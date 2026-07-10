<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class LaporanPenjualanExport implements FromCollection, WithHeadings, WithMapping
{
    /** @param  Collection<int, array<string, mixed>>  $rows */
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    /** @return array<int, string> */
    public function headings(): array
    {
        return ['No. Transaksi', 'Tanggal', 'Pasien', 'Dokter', 'Metode Bayar', 'Jumlah Item', 'Total'];
    }

    /** @param  array<string, mixed>  $row */
    public function map($row): array
    {
        return [
            $row['no_transaksi'],
            $row['tanggal'],
            $row['pasien'],
            $row['dokter'],
            $row['metode_bayar'],
            $row['jumlah_item'],
            $row['total'],
        ];
    }
}
