<?php

namespace App\Exports;

use App\Models\Obat;
use App\Services\StokStatusService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class LaporanKadaluarsaExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection(): Collection
    {
        return Obat::query()
            ->where('status', 'aktif')
            ->whereNotNull('expired_date')
            ->orderBy('expired_date')
            ->get();
    }

    /** @return array<int, string> */
    public function headings(): array
    {
        return ['Kode', 'Nama Obat', 'Stok', 'Tanggal Expired', 'Sisa Hari', 'Status'];
    }

    /** @param  Obat  $obat */
    public function map($obat): array
    {
        $exp = StokStatusService::expStatus($obat->expired_date);

        return [
            $obat->kode,
            $obat->nama,
            $obat->stok,
            $obat->expired_date?->toDateString(),
            $exp['hari_expired'],
            $exp['status_exp'],
        ];
    }
}
