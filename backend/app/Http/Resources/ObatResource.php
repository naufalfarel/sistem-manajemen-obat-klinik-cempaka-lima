<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Obat
 */
class ObatResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode' => $this->kode,
            'nama' => $this->nama,
            'nama_generik' => $this->nama_generik,
            'kategori_id' => $this->kategori_id,
            'kategori' => new KategoriObatResource($this->whenLoaded('kategori')),
            'supplier_id' => $this->supplier_id,
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'satuan' => $this->satuan,
            'stok' => $this->stok,
            'stok_minimum' => $this->stok_minimum,
            'harga_beli' => (float) $this->harga_beli,
            'harga_jual' => (float) $this->harga_jual,
            'golongan' => $this->golongan,
            'lokasi_rak' => $this->lokasi_rak,
            'expired_date' => $this->expired_date?->toDateString(),
            'status' => $this->status,
            'foto' => $this->foto ? asset('storage/' . $this->foto) : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
