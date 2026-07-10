<?php

namespace App\Policies;

use App\Models\User;

class AuditLogPolicy
{
    public function viewAny(User $actor): bool
    {
        return $actor->isAdmin();
    }

    public function view(User $actor): bool
    {
        return $actor->isAdmin();
    }

    public function export(User $actor): bool
    {
        return $actor->isAdmin();
    }
}
