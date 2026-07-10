<?php

namespace App\Models;

use App\Observers\ObatObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property string $kode
 * @property string $nama
 * @property string|null $nama_generik
 * @property int $kategori_id
 * @property string $satuan
 * @property int $stok
 * @property int $stok_minimum
 * @property string $harga_beli
 * @property string $harga_jual
 * @property string $golongan
 * @property string|null $lokasi_rak
 * @property \Illuminate\Support\Carbon|null $expired_date
 * @property string $status
 */
#[ObservedBy(ObatObserver::class)]
class Obat extends Model
{
    /** @use HasFactory<\Database\Factories\ObatFactory> */
    use HasFactory, SoftDeletes;

    protected $table = 'obat';

    public const GOLONGAN = ['bebas', 'bebas-terbatas', 'keras', 'narkotika', 'psikotropika'];

    protected $fillable = [
        'kode',
        'nama',
        'nama_generik',
        'kategori_id',
        'supplier_id',
        'satuan',
        'stok',
        'stok_minimum',
        'harga_beli',
        'harga_jual',
        'golongan',
        'lokasi_rak',
        'expired_date',
        'status',
        'foto',
    ];

    protected function casts(): array
    {
        return [
            'stok' => 'integer',
            'stok_minimum' => 'integer',
            'harga_beli' => 'decimal:2',
            'harga_jual' => 'decimal:2',
            'expired_date' => 'date',
        ];
    }

    /** @return BelongsTo<KategoriObat, $this> */
    public function kategori(): BelongsTo
    {
        return $this->belongsTo(KategoriObat::class, 'kategori_id');
    }

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    /** @return HasMany<ObatMasukItem, $this> */
    public function obatMasukItems(): HasMany
    {
        return $this->hasMany(ObatMasukItem::class, 'obat_id');
    }

    /** @return HasMany<ObatKeluarItem, $this> */
    public function obatKeluarItems(): HasMany
    {
        return $this->hasMany(ObatKeluarItem::class, 'obat_id');
    }
}
