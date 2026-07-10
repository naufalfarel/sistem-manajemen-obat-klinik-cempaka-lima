<?php

namespace App\Services;

use App\Models\Obat;
use App\Models\Setting;
use Carbon\Carbon;

/**
 * status_stok dan status_exp TIDAK disimpan sebagai kolom fisik - keduanya
 * dihitung on-the-fly setiap kali obat dibaca, sesuai instruksi kontrak.
 * Ambang stok memakai persentase terhadap stok_minimum (tetap, tidak
 * dikonfigurasi lewat Pengaturan agar konsisten lintas endpoint). Ambang
 * kedaluwarsa (near_30/near_90) DIAMBIL dari Pengaturan > Stok sesuai
 * instruksi kontrak.
 */
class StokStatusService
{
    /** aman | rendah | kritis | habis */
    public static function stokStatus(int $stok, ?int $stokMinimum): string
    {
        if ($stok <= 0) {
            return 'habis';
        }

        if ($stokMinimum === null || $stokMinimum <= 0) {
            $settings = Setting::query()->where('category', 'stok')->value('data');
            $stokMinimum = (int) ($settings['stok_minimum_default'] ?? 10);
        }

        if ($stok <= $stokMinimum) {
            return 'kritis';
        }

        if ($stok <= (int) round($stokMinimum * 1.5)) {
            return 'rendah';
        }

        return 'aman';
    }

    /**
     * @return array{hari_expired: int|null, status_exp: string|null}
     */
    public static function expStatus(?Carbon $expiredDate): array
    {
        if ($expiredDate === null) {
            return ['hari_expired' => null, 'status_exp' => null];
        }

        $hari = (int) Carbon::today()->diffInDays($expiredDate, false);

        $thresholds = self::ambangExpired();

        $status = match (true) {
            $hari < 0 => 'expired',
            $hari <= $thresholds['near_30'] => 'near-30',
            $hari <= $thresholds['near_90'] => 'near-90',
            default => 'aman',
        };

        return ['hari_expired' => $hari, 'status_exp' => $status];
    }

    /**
     * @return array{near_30: int, near_90: int}
     */
    public static function ambangExpired(): array
    {
        $stok = Setting::query()->where('category', 'stok')->value('data');
        $stok = is_array($stok) ? $stok : (Setting::defaults()['stok']);

        return [
            'near_30' => (int) ($stok['near_30'] ?? 30),
            'near_90' => (int) ($stok['near_90'] ?? 90),
        ];
    }

    /**
     * Ringkasan agregat dipakai oleh /monitoring/summary dan dashboard.
     *
     * @return array{stok_kritis: int, stok_habis: int, expired: int, near_30: int, near_90: int}
     */
    public static function summary(): array
    {
        $obat = Obat::query()->where('status', 'aktif')->get(['stok', 'stok_minimum', 'expired_date']);
        $thresholds = self::ambangExpired();

        $stokKritis = 0;
        $stokHabis = 0;
        $expired = 0;
        $near30 = 0;
        $near90 = 0;

        foreach ($obat as $item) {
            $status = self::stokStatus($item->stok, $item->stok_minimum);
            if ($status === 'kritis') {
                $stokKritis++;
            } elseif ($status === 'habis') {
                $stokHabis++;
            }

            if ($item->expired_date !== null) {
                $exp = self::expStatus($item->expired_date);
                match ($exp['status_exp']) {
                    'expired' => $expired++,
                    'near-30' => $near30++,
                    'near-90' => $near90++,
                    default => null,
                };
            }
        }

        return [
            'stok_kritis' => $stokKritis,
            'stok_habis' => $stokHabis,
            'expired' => $expired,
            'near_30' => $near30,
            'near_90' => $near90,
        ];
    }
}
