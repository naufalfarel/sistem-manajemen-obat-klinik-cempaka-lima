<?php

namespace App\Observers;

use App\Models\Supplier;
use App\Services\AuditLogger;

class SupplierObserver
{
    public function created(Supplier $supplier): void
    {
        AuditLogger::tambah(
            module: 'supplier',
            description: "Menambahkan supplier baru: {$supplier->nama} ({$supplier->kode})",
            after: $supplier->only(['kode', 'nama', 'kota', 'status']),
        );
    }

    public function updated(Supplier $supplier): void
    {
        $diff = AuditLogger::changedOnly($supplier);

        if (empty($diff['after'])) {
            return;
        }

        // Blacklist/restore juga lewat event `updated` biasa (perubahan kolom
        // status + alasan_blacklist), sehingga deskripsi dibuat lebih spesifik
        // untuk kasus ini agar audit log lebih mudah dibaca.
        $description = match (true) {
            isset($diff['after']['status']) && $diff['after']['status'] === 'blacklist'
                => "Memblacklist supplier: {$supplier->nama} ({$supplier->kode})",
            isset($diff['after']['status']) && $diff['before']['status'] === 'blacklist'
                => "Memulihkan supplier dari blacklist: {$supplier->nama} ({$supplier->kode})",
            default => "Mengubah data supplier: {$supplier->nama} ({$supplier->kode})",
        };

        AuditLogger::ubah(
            module: 'supplier',
            description: $description,
            before: $diff['before'],
            after: $diff['after'],
        );
    }

    public function deleted(Supplier $supplier): void
    {
        AuditLogger::hapus(
            module: 'supplier',
            description: "Menghapus supplier: {$supplier->nama} ({$supplier->kode})",
            before: $supplier->only(['kode', 'nama']),
        );
    }
}
