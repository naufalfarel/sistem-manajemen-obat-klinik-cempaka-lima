<?php

namespace App\Policies;

use App\Models\User;

class PengaturanPolicy
{
    public function view(User $actor): bool
    {
        return $actor->isAdmin();
    }

    public function update(User $actor): bool
    {
        return $actor->isAdmin();
    }

    public function backup(User $actor): bool
    {
        return $actor->isAdmin();
    }

    public function testSmtp(User $actor): bool
    {
        return $actor->isAdmin();
    }
}
