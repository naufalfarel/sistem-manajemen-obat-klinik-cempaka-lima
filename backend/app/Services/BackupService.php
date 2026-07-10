<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use ZipArchive;

/**
 * Backup sederhana berbasis dump JSON per tabel yang dikompres menjadi satu
 * file .zip, BUKAN dump SQL biner via `mysqldump` - pilihan ini sengaja
 * dibuat agar backup tetap berjalan tanpa bergantung pada ketersediaan
 * binary `mysqldump` di server (lihat README.md, bagian Keputusan Desain).
 * Untuk kebutuhan disaster-recovery produksi yang lebih lengkap, disarankan
 * tetap menjadwalkan `mysqldump`/snapshot terkelola di level infrastruktur.
 */
class BackupService
{
    private const TABLES = [
        'users', 'kategori_obat', 'obat', 'suppliers',
        'obat_masuk', 'obat_masuk_items', 'obat_keluar', 'obat_keluar_items',
        'audit_log', 'settings',
    ];

    /** @return array{file: string, size: string} */
    public function buat(): array
    {
        $timestamp = now()->format('Y-m-d_His');
        $jsonDir = storage_path("app/backups/tmp_{$timestamp}");
        @mkdir($jsonDir, recursive: true);

        foreach (self::TABLES as $table) {
            $rows = DB::table($table)->get();
            file_put_contents(
                "{$jsonDir}/{$table}.json",
                json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            );
        }

        $zipName = "backup-smo-{$timestamp}.zip";
        $zipPath = storage_path("app/backups/{$zipName}");

        $zip = new ZipArchive;
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        foreach (self::TABLES as $table) {
            $zip->addFile("{$jsonDir}/{$table}.json", "{$table}.json");
        }
        $zip->close();

        foreach (self::TABLES as $table) {
            @unlink("{$jsonDir}/{$table}.json");
        }
        @rmdir($jsonDir);

        return [
            'file' => $zipName,
            'size' => $this->formatSize(filesize($zipPath) ?: 0),
        ];
    }

    private function formatSize(int $bytes): string
    {
        if ($bytes < 1024) {
            return "{$bytes} B";
        }

        $units = ['KB', 'MB', 'GB'];
        $value = $bytes;
        foreach ($units as $unit) {
            $value /= 1024;
            if ($value < 1024) {
                return round($value, 2)." {$unit}";
            }
        }

        return round($value, 2).' GB';
    }
}
