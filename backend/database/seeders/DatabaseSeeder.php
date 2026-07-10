<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SettingSeeder::class,
            UserSeeder::class,
            KategoriObatSeeder::class,
            ObatSeeder::class,
            SupplierSeeder::class,
            ObatMasukSeeder::class,
            ObatKeluarSeeder::class,
        ]);
    }
}
