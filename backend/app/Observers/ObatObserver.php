<?php

namespace App\Observers;

use App\Models\Obat;
use App\Services\AuditLogger;

class ObatObserver
{
    public function created(Obat $obat): void
    {
        AuditLogger::tambah(
            module: 'obat',
            description: "Menambahkan obat baru: {$obat->nama} ({$obat->kode})",
            after: $obat->only(['kode', 'nama', 'kategori_id', 'stok', 'harga_beli', 'harga_jual', 'golongan', 'status']),
        );
    }

    public function updated(Obat $obat): void
    {
        $diff = AuditLogger::changedOnly($obat);

        if (empty($diff['after'])) {
            return;
        }

        AuditLogger::ubah(
            module: 'obat',
            description: "Mengubah data obat: {$obat->nama} ({$obat->kode})",
            before: $diff['before'],
            after: $diff['after'],
        );
    }

    public function deleted(Obat $obat): void
    {
        AuditLogger::hapus(
            module: 'obat',
            description: "Menghapus obat: {$obat->nama} ({$obat->kode})",
            before: $obat->only(['kode', 'nama', 'kategori_id', 'stok']),
        );
    }
}
