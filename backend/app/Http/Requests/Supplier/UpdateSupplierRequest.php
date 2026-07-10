<?php

namespace App\Http\Requests\Supplier;

use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nama' => ['sometimes', 'required', 'string', 'max:255'],
            'alamat' => ['sometimes', 'required', 'string'],
            'kota' => ['sometimes', 'required', 'string', 'max:100'],
            'telepon' => ['sometimes', 'required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'pic' => ['sometimes', 'required', 'string', 'max:255'],
            'npwp' => ['nullable', 'string', 'max:50'],
            'no_izin_pbf' => ['nullable', 'string', 'max:100'],
            'sertifikat_cdob' => ['nullable', 'string', 'max:100'],
            'exp_izin_pbf' => ['nullable', 'date'],
            'exp_cdob' => ['nullable', 'date'],
            'termin_pembayaran' => ['sometimes', 'required', Rule::in(Supplier::TERMIN)],
            'lead_time' => ['sometimes', 'required', 'integer', 'min:0'],
            // Perubahan status ke/dari 'blacklist' sengaja TIDAK divalidasi di
            // sini - gunakan endpoint khusus PATCH /supplier/{id}/blacklist
            // dan /restore agar alasan_blacklist selalu konsisten terisi.
            'status' => ['sometimes', 'required', Rule::in(['aktif', 'nonaktif'])],
            'foto' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
