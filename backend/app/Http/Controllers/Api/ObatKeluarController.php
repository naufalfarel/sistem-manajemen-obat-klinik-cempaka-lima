<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ObatKeluar\ReturVoidRequest;
use App\Http\Requests\ObatKeluar\StoreObatKeluarRequest;
use App\Http\Resources\ObatKeluarResource;
use App\Models\Obat;
use App\Models\ObatKeluar;
use App\Services\NomorGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ObatKeluarController extends Controller
{
    /** GET /api/obat-keluar */
    public function index(Request $request): JsonResponse
    {
        $query = ObatKeluar::query()->with(['kasir', 'items.obat']);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                    ->orWhere('pasien', 'like', "%{$search}%");
            });
        }

        $query->when($request->filled('jenis'), function ($q) use ($request) {
            $jenis = $request->string('jenis');
            if ($jenis == 'resep') {
                $q->where('status', 'selesai')->whereNotNull('dokter');
            } elseif ($jenis == 'otc') {
                $q->where('status', 'selesai')->whereNull('dokter');
            } else {
                $q->where('status', $jenis);
            }
        });

        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));
        $query->when($request->filled('obat_id'), fn ($q) => $q->whereHas('items', fn ($iq) => $iq->where('obat_id', $request->integer('obat_id'))));
        $query->when($request->filled('kasir_id'), fn ($q) => $q->where('kasir_id', $request->integer('kasir_id')));
        $query->when($request->filled('dari'), fn ($q) => $q->whereDate('tanggal', '>=', $request->string('dari')));
        $query->when($request->filled('sampai'), fn ($q) => $q->whereDate('tanggal', '<=', $request->string('sampai')));

        $query->orderByDesc('tanggal')->orderByDesc('id');

        $perPage = min((int) $request->integer('per_page', 15), 100) ?: 15;

        return ObatKeluarResource::collection($query->paginate($perPage))->response();
    }

    /** GET /api/obat-keluar/{obat_keluar} */
    public function show(ObatKeluar $obatKeluar): JsonResponse
    {
        $obatKeluar->load(['kasir', 'items.obat', 'riwayatCetak.user']);

        return response()->json(['data' => new ObatKeluarResource($obatKeluar)]);
    }

    /**
     * POST /api/obat-keluar
     *
     * Validasi stok cukup dilakukan DI DALAM transaction dengan row lock,
     * supaya dua checkout bersamaan untuk obat yang sama tidak sama-sama
     * lolos validasi lalu membuat stok jadi negatif (race condition).
     */
    public function store(StoreObatKeluarRequest $request): JsonResponse
    {
        $data = $request->validated();

        $obatKeluar = DB::transaction(function () use ($data) {
            $obatIds = array_column($data['items'], 'obat_id');
            $obatList = Obat::whereIn('id', $obatIds)->lockForUpdate()->get()->keyBy('id');

            $errors = [];
            $total = 0;
            foreach ($data['items'] as $index => $item) {
                $obat = $obatList->get($item['obat_id']);

                if (! $obat) {
                    $errors["items.{$index}.obat_id"] = ['Obat tidak ditemukan.'];

                    continue;
                }

                if ($obat->stok < $item['jumlah']) {
                    $errors["items.{$index}.jumlah"] = [
                        "Stok {$obat->nama} tidak cukup (tersisa {$obat->stok}, diminta {$item['jumlah']}).",
                    ];
                }

                $total += $item['jumlah'] * $item['harga'];
            }

            if (! empty($errors)) {
                throw ValidationException::withMessages($errors);
            }

            $obatKeluar = ObatKeluar::create([
                'no_transaksi' => NomorGenerator::noObatKeluar(Carbon::parse($data['tanggal'])),
                'tanggal' => $data['tanggal'],
                'pasien' => $data['pasien'],
                'dokter' => $data['dokter'] ?? null,
                'tipe_resep' => $data['tipe_resep'] ?? null,
                'metode_bayar' => $data['metode_bayar'],
                'total' => $total,
                'status' => 'selesai',
                'kasir_id' => $data['kasir_id'],
            ]);

            foreach ($data['items'] as $item) {
                $obatKeluar->items()->create([
                    'obat_id' => $item['obat_id'],
                    'jumlah' => $item['jumlah'],
                    'harga' => $item['harga'],
                    'subtotal' => $item['jumlah'] * $item['harga'],
                ]);

                Obat::whereKey($item['obat_id'])->decrement('stok', $item['jumlah']);
            }

            return $obatKeluar;
        });

        $obatKeluar->load(['kasir', 'items.obat']);

        return response()->json([
            'data' => new ObatKeluarResource($obatKeluar),
            'message' => 'Transaksi obat keluar berhasil dibuat.',
        ], 201);
    }

    /** PATCH /api/obat-keluar/{obat_keluar}/retur */
    public function retur(ReturVoidRequest $request, ObatKeluar $obatKeluar): JsonResponse
    {
        return $this->kembalikanStok($request, $obatKeluar, 'retur', 'Retur berhasil diproses, stok telah dikembalikan.');
    }

    /** PATCH /api/obat-keluar/{obat_keluar}/void */
    public function void(ReturVoidRequest $request, ObatKeluar $obatKeluar): JsonResponse
    {
        return $this->kembalikanStok($request, $obatKeluar, 'void', 'Transaksi berhasil di-void, stok telah dikembalikan.');
    }

    private function kembalikanStok(
        ReturVoidRequest $request,
        ObatKeluar $obatKeluar,
        string $statusBaru,
        string $pesan,
    ): JsonResponse {
        if ($obatKeluar->status !== 'selesai') {
            abort(422, 'Hanya transaksi dengan status "selesai" yang dapat di-retur/void (status saat ini: '.$obatKeluar->status.').');
        }

        DB::transaction(function () use ($obatKeluar, $statusBaru, $request) {
            $items = $obatKeluar->items()->lockForUpdate()->get();

            foreach ($items as $item) {
                Obat::whereKey($item->obat_id)->lockForUpdate()->increment('stok', $item->jumlah);
            }

            $obatKeluar->update([
                'status' => $statusBaru,
                'alasan_retur_void' => $request->validated('alasan'),
            ]);
        });

        $obatKeluar->load(['kasir', 'items.obat']);

        return response()->json([
            'data' => new ObatKeluarResource($obatKeluar),
            'message' => $pesan,
        ]);
    }

    /** POST /api/obat-keluar/{obatKeluar}/cetak */
    public function logCetak(Request $request, ObatKeluar $obatKeluar): JsonResponse
    {
        $jenis = $request->string('jenis')->value();
        if (!in_array($jenis, ['nota', 'resep', 'copy_resep'])) {
            abort(422, 'Jenis cetak tidak valid.');
        }

        $log = $obatKeluar->riwayatCetak()->create([
            'user_id' => auth()->id() ?? $obatKeluar->kasir_id,
            'jenis' => $jenis,
        ]);

        $label = $jenis === 'nota' ? 'Nota Transaksi' : ($jenis === 'resep' ? 'Resep' : 'Copy Resep');
        \App\Services\AuditLogger::record('cetak', 'obat-keluar', "Mencetak {$label} untuk transaksi: {$obatKeluar->no_transaksi} (pasien: {$obatKeluar->pasien})");

        return response()->json([
            'data' => [
                'id' => $log->id,
                'jenis' => $log->jenis,
                'actor' => auth()->user()?->nama ?? 'Petugas',
                'created_at' => $log->created_at?->toIso8601String(),
            ],
            'message' => 'Riwayat cetak berhasil dicatat.',
        ]);
    }
}
