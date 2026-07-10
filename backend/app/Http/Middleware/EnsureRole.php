<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware pembatas akses berbasis role, dipakai pada grup route yang
 * hanya boleh diakses role tertentu (manajemen-user, pengaturan, audit-log
 * => 'admin'). Untuk otorisasi pada level aksi/objek individual, lihat
 * app/Policies/* yang dipanggil lewat $this->authorize() di controller -
 * keduanya saling melengkapi (defense in depth), bukan duplikasi.
 */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            abort(403, 'Anda tidak memiliki izin untuk mengakses resource ini.');
        }

        return $next($request);
    }
}
