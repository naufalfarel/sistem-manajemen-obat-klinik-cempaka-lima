<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Password default SEMUA akun seed: "Cempaka@123"
     * (didokumentasikan juga di README.md - WAJIB diganti sebelum produksi).
     */
    public function run(): void
    {
        $password = Hash::make('Cempaka@123');

        $users = [
            [
                'nama' => 'Muhammad Rizki (Admin)',
                'username' => 'admin',
                'email' => 'admin@cempakalima.id',
                'nip' => '198501012010011001',
                'role' => User::ROLE_ADMIN,
            ],
            [
                'nama' => 'Apt. Siti Rahmawati, S.Farm',
                'username' => 'apoteker1',
                'email' => 'apoteker@cempakalima.id',
                'nip' => '199003152015022002',
                'role' => User::ROLE_APOTEKER,
            ],
            [
                'nama' => 'Ahmad Fauzan',
                'username' => 'gudang1',
                'email' => 'gudang@cempakalima.id',
                'nip' => '199206202018011003',
                'role' => User::ROLE_STAF_GUDANG,
            ],
            [
                'nama' => 'Dewi Kurniawati',
                'username' => 'kasir1',
                'email' => 'kasir@cempakalima.id',
                'nip' => '199508102019022004',
                'role' => User::ROLE_KASIR,
            ],
        ];

        foreach ($users as $data) {
            User::query()->updateOrCreate(
                ['email' => $data['email']],
                [...$data, 'password' => $password, 'status' => 'aktif'],
            );
        }
    }
}
