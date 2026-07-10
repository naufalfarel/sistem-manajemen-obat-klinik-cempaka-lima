<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request as RequestFacade;

/**
 * Titik tunggal penulisan audit_log. Observer model memanggil record() untuk
 * aksi tambah/ubah/hapus; controller memanggil record() secara eksplisit
 * untuk aksi yang bukan event Eloquent (login, logout, ekspor) karena
 * peristiwa tersebut secara alami tidak memicu created/updated/deleted.
 */
class AuditLogger
{
    /**
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    public static function record(
        string $action,
        string $module,
        string $description,
        ?array $before = null,
        ?array $after = null,
        ?User $actor = null,
    ): AuditLog {
        $actor ??= Auth::user();

        return AuditLog::create([
            'user_id' => $actor?->id,
            'action' => $action,
            'module' => $module,
            'description' => $description,
            'ip_address' => RequestFacade::ip() ?? '0.0.0.0',
            'user_agent' => RequestFacade::header('User-Agent', 'unknown'),
            'before' => $before,
            'after' => $after,
        ]);
    }

    public static function tambah(string $module, string $description, ?array $after = null): AuditLog
    {
        return self::record('tambah', $module, $description, null, $after);
    }

    public static function ubah(string $module, string $description, ?array $before, ?array $after): AuditLog
    {
        return self::record('ubah', $module, $description, $before, $after);
    }

    public static function hapus(string $module, string $description, ?array $before = null): AuditLog
    {
        return self::record('hapus', $module, $description, $before, null);
    }

    public static function ekspor(string $module, string $description): AuditLog
    {
        return self::record('ekspor', $module, $description);
    }

    /**
     * Ambil snapshot before/after HANYA untuk kolom yang benar-benar berubah
     * pada event `updated`, supaya audit log tidak dipenuhi kolom yang tidak
     * relevan (mis. updated_at, atau kolom lain yang nilainya tidak berubah).
     *
     * @return array{before: array<string, mixed>, after: array<string, mixed>}
     */
    public static function changedOnly(Model $model): array
    {
        $changed = Arr::except($model->getChanges(), ['updated_at']);
        $before = Arr::only($model->getOriginal(), array_keys($changed));

        return ['before' => $before, 'after' => $changed];
    }
}
