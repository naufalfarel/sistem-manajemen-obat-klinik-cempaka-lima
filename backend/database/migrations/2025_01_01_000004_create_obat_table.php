<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obat', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->unique();
            $table->string('nama');
            $table->string('nama_generik')->nullable();
            $table->foreignId('kategori_id')->constrained('kategori_obat')->restrictOnDelete();
            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->string('satuan');
            $table->unsignedInteger('stok')->default(0);
            $table->unsignedInteger('stok_minimum')->default(0);
            $table->decimal('harga_beli', 14, 2)->default(0);
            $table->decimal('harga_jual', 14, 2)->default(0);
            $table->enum('golongan', ['bebas', 'bebas-terbatas', 'keras', 'narkotika', 'psikotropika']);
            $table->string('lokasi_rak')->nullable();
            $table->date('expired_date')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->string('foto')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'golongan']);
            $table->index('expired_date');
            $table->index('nama');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obat');
    }
};
