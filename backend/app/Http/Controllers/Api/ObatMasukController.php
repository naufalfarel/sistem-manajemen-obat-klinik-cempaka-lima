<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ObatMasuk\StoreObatMasukRequest;
use App\Http\Resources\ObatMasukDetailResource;
use App\Http\Resources\ObatMasukResource;
use App\Models\Obat;
use App\Models\ObatMasuk;
use App\Services\NomorGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ObatMasukController extends Controller
{
    /** GET /api/obat-masuk */
    public function index(Request $request): JsonResponse
    {
        $query = ObatMasuk::query()->with(['supplier', 'petugas']);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('no_transaksi', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn ($sq) => $sq->where('nama', 'like', "%{$search}%"));
            });
        }

        $query->when($request->filled('supplier_id'), fn ($q) => $q->where('supplier_id', $request->integer('supplier_id')));
        $query->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')));
        $query->when($request->filled('dari'), fn ($q) => $q->whereDate('tanggal', '>=', $request->string('dari')));
        $query->when($request->filled('sampai'), fn ($q) => $q->whereDate('tanggal', '<=', $request->string('sampai')));

        $query->orderByDesc('tanggal')->orderByDesc('id');

        $perPage = min((int) $request->integer('per_page', 15), 100) ?: 15;

        return ObatMasukResource::collection($query->paginate($perPage))->response();
    }

    /** GET /api/obat-masuk/{obat_masuk} */
    public function show(ObatMasuk $obatMasuk): JsonResponse
    {
        $obatMasuk->load(['supplier', 'petugas', 'items.obat']);

        return response()->json(['data' => new ObatMasukDetailResource($obatMasuk)]);
    }

    /** POST /api/obat-masuk */
    public function store(StoreObatMasukRequest $request): JsonResponse
    {
        $data = $request->validated();

        $fotoNotaPath = null;
        if ($request->hasFile('foto_nota')) {
            $fotoNotaPath = $request->file('foto_nota')->store('obat_masuk', 'public');
        }

        $obatMasuk = DB::transaction(function () use ($data, $fotoNotaPath) {
            $totalItem = count($data['items']);
            $nilaiTotal = 0;
            foreach ($data['items'] as $item) {
                $nilaiTotal += $item['jumlah'] * $item['harga_satuan'];
            }

            $obatMasuk = ObatMasuk::create([
                'no_transaksi' => NomorGenerator::noObatMasuk(Carbon::parse($data['tanggal'])),
                'tanggal' => $data['tanggal'],
                'supplier_id' => $data['supplier_id'],
                'total_item' => $totalItem,
                'nilai_total' => $nilaiTotal,
                'status' => $data['status'] ?? 'draft',
                'petugas_id' => $data['petugas_id'],
                'catatan' => $data['catatan'] ?? null,
                'foto_nota' => $fotoNotaPath,
            ]);

            foreach ($data['items'] as $item) {
                $obatMasuk->items()->create([
                    'obat_id' => $item['obat_id'],
                    'jumlah' => $item['jumlah'],
                    'harga_satuan' => $item['harga_satuan'],
                    'subtotal' => $item['jumlah'] * $item['harga_satuan'],
                    'no_batch' => $item['no_batch'] ?? null,
                    'expired_date' => $item['expired_date'] ?? null,
                ]);
            }

            return $obatMasuk;
        });

        $obatMasuk->load(['supplier', 'petugas', 'items.obat']);

        return response()->json([
            'data' => new ObatMasukDetailResource($obatMasuk),
            'message' => 'Transaksi obat masuk berhasil dibuat.',
        ], 201);
    }

    /**
     * PATCH /api/obat-masuk/{obat_masuk}/terima
     *
     * Menambah stok tiap obat sesuai items, lalu mengubah status menjadi
     * "diterima". Hanya bisa dilakukan dari status "draft" untuk mencegah
     * stok bertambah dua kali pada transaksi yang sama.
     */
    public function terima(ObatMasuk $obatMasuk): JsonResponse
    {
        if ($obatMasuk->status !== 'draft') {
            abort(422, 'Transaksi ini sudah diproses sebelumnya (status saat ini: '.$obatMasuk->status.').');
        }

        DB::transaction(function () use ($obatMasuk) {
            $items = $obatMasuk->items()->lockForUpdate()->get();

            foreach ($items as $item) {
                $obat = Obat::whereKey($item->obat_id)->lockForUpdate()->first();
                if ($obat) {
                    $obat->increment('stok', $item->jumlah);
                    
                    $updates = [];
                    if ($item->expired_date) {
                        $updates['expired_date'] = $item->expired_date;
                    }

                    // Jika harga beli baru berbeda, buat usulan. Jangan override otomatis.
                    if ((float)$item->harga_satuan != (float)$obat->harga_beli) {
                        \App\Models\RiwayatHarga::create([
                            'obat_id' => $obat->id,
                            'user_id' => auth()->id() ?: $obatMasuk->petugas_id,
                            'harga_beli_lama' => (float)$obat->harga_beli,
                            'harga_beli_baru' => (float)$item->harga_satuan,
                            'harga_jual_lama' => (float)$obat->harga_jual,
                            'harga_jual_baru' => (float)$obat->harga_jual,
                            'sumber' => 'faktur',
                            'no_transaksi' => $obatMasuk->no_transaksi,
                            'status' => 'usulan',
                        ]);
                    }

                    if (!empty($updates)) {
                        $obat->update($updates);
                    }
                }
            }

            $obatMasuk->update(['status' => 'diterima']);
        });

        $obatMasuk->load(['supplier', 'petugas', 'items.obat']);

        return response()->json([
            'data' => new ObatMasukDetailResource($obatMasuk),
            'message' => 'Obat masuk berhasil diterima dan stok telah diperbarui.',
        ]);
    }

    /** DELETE /api/obat-masuk/{obat_masuk} */
    public function destroy(ObatMasuk $obatMasuk): JsonResponse
    {
        if ($obatMasuk->status !== 'draft') {
            abort(422, 'Transaksi yang sudah diterima tidak dapat dihapus (stok sudah bertambah). Batalkan lewat proses retur jika diperlukan.');
        }

        $obatMasuk->delete();

        return response()->json(null, 204);
    }

    /**
     * GET /api/obat-masuk/check-faktur
     */
    public function checkFaktur(Request $request): JsonResponse
    {
        $supplierId = $request->integer('supplier_id');
        $faktur = $request->string('faktur')->trim()->value();

        if (!$supplierId || !$faktur) {
            return response()->json(['exists' => false]);
        }

        $exists = ObatMasuk::where('supplier_id', $supplierId)
            ->where('catatan', $faktur)
            ->exists();

        return response()->json(['exists' => $exists]);
    }
}
