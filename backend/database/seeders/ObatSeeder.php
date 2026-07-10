<?php

namespace Database\Seeders;

use App\Models\KategoriObat;
use App\Models\Obat;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ObatSeeder extends Seeder
{
    public function run(): void
    {
        $k = fn (string $kode) => KategoriObat::query()->where('kode', $kode)->value('id');

        $today = Carbon::today();

        $data = [
            // ── Analgesik & Antipiretik ──────────────────────────────────
            ['kode' => 'OBT-0001', 'nama' => 'Paracetamol 500mg', 'nama_generik' => 'Paracetamol', 'kategori_id' => $k('KTG-01'), 'satuan' => 'Tablet', 'stok' => 850, 'stok_minimum' => 100, 'harga_beli' => 250, 'harga_jual' => 500, 'golongan' => 'bebas', 'lokasi_rak' => 'A1-01', 'expired_date' => $today->copy()->addMonths(18)],
            ['kode' => 'OBT-0002', 'nama' => 'Ibuprofen 400mg', 'nama_generik' => 'Ibuprofen', 'kategori_id' => $k('KTG-01'), 'satuan' => 'Tablet', 'stok' => 15, 'stok_minimum' => 50, 'harga_beli' => 400, 'harga_jual' => 800, 'golongan' => 'bebas-terbatas', 'lokasi_rak' => 'A1-02', 'expired_date' => $today->copy()->addDays(20)],
            ['kode' => 'OBT-0003', 'nama' => 'Asam Mefenamat 500mg', 'nama_generik' => 'Mefenamic Acid', 'kategori_id' => $k('KTG-01'), 'satuan' => 'Tablet', 'stok' => 0, 'stok_minimum' => 40, 'harga_beli' => 350, 'harga_jual' => 700, 'golongan' => 'keras', 'lokasi_rak' => 'A1-03', 'expired_date' => $today->copy()->addYear()],

            // ── Antibiotik ────────────────────────────────────────────────
            ['kode' => 'OBT-0004', 'nama' => 'Amoxicillin 500mg', 'nama_generik' => 'Amoxicillin', 'kategori_id' => $k('KTG-02'), 'satuan' => 'Kapsul', 'stok' => 320, 'stok_minimum' => 80, 'harga_beli' => 500, 'harga_jual' => 1000, 'golongan' => 'keras', 'lokasi_rak' => 'B1-01', 'expired_date' => $today->copy()->addDays(75)],
            ['kode' => 'OBT-0005', 'nama' => 'Ciprofloxacin 500mg', 'nama_generik' => 'Ciprofloxacin', 'kategori_id' => $k('KTG-02'), 'satuan' => 'Tablet', 'stok' => 45, 'stok_minimum' => 40, 'harga_beli' => 900, 'harga_jual' => 1800, 'golongan' => 'keras', 'lokasi_rak' => 'B1-02', 'expired_date' => $today->copy()->subDays(5)],
            ['kode' => 'OBT-0006', 'nama' => 'Azithromycin 500mg', 'nama_generik' => 'Azithromycin', 'kategori_id' => $k('KTG-02'), 'satuan' => 'Tablet', 'stok' => 60, 'stok_minimum' => 20, 'harga_beli' => 3500, 'harga_jual' => 6500, 'golongan' => 'keras', 'lokasi_rak' => 'B1-03', 'expired_date' => $today->copy()->addMonths(10)],

            // ── Antihistamin & Alergi ───────────────────────────────────
            ['kode' => 'OBT-0007', 'nama' => 'Cetirizine 10mg', 'nama_generik' => 'Cetirizine', 'kategori_id' => $k('KTG-03'), 'satuan' => 'Tablet', 'stok' => 200, 'stok_minimum' => 50, 'harga_beli' => 300, 'harga_jual' => 600, 'golongan' => 'bebas-terbatas', 'lokasi_rak' => 'C1-01', 'expired_date' => $today->copy()->addMonths(14)],
            ['kode' => 'OBT-0008', 'nama' => 'Loratadine 10mg', 'nama_generik' => 'Loratadine', 'kategori_id' => $k('KTG-03'), 'satuan' => 'Tablet', 'stok' => 8, 'stok_minimum' => 30, 'harga_beli' => 450, 'harga_jual' => 900, 'golongan' => 'bebas-terbatas', 'lokasi_rak' => 'C1-02', 'expired_date' => $today->copy()->addDays(60)],

            // ── Vitamin & Suplemen ───────────────────────────────────────
            ['kode' => 'OBT-0009', 'nama' => 'Vitamin C 500mg', 'nama_generik' => 'Ascorbic Acid', 'kategori_id' => $k('KTG-04'), 'satuan' => 'Tablet', 'stok' => 500, 'stok_minimum' => 100, 'harga_beli' => 200, 'harga_jual' => 450, 'golongan' => 'bebas', 'lokasi_rak' => 'D1-01', 'expired_date' => $today->copy()->addMonths(20)],
            ['kode' => 'OBT-0010', 'nama' => 'Vitamin B Complex', 'nama_generik' => null, 'kategori_id' => $k('KTG-04'), 'satuan' => 'Tablet', 'stok' => 180, 'stok_minimum' => 50, 'harga_beli' => 300, 'harga_jual' => 600, 'golongan' => 'bebas', 'lokasi_rak' => 'D1-02', 'expired_date' => null],

            // ── Obat Saluran Pencernaan ──────────────────────────────────
            ['kode' => 'OBT-0011', 'nama' => 'Antasida DOEN', 'nama_generik' => 'Antasida', 'kategori_id' => $k('KTG-05'), 'satuan' => 'Tablet', 'stok' => 12, 'stok_minimum' => 40, 'harga_beli' => 150, 'harga_jual' => 350, 'golongan' => 'bebas', 'lokasi_rak' => 'E1-01', 'expired_date' => $today->copy()->addDays(85)],
            ['kode' => 'OBT-0012', 'nama' => 'Omeprazole 20mg', 'nama_generik' => 'Omeprazole', 'kategori_id' => $k('KTG-05'), 'satuan' => 'Kapsul', 'stok' => 95, 'stok_minimum' => 30, 'harga_beli' => 600, 'harga_jual' => 1200, 'golongan' => 'keras', 'lokasi_rak' => 'E1-02', 'expired_date' => $today->copy()->addMonths(9)],

            // ── Antihipertensi ───────────────────────────────────────────
            ['kode' => 'OBT-0013', 'nama' => 'Amlodipine 10mg', 'nama_generik' => 'Amlodipine', 'kategori_id' => $k('KTG-06'), 'satuan' => 'Tablet', 'stok' => 150, 'stok_minimum' => 40, 'harga_beli' => 350, 'harga_jual' => 700, 'golongan' => 'keras', 'lokasi_rak' => 'F1-01', 'expired_date' => $today->copy()->addDays(10)],
            ['kode' => 'OBT-0014', 'nama' => 'Captopril 25mg', 'nama_generik' => 'Captopril', 'kategori_id' => $k('KTG-06'), 'satuan' => 'Tablet', 'stok' => 210, 'stok_minimum' => 60, 'harga_beli' => 200, 'harga_jual' => 450, 'golongan' => 'keras', 'lokasi_rak' => 'F1-02', 'expired_date' => $today->copy()->addYear()],

            // ── Antidiabetes ─────────────────────────────────────────────
            ['kode' => 'OBT-0015', 'nama' => 'Metformin 500mg', 'nama_generik' => 'Metformin', 'kategori_id' => $k('KTG-07'), 'satuan' => 'Tablet', 'stok' => 3, 'stok_minimum' => 50, 'harga_beli' => 250, 'harga_jual' => 500, 'golongan' => 'keras', 'lokasi_rak' => 'G1-01', 'expired_date' => $today->copy()->addDays(120)],
            ['kode' => 'OBT-0016', 'nama' => 'Glimepiride 2mg', 'nama_generik' => 'Glimepiride', 'kategori_id' => $k('KTG-07'), 'satuan' => 'Tablet', 'stok' => 70, 'stok_minimum' => 25, 'harga_beli' => 800, 'harga_jual' => 1600, 'golongan' => 'keras', 'lokasi_rak' => 'G1-02', 'expired_date' => $today->copy()->subDays(15)],

            // ── Obat Saluran Pernapasan ──────────────────────────────────
            ['kode' => 'OBT-0017', 'nama' => 'Salbutamol Inhaler', 'nama_generik' => 'Salbutamol', 'kategori_id' => $k('KTG-08'), 'satuan' => 'Tabung', 'stok' => 25, 'stok_minimum' => 10, 'harga_beli' => 25000, 'harga_jual' => 45000, 'golongan' => 'keras', 'lokasi_rak' => 'H1-01', 'expired_date' => $today->copy()->addMonths(16)],
            ['kode' => 'OBT-0018', 'nama' => 'Ambroxol Syrup 60ml', 'nama_generik' => 'Ambroxol', 'kategori_id' => $k('KTG-08'), 'satuan' => 'Botol', 'stok' => 40, 'stok_minimum' => 15, 'harga_beli' => 8000, 'harga_jual' => 15000, 'golongan' => 'bebas-terbatas', 'lokasi_rak' => 'H1-02', 'expired_date' => $today->copy()->addDays(28)],
        ];

        foreach ($data as $obat) {
            Obat::query()->updateOrCreate(
                ['kode' => $obat['kode']],
                [...$obat, 'status' => 'aktif'],
            );
        }
    }
}
