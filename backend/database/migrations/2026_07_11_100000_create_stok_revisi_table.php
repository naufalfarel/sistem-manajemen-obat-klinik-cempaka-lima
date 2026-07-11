<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stok_revisi', function (Blueprint $table) {
            $table->id();
            $table->string('no_revisi')->unique(); // Nomor dokumen revisi otomatis
            $table->foreignId('obat_id')->constrained('obat')->onDelete('cascade');
            $table->foreignId('petugas_id')->constrained('users');
            $table->date('tanggal');
            $table->enum('tipe', ['tambah', 'kurang', 'set']); // tipe penyesuaian
            $table->integer('stok_sebelum');
            $table->integer('jumlah');       // jumlah yang disesuaikan
            $table->integer('stok_sesudah');
            $table->enum('alasan', [
                'rusak',
                'kadaluarsa',
                'hilang',
                'temuan',
                'koreksi_sistem',
                'penerimaan_lain',
                'lainnya',
            ]);
            $table->text('catatan')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stok_revisi');
    }
};
