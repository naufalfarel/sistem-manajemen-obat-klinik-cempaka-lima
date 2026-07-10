<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Bentuk baru untuk mengisi celah kontrak (lihat README.md). Sengaja dibuat
 * meniru bentuk `ObatKeluarItem` di api.ts (obat_id + obat ringkas + jumlah +
 * harga + subtotal) supaya konsisten dan mudah dikenali oleh frontend saat
 * nanti diintegrasikan.
 *
 * @mixin \App\Models\ObatMasukItem
 */
class ObatMasukItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'obat_id' => $this->obat_id,
            'obat' => $this->whenLoaded('obat', fn () => $this->obat->only(['id', 'kode', 'nama', 'satuan'])),
            'jumlah' => $this->jumlah,
            'harga_satuan' => (float) $this->harga_satuan,
            'subtotal' => (float) $this->subtotal,
            'no_batch' => $this->no_batch,
            'expired_date' => $this->expired_date?->toDateString(),
        ];
    }
}
