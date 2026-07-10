<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ObatKeluarItem
 */
class ObatKeluarItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'obat_id' => $this->obat_id,
            'obat' => $this->whenLoaded('obat', fn () => $this->obat->only(['id', 'kode', 'nama', 'satuan'])),
            'jumlah' => $this->jumlah,
            'harga' => (float) $this->harga,
            'subtotal' => (float) $this->subtotal,
        ];
    }
}
