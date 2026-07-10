<?php

namespace App\Providers;

use App\Models\AuditLog;
use App\Models\Setting;
use App\Models\User;
use App\Policies\AuditLogPolicy;
use App\Policies\PenggunaPolicy;
use App\Policies\PengaturanPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        // Observer model (ObatObserver, SupplierObserver, dst) sudah didaftarkan
        // langsung di masing-masing model lewat atribut #[ObservedBy(...)],
        // jadi tidak perlu Model::observe() manual di sini.

        Gate::policy(User::class, PenggunaPolicy::class);
        Gate::policy(Setting::class, PengaturanPolicy::class);
        Gate::policy(AuditLog::class, AuditLogPolicy::class);
    }
}
