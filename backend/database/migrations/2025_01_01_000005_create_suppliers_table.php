<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('kode')->unique();
            $table->string('nama');
            $table->text('alamat');
            $table->string('kota');
            $table->string('telepon');
            $table->string('email')->nullable();
            $table->string('pic');
            $table->string('npwp')->nullable();
            $table->string('no_izin_pbf')->nullable();
            $table->string('sertifikat_cdob')->nullable();
            $table->date('exp_izin_pbf')->nullable();
            $table->date('exp_cdob')->nullable();
            $table->enum('termin_pembayaran', ['cash', 'tempo30', 'tempo60', 'tempo90'])->default('cash');
            $table->unsignedSmallInteger('lead_time')->default(0)->comment('hari');
            $table->enum('status', ['aktif', 'nonaktif', 'blacklist'])->default('aktif');
            $table->string('alasan_blacklist')->nullable();
            $table->string('foto')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'kota']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
