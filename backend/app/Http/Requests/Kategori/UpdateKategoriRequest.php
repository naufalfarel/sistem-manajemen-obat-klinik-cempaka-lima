<?php

namespace App\Http\Requests\Kategori;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKategoriRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        $kategoriId = $this->route('kategori');

        return [
            'nama' => ['sometimes', 'required', 'string', 'max:255'],
            'kode' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('kategori_obat', 'kode')->ignore($kategoriId)],
            'deskripsi' => ['nullable', 'string'],
        ];
    }
}
