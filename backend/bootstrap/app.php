<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\TokenFromQueryString;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Semua request /api/* dipaksa berperilaku sebagai request JSON,
        // sehingga Accept header yang hilang tidak membuat Laravel mencoba
        // me-render halaman HTML (mis. redirect ke route login yang tidak ada).
        $middleware->api(prepend: [
            ForceJsonResponse::class,
            TokenFromQueryString::class,
        ]);

        $middleware->alias([
            'role' => EnsureRole::class,
        ]);

        // API ini stateless (Bearer token via Sanctum), bukan SPA cookie-based,
        // sehingga EnsureFrontendRequestsAreStateful tidak diperlukan di sini.
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Paksa SEMUA error dari route /api/* dibalas sebagai JSON, termasuk
        // 404 dan 500 yang secara default dirender Laravel sebagai halaman HTML.
        $exceptions->shouldRenderJsonWhen(function (Request $request, Throwable $e) {
            return $request->is('api/*') || $request->expectsJson();
        });

        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Sesi tidak valid atau token telah kedaluwarsa. Silakan login kembali.',
                ], 401);
            }
        });

        $exceptions->render(function (AuthorizationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => $e->getMessage() ?: 'Anda tidak memiliki izin untuk mengakses resource ini.',
                ], 403);
            }
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            if ($request->is('api/*')) {
                $model = class_basename($e->getModel());

                return response()->json([
                    'message' => "Data {$model} yang diminta tidak ditemukan.",
                ], 404);
            }
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Endpoint tidak ditemukan.',
                ], 404);
            }
        });

        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => 'Data yang dikirim tidak valid.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'message' => $e->getMessage() ?: 'Terjadi kesalahan pada permintaan.',
                ], $e->getStatusCode());
            }
        });

        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*') && ! ($e instanceof HttpExceptionInterface)) {
                $status = 500;

                return response()->json([
                    'message' => config('app.debug')
                        ? $e->getMessage()
                        : 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
                ], $status);
            }
        });
    })->create();
