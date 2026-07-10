<?php

namespace App\Http\Requests\Supplier;

use App\Models\Supplier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'nama' => ['required', 'string', 'max:255'],
            'alamat' => ['required', 'string'],
            'kota' => ['required', 'string', 'max:100'],
            'telepon' => ['required', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'pic' => ['required', 'string', 'max:255'],
            'npwp' => ['nullable', 'string', 'max:50'],
            'no_izin_pbf' => ['nullable', 'string', 'max:100'],
            'sertifikat_cdob' => ['nullable', 'string', 'max:100'],
            'exp_izin_pbf' => ['nullable', 'date'],
            'exp_cdob' => ['nullable', 'date'],
            'termin_pembayaran' => ['required', Rule::in(Supplier::TERMIN)],
            'lead_time' => ['required', 'integer', 'min:0'],
            'status' => ['sometimes', Rule::in(Supplier::STATUS)],
            'foto' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
