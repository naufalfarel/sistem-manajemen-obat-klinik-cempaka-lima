<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Bentuk dasar mengikuti tipe `ObatMasuk` di api.ts (tanpa `items`, agar
 * payload listing tetap ringan). Untuk detail transaksi lengkap dengan
 * rincian obat, lihat ObatMasukDetailResource.
 *
 * @mixin \App\Models\ObatMasuk
 */
class ObatMasukResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'no_transaksi' => $this->no_transaksi,
            'tanggal' => $this->tanggal?->toDateString(),
            'supplier_id' => $this->supplier_id,
            'supplier' => $this->whenLoaded('supplier', fn () => $this->supplier->only(['id', 'nama', 'kode'])),
            'total_item' => $this->total_item,
            'nilai_total' => (float) $this->nilai_total,
            'status' => $this->status,
            'petugas_id' => $this->petugas_id,
            'petugas' => $this->whenLoaded('petugas', fn () => $this->petugas->only(['id', 'nama'])),
            'catatan' => $this->catatan,
            'foto_nota' => $this->foto_nota ? asset('storage/' . $this->foto_nota) : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
