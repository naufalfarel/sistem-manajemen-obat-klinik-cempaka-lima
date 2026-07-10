<?php

namespace App\Exports;

use App\Models\Obat;
use App\Services\StokStatusService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class LaporanStokExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection(): Collection
    {
        return Obat::query()->with('kategori')->where('status', 'aktif')->orderBy('nama')->get();
    }

    /** @return array<int, string> */
    public function headings(): array
    {
        return ['Kode Obat', 'Nama Obat', 'Kategori', 'Stok', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok Minimum', 'Status Stok', 'Nilai Stok'];
    }

    /** @param  Obat  $obat */
    public function map($obat): array
    {
        return [
            $obat->kode,
            $obat->nama,
            $obat->kategori?->nama,
            $obat->stok,
            $obat->satuan,
            (float) $obat->harga_beli,
            (float) $obat->harga_jual,
            $obat->stok_minimum,
            StokStatusService::stokStatus($obat->stok, $obat->stok_minimum),
            (float) $obat->harga_beli * $obat->stok,
        ];
    }
}
