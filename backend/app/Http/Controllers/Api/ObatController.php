<?php

namespace App\Http\Controllers\Api;

use App\Exports\ObatExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Obat\StoreObatRequest;
use App\Http\Requests\Obat\UpdateObatRequest;
use App\Http\Resources\ObatResource;
use App\Models\Obat;
use App\Services\AuditLogger;
use App\Services\NomorGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;

class ObatController extends Controller
{
    private const SORTABLE = ['nama', 'stok', 'expired_date', 'harga_jual'];

    /** GET /api/obat */
    public function index(Request $request): JsonResponse
    {
        $query = Obat::query()->with([
            'kategori' => fn ($q) => $q->withCount('obat'),
            'supplier'
        ]);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('kode', 'like', "%{$search}%")
                    ->orWhere('nama_generik', 'like', "%{$search}%");
            });
        }

        $query->when($request->filled('kategori_id'), fn ($q) => $q->where('kategori_id', $request->integer('kategori_id')));
        $query->when($request->filled('golongan'), fn ($q) => $q->where('golongan', $request->string('golongan')));
        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));

        if ($request->boolean('stok_kritis')) {
            $settings = \App\Models\Setting::query()->where('category', 'stok')->value('data');
            $defaultMin = (int) ($settings['stok_minimum_default'] ?? 10);
            $query->where(function($q) use ($defaultMin) {
                $q->where(function($sub) {
                    $sub->whereNotNull('stok_minimum')
                        ->where('stok_minimum', '>', 0)
                        ->whereColumn('stok', '<=', 'stok_minimum');
                })->orWhere(function($sub) use ($defaultMin) {
                    $sub->where(function($s) {
                        $s->whereNull('stok_minimum')
                          ->orWhere('stok_minimum', '<=', 0);
                    })->whereColumn('stok', '<=', \Illuminate\Support\Facades\DB::raw($defaultMin));
                });
            });
        }

        $sort = in_array($request->string('sort')->value(), self::SORTABLE, true)
            ? $request->string('sort')->value()
            : 'nama';
        $direction = $request->string('direction')->value() === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $direction);

        $perPage = min((int) $request->integer('per_page', 15), 100) ?: 15;

        return ObatResource::collection($query->paginate($perPage))->response();
    }

    /** GET /api/obat/{obat} */
    public function show(Obat $obat): JsonResponse
    {
        $obat->load([
            'kategori' => fn ($q) => $q->withCount('obat'),
            'supplier'
        ]);

        return response()->json(['data' => new ObatResource($obat)]);
    }

    /** POST /api/obat */
    public function store(StoreObatRequest $request): JsonResponse
    {
        $data = $request->validated();
        
        if ($request->hasFile('foto')) {
            $data['foto'] = $request->file('foto')->store('obat', 'public');
        }

        $data['kode'] = NomorGenerator::kodeObat();
        $data['status'] ??= 'aktif';

        $obat = Obat::create($data);
        $obat->load([
            'kategori' => fn ($q) => $q->withCount('obat'),
            'supplier'
        ]);

        return response()->json([
            'data' => new ObatResource($obat),
            'message' => 'Obat berhasil ditambahkan.',
        ], 201);
    }

    /** PUT /api/obat/{obat} (atau POST dengan _method=PUT) */
    public function update(UpdateObatRequest $request, Obat $obat): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('foto')) {
            if ($obat->foto && \Illuminate\Support\Facades\Storage::disk('public')->exists($obat->foto)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($obat->foto);
            }
            $data['foto'] = $request->file('foto')->store('obat', 'public');
        }

        $obat->update($data);
        $obat->load([
            'kategori' => fn ($q) => $q->withCount('obat'),
            'supplier'
        ]);

        return response()->json([
            'data' => new ObatResource($obat),
            'message' => 'Data obat berhasil diperbarui.',
        ]);
    }

    /** DELETE /api/obat/{obat} */
    public function destroy(Obat $obat): JsonResponse
    {
        if ($obat->obatMasukItems()->exists() || $obat->obatKeluarItems()->exists()) {
            return response()->json([
                'message' => 'Obat tidak dapat dihapus karena sudah memiliki riwayat transaksi masuk atau keluar.'
            ], 422);
        }

        if ($obat->foto && \Illuminate\Support\Facades\Storage::disk('public')->exists($obat->foto)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($obat->foto);
        }

        $obat->delete();

        return response()->json(null, 204);
    }

    /**
     * GET /api/obat/export?format=csv|xlsx
     *
     * Diautentikasi lewat ?token= (bukan header Authorization) karena
     * obatApi.export() di api.ts mengembalikan URL mentah untuk dibuka
     * langsung oleh browser (window.open/<a href>), yang tidak bisa
     * menyertakan header custom. Lihat TokenFromQueryString middleware.
     */
    public function export(Request $request): mixed
    {
        $format = $request->string('format')->value() === 'xlsx' ? 'xlsx' : 'csv';
        $writerType = $format === 'xlsx' ? \Maatwebsite\Excel\Excel::XLSX : \Maatwebsite\Excel\Excel::CSV;

        AuditLogger::ekspor('obat', "Mengekspor data master obat (format: {$format})");

        return Excel::download(new ObatExport, "data-obat.{$format}", $writerType);
    }

    /**
     * GET /api/obat/{obat}/kartu-stok
     */
    public function kartuStok(Obat $obat): JsonResponse
    {
        // 1. Ambil transaksi masuk yang sudah diterima
        $masuk = DB::table('obat_masuk_items')
            ->join('obat_masuk', 'obat_masuk_items.obat_masuk_id', '=', 'obat_masuk.id')
            ->where('obat_masuk_items.obat_id', $obat->id)
            ->where('obat_masuk.status', 'diterima')
            ->select([
                'obat_masuk.tanggal as tanggal',
                'obat_masuk.no_transaksi as referensi',
                'obat_masuk_items.jumlah as masuk',
                DB::raw('0 as keluar'),
                DB::raw('"masuk" as tipe'),
                'obat_masuk.created_at as created_at'
            ])
            ->get();

        // 2. Ambil transaksi keluar yang selesai
        $keluar = DB::table('obat_keluar_items')
            ->join('obat_keluar', 'obat_keluar_items.obat_keluar_id', '=', 'obat_keluar.id')
            ->where('obat_keluar_items.obat_id', $obat->id)
            ->where('obat_keluar.status', 'selesai')
            ->select([
                'obat_keluar.tanggal as tanggal',
                'obat_keluar.no_transaksi as referensi',
                DB::raw('0 as masuk'),
                'obat_keluar_items.jumlah as keluar',
                DB::raw('"keluar" as tipe'),
                'obat_keluar.created_at as created_at'
            ])
            ->get();

        // 3. Ambil revisi stok — hitung delta masuk/keluar yang benar per tipe:
        //    - tambah : masuk = jumlah (delta yg ditambahkan)
        //    - kurang : keluar = jumlah (delta yg dikurangkan)
        //    - set    : selisih = stok_sesudah - stok_sebelum
        //               jika selisih > 0 → masuk = selisih ; jika selisih < 0 → keluar = |selisih|
        $revisi = DB::table('stok_revisi')
            ->where('obat_id', $obat->id)
            ->select([
                'tanggal as tanggal',
                'no_revisi as referensi',
                DB::raw('
                    CASE
                        WHEN tipe = "tambah" THEN jumlah
                        WHEN tipe = "set" AND (stok_sesudah - stok_sebelum) > 0 THEN (stok_sesudah - stok_sebelum)
                        ELSE 0
                    END as masuk
                '),
                DB::raw('
                    CASE
                        WHEN tipe = "kurang" THEN jumlah
                        WHEN tipe = "set" AND (stok_sesudah - stok_sebelum) < 0 THEN ABS(stok_sesudah - stok_sebelum)
                        ELSE 0
                    END as keluar
                '),
                DB::raw('"revisi" as tipe'),
                'created_at as created_at',
            ])
            ->get();

        // 4. Gabungkan dan urutkan
        $merged = $masuk->merge($keluar)->merge($revisi)->sortBy(function ($item) {
            return $item->tanggal . ' ' . $item->created_at;
        })->values();

        // 5. Hitung saldo berjalan
        $saldo = 0;
        $kartuStok = $merged->map(function ($item) use (&$saldo) {
            $saldo += ($item->masuk - $item->keluar);
            return [
                'tanggal'  => $item->tanggal,
                'referensi'=> $item->referensi,
                'masuk'    => (int) $item->masuk,
                'keluar'   => (int) $item->keluar,
                'tipe'     => $item->tipe,
                'saldo'    => $saldo,
            ];
        });

        return response()->json([
            'data' => $kartuStok
        ]);
    }
}
