<?php

namespace App\Models;

use App\Observers\ObatKeluarObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $no_transaksi
 * @property \Illuminate\Support\Carbon $tanggal
 * @property string $pasien
 * @property string|null $dokter
 * @property string $metode_bayar
 * @property string $total
 * @property string $status
 * @property string|null $alasan_retur_void
 * @property int $kasir_id
 */
#[ObservedBy(ObatKeluarObserver::class)]
class ObatKeluar extends Model
{
    /** @use HasFactory<\Database\Factories\ObatKeluarFactory> */
    use HasFactory;

    protected $table = 'obat_keluar';

    public const UPDATED_AT = null;

    public const STATUS = ['selesai', 'retur', 'void'];

    public const METODE_BAYAR = ['cash', 'qris', 'debit', 'kredit', 'bpjs'];

    protected $fillable = [
        'no_transaksi',
        'tanggal',
        'pasien',
        'dokter',
        'metode_bayar',
        'total',
        'status',
        'alasan_retur_void',
        'kasir_id',
    ];

    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'total' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kasir_id');
    }

    /** @return HasMany<ObatKeluarItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(ObatKeluarItem::class, 'obat_keluar_id');
    }
}
