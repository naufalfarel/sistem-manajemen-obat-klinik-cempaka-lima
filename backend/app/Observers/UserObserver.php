<?php

namespace App\Observers;

use App\Models\User;
use App\Services\AuditLogger;

class UserObserver
{
    /** Kolom sensitif yang TIDAK PERNAH ditulis ke audit_log. */
    private const REDACTED = ['password', 'remember_token'];

    public function created(User $user): void
    {
        AuditLogger::tambah(
            module: 'pengguna',
            description: "Menambahkan pengguna baru: {$user->nama} ({$user->username}, role: {$user->role})",
            after: $user->only(['nama', 'username', 'email', 'role', 'status']),
        );
    }

    public function updated(User $user): void
    {
        $diff = AuditLogger::changedOnly($user);
        $after = array_diff_key($diff['after'], array_flip(self::REDACTED));
        $before = array_diff_key($diff['before'], array_flip(self::REDACTED));

        if (empty($after)) {
            return;
        }

        if (array_key_exists('status', $diff['after'])) {
            $statusStr = $diff['after']['status'] === 'aktif' ? 'Mengaktifkan' : 'Menonaktifkan';
            $description = "{$statusStr} pengguna: {$user->nama} ({$user->username})";
        } elseif (array_key_exists('password', $diff['after'])) {
            $description = "Reset password pengguna: {$user->nama} ({$user->username})";
        } else {
            $description = "Mengubah data pengguna: {$user->nama} ({$user->username})";
        }

        AuditLogger::ubah(module: 'pengguna', description: $description, before: $before, after: $after);
    }

    public function deleted(User $user): void
    {
        AuditLogger::hapus(
            module: 'pengguna',
            description: "Menghapus pengguna: {$user->nama} ({$user->username})",
            before: $user->only(['nama', 'username', 'role']),
        );
    }
}
