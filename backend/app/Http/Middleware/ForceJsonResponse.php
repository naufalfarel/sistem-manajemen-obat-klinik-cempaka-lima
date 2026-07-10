<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Memastikan setiap request ke /api/* diperlakukan sebagai request JSON,
 * apapun Accept header yang benar-benar dikirim klien. Ini melengkapi
 * shouldRenderJsonWhen() di bootstrap/app.php agar path exception rendering
 * DAN path normal response konsisten selalu JSON, tidak pernah HTML.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
