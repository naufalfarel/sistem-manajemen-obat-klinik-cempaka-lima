<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * obatApi.export(), laporanApi.*(format=csv|pdf), dan auditLogApi.export()
 * di api.ts membangun URL MENTAH (dengan token di query string) yang dibuka
 * langsung oleh browser lewat window.open()/<a href download>, bukan lewat
 * fetch() dengan header Authorization - navigasi browser biasa tidak bisa
 * menyertakan header custom. Middleware ini menyalin `?token=` ke header
 * Authorization SEBELUM middleware `auth:sanctum` berjalan, hanya jika
 * header Authorization belum diisi. Aman dipasang global di grup `api`
 * karena tidak berefek pada request yang sudah membawa Bearer token asli.
 */
class TokenFromQueryString
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->headers->has('Authorization') && $request->query->has('token')) {
            $request->headers->set('Authorization', 'Bearer '.$request->query('token'));
        }

        return $next($request);
    }
}
