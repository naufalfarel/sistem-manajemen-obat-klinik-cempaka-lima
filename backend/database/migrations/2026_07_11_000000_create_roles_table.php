<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        DB::table('roles')->insert([
            [
                'name' => 'Administrator',
                'slug' => 'admin',
                'description' => 'Akses penuh ke semua fitur dan pengaturan sistem',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Apoteker',
                'slug' => 'apoteker',
                'description' => 'Manajemen obat, persediaan, dan usulan harga',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Staf Gudang',
                'slug' => 'staf-gudang',
                'description' => 'Pencatatan obat masuk (faktur) dan stok gudang',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Kasir',
                'slug' => 'kasir',
                'description' => 'Pencatatan obat keluar (penjualan/transaksi pasien)',
                'created_at' => now(),
                'updated_at' => now()
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
