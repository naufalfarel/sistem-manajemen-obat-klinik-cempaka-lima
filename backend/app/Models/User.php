<?php

namespace App\Models;

use App\Observers\UserObserver;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Pengguna sistem (users). Nilai `role` disimpan sebagai slug huruf kecil
 * dengan dash ('admin' | 'apoteker' | 'staf-gudang' | 'kasir') persis sesuai
 * union type `AuthUser['role']` / `Pengguna['role']` pada api.ts. Label
 * tampilan berkapital ("Administrator", "Staf Gudang", dst) adalah urusan
 * presentasi di frontend, BUKAN tanggung jawab API ini.
 *
 * @property int $id
 * @property string $nama
 * @property string $username
 * @property string $email
 * @property string $password
 * @property string|null $nip
 * @property string $role
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $last_login
 */
#[ObservedBy(UserObserver::class)]
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    public const ROLE_ADMIN = 'admin';

    public const ROLE_APOTEKER = 'apoteker';

    public const ROLE_STAF_GUDANG = 'staf-gudang';

    public const ROLE_KASIR = 'kasir';

    public const ROLES = [self::ROLE_ADMIN, self::ROLE_APOTEKER, self::ROLE_STAF_GUDANG, self::ROLE_KASIR];

    protected $fillable = [
        'nama',
        'username',
        'email',
        'password',
        'nip',
        'foto',
        'role',
        'status',
        'last_login',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'last_login' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Full public URL ke foto profil user, atau null jika tidak ada.
     * Dipakai oleh PenggunaResource dan AuthUserResource.
     */
    public function getFotoUrlAttribute(): ?string
    {
        if (! $this->foto) {
            return null;
        }

        return Storage::disk('public')->url($this->foto);
    }

    /** @return HasMany<ObatMasuk, $this> */
    public function obatMasukDitangani(): HasMany
    {
        return $this->hasMany(ObatMasuk::class, 'petugas_id');
    }

    /** @return HasMany<ObatKeluar, $this> */
    public function obatKeluarDitangani(): HasMany
    {
        return $this->hasMany(ObatKeluar::class, 'kasir_id');
    }

    /** @return HasMany<AuditLog, $this> */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }
}
