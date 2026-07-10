<?php

namespace App\Observers;

use App\Models\KategoriObat;
use App\Services\AuditLogger;

class KategoriObatObserver
{
    public function created(KategoriObat $kategori): void
    {
        AuditLogger::tambah(
            module: 'kategori',
            description: "Menambahkan kategori obat: {$kategori->nama} ({$kategori->kode})",
            after: $kategori->only(['kode', 'nama', 'deskripsi']),
        );
    }

    public function updated(KategoriObat $kategori): void
    {
        $diff = AuditLogger::changedOnly($kategori);

        if (empty($diff['after'])) {
            return;
        }

        AuditLogger::ubah(
            module: 'kategori',
            description: "Mengubah kategori obat: {$kategori->nama} ({$kategori->kode})",
            before: $diff['before'],
            after: $diff['after'],
        );
    }

    public function deleted(KategoriObat $kategori): void
    {
        AuditLogger::hapus(
            module: 'kategori',
            description: "Menghapus kategori obat: {$kategori->nama} ({$kategori->kode})",
            before: $kategori->only(['kode', 'nama']),
        );
    }
}
