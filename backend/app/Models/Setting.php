<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Satu baris per kategori pengaturan (umum/stok/notifikasi/keamanan/integrasi).
 * Lihat README.md bagian "Keputusan Desain" untuk alasan pemilihan struktur
 * ini dibanding tabel key-value generik.
 *
 * @property int $id
 * @property string $category
 * @property array $data
 */
class Setting extends Model
{
    public const CATEGORIES = ['umum', 'stok', 'notifikasi', 'keamanan', 'integrasi'];

    protected $table = 'settings';

    protected $fillable = ['category', 'data'];

    protected function casts(): array
    {
        return [
            'data' => 'array',
        ];
    }

    /**
     * Nilai default per kategori. Dipakai oleh seeder dan sebagai fallback
     * bila baris kategori belum ada di database.
     */
    public static function defaults(): array
    {
        return [
            'umum' => [
                'nama_klinik' => 'Klinik Utama Cempaka Lima',
                'alamat' => 'Jl. Cempaka Lima No. 5, Banda Aceh',
                'telepon' => '(0651) 123456',
                'email' => 'info@cempakalima.id',
                'zona_waktu' => 'Asia/Jakarta',
                'format_tanggal' => 'DD/MM/YYYY',
                'mata_uang' => 'IDR',
            ],
            'stok' => [
                'near_30' => 30,
                'near_90' => 90,
                'stok_minimum_default' => 10,
                'ambang_kritis_persen' => 100,
                'ambang_rendah_persen' => 150,
                'auto_nonaktifkan_expired' => false,
            ],
            'notifikasi' => [
                'email_stok_kritis' => true,
                'email_expired' => true,
                'notif_transaksi_besar' => false,
                'batas_transaksi_besar' => 1000000,
            ],
            'keamanan' => [
                'panjang_password_minimum' => 8,
                'wajib_ganti_password_hari' => 90,
                'maks_percobaan_login' => 5,
                'durasi_lockout_menit' => 15,
                'sesi_timeout_menit' => 480,
            ],
            'integrasi' => [
                'smtp_host' => 'smtp.gmail.com',
                'smtp_port' => '587',
                'smtp_user' => 'noreply@cempakalima.id',
                'printer_default' => '',
            ],
        ];
    }
}
