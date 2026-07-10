<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obat_masuk_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('obat_masuk_id')->constrained('obat_masuk')->cascadeOnDelete();
            $table->foreignId('obat_id')->constrained('obat')->restrictOnDelete();
            $table->unsignedInteger('jumlah');
            $table->decimal('harga_satuan', 14, 2);
            $table->decimal('subtotal', 16, 2);
            $table->string('no_batch')->nullable();
            $table->date('expired_date')->nullable();

            $table->index('obat_masuk_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obat_masuk_items');
    }
};
