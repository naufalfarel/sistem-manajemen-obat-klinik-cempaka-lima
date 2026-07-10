<?php

namespace App\Http\Requests\ObatMasuk;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreObatMasukRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // petugas_id ada di tipe request api.ts (tidak di-Omit). Jika tidak
        // dikirim, default ke user yang sedang login (pola sama dengan
        // kasir_id pada StoreObatKeluarRequest).
        if (! $this->filled('petugas_id') && $this->user()) {
            $this->merge(['petugas_id' => $this->user()->id]);
        }

        if (is_string($this->items)) {
            $this->merge([
                'items' => json_decode($this->items, true)
            ]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'tanggal' => ['required', 'date'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'petugas_id' => ['required', 'integer', 'exists:users,id'],
            'catatan' => ['nullable', 'string', 'max:1000'],
            'foto_nota' => ['nullable', 'image', 'max:2048'],

            // Status HANYA boleh 'draft' saat pembuatan. Transisi ke
            // 'diterima' wajib lewat PATCH /obat-masuk/{id}/terima supaya
            // penambahan stok konsisten & ter-audit. 'sebagian' dan
            // 'dikembalikan' disediakan di enum untuk pengembangan lanjutan
            // namun belum punya endpoint pemicu otomatis pada versi ini.
            'status' => ['sometimes', Rule::in(['draft'])],

            // `items` mengisi celah kontrak: tipe ObatMasuk di api.ts tidak
            // mendeklarasikan field ini, tapi total_item/nilai_total wajib
            // dihitung dari rincian obat yang diterima. Lihat README.md.
            'items' => ['required', 'array', 'min:1'],
            'items.*.obat_id' => ['required', 'integer', 'exists:obat,id'],
            'items.*.jumlah' => ['required', 'integer', 'min:1'],
            'items.*.harga_satuan' => ['required', 'numeric', 'min:0'],
            'items.*.no_batch' => ['nullable', 'string', 'max:100'],
            'items.*.expired_date' => ['nullable', 'date', 'after_or_equal:tanggal'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Transaksi baru harus berstatus "draft". Gunakan endpoint /terima untuk memproses penerimaan.',
            'items.required' => 'Minimal satu obat harus dimasukkan dalam transaksi ini.',
            'items.*.obat_id.exists' => 'Salah satu obat yang dipilih tidak ditemukan.',
        ];
    }
}
