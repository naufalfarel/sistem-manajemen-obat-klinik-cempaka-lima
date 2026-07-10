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
            $query->whereColumn('stok', '<=', 'stok_minimum');
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
}
