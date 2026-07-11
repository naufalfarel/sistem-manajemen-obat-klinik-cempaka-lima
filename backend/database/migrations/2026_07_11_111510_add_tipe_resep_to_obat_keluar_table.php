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
        Schema::table('obat_keluar', function (Blueprint $table) {
            $table->enum('tipe_resep', ['racik', 'non-racik'])->nullable()->after('dokter');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('obat_keluar', function (Blueprint $table) {
            $table->dropColumn('tipe_resep');
        });
    }
};
