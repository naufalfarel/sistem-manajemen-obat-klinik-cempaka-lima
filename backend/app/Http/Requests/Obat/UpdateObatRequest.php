<?php

namespace App\Http\Requests\Obat;

use App\Models\Obat;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateObatRequest extends FormRequest
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
            'nama_generik' => ['nullable', 'string', 'max:255'],
            'kategori_id' => ['sometimes', 'required', 'integer', 'exists:kategori_obat,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'satuan' => ['sometimes', 'required', 'string', 'max:50'],
            'stok' => ['sometimes', 'required', 'integer', 'min:0'],
            'stok_minimum' => ['sometimes', 'required', 'integer', 'min:0'],
            'harga_beli' => ['sometimes', 'required', 'numeric', 'min:0'],
            'harga_jual' => ['sometimes', 'required', 'numeric', 'min:0'],
            'golongan' => ['sometimes', 'required', Rule::in(Obat::GOLONGAN)],
            'lokasi_rak' => ['nullable', 'string', 'max:50'],
            'expired_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'required', Rule::in(['aktif', 'nonaktif'])],
            'foto' => ['nullable', 'image', 'max:2048'],
        ];
    }
}
