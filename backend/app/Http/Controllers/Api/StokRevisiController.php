<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Obat;
use App\Models\StokRevisi;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StokRevisiController extends Controller
{
    /**
     * GET /api/stok-revisi
     * Riwayat semua revisi stok (paginasi)
     */
    public function index(Request $request): JsonResponse
    {
        $query = StokRevisi::with(['obat:id,nama,kode,satuan', 'petugas:id,nama'])
            ->orderByDesc('tanggal')
            ->orderByDesc('created_at');

        if ($search = $request->string('search')->trim()->value()) {
            $query->whereHas('obat', fn ($q) =>
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('kode', 'like', "%{$search}%")
            );
        }

        if ($request->filled('obat_id')) {
            $query->where('obat_id', $request->integer('obat_id'));
        }

        if ($request->filled('tipe')) {
            $query->where('tipe', $request->string('tipe'));
        }

        if ($request->filled('alasan')) {
            $query->where('alasan', $request->string('alasan'));
        }

        if ($request->filled('dari')) {
            $query->whereDate('tanggal', '>=', $request->string('dari'));
        }

        if ($request->filled('sampai')) {
            $query->whereDate('tanggal', '<=', $request->string('sampai'));
        }

        $perPage = min((int) $request->integer('per_page', 10), 100) ?: 10;
        $paginated = $query->paginate($perPage);

        return response()->json([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
            ],
        ]);
    }

    /**
     * POST /api/stok-revisi
     * Buat revisi stok baru — sesuaikan stok di tabel obat + catat log
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'obat_id' => ['required', 'exists:obat,id'],
            'tipe'    => ['required', 'in:tambah,kurang,set'],
            'jumlah'  => ['required', 'integer', 'min:0'],
            'alasan'  => ['required', 'in:rusak,kadaluarsa,hilang,temuan,koreksi_sistem,penerimaan_lain,lainnya'],
            'catatan' => ['nullable', 'string', 'max:500'],
            'tanggal' => ['nullable', 'date'],
        ]);

        return DB::transaction(function () use ($validated, $request) {
            /** @var Obat $obat */
            $obat = Obat::lockForUpdate()->findOrFail($validated['obat_id']);

            $stokSebelum = $obat->stok;
            $jumlah      = (int) $validated['jumlah'];

            $stokSesudah = match ($validated['tipe']) {
                'tambah' => $stokSebelum + $jumlah,
                'kurang' => max(0, $stokSebelum - $jumlah),
                'set'    => $jumlah,
            };

            // Buat nomor revisi otomatis: RVS-YYYYMM-XXXX
            $bulan    = now()->format('Ym');
            $count    = StokRevisi::whereRaw("no_revisi LIKE 'RVS-{$bulan}-%'")->count() + 1;
            $noRevisi = sprintf('RVS-%s-%04d', $bulan, $count);

            $revisi = StokRevisi::create([
                'no_revisi'    => $noRevisi,
                'obat_id'      => $obat->id,
                'petugas_id'   => $request->user()->id,
                'tanggal'      => $validated['tanggal'] ?? today()->toDateString(),
                'tipe'         => $validated['tipe'],
                'stok_sebelum' => $stokSebelum,
                'jumlah'       => $jumlah,
                'stok_sesudah' => $stokSesudah,
                'alasan'       => $validated['alasan'],
                'catatan'      => $validated['catatan'] ?? null,
            ]);

            // Update stok aktual
            $obat->update(['stok' => $stokSesudah]);

            // Catat ke audit log
            $tipeLabel = ['tambah' => 'Penambahan', 'kurang' => 'Pengurangan', 'set' => 'Set Ulang'][$validated['tipe']];
            $alasanLabel = StokRevisi::ALASAN_LABELS[$validated['alasan']] ?? $validated['alasan'];
            AuditLogger::ubah(
                module: 'stok-revisi',
                description: "{$tipeLabel} stok {$obat->nama} ({$obat->kode}): {$stokSebelum} → {$stokSesudah} | Alasan: {$alasanLabel}",
                before: ['stok' => $stokSebelum],
                after:  ['stok' => $stokSesudah],
            );

            $revisi->load(['obat:id,nama,kode,satuan', 'petugas:id,nama']);

            return response()->json([
                'data'    => $revisi,
                'message' => "Revisi stok {$obat->nama} berhasil. Stok diperbarui: {$stokSebelum} → {$stokSesudah}.",
            ], 201);
        });
    }

    /**
     * GET /api/stok-revisi/{id}
     * Detail satu record revisi
     */
    public function show(StokRevisi $stokRevisi): JsonResponse
    {
        $stokRevisi->load(['obat', 'petugas:id,nama']);

        return response()->json(['data' => $stokRevisi]);
    }
}
