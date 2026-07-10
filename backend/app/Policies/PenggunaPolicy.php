<?php

namespace App\Policies;

use App\Models\User;

/**
 * Otorisasi untuk endpoint /api/pengguna/*. Route group-nya sudah dijaga
 * middleware 'role:admin' (lihat routes/api.php), policy ini menambah lapis
 * kedua di level controller/aksi sekaligus mencegah admin menonaktifkan atau
 * menghapus akunnya sendiri secara tidak sengaja.
 */
class PenggunaPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->isAdmin();
    }

    public function view(User $actor, User $target): bool
    {
        return $actor->isAdmin();
    }

    public function create(User $actor): bool
    {
        return $actor->isAdmin();
    }

    public function update(User $actor, User $target): bool
    {
        return $actor->isAdmin();
    }

    public function delete(User $actor, User $target): bool
    {
        return $actor->isAdmin() && $actor->id !== $target->id;
    }

    public function resetPassword(User $actor, User $target): bool
    {
        return $actor->isAdmin();
    }

    public function toggleStatus(User $actor, User $target): bool
    {
        return $actor->isAdmin() && $actor->id !== $target->id;
    }
}
