<?php

namespace App\Models;

use App\Observers\SupplierObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $kode
 * @property string $nama
 * @property string $status
 * @property string|null $alasan_blacklist
 */
#[ObservedBy(SupplierObserver::class)]
class Supplier extends Model
{
    /** @use HasFactory<\Database\Factories\SupplierFactory> */
    use HasFactory, SoftDeletes;

    public const TERMIN = ['cash', 'tempo30', 'tempo60', 'tempo90'];

    public const STATUS = ['aktif', 'nonaktif', 'blacklist'];

    protected $fillable = [
        'kode',
        'nama',
        'alamat',
        'kota',
        'telepon',
        'email',
        'pic',
        'npwp',
        'no_izin_pbf',
        'sertifikat_cdob',
        'exp_izin_pbf',
        'exp_cdob',
        'termin_pembayaran',
        'lead_time',
        'status',
        'alasan_blacklist',
        'foto',
    ];

    protected function casts(): array
    {
        return [
            'exp_izin_pbf' => 'date',
            'exp_cdob' => 'date',
            'lead_time' => 'integer',
        ];
    }

    /** @return HasMany<ObatMasuk, $this> */
    public function obatMasuk(): HasMany
    {
        return $this->hasMany(ObatMasuk::class, 'supplier_id');
    }

    /** @return HasMany<Obat, $this> */
    public function obat(): HasMany
    {
        return $this->hasMany(Obat::class, 'supplier_id');
    }
}
