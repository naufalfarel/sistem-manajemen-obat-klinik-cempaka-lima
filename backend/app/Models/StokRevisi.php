<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int    $id
 * @property string $no_revisi
 * @property int    $obat_id
 * @property int    $petugas_id
 * @property string $tanggal
 * @property string $tipe
 * @property int    $stok_sebelum
 * @property int    $jumlah
 * @property int    $stok_sesudah
 * @property string $alasan
 * @property string|null $catatan
 */
class StokRevisi extends Model
{
    protected $table = 'stok_revisi';

    public const ALASAN_LABELS = [
        'rusak'            => 'Barang Rusak',
        'kadaluarsa'       => 'Barang Kadaluarsa',
        'hilang'           => 'Kehilangan / Susut',
        'temuan'           => 'Temuan Stok',
        'koreksi_sistem'   => 'Koreksi Sistem',
        'penerimaan_lain'  => 'Penerimaan dari Sumber Lain',
        'lainnya'          => 'Lainnya',
    ];

    protected $fillable = [
        'no_revisi',
        'obat_id',
        'petugas_id',
        'tanggal',
        'tipe',
        'stok_sebelum',
        'jumlah',
        'stok_sesudah',
        'alasan',
        'catatan',
    ];

    protected function casts(): array
    {
        return [
            'stok_sebelum' => 'integer',
            'jumlah'       => 'integer',
            'stok_sesudah' => 'integer',
            'tanggal'      => 'date',
        ];
    }

    /** @return BelongsTo<Obat, $this> */
    public function obat(): BelongsTo
    {
        return $this->belongsTo(Obat::class, 'obat_id');
    }

    /** @return BelongsTo<User, $this> */
    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'petugas_id');
    }
}
