<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obat_keluar', function (Blueprint $table) {
            $table->id();
            $table->string('no_transaksi')->unique();
            $table->date('tanggal');
            $table->string('pasien');
            $table->string('dokter')->nullable();
            $table->enum('metode_bayar', ['cash', 'qris', 'debit', 'kredit', 'bpjs'])->default('cash');
            $table->decimal('total', 16, 2)->default(0)->comment('computed dari items');
            $table->enum('status', ['selesai', 'retur', 'void'])->default('selesai');
            $table->string('alasan_retur_void')->nullable();
            $table->foreignId('kasir_id')->constrained('users')->restrictOnDelete();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['status', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obat_keluar');
    }
};
