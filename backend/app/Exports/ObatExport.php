<?php

namespace App\Exports;

use App\Models\Obat;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ObatExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection(): Collection
    {
        return Obat::query()->with('kategori')->orderBy('nama')->get();
    }

    /** @return array<int, string> */
    public function headings(): array
    {
        return [
            'Kode', 'Nama Obat', 'Nama Generik', 'Kategori', 'Satuan',
            'Stok', 'Stok Minimum', 'Harga Beli', 'Harga Jual',
            'Golongan', 'Lokasi Rak', 'Tanggal Expired', 'Status',
        ];
    }

    /** @return array<int, mixed> */
    public function map($obat): array
    {
        /** @var Obat $obat */
        return [
            $obat->kode,
            $obat->nama,
            $obat->nama_generik,
            $obat->kategori?->nama,
            $obat->satuan,
            $obat->stok,
            $obat->stok_minimum,
            (float) $obat->harga_beli,
            (float) $obat->harga_jual,
            $obat->golongan,
            $obat->lokasi_rak,
            $obat->expired_date?->toDateString(),
            $obat->status,
        ];
    }
}
