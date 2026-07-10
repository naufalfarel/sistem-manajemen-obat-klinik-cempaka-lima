<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $obat_keluar_id
 * @property int $obat_id
 * @property int $jumlah
 * @property string $harga
 * @property string $subtotal
 */
class ObatKeluarItem extends Model
{
    /** @use HasFactory<\Database\Factories\ObatKeluarItemFactory> */
    use HasFactory;

    protected $table = 'obat_keluar_items';

    public $timestamps = false;

    protected $fillable = [
        'obat_keluar_id',
        'obat_id',
        'jumlah',
        'harga',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'jumlah' => 'integer',
            'harga' => 'decimal:2',
            'subtotal' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<ObatKeluar, $this> */
    public function obatKeluar(): BelongsTo
    {
        return $this->belongsTo(ObatKeluar::class, 'obat_keluar_id');
    }

    /** @return BelongsTo<Obat, $this> */
    public function obat(): BelongsTo
    {
        return $this->belongsTo(Obat::class, 'obat_id');
    }
}
