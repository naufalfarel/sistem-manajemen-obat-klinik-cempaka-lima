<?php

namespace App\Http\Resources;

use App\Services\StokStatusService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Membungkus model Obat menjadi bentuk MonitoringItem di api.ts.
 * status_stok dan status_exp SENGAJA tidak disimpan sebagai kolom - selalu
 * dihitung ulang lewat StokStatusService setiap resource ini dibentuk, agar
 * selalu akurat terhadap waktu saat ini dan ambang di Pengaturan > Stok.
 *
 * @mixin \App\Models\Obat
 */
class MonitoringItemResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        $exp = StokStatusService::expStatus($this->expired_date);

        return [
            'obat_id' => $this->id,
            'nama' => $this->nama,
            'kode' => $this->kode,
            'stok' => $this->stok,
            'stok_minimum' => $this->stok_minimum,
            'expired_date' => $this->expired_date?->toDateString(),
            'status_stok' => StokStatusService::stokStatus($this->stok, $this->stok_minimum),
            'hari_expired' => $exp['hari_expired'],
            'status_exp' => $exp['status_exp'],
        ];
    }
}
