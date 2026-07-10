<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

/**
 * Dipakai HANYA pada endpoint detail (GET /obat-masuk/{id}) dan sebagai
 * response create(). Menambahkan `items` di atas bentuk dasar ObatMasuk
 * sesuai keputusan desain untuk celah kontrak #1 - lihat README.md.
 *
 * @mixin \App\Models\ObatMasuk
 */
class ObatMasukDetailResource extends ObatMasukResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            ...parent::toArray($request),
            'items' => ObatMasukItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
