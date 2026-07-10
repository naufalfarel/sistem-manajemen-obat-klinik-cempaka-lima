<?php

namespace Database\Seeders;

use App\Models\Obat;
use App\Models\ObatKeluar;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * Sama seperti ObatMasukSeeder: ini riwayat historis untuk demo, bukan hasil
 * pemanggilan endpoint POST /obat-keluar - stok akhir sudah final lewat
 * ObatSeeder sehingga tidak dikurangi ulang di sini.
 */
class ObatKeluarSeeder extends Seeder
{
    public function run(): void
    {
        $kasir = User::query()->where('role', User::ROLE_KASIR)->first();

        $transaksi = [
            [
                'no_transaksi' => 'KLR-'.Carbon::now()->subDays(2)->format('Ymd').'-0001',
                'tanggal' => Carbon::now()->subDays(2),
                'pasien' => 'Muhammad Iqbal',
                'dokter' => 'dr. Andi Prasetyo',
                'metode_bayar' => 'bpjs',
                'status' => 'selesai',
                'alasan_retur_void' => null,
                'items' => [
                    ['kode' => 'OBT-0001', 'jumlah' => 10, 'harga' => 500],
                    ['kode' => 'OBT-0013', 'jumlah' => 30, 'harga' => 700],
                ],
            ],
            [
                'no_transaksi' => 'KLR-'.Carbon::now()->subDay()->format('Ymd').'-0001',
                'tanggal' => Carbon::now()->subDay(),
                'pasien' => 'Nurul Huda',
                'dokter' => null,
                'metode_bayar' => 'cash',
                'status' => 'selesai',
                'alasan_retur_void' => null,
                'items' => [
                    ['kode' => 'OBT-0009', 'jumlah' => 20, 'harga' => 450],
                    ['kode' => 'OBT-0007', 'jumlah' => 10, 'harga' => 600],
                ],
            ],
            [
                'no_transaksi' => 'KLR-'.Carbon::now()->format('Ymd').'-0001',
                'tanggal' => Carbon::now(),
                'pasien' => 'Rina Marlina',
                'dokter' => 'dr. Andi Prasetyo',
                'metode_bayar' => 'qris',
                'status' => 'retur',
                'alasan_retur_void' => 'Pasien salah menerima resep, obat dikembalikan utuh.',
                'items' => [
                    ['kode' => 'OBT-0018', 'jumlah' => 2, 'harga' => 15000],
                ],
            ],
        ];

        foreach ($transaksi as $data) {
            $items = $data['items'];
            unset($data['items']);

            $total = 0;
            foreach ($items as $item) {
                $total += $item['jumlah'] * $item['harga'];
            }

            $obatKeluar = ObatKeluar::query()->updateOrCreate(
                ['no_transaksi' => $data['no_transaksi']],
                [...$data, 'kasir_id' => $kasir->id, 'total' => $total],
            );

            $obatKeluar->items()->delete();
            foreach ($items as $item) {
                $obatId = Obat::query()->where('kode', $item['kode'])->value('id');

                $obatKeluar->items()->create([
                    'obat_id' => $obatId,
                    'jumlah' => $item['jumlah'],
                    'harga' => $item['harga'],
                    'subtotal' => $item['jumlah'] * $item['harga'],
                ]);
            }
        }
    }
}
