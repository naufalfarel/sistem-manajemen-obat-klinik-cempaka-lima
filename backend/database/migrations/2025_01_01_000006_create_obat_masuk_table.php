<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obat_masuk', function (Blueprint $table) {
            $table->id();
            $table->string('no_transaksi')->unique();
            $table->date('tanggal');
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->unsignedInteger('total_item')->default(0)->comment('jumlah baris/jenis obat, computed');
            $table->decimal('nilai_total', 16, 2)->default(0)->comment('computed dari items');
            $table->enum('status', ['draft', 'diterima', 'sebagian', 'dikembalikan'])->default('draft');
            $table->foreignId('petugas_id')->constrained('users')->restrictOnDelete();
            $table->text('catatan')->nullable();
            $table->string('foto_nota')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['status', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obat_masuk');
    }
};
