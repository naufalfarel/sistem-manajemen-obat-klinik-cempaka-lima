<?php

namespace App\Observers;

use App\Models\ObatKeluar;
use App\Services\AuditLogger;

class ObatKeluarObserver
{
    public function created(ObatKeluar $obatKeluar): void
    {
        AuditLogger::tambah(
            module: 'obat-keluar',
            description: "Membuat transaksi obat keluar: {$obatKeluar->no_transaksi} (pasien: {$obatKeluar->pasien})",
            after: $obatKeluar->only(['no_transaksi', 'pasien', 'metode_bayar', 'total', 'status']),
        );
    }

    public function updated(ObatKeluar $obatKeluar): void
    {
        $diff = AuditLogger::changedOnly($obatKeluar);

        if (empty($diff['after'])) {
            return;
        }

        $description = match ($diff['after']['status'] ?? null) {
            'retur' => "Retur transaksi obat keluar: {$obatKeluar->no_transaksi}",
            'void' => "Void transaksi obat keluar: {$obatKeluar->no_transaksi}",
            default => "Mengubah transaksi obat keluar: {$obatKeluar->no_transaksi}",
        };

        AuditLogger::ubah(
            module: 'obat-keluar',
            description: $description,
            before: $diff['before'],
            after: $diff['after'],
        );
    }

    public function deleted(ObatKeluar $obatKeluar): void
    {
        AuditLogger::hapus(
            module: 'obat-keluar',
            description: "Menghapus transaksi obat keluar: {$obatKeluar->no_transaksi}",
            before: $obatKeluar->only(['no_transaksi', 'status']),
        );
    }
}
