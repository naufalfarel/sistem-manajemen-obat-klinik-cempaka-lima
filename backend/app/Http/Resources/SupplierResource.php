<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Supplier
 */
class SupplierResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'kode' => $this->kode,
            'nama' => $this->nama,
            'alamat' => $this->alamat,
            'kota' => $this->kota,
            'telepon' => $this->telepon,
            'email' => $this->email,
            'pic' => $this->pic,
            'npwp' => $this->npwp,
            'no_izin_pbf' => $this->no_izin_pbf,
            'sertifikat_cdob' => $this->sertifikat_cdob,
            'exp_izin_pbf' => $this->exp_izin_pbf?->toDateString(),
            'exp_cdob' => $this->exp_cdob?->toDateString(),
            'termin_pembayaran' => $this->termin_pembayaran,
            'lead_time' => $this->lead_time,
            'status' => $this->status,
            'alasan_blacklist' => $this->alasan_blacklist,
            'foto' => $this->foto ? asset('storage/' . $this->foto) : null,
            'jumlah_obat_masuk' => (int) ($this->obat_masuk_count ?? $this->obatMasuk()->count()),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
