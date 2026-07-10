<?php

namespace Database\Seeders;

use App\Models\Obat;
use App\Models\ObatMasuk;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Catatan: karena stok akhir obat pada ObatSeeder sudah ditetapkan langsung
 * (nilai final untuk demo monitoring), transaksi "diterima" di sini TIDAK
 * memicu ulang penambahan stok (itu hanya terjadi lewat endpoint
 * PATCH /obat-masuk/{id}/terima di aplikasi nyata). Data di bawah murni
 * riwayat historis untuk keperluan tampilan listing & audit trail.
 */
class ObatMasukSeeder extends Seeder
{
    public function run(): void
    {
        $petugas = User::query()->where('role', User::ROLE_STAF_GUDANG)->first()
            ?? User::query()->where('role', User::ROLE_ADMIN)->first();

        $supplierKfa = Supplier::query()->where('kode', 'SUP-0001')->first();
        $supplierEnseval = Supplier::query()->where('kode', 'SUP-0002')->first();

        $transaksi = [
            [
                'no_transaksi' => 'MSK-'.Carbon::now()->subDays(10)->format('Ymd').'-0001',
                'tanggal' => Carbon::now()->subDays(10),
                'supplier_id' => $supplierKfa->id,
                'status' => 'diterima',
                'catatan' => 'Pengadaan rutin bulanan.',
                'items' => [
                    ['kode' => 'OBT-0001', 'jumlah' => 500, 'harga_satuan' => 250],
                    ['kode' => 'OBT-0004', 'jumlah' => 200, 'harga_satuan' => 500],
                ],
            ],
            [
                'no_transaksi' => 'MSK-'.Carbon::now()->subDays(3)->format('Ymd').'-0001',
                'tanggal' => Carbon::now()->subDays(3),
                'supplier_id' => $supplierEnseval->id,
                'status' => 'diterima',
                'catatan' => null,
                'items' => [
                    ['kode' => 'OBT-0007', 'jumlah' => 150, 'harga_satuan' => 300],
                    ['kode' => 'OBT-0009', 'jumlah' => 300, 'harga_satuan' => 200],
                ],
            ],
            [
                'no_transaksi' => 'MSK-'.Carbon::now()->format('Ymd').'-0001',
                'tanggal' => Carbon::now(),
                'supplier_id' => $supplierKfa->id,
                'status' => 'draft',
                'catatan' => 'Menunggu verifikasi barang oleh apoteker.',
                'items' => [
                    ['kode' => 'OBT-0012', 'jumlah' => 100, 'harga_satuan' => 600],
                ],
            ],
        ];

        foreach ($transaksi as $data) {
            $items = $data['items'];
            unset($data['items']);

            $totalItem = count($items);
            $nilaiTotal = 0;
            foreach ($items as $item) {
                $nilaiTotal += $item['jumlah'] * $item['harga_satuan'];
            }

            $obatMasuk = ObatMasuk::query()->updateOrCreate(
                ['no_transaksi' => $data['no_transaksi']],
                [
                    ...$data,
                    'petugas_id' => $petugas->id,
                    'total_item' => $totalItem,
                    'nilai_total' => $nilaiTotal,
                ],
            );

            $obatMasuk->items()->delete();
            foreach ($items as $item) {
                $obatId = Obat::query()->where('kode', $item['kode'])->value('id');

                $obatMasuk->items()->create([
                    'obat_id' => $obatId,
                    'jumlah' => $item['jumlah'],
                    'harga_satuan' => $item['harga_satuan'],
                    'subtotal' => $item['jumlah'] * $item['harga_satuan'],
                ]);
            }
        }
    }
}
