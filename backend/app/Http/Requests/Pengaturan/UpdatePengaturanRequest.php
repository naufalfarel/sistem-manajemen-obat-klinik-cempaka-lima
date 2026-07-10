<?php

namespace App\Http\Requests\Pengaturan;

use App\Models\Setting;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePengaturanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * PengaturanData bersifat Partial<> di api.ts dan isi tiap kategori
     * adalah pasangan key-value yang fleksibel/terbuka untuk pengembangan ke
     * depan. Karena itu validasi di sini sengaja hanya membatasi BENTUK
     * (harus object per kategori yang dikenal), bukan daftar key yang kaku.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $rules = [];

        foreach (Setting::CATEGORIES as $category) {
            $rules[$category] = ['sometimes', 'array'];
        }

        // Validasi mendalam untuk key penting di dalam kategori
        $rules['stok.near_30'] = ['sometimes', 'integer', 'min:1'];
        $rules['stok.near_90'] = ['sometimes', 'integer', 'min:1'];
        $rules['stok.stok_minimum_default'] = ['sometimes', 'integer', 'min:1'];
        $rules['umum.nama_klinik'] = ['sometimes', 'string', 'max:255'];

        return $rules;
    }
}
