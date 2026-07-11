<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiwayatHarga extends Model
{
    use HasFactory;

    protected $table = 'riwayat_harga';

    protected $fillable = [
        'obat_id',
        'user_id',
        'harga_beli_lama',
        'harga_beli_baru',
        'harga_jual_lama',
        'harga_jual_baru',
        'sumber',
        'no_transaksi',
        'status',
    ];

    protected $casts = [
        'harga_beli_lama' => 'float',
        'harga_beli_baru' => 'float',
        'harga_jual_lama' => 'float',
        'harga_jual_baru' => 'float',
    ];

    /** @return BelongsTo<Obat, $this> */
    public function obat(): BelongsTo
    {
        return $this->belongsTo(Obat::class, 'obat_id');
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
