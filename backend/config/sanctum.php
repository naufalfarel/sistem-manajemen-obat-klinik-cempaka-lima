<?php

use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Tidak dipakai di backend ini - frontend React mengautentikasi lewat
    | Bearer token (personal access token), bukan cookie SPA stateful.
    | Dibiarkan kosong secara sengaja.
    |
    */

    'stateful' => [],

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | Masa berlaku token dalam menit. null = token tidak pernah expire secara
    | otomatis (hanya hilang lewat logout / refresh manual). Diatur lewat
    | SANCTUM_TOKEN_EXPIRATION di .env untuk produksi.
    |
    */

    'expiration' => env('SANCTUM_TOKEN_EXPIRATION'),

    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', ''),

    'middleware' => [
        'verify_csrf_token' => Laravel\Sanctum\Http\Middleware\ValidateCsrfToken::class,
        'encrypt_cookies' => Illuminate\Cookie\Middleware\EncryptCookies::class,
    ],

];
