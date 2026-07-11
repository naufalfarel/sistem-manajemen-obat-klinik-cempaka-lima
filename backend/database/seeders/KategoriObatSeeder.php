<?php

namespace Database\Seeders;

use App\Models\KategoriObat;
use Illuminate\Database\Seeder;

class KategoriObatSeeder extends Seeder
{
    public function run(): void
    {
        $kategori = [
            ['kode' => 'KTG-01', 'nama' => 'Analgesik & Antipiretik', 'deskripsi' => 'Obat pereda nyeri dan penurun demam.'],
            ['kode' => 'KTG-02', 'nama' => 'Antibiotik', 'deskripsi' => 'Obat untuk infeksi bakteri.'],
            ['kode' => 'KTG-03', 'nama' => 'Antihistamin & Alergi', 'deskripsi' => 'Obat untuk reaksi alergi dan gatal-gatal.'],
            ['kode' => 'KTG-04', 'nama' => 'Vitamin & Suplemen', 'deskripsi' => 'Vitamin dan suplemen penunjang kesehatan.'],
            ['kode' => 'KTG-05', 'nama' => 'Obat Saluran Pencernaan', 'deskripsi' => 'Obat untuk gangguan lambung dan pencernaan.'],
            ['kode' => 'KTG-06', 'nama' => 'Antihipertensi', 'deskripsi' => 'Obat penurun tekanan darah tinggi.'],
            ['kode' => 'KTG-07', 'nama' => 'Antidiabetes', 'deskripsi' => 'Obat pengontrol gula darah.'],
            ['kode' => 'KTG-08', 'nama' => 'Obat Saluran Pernapasan', 'deskripsi' => 'Obat batuk, pilek, dan asma.'],
            ['kode' => 'KTG-09', 'nama' => 'Bahan Medis Habis Pakai (BMHP)', 'deskripsi' => 'Bahan medis habis pakai seperti plester, perban, kassa, dll.'],
            ['kode' => 'KTG-10', 'nama' => 'Cairan Antiseptik & Disinfektan', 'deskripsi' => 'Cairan untuk sterilisasi luka dan peralatan.'],
            ['kode' => 'KTG-11', 'nama' => 'Alat Kesehatan Habis Pakai', 'deskripsi' => 'Alat kesehatan sekali pakai seperti spuit, masker, sarung tangan.'],
        ];

        foreach ($kategori as $data) {
            KategoriObat::query()->updateOrCreate(['kode' => $data['kode']], $data);
        }
    }
}
