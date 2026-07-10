<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'kode' => 'SUP-0001',
                'nama' => 'PT Kimia Farma Trading & Distribution',
                'alamat' => 'Jl. Veteran No. 9, Banda Aceh',
                'kota' => 'Banda Aceh',
                'telepon' => '(0651) 22334',
                'email' => 'kftd.aceh@kimiafarma.co.id',
                'pic' => 'Bambang Setiawan',
                'npwp' => '01.234.567.8-901.000',
                'no_izin_pbf' => 'PBF-001/ACEH/2020',
                'sertifikat_cdob' => 'CDOB-2023-0011',
                'exp_izin_pbf' => Carbon::now()->addYears(2),
                'exp_cdob' => Carbon::now()->addYear(),
                'termin_pembayaran' => 'tempo30',
                'lead_time' => 3,
                'status' => 'aktif',
            ],
            [
                'kode' => 'SUP-0002',
                'nama' => 'PT Enseval Putera Megatrading',
                'alamat' => 'Jl. T. Nyak Arief No. 45, Banda Aceh',
                'kota' => 'Banda Aceh',
                'telepon' => '(0651) 44556',
                'email' => 'sales.aceh@enseval.com',
                'pic' => 'Rina Kartika',
                'npwp' => '02.345.678.9-012.000',
                'no_izin_pbf' => 'PBF-002/ACEH/2019',
                'sertifikat_cdob' => 'CDOB-2022-0034',
                'exp_izin_pbf' => Carbon::now()->addYears(3),
                'exp_cdob' => Carbon::now()->addMonths(8),
                'termin_pembayaran' => 'tempo60',
                'lead_time' => 5,
                'status' => 'aktif',
            ],
            [
                'kode' => 'SUP-0003',
                'nama' => 'PT Anugrah Pharmindo Lestari',
                'alamat' => 'Jl. Sultan Iskandar Muda No. 12, Banda Aceh',
                'kota' => 'Banda Aceh',
                'telepon' => '(0651) 66778',
                'email' => 'apl.distribusi@gmail.com',
                'pic' => 'Yusuf Hamdani',
                'npwp' => '03.456.789.0-123.000',
                'no_izin_pbf' => 'PBF-003/ACEH/2021',
                'sertifikat_cdob' => 'CDOB-2023-0055',
                'exp_izin_pbf' => Carbon::now()->addYear(),
                'exp_cdob' => Carbon::now()->addMonths(4),
                'termin_pembayaran' => 'cash',
                'lead_time' => 2,
                'status' => 'aktif',
            ],
            [
                'kode' => 'SUP-0004',
                'nama' => 'PT Merapi Utama Pharma',
                'alamat' => 'Jl. Cut Nyak Dhien No. 8, Lhokseumawe',
                'kota' => 'Lhokseumawe',
                'telepon' => '(0645) 33221',
                'email' => 'mup.lhokseumawe@merapi.co.id',
                'pic' => 'Fitriani Ulfa',
                'npwp' => '04.567.890.1-234.000',
                'no_izin_pbf' => 'PBF-004/ACEH/2018',
                'sertifikat_cdob' => 'CDOB-2021-0078',
                'exp_izin_pbf' => Carbon::now()->subMonths(2),
                'exp_cdob' => Carbon::now()->subMonth(),
                'termin_pembayaran' => 'tempo90',
                'lead_time' => 7,
                'status' => 'blacklist',
                'alasan_blacklist' => 'Izin PBF dan sertifikat CDOB telah kedaluwarsa dan belum diperpanjang.',
            ],
            [
                'kode' => 'SUP-0005',
                'nama' => 'PT Bina San Prima',
                'alamat' => 'Jl. Prof. A. Majid Ibrahim No. 3, Banda Aceh',
                'kota' => 'Banda Aceh',
                'telepon' => '(0651) 88990',
                'email' => 'binasanprima.aceh@gmail.com',
                'pic' => 'Teuku Iskandar',
                'npwp' => '05.678.901.2-345.000',
                'no_izin_pbf' => 'PBF-005/ACEH/2022',
                'sertifikat_cdob' => 'CDOB-2023-0099',
                'exp_izin_pbf' => Carbon::now()->addYears(2),
                'exp_cdob' => Carbon::now()->addYear(),
                'termin_pembayaran' => 'tempo30',
                'lead_time' => 4,
                'status' => 'aktif',
            ],
        ];

        foreach ($suppliers as $data) {
            Supplier::query()->updateOrCreate(['kode' => $data['kode']], $data);
        }
    }
}
