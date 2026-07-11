<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $obat_keluar_id
 * @property int $user_id
 * @property string $jenis
 * @property \Illuminate\Support\Carbon $created_at
 */
class RiwayatCetak extends Model
{
    protected $table = 'riwayat_cetak';

    public const UPDATED_AT = null;

    protected $fillable = [
        'obat_keluar_id',
        'user_id',
        'jenis',
    ];

    /** @return BelongsTo<ObatKeluar, $this> */
    public function obatKeluar(): BelongsTo
    {
        return $this->belongsTo(ObatKeluar::class, 'obat_keluar_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
