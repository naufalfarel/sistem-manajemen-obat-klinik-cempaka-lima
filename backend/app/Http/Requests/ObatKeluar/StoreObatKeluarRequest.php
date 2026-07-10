<?php

namespace App\Http\Requests\ObatKeluar;

use App\Models\ObatKeluar;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreObatKeluarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // kasir_id ada di tipe request api.ts (tidak di-Omit), tapi dalam
        // praktiknya transaksi hampir selalu dibuat oleh kasir yang login.
        // Jika field ini tidak dikirim, default ke user yang sedang login.
        if (! $this->filled('kasir_id') && $this->user()) {
            $this->merge(['kasir_id' => $this->user()->id]);
        }

        if ($this->has('metode_bayar')) {
            $map = [
                'tunai' => 'cash',
                'cash' => 'cash',
                'qris' => 'qris',
                'debit' => 'debit',
                'kredit' => 'kredit',
                'bpjs' => 'bpjs',
            ];
            $this->merge([
                'metode_bayar' => $map[$this->input('metode_bayar')] ?? $this->input('metode_bayar')
            ]);
        }
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'tanggal' => ['required', 'date'],
            'pasien' => ['required', 'string', 'max:255'],
            'dokter' => ['nullable', 'string', 'max:255'],
            'metode_bayar' => ['required', Rule::in(ObatKeluar::METODE_BAYAR)],
            'kasir_id' => ['required', 'integer', 'exists:users,id'],

            // Status HANYA boleh 'selesai' saat pembuatan transaksi. 'retur'
            // dan 'void' wajib lewat endpoint PATCH khusus supaya alasan dan
            // pengembalian stok tercatat konsisten. Lihat README.md.
            'status' => ['sometimes', Rule::in(['selesai'])],

            'items' => ['required', 'array', 'min:1'],
            'items.*.obat_id' => ['required', 'integer', 'exists:obat,id', 'distinct'],
            'items.*.jumlah' => ['required', 'integer', 'min:1'],
            'items.*.harga' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.in' => 'Transaksi baru harus berstatus "selesai". Gunakan endpoint retur/void untuk mengubah status setelahnya.',
            'items.required' => 'Minimal satu obat harus dimasukkan dalam transaksi ini.',
            'items.*.obat_id.distinct' => 'Setiap obat hanya boleh muncul satu kali per transaksi.',
        ];
    }
}
