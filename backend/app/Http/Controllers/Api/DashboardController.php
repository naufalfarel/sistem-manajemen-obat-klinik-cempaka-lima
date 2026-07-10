<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KategoriObat;
use App\Models\Obat;
use App\Models\ObatKeluar;
use App\Models\ObatMasuk;
use App\Models\Supplier;
use App\Services\StokStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    /** GET /api/dashboard/summary */
    public function summary(Request $request): JsonResponse
    {
        $today = Carbon::today();
        $expiredDays = $request->integer('expired_days', 30);

        // Agregasi dasar menggunakan DB query / Eloquent secara efisien
        $totalJenisObat = Obat::query()->where('status', 'aktif')->count();
        $totalStokUnit = (int) Obat::query()->where('status', 'aktif')->sum('stok');
        $totalSupplierAktif = Supplier::query()->where('status', 'aktif')->count();
        $totalKategori = KategoriObat::query()->count();

        // Transaksi hari ini
        $obatMasukHariIni = ObatMasuk::query()->whereDate('tanggal', $today)->count();
        $obatKeluarHariIni = ObatKeluar::query()->whereDate('tanggal', $today)->count();

        // Transaksi bulan ini
        $transaksiMasukBulanIni = ObatMasuk::query()
            ->whereMonth('tanggal', $today->month)
            ->whereYear('tanggal', $today->year)
            ->count();
        $transaksiKeluarBulanIni = ObatKeluar::query()
            ->where('status', 'selesai')
            ->whereMonth('tanggal', $today->month)
            ->whereYear('tanggal', $today->year)
            ->count();

        // Perhitungan status stok & expired secara efisien langsung di DB
        $stokKritis = Obat::query()
            ->where('status', 'aktif')
            ->where(function ($q) {
                $q->whereColumn('stok', '<=', 'stok_minimum');
            })
            ->count();

        $expired = Obat::query()
            ->where('status', 'aktif')
            ->whereNotNull('expired_date')
            ->where('expired_date', '<', $today->toDateString())
            ->count();

        $near30 = Obat::query()
            ->where('status', 'aktif')
            ->whereNotNull('expired_date')
            ->where('expired_date', '>=', $today->toDateString())
            ->where('expired_date', '<=', $today->copy()->addDays(30)->toDateString())
            ->count();

        $nearExpired = Obat::query()
            ->where('status', 'aktif')
            ->whereNotNull('expired_date')
            ->where('expired_date', '>=', $today->toDateString())
            ->where('expired_date', '<=', $today->copy()->addDays($expiredDays)->toDateString())
            ->count();

        return response()->json(['data' => [
            'total_jenis_obat' => $totalJenisObat,
            'total_stok_unit' => $totalStokUnit,
            'total_supplier_aktif' => $totalSupplierAktif,
            'total_kategori' => $totalKategori,
            'transaksi_hari_ini' => $obatMasukHariIni + $obatKeluarHariIni,
            'obat_masuk_hari_ini' => $obatMasukHariIni,
            'obat_keluar_hari_ini' => $obatKeluarHariIni,
            'stok_kritis' => $stokKritis,
            'expired' => $expired,
            'near_30_days' => $near30,
            'near_expired' => $nearExpired,
            'transaksi_masuk_bulan_ini' => $transaksiMasukBulanIni,
            'transaksi_keluar_bulan_ini' => $transaksiKeluarBulanIni,
        ]]);
    }

    /**
     * GET /api/dashboard/chart-penjualan?bulan=&tahun=
     *
     * "masuk"/"keluar" merepresentasikan NILAI RUPIAH (nilai_total/total)
     * harian, bukan jumlah transaksi - dipilih karena namanya "chart
     * penjualan" (nilai penjualan), bukan "chart jumlah transaksi". Lihat
     * README.md untuk asumsi ini.
     */
    public function chartPenjualan(Request $request): JsonResponse
    {
        $bulan = max(1, min(12, (int) $request->integer('bulan', now()->month)));
        $tahun = (int) $request->integer('tahun', now()->year);

        $awal = Carbon::create($tahun, $bulan, 1)->startOfMonth();
        $akhir = $awal->copy()->endOfMonth();

        $masukPerHari = ObatMasuk::query()
            ->whereBetween('tanggal', [$awal->toDateString(), $akhir->toDateString()])
            ->selectRaw('DAY(tanggal) as hari, SUM(nilai_total) as total')
            ->groupBy('hari')
            ->pluck('total', 'hari');

        $keluarPerHari = ObatKeluar::query()
            ->where('status', 'selesai')
            ->whereBetween('tanggal', [$awal->toDateString(), $akhir->toDateString()])
            ->selectRaw('DAY(tanggal) as hari, SUM(total) as total')
            ->groupBy('hari')
            ->pluck('total', 'hari');

        $chart = [];
        for ($hari = 1; $hari <= $awal->daysInMonth; $hari++) {
            $chart[] = [
                'label' => sprintf('%02d/%02d', $hari, $bulan),
                'masuk' => (float) ($masukPerHari[$hari] ?? 0),
                'keluar' => (float) ($keluarPerHari[$hari] ?? 0),
            ];
        }

        return response()->json(['data' => $chart]);
    }

    /** GET /api/dashboard/stok-per-kategori */
    public function stockByKategori(): JsonResponse
    {
        $data = KategoriObat::query()
            ->withSum(['obat' => fn ($q) => $q->where('status', 'aktif')], 'stok')
            ->orderBy('nama')
            ->get()
            ->map(fn (KategoriObat $kategori) => [
                'name' => $kategori->nama,
                'value' => (int) ($kategori->obat_sum_stok ?? 0),
            ]);

        return response()->json(['data' => $data]);
    }
}
