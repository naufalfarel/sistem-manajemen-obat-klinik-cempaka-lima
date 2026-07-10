<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\KategoriObat
 */
class KategoriObatResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nama' => $this->nama,
            'kode' => $this->kode,
            'deskripsi' => $this->deskripsi,
            // Dihitung via withCount('obat') pada query, BUKAN kolom fisik,
            // sesuai catatan pada dokumen kontrak.
            'jumlah_obat' => (int) ($this->obat_count ?? 0),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
