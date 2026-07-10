<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obat_keluar_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('obat_keluar_id')->constrained('obat_keluar')->cascadeOnDelete();
            $table->foreignId('obat_id')->constrained('obat')->restrictOnDelete();
            $table->unsignedInteger('jumlah');
            $table->decimal('harga', 14, 2);
            $table->decimal('subtotal', 16, 2);

            $table->index('obat_keluar_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obat_keluar_items');
    }
};
