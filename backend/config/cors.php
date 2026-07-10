<?php

// Origin frontend Vite. Mendukung beberapa origin sekaligus (pisahkan dengan
// koma di .env), berguna saat frontend dijalankan di port lain atau di-deploy
// ke domain staging/production.
$origins = array_filter(array_map(
    'trim',
    explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173'))
));

return [

    // Semua route di aplikasi ini adalah API, jadi cukup path 'api/*' dan
    // endpoint bawaan Sanctum/health check.
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'up'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $origins ?: ['http://localhost:5173'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // false karena autentikasi memakai Bearer token di header Authorization,
    // bukan cookie - tidak perlu credentials/cookie cross-origin.
    'supports_credentials' => false,

];
