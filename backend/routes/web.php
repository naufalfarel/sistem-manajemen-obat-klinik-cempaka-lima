<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Backend ini adalah REST API murni yang dikonsumsi oleh frontend React
| terpisah (lihat routes/api.php). Route web hanya dipakai untuk health
| check singkat di root agar mudah dicek dari browser.
|
*/

Route::get('/', function () {
    return response()->json([
        'app' => config('app.name'),
        'status' => 'ok',
        'docs' => 'Lihat routes/api.php atau README.md untuk daftar endpoint.',
    ]);
});
