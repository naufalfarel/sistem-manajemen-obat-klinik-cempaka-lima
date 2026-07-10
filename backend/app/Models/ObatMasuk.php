<?php

namespace App\Models;

use App\Observers\ObatMasukObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $no_transaksi
 * @property \Illuminate\Support\Carbon $tanggal
 * @property int $supplier_id
 * @property int $total_item
 * @property string $nilai_total
 * @property string $status
 * @property int $petugas_id
 * @property string|null $catatan
 */
#[ObservedBy(ObatMasukObserver::class)]
class ObatMasuk extends Model
{
    /** @use HasFactory<\Database\Factories\ObatMasukFactory> */
    use HasFactory;

    protected $table = 'obat_masuk';

    public const UPDATED_AT = null;

    public const STATUS = ['draft', 'diterima', 'sebagian', 'dikembalikan'];

    protected $fillable = [
        'no_transaksi',
        'tanggal',
        'supplier_id',
        'total_item',
        'nilai_total',
        'status',
        'petugas_id',
        'catatan',
        'foto_nota',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'total_item' => 'integer',
            'nilai_total' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    /** @return BelongsTo<User, $this> */
    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'petugas_id');
    }

    /** @return HasMany<ObatMasukItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(ObatMasukItem::class, 'obat_masuk_id');
    }
}
