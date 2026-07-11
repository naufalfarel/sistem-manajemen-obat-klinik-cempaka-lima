<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Obat;
use App\Models\RiwayatHarga;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HargaBarangController extends Controller
{
    /**
     * GET /api/harga-barang
     */
    public function index(Request $request): JsonResponse
    {
        $query = Obat::query()->with(['kategori']);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                    ->orWhere('kode', 'like', "%{$search}%");
            });
        }

        if ($request->filled('kategori_id')) {
            $query->where('kategori_id', $request->integer('kategori_id'));
        }

        $query->orderBy('nama');

        $perPage = min((int) $request->integer('per_page', 10), 100) ?: 10;
        $paginated = $query->paginate($perPage);

        // Transform collection to include margin and latest change info
        $items = $paginated->getCollection()->map(function (Obat $obat) {
            $latestApproved = RiwayatHarga::where('obat_id', $obat->id)
                ->where('status', 'disetujui')
                ->latest()
                ->first();

            $pendingProposalsCount = RiwayatHarga::where('obat_id', $obat->id)
                ->where('status', 'usulan')
                ->count();

            $hargaBeli = (float) $obat->harga_beli;
            $hargaJual = (float) $obat->harga_jual;
            $margin = $hargaJual - $hargaBeli;
            $marginPersen = $hargaBeli > 0 ? round(($margin / $hargaBeli) * 100) : 0;

            return [
                'id' => $obat->id,
                'kode' => $obat->kode,
                'nama' => $obat->nama,
                'kategori' => $obat->kategori ? ['id' => $obat->kategori->id, 'nama' => $obat->kategori->nama] : null,
                'satuan' => $obat->satuan,
                'harga_beli' => $hargaBeli,
                'harga_jual' => $hargaJual,
                'margin' => $margin,
                'margin_persen' => $marginPersen,
                'tanggal_diubah' => $latestApproved ? $latestApproved->created_at->toISOString() : $obat->updated_at->toISOString(),
                'has_proposal' => $pendingProposalsCount > 0,
                'proposals_count' => $pendingProposalsCount,
            ];
        });

        $paginated->setCollection($items);

        return response()->json($paginated);
    }

    /**
     * PUT /api/harga-barang/{obat}
     */
    public function update(Request $request, Obat $obat): JsonResponse
    {
        $request->validate([
            'harga_beli' => ['required', 'numeric', 'min:0'],
            'harga_jual' => ['required', 'numeric', 'min:0'],
        ]);

        $hargaBeliLama = (float) $obat->harga_beli;
        $hargaJualLama = (float) $obat->harga_jual;
        $hargaBeliBaru = (float) $request->input('harga_beli');
        $hargaJualBaru = (float) $request->input('harga_jual');

        if ($hargaBeliLama == $hargaBeliBaru && $hargaJualLama == $hargaJualBaru) {
            return response()->json([
                'message' => 'Tidak ada perubahan harga.',
            ]);
        }

        DB::transaction(function () use ($obat, $hargaBeliLama, $hargaJualLama, $hargaBeliBaru, $hargaJualBaru) {
            $obat->update([
                'harga_beli' => $hargaBeliBaru,
                'harga_jual' => $hargaJualBaru,
            ]);

            RiwayatHarga::create([
                'obat_id' => $obat->id,
                'user_id' => auth()->id(),
                'harga_beli_lama' => $hargaBeliLama,
                'harga_beli_baru' => $hargaBeliBaru,
                'harga_jual_lama' => $hargaJualLama,
                'harga_jual_baru' => $hargaJualBaru,
                'sumber' => 'manual',
                'status' => 'disetujui',
            ]);

            AuditLogger::ubah(
                module: 'harga-barang',
                description: "Mengubah harga barang secara manual untuk \"{$obat->nama}\"",
                before: [
                    'harga_beli' => $hargaBeliLama,
                    'harga_jual' => $hargaJualLama,
                ],
                after: [
                    'harga_beli' => $hargaBeliBaru,
                    'harga_jual' => $hargaJualBaru,
                ]
            );
        });

        return response()->json([
            'message' => 'Harga barang berhasil diperbarui.',
        ]);
    }

    /**
     * GET /api/harga-barang/proposals
     */
    public function proposals(): JsonResponse
    {
        $proposals = RiwayatHarga::with(['obat', 'user'])
            ->where('status', 'usulan')
            ->latest()
            ->get()
            ->map(function (RiwayatHarga $proposal) {
                return [
                    'id' => $proposal->id,
                    'obat' => $proposal->obat ? [
                        'id' => $proposal->obat->id,
                        'nama' => $proposal->obat->nama,
                        'kode' => $proposal->obat->kode,
                        'harga_beli_sekarang' => (float)$proposal->obat->harga_beli,
                        'harga_jual_sekarang' => (float)$proposal->obat->harga_jual,
                    ] : null,
                    'user' => $proposal->user ? ['id' => $proposal->user->id, 'nama' => $proposal->user->nama] : null,
                    'harga_beli_lama' => (float)$proposal->harga_beli_lama,
                    'harga_beli_baru' => (float)$proposal->harga_beli_baru,
                    'harga_jual_lama' => (float)$proposal->harga_jual_lama,
                    'harga_jual_baru' => (float)$proposal->harga_jual_baru,
                    'sumber' => $proposal->sumber,
                    'no_transaksi' => $proposal->no_transaksi,
                    'tanggal_diusulkan' => $proposal->created_at->toISOString(),
                ];
            });

        return response()->json(['data' => $proposals]);
    }

    /**
     * POST /api/harga-barang/proposals/{id}/confirm
     */
    public function confirmProposal(int $id): JsonResponse
    {
        $proposal = RiwayatHarga::findOrFail($id);

        if ($proposal->status !== 'usulan') {
            abort(422, 'Usulan ini sudah diproses sebelumnya.');
        }

        $obat = Obat::findOrFail($proposal->obat_id);

        DB::transaction(function () use ($proposal, $obat) {
            $hargaBeliLama = (float)$obat->harga_beli;
            $hargaBeliBaru = (float)$proposal->harga_beli_baru;

            $obat->update([
                'harga_beli' => $hargaBeliBaru,
            ]);

            $proposal->update([
                'status' => 'disetujui',
                'user_id' => auth()->id(),
            ]);

            AuditLogger::ubah(
                module: 'harga-barang',
                description: "Menyetujui usulan perubahan harga beli untuk \"{$obat->nama}\" dari transaksi {$proposal->no_transaksi}",
                before: [
                    'harga_beli' => $hargaBeliLama,
                ],
                after: [
                    'harga_beli' => $hargaBeliBaru,
                ]
            );
        });

        return response()->json([
            'message' => 'Usulan perubahan harga berhasil disetujui.',
        ]);
    }

    /**
     * POST /api/harga-barang/proposals/{id}/reject
     */
    public function rejectProposal(int $id): JsonResponse
    {
        $proposal = RiwayatHarga::findOrFail($id);

        if ($proposal->status !== 'usulan') {
            abort(422, 'Usulan ini sudah diproses sebelumnya.');
        }

        $obat = Obat::findOrFail($proposal->obat_id);

        DB::transaction(function () use ($proposal, $obat) {
            $proposal->update([
                'status' => 'ditolak',
                'user_id' => auth()->id(),
            ]);

            AuditLogger::ubah(
                module: 'harga-barang',
                description: "Menolak usulan perubahan harga beli untuk \"{$obat->nama}\" dari transaksi {$proposal->no_transaksi}",
                before: [
                    'harga_beli' => (float)$obat->harga_beli,
                    'harga_beli_usulan' => (float)$proposal->harga_beli_baru,
                ],
                after: [
                    'status_usulan' => 'ditolak',
                ]
            );
        });

        return response()->json([
            'message' => 'Usulan perubahan harga berhasil ditolak.',
        ]);
    }

    /**
     * GET /api/harga-barang/{id}/history
     */
    public function history(int $id): JsonResponse
    {
        $history = RiwayatHarga::with(['user'])
            ->where('obat_id', $id)
            ->where('status', 'disetujui')
            ->latest()
            ->get()
            ->map(function (RiwayatHarga $log) {
                return [
                    'id' => $log->id,
                    'user' => $log->user ? ['id' => $log->user->id, 'nama' => $log->user->nama] : null,
                    'harga_beli_lama' => (float)$log->harga_beli_lama,
                    'harga_beli_baru' => (float)$log->harga_beli_baru,
                    'harga_jual_lama' => (float)$log->harga_jual_lama,
                    'harga_jual_baru' => (float)$log->harga_jual_baru,
                    'sumber' => $log->sumber,
                    'no_transaksi' => $log->no_transaksi,
                    'tanggal' => $log->created_at->toISOString(),
                ];
            });

        return response()->json(['data' => $history]);
    }
}
