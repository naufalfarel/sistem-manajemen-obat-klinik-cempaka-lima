<?php

namespace App\Services;

use App\Models\Obat;
use App\Models\ObatKeluar;
use App\Models\ObatMasuk;
use App\Models\Supplier;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Generator kode/nomor transaksi otomatis. Memakai DB transaction + lock
 * pada saat penomoran transaksi harian (obat_masuk/obat_keluar) untuk
 * menghindari duplikasi nomor pada kondisi concurrent request.
 */
class NomorGenerator
{
    public static function kodeObat(): string
    {
        $last = Obat::query()->withTrashed()->max('id') ?? 0;

        return 'OBT-'.str_pad((string) ($last + 1), 4, '0', STR_PAD_LEFT);
    }

    public static function kodeSupplier(): string
    {
        $last = Supplier::query()->withTrashed()->max('id') ?? 0;

        return 'SUP-'.str_pad((string) ($last + 1), 4, '0', STR_PAD_LEFT);
    }

    /** Format: MSK-YYYYMMDD-XXXX (reset urutan setiap hari) */
    public static function noObatMasuk(Carbon $tanggal): string
    {
        return self::nomorHarian('MSK', $tanggal, ObatMasuk::class);
    }

    /** Format: KLR-YYYYMMDD-XXXX (reset urutan setiap hari) */
    public static function noObatKeluar(Carbon $tanggal): string
    {
        return self::nomorHarian('KLR', $tanggal, ObatKeluar::class);
    }

    /**
     * @param  class-string  $model
     */
    private static function nomorHarian(string $prefix, Carbon $tanggal, string $model): string
    {
        $tanggalStr = $tanggal->format('Ymd');
        $likePattern = "{$prefix}-{$tanggalStr}-%";

        // Lock baris yang cocok agar dua request bersamaan tidak mendapat
        // nomor urut yang sama (mis. dua kasir checkout di detik yang sama).
        $count = DB::transaction(function () use ($model, $likePattern) {
            return $model::query()
                ->where('no_transaksi', 'like', $likePattern)
                ->lockForUpdate()
                ->count();
        });

        $urutan = str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);

        return "{$prefix}-{$tanggalStr}-{$urutan}";
    }
}
