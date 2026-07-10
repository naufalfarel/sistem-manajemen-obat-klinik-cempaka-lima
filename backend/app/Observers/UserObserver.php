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

        $description = array_key_exists('password', $diff['after'])
            ? "Reset password pengguna: {$user->nama} ({$user->username})"
            : "Mengubah data pengguna: {$user->nama} ({$user->username})";

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
