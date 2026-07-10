<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\KategoriObatController;
use App\Http\Controllers\Api\LaporanController;
use App\Http\Controllers\Api\MonitoringController;
use App\Http\Controllers\Api\ObatController;
use App\Http\Controllers\Api\ObatKeluarController;
use App\Http\Controllers\Api\ObatMasukController;
use App\Http\Controllers\Api\PenggunaController;
use App\Http\Controllers\Api\PengaturanController;
use App\Http\Controllers\Api\SupplierController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Sistem Manajemen Obat (SMO) Cempaka Lima
|--------------------------------------------------------------------------
|
| Seluruh path di sini otomatis diprefix "/api" oleh Laravel. Nama parameter
| route (mis. {obatMasuk}, {pengguna}) SENGAJA disamakan dengan nama variabel
| pada signature method controller agar route model binding implisit bekerja
| meski segmen URL-nya kebab-case (mis. /obat-masuk/{obatMasuk}).
|
*/

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {

    /* ── Auth ─────────────────────────────────────────────────────────── */
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    /* ── Obat ─────────────────────────────────────────────────────────── */
    // /export didaftarkan SEBELUM /{obat} agar tidak ditangkap sebagai id.
    Route::get('/obat/export', [ObatController::class, 'export']);
    Route::get('/obat', [ObatController::class, 'index']);
    Route::post('/obat', [ObatController::class, 'store']);
    Route::get('/obat/{obat}', [ObatController::class, 'show']);
    Route::put('/obat/{obat}', [ObatController::class, 'update']);
    Route::delete('/obat/{obat}', [ObatController::class, 'destroy']);

    /* ── Kategori ─────────────────────────────────────────────────────── */
    Route::get('/kategori', [KategoriObatController::class, 'index']);
    Route::post('/kategori', [KategoriObatController::class, 'store']);
    Route::get('/kategori/{kategori}', [KategoriObatController::class, 'show']);
    Route::put('/kategori/{kategori}', [KategoriObatController::class, 'update']);
    Route::delete('/kategori/{kategori}', [KategoriObatController::class, 'destroy']);

    /* ── Supplier (tidak ada DELETE - lihat SupplierController) ─────────── */
    Route::get('/supplier', [SupplierController::class, 'index']);
    Route::post('/supplier', [SupplierController::class, 'store']);
    Route::get('/supplier/{supplier}', [SupplierController::class, 'show']);
    Route::put('/supplier/{supplier}', [SupplierController::class, 'update']);
    Route::patch('/supplier/{supplier}/blacklist', [SupplierController::class, 'blacklist']);
    Route::patch('/supplier/{supplier}/restore', [SupplierController::class, 'restore']);

    /* ── Obat Masuk ───────────────────────────────────────────────────── */
    Route::get('/obat-masuk', [ObatMasukController::class, 'index']);
    Route::post('/obat-masuk', [ObatMasukController::class, 'store']);
    Route::get('/obat-masuk/{obatMasuk}', [ObatMasukController::class, 'show']);
    Route::patch('/obat-masuk/{obatMasuk}/terima', [ObatMasukController::class, 'terima']);
    Route::delete('/obat-masuk/{obatMasuk}', [ObatMasukController::class, 'destroy']);

    /* ── Obat Keluar ──────────────────────────────────────────────────── */
    Route::get('/obat-keluar', [ObatKeluarController::class, 'index']);
    Route::post('/obat-keluar', [ObatKeluarController::class, 'store']);
    Route::get('/obat-keluar/{obatKeluar}', [ObatKeluarController::class, 'show']);
    Route::patch('/obat-keluar/{obatKeluar}/retur', [ObatKeluarController::class, 'retur']);
    Route::patch('/obat-keluar/{obatKeluar}/void', [ObatKeluarController::class, 'void']);

    /* ── Monitoring ───────────────────────────────────────────────────── */
    Route::get('/monitoring/kritis', [MonitoringController::class, 'kritis']);
    Route::get('/monitoring/expired', [MonitoringController::class, 'expired']);
    Route::get('/monitoring/summary', [MonitoringController::class, 'summary']);

    /* ── Laporan ──────────────────────────────────────────────────────────
       Path dasar (json) DAN path /export (csv|pdf) diarahkan ke method yang
       sama - lihat catatan "Temuan Tambahan" di LaporanController & README.
    ------------------------------------------------------------------------ */
    Route::get('/laporan/penjualan', [LaporanController::class, 'penjualan']);
    Route::get('/laporan/penjualan/export', [LaporanController::class, 'penjualan']);
    Route::get('/laporan/stok', [LaporanController::class, 'stok']);
    Route::get('/laporan/stok/export', [LaporanController::class, 'stok']);
    Route::get('/laporan/kadaluarsa', [LaporanController::class, 'kadaluarsa']);
    Route::get('/laporan/kadaluarsa/export', [LaporanController::class, 'kadaluarsa']);
    Route::get('/laporan/logistik', [LaporanController::class, 'logistik']);
    Route::get('/laporan/logistik/export', [LaporanController::class, 'logistik']);

    /* ── Dashboard ────────────────────────────────────────────────────── */
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/chart-penjualan', [DashboardController::class, 'chartPenjualan']);
    Route::get('/dashboard/stok-per-kategori', [DashboardController::class, 'stockByKategori']);
    Route::get('/pengaturan/publik', [PengaturanController::class, 'publik']);

    /* ── Roles (daftar role yang tersedia) ─────────────────────────────── */
    Route::get('/roles', [PenggunaController::class, 'roles']);

    /* ── Pengguna, Pengaturan, Audit Log - KHUSUS ADMIN ──────────────────
       Dijaga middleware 'role:admin' (route-level) + Policy (object-level)
       sebagai defense-in-depth, sesuai instruksi kontrak.
    ------------------------------------------------------------------------ */
    Route::middleware('role:admin')->group(function () {
        Route::get('/pengguna', [PenggunaController::class, 'index']);
        Route::post('/pengguna', [PenggunaController::class, 'store']);
        Route::get('/pengguna/{pengguna}', [PenggunaController::class, 'show']);
        Route::put('/pengguna/{pengguna}', [PenggunaController::class, 'update']);
        Route::patch('/pengguna/{pengguna}/reset-password', [PenggunaController::class, 'resetPassword']);
        Route::patch('/pengguna/{pengguna}/toggle-status', [PenggunaController::class, 'toggleStatus']);
        Route::delete('/pengguna/{pengguna}', [PenggunaController::class, 'destroy']);

        Route::get('/pengaturan', [PengaturanController::class, 'show']);
        Route::put('/pengaturan', [PengaturanController::class, 'update']);
        Route::post('/pengaturan/logo', [PengaturanController::class, 'uploadLogo']);
        Route::post('/pengaturan/backup', [PengaturanController::class, 'backup']);
        Route::post('/pengaturan/test-smtp', [PengaturanController::class, 'testSmtp']);

        // /export didaftarkan SEBELUM /{auditLog} agar tidak ditangkap sebagai id.
        Route::get('/audit-log/export', [AuditLogController::class, 'export']);
        Route::get('/audit-log', [AuditLogController::class, 'index']);
        Route::get('/audit-log/{auditLog}', [AuditLogController::class, 'show']);
    });
});
