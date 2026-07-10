<?php

namespace App\Observers;

use App\Models\ObatMasuk;
use App\Services\AuditLogger;

class ObatMasukObserver
{
    public function created(ObatMasuk $obatMasuk): void
    {
        AuditLogger::tambah(
            module: 'obat-masuk',
            description: "Membuat transaksi obat masuk: {$obatMasuk->no_transaksi}",
            after: $obatMasuk->only(['no_transaksi', 'supplier_id', 'total_item', 'nilai_total', 'status']),
        );
    }

    public function updated(ObatMasuk $obatMasuk): void
    {
        $diff = AuditLogger::changedOnly($obatMasuk);

        if (empty($diff['after'])) {
            return;
        }

        $description = isset($diff['after']['status'])
            ? "Mengubah status obat masuk {$obatMasuk->no_transaksi} menjadi \"{$diff['after']['status']}\""
            : "Mengubah transaksi obat masuk: {$obatMasuk->no_transaksi}";

        AuditLogger::ubah(
            module: 'obat-masuk',
            description: $description,
            before: $diff['before'],
            after: $diff['after'],
        );
    }

    public function deleted(ObatMasuk $obatMasuk): void
    {
        AuditLogger::hapus(
            module: 'obat-masuk',
            description: "Menghapus transaksi obat masuk: {$obatMasuk->no_transaksi}",
            before: $obatMasuk->only(['no_transaksi', 'status']),
        );
    }
}
