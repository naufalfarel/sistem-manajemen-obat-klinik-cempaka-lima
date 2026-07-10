<?php

namespace App\Models;

use App\Observers\KategoriObatObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $nama
 * @property string $kode
 * @property string|null $deskripsi
 * @property-read int|null $obat_count
 */
#[ObservedBy(KategoriObatObserver::class)]
class KategoriObat extends Model
{
    /** @use HasFactory<\Database\Factories\KategoriObatFactory> */
    use HasFactory;

    protected $table = 'kategori_obat';

    protected $fillable = [
        'nama',
        'kode',
        'deskripsi',
    ];

    /** @return HasMany<Obat, $this> */
    public function obat(): HasMany
    {
        return $this->hasMany(Obat::class, 'kategori_id');
    }
}
