<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\ObatKeluar
 */
class ObatKeluarResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'no_transaksi' => $this->no_transaksi,
            'tanggal' => $this->tanggal?->toDateString(),
            'nama_pasien' => $this->pasien,
            'pasien' => $this->pasien,
            'no_rekam_medis' => null,
            'dokter' => $this->dokter,
            'total' => (float) $this->total,
            'metode_pembayaran' => $this->metode_bayar === 'cash' ? 'tunai' : ($this->metode_bayar === 'kredit' ? 'bpjs' : $this->metode_bayar),
            'metode_bayar' => $this->metode_bayar,
            'status' => $this->status,
            'alasan_retur_void' => $this->alasan_retur_void,
            'petugas_id' => $this->kasir_id,
            'petugas' => $this->relationLoaded('kasir') ? [
                'id' => $this->kasir->id,
                'nama' => $this->kasir->nama,
            ] : [
                'id' => $this->kasir_id,
                'nama' => \App\Models\User::find($this->kasir_id)?->nama ?? 'Petugas',
            ],
            'jenis' => $this->status !== 'selesai' ? $this->status : ($this->dokter ? 'resep' : 'otc'),
            'catatan' => $this->alasan_retur_void,
            'items' => ObatKeluarItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
