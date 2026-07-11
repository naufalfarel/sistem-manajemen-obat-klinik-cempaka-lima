<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('riwayat_harga', function (Blueprint $table) {
            $table->id();
            $table->foreignId('obat_id')->constrained('obat')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('harga_beli_lama', 14, 2);
            $table->decimal('harga_beli_baru', 14, 2);
            $table->decimal('harga_jual_lama', 14, 2);
            $table->decimal('harga_jual_baru', 14, 2);
            $table->string('sumber'); // 'manual' atau 'faktur'
            $table->string('no_transaksi')->nullable();
            $table->enum('status', ['disetujui', 'usulan', 'ditolak'])->default('disetujui');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('riwayat_harga');
    }
};
