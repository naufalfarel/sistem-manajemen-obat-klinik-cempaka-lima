<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tabel baru untuk mengisi celah kontrak: tipe `ObatMasuk` pada api.ts hanya
 * menyimpan agregat (`total_item`, `nilai_total`) tanpa rincian obat apa saja
 * yang diterima. Lihat catatan desain di README.md bagian "Keputusan Desain".
 *
 * @property int $id
 * @property int $obat_masuk_id
 * @property int $obat_id
 * @property int $jumlah
 * @property string $harga_satuan
 * @property string $subtotal
 */
class ObatMasukItem extends Model
{
    /** @use HasFactory<\Database\Factories\ObatMasukItemFactory> */
    use HasFactory;

    protected $table = 'obat_masuk_items';

    public $timestamps = false;

    protected $fillable = [
        'obat_masuk_id',
        'obat_id',
        'jumlah',
        'harga_satuan',
        'subtotal',
        'no_batch',
        'expired_date',
    ];

    protected function casts(): array
    {
        return [
            'jumlah' => 'integer',
            'harga_satuan' => 'decimal:2',
            'subtotal' => 'decimal:2',
            'expired_date' => 'date',
        ];
    }

    /** @return BelongsTo<ObatMasuk, $this> */
    public function obatMasuk(): BelongsTo
    {
        return $this->belongsTo(ObatMasuk::class, 'obat_masuk_id');
    }

    /** @return BelongsTo<Obat, $this> */
    public function obat(): BelongsTo
    {
        return $this->belongsTo(Obat::class, 'obat_id');
    }
}
