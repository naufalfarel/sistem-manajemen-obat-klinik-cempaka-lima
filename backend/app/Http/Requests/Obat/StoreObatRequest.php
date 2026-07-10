<?php

namespace App\Http\Requests\Obat;

use App\Models\Obat;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreObatRequest extends FormRequest
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
            'nama_generik' => ['nullable', 'string', 'max:255'],
            'kategori_id' => ['required', 'integer', 'exists:kategori_obat,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'satuan' => ['required', 'string', 'max:50'],
            'stok' => ['required', 'integer', 'min:0'],
            'stok_minimum' => ['required', 'integer', 'min:0'],
            'harga_beli' => ['required', 'numeric', 'min:0'],
            'harga_jual' => ['required', 'numeric', 'min:0'],
            'golongan' => ['required', Rule::in(Obat::GOLONGAN)],
            'lokasi_rak' => ['nullable', 'string', 'max:50'],
            'expired_date' => ['nullable', 'date'],
            'status' => ['sometimes', Rule::in(['aktif', 'nonaktif'])],
            'foto' => ['nullable', 'image', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'kategori_id.exists' => 'Kategori obat yang dipilih tidak ditemukan.',
            'harga_jual.min' => 'Harga jual tidak boleh negatif.',
        ];
    }
}
