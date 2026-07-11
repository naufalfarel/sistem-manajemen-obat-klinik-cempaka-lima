<?php

namespace App\Http\Controllers\Api;

use App\Exports\LaporanKadaluarsaExport;
use App\Exports\LaporanPenjualanExport;
use App\Exports\LaporanStokExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\MonitoringItemResource;
use App\Models\Obat;
use App\Models\ObatKeluar;
use App\Services\AuditLogger;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * CATATAN PENTING soal routing laporan (lihat README.md "Temuan Tambahan"):
 * dokumen kontrak endpoint menuliskan satu path `?format=json|csv|pdf`,
 * tapi kode nyata di api.ts (laporanApi) memanggil PATH BERBEDA untuk
 * format non-json: `/laporan/{jenis}/export?format=csv|pdf`. Controller ini
 * mengikuti api.ts (source of truth) dengan menyediakan KEDUA path yang
 * mengarah ke method yang sama, supaya kompatibel dengan api.ts maupun
 * dengan pembacaan literal dokumen endpoint.
 */
class LaporanController extends Controller
{
    /** GET /api/laporan/penjualan (+ /export) */
    public function penjualan(Request $request): JsonResponse|StreamedResponse
    {
        $dari = $request->string('dari')->value();
        $sampai = $request->string('sampai')->value();

        if (! $dari || ! $sampai) {
            abort(422, 'Parameter dari dan sampai wajib diisi.');
        }

        $transaksi = ObatKeluar::query()
            ->where('status', 'selesai')
            ->whereDate('tanggal', '>=', $dari)
            ->whereDate('tanggal', '<=', $sampai)
            ->withCount('items')
            ->orderBy('tanggal')
            ->get();

        $rows = $transaksi->map(fn (ObatKeluar $t) => [
            'no_transaksi' => $t->no_transaksi,
            'tanggal' => $t->tanggal->toDateString(),
            'pasien' => $t->pasien,
            'dokter' => $t->dokter,
            'metode_bayar' => $t->metode_bayar,
            'jumlah_item' => $t->items_count,
            'total' => (float) $t->total,
        ]);

        $format = $request->string('format')->value() ?: 'json';

        if ($format === 'json') {
            return response()->json([
                'data' => [
                    'total' => (float) $rows->sum('total'),
                    'items' => $rows->values(),
                ],
            ]);
        }

        AuditLogger::ekspor('laporan-penjualan', "Mengekspor laporan penjualan {$dari} s/d {$sampai} (format: {$format})");

        if ($format === 'pdf') {
            return $this->pdf(
                title: 'Laporan Penjualan',
                subtitle: "Periode {$dari} s/d {$sampai}",
                headings: ['No. Transaksi', 'Tanggal', 'Pasien', 'Dokter', 'Metode Bayar', 'Jumlah Item', 'Total'],
                rows: $rows->map(fn ($r) => array_values($r)),
                filename: 'laporan-penjualan.pdf',
            );
        }

        return Excel::download(new LaporanPenjualanExport($rows), 'laporan-penjualan.csv', \Maatwebsite\Excel\Excel::CSV);
    }

    /** GET /api/laporan/stok (+ /export) */
    public function stok(Request $request): JsonResponse|StreamedResponse
    {
        $format = $request->string('format')->value() ?: 'json';
        $export = new LaporanStokExport;

        if ($format === 'json') {
            $data = $export->collection()->map(function (Obat $obat) use ($export) {
                return array_combine($export->headings(), $export->map($obat));
            });

            return response()->json(['data' => $data->values()]);
        }

        AuditLogger::ekspor('laporan-stok', "Mengekspor laporan stok (format: {$format})");

        if ($format === 'pdf') {
            return $this->pdf(
                title: 'Laporan Stok Barang & BMHP',
                subtitle: 'Seluruh barang aktif per '.now()->toDateString(),
                headings: $export->headings(),
                rows: $export->collection()->map(fn ($o) => $export->map($o)),
                filename: 'laporan-stok.pdf',
            );
        }

        return Excel::download($export, 'laporan-stok.csv', \Maatwebsite\Excel\Excel::CSV);
    }

    /** GET /api/laporan/kadaluarsa (+ /export) */
    public function kadaluarsa(Request $request): JsonResponse|StreamedResponse
    {
        $format = $request->string('format')->value() ?: 'json';

        if ($format === 'json') {
            $obat = (new LaporanKadaluarsaExport)->collection();

            return response()->json(['data' => MonitoringItemResource::collection($obat)]);
        }

        AuditLogger::ekspor('laporan-kadaluarsa', "Mengekspor laporan kadaluarsa (format: {$format})");

        if ($format === 'pdf') {
            $export = new LaporanKadaluarsaExport;

            return $this->pdf(
                title: 'Laporan Barang Kadaluarsa',
                subtitle: 'Seluruh barang aktif dengan tanggal expired per '.now()->toDateString(),
                headings: $export->headings(),
                rows: $export->collection()->map(fn ($o) => $export->map($o)),
                filename: 'laporan-kadaluarsa.pdf',
            );
        }

        return Excel::download(new LaporanKadaluarsaExport, 'laporan-kadaluarsa.csv', \Maatwebsite\Excel\Excel::CSV);
    }

    /**
     * @param  array<int, string>  $headings
     * @param  Collection<int, array<int, mixed>>  $rows
     */
    private function pdf(string $title, string $subtitle, array $headings, Collection $rows, string $filename)
    {
        $pdf = Pdf::loadView('laporan.tabel', [
            'title' => $title,
            'subtitle' => $subtitle,
            'headings' => $headings,
            'rows' => $rows,
            'dicetak' => Carbon::now()->translatedFormat('d F Y H:i'),
        ]);

        return response($pdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $filename . '"',
        ]);
    }

    /** GET /api/laporan/logistik */
    public function logistik(Request $request): JsonResponse|\Illuminate\Http\Response|StreamedResponse
    {
        $dari = $request->string('dari')->value();
        $sampai = $request->string('sampai')->value();

        if (! $dari || ! $sampai) {
            abort(422, 'Parameter dari dan sampai wajib diisi.');
        }

        $obatMasuk = DB::table('obat_masuk')
            ->join('obat_masuk_items', 'obat_masuk.id', '=', 'obat_masuk_items.obat_masuk_id')
            ->where('obat_masuk.status', 'diterima')
            ->whereDate('obat_masuk.tanggal', '>=', $dari)
            ->whereDate('obat_masuk.tanggal', '<=', $sampai)
            ->selectRaw('obat_masuk.tanggal, SUM(obat_masuk_items.jumlah) as total_masuk, SUM(obat_masuk_items.subtotal) as nilai_masuk')
            ->groupBy('obat_masuk.tanggal')
            ->get()
            ->keyBy('tanggal');

        $obatKeluar = DB::table('obat_keluar')
            ->join('obat_keluar_items', 'obat_keluar.id', '=', 'obat_keluar_items.obat_keluar_id')
            ->where('obat_keluar.status', 'selesai')
            ->whereDate('obat_keluar.tanggal', '>=', $dari)
            ->whereDate('obat_keluar.tanggal', '<=', $sampai)
            ->selectRaw('obat_keluar.tanggal, SUM(obat_keluar_items.jumlah) as total_keluar, SUM(obat_keluar_items.subtotal) as nilai_keluar')
            ->groupBy('obat_keluar.tanggal')
            ->get()
            ->keyBy('tanggal');

        $period = new \DatePeriod(
            new \DateTime($dari),
            new \DateInterval('P1D'),
            (new \DateTime($sampai))->modify('+1 day')
        );

        $chartData = [];
        foreach ($period as $date) {
            $tgl = $date->format('Y-m-d');
            $masuk = $obatMasuk->get($tgl);
            $keluar = $obatKeluar->get($tgl);

            $chartData[] = [
                'tanggal' => $tgl,
                'total_masuk' => $masuk ? (int) $masuk->total_masuk : 0,
                'nilai_masuk' => $masuk ? (float) $masuk->nilai_masuk : 0,
                'total_keluar' => $keluar ? (int) $keluar->total_keluar : 0,
                'nilai_keluar' => $keluar ? (float) $keluar->nilai_keluar : 0,
            ];
        }

        $format = $request->string('format')->value() ?: 'json';
        if ($format === 'json') {
            return response()->json([
                'data' => [
                    'chart' => $chartData,
                    'total_item_masuk' => (int) collect($chartData)->sum('total_masuk'),
                    'nilai_item_masuk' => (float) collect($chartData)->sum('nilai_masuk'),
                    'total_item_keluar' => (int) collect($chartData)->sum('total_keluar'),
                    'nilai_item_keluar' => (float) collect($chartData)->sum('nilai_keluar'),
                ],
            ]);
        }

        AuditLogger::ekspor('laporan-logistik', "Mengekspor laporan logistik {$dari} s/d {$sampai} (format: {$format})");

        if ($format === 'pdf') {
            return $this->pdf(
                title: 'Laporan Logistik Barang & BMHP',
                subtitle: "Periode {$dari} s/d {$sampai}",
                headings: ['Tanggal', 'Total Item Masuk', 'Nilai Masuk', 'Total Item Keluar', 'Nilai Keluar'],
                rows: collect($chartData)->map(fn ($r) => [
                    $r['tanggal'],
                    $r['total_masuk'] . ' unit',
                    'Rp ' . number_format($r['nilai_masuk'], 0, ',', '.'),
                    $r['total_keluar'] . ' unit',
                    'Rp ' . number_format($r['nilai_keluar'], 0, ',', '.'),
                ]),
                filename: 'laporan-logistik.pdf',
            );
        }

        $exportRows = collect($chartData)->map(fn ($r) => [
            'Tanggal' => $r['tanggal'],
            'Total Masuk' => $r['total_masuk'],
            'Nilai Masuk' => $r['nilai_masuk'],
            'Total Keluar' => $r['total_keluar'],
            'Nilai Keluar' => $r['nilai_keluar'],
        ]);

        return Excel::download(new class($exportRows) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings {
            protected $rows;
            public function __construct($rows) { $this->rows = $rows; }
            public function collection() { return $this->rows; }
            public function headings(): array { return ['Tanggal', 'Total Masuk', 'Nilai Masuk', 'Total Keluar', 'Nilai Keluar']; }
        }, 'laporan-logistik.csv', \Maatwebsite\Excel\Excel::CSV);
    }

    /** GET /api/laporan/analisis */
    public function analisis(Request $request): JsonResponse|\Illuminate\Http\Response|StreamedResponse
    {
        $dari = $request->string('dari')->value();
        $sampai = $request->string('sampai')->value();

        if (!$dari || !$sampai) {
            abort(422, 'Parameter dari dan sampai wajib diisi.');
        }

        // 1. Nilai Total Inventaris: sum(stok * harga_beli) untuk semua barang aktif
        $nilaiInventaris = (float) Obat::query()->where('status', 'aktif')->selectRaw('SUM(stok * harga_beli) as total_nilai')->value('total_nilai');

        // 2. Barang paling sering keluar (Top 5 berdasarkan frekuensi transaksi obat_keluar)
        $palingSeringKeluar = DB::table('obat_keluar_items')
            ->join('obat_keluar', 'obat_keluar.id', '=', 'obat_keluar_items.obat_keluar_id')
            ->join('obat', 'obat.id', '=', 'obat_keluar_items.obat_id')
            ->where('obat_keluar.status', 'selesai')
            ->whereDate('obat_keluar.tanggal', '>=', $dari)
            ->whereDate('obat_keluar.tanggal', '<=', $sampai)
            ->selectRaw('obat.id, obat.nama, obat.kode, COUNT(DISTINCT obat_keluar.id) as frekuensi, SUM(obat_keluar_items.jumlah) as total_qty')
            ->groupBy('obat.id', 'obat.nama', 'obat.kode')
            ->orderByDesc('frekuensi')
            ->limit(5)
            ->get();

        // 3. Barang tercepat habis (Top 5 berdasarkan total qty keluar tertinggi)
        $tercepatHabis = DB::table('obat_keluar_items')
            ->join('obat_keluar', 'obat_keluar.id', '=', 'obat_keluar_items.obat_keluar_id')
            ->join('obat', 'obat.id', '=', 'obat_keluar_items.obat_id')
            ->where('obat_keluar.status', 'selesai')
            ->whereDate('obat_keluar.tanggal', '>=', $dari)
            ->whereDate('obat_keluar.tanggal', '<=', $sampai)
            ->selectRaw('obat.id, obat.nama, obat.kode, SUM(obat_keluar_items.jumlah) as total_qty, obat.stok')
            ->groupBy('obat.id', 'obat.nama', 'obat.kode', 'obat.stok')
            ->orderByDesc('total_qty')
            ->limit(5)
            ->get();

        // 4. Riwayat barang expired/dibuang
        // expired: barang dengan tanggal expired sudah lewat atau dalam range dari/sampai
        $expiredBarang = Obat::query()
            ->where('status', 'aktif')
            ->whereNotNull('expired_date')
            ->whereDate('expired_date', '<=', $sampai)
            ->whereDate('expired_date', '>=', $dari)
            ->orderBy('expired_date')
            ->get(['id', 'nama', 'kode', 'stok', 'expired_date']);

        // dibuang/retur/void: rekap items dari transaksi retur & void
        $dibuangBarang = DB::table('obat_keluar_items')
            ->join('obat_keluar', 'obat_keluar.id', '=', 'obat_keluar_items.obat_keluar_id')
            ->join('obat', 'obat.id', '=', 'obat_id')
            ->whereIn('obat_keluar.status', ['retur', 'void'])
            ->whereDate('obat_keluar.tanggal', '>=', $dari)
            ->whereDate('obat_keluar.tanggal', '<=', $sampai)
            ->selectRaw('obat.nama, obat.kode, SUM(obat_keluar_items.jumlah) as total_qty, obat_keluar.status, obat_keluar.alasan_retur_void')
            ->groupBy('obat.nama', 'obat.kode', 'obat_keluar.status', 'obat_keluar.alasan_retur_void')
            ->get();

        $format = $request->string('format')->value() ?: 'json';

        if ($format === 'json') {
            return response()->json([
                'data' => [
                    'nilai_inventaris' => $nilaiInventaris,
                    'paling_sering_keluar' => $palingSeringKeluar,
                    'tercepat_habis' => $tercepatHabis,
                    'expired_barang' => $expiredBarang,
                    'dibuang_barang' => $dibuangBarang,
                ]
            ]);
        }

        AuditLogger::ekspor('laporan-analisis', "Mengekspor laporan analisis {$dari} s/d {$sampai} (format: {$format})");

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('laporan.analisis', [
                'nilai_inventaris' => $nilaiInventaris,
                'paling_sering_keluar' => $palingSeringKeluar,
                'tercepat_habis' => $tercepatHabis,
                'expired_barang' => $expiredBarang,
                'dibuang_barang' => $dibuangBarang,
                'dari' => $dari,
                'sampai' => $sampai,
                'dicetak' => Carbon::now()->translatedFormat('d F Y H:i'),
            ]);

            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="laporan-analisis.pdf"',
            ]);
        }

        // Format CSV untuk Analisis
        $callback = function() use ($nilaiInventaris, $palingSeringKeluar, $tercepatHabis, $expiredBarang, $dibuangBarang, $dari, $sampai) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['LAPORAN ANALISIS KINERJA & ASET']);
            fputcsv($file, ["Periode: {$dari} s/d {$sampai}"]);
            fputcsv($file, []);
            fputcsv($file, ['Nilai Total Aset Inventaris', (float) $nilaiInventaris]);
            fputcsv($file, []);
            
            fputcsv($file, ['TOP 5 BARANG PALING SERING KELUAR']);
            fputcsv($file, ['Kode', 'Nama Barang', 'Frekuensi', 'Total Qty']);
            foreach ($palingSeringKeluar as $row) {
                fputcsv($file, [$row->kode, $row->nama, $row->frekuensi, $row->total_qty]);
            }
            fputcsv($file, []);
            
            fputcsv($file, ['TOP 5 BARANG TERCEPAT HABIS']);
            fputcsv($file, ['Kode', 'Nama Barang', 'Total Qty', 'Sisa Stok']);
            foreach ($tercepatHabis as $row) {
                fputcsv($file, [$row->kode, $row->nama, $row->total_qty, $row->stok]);
            }
            fputcsv($file, []);

            fputcsv($file, ['BARANG EXPIRED PERIODE INI']);
            fputcsv($file, ['Kode', 'Nama Barang', 'Stok', 'Tanggal Expired']);
            foreach ($expiredBarang as $row) {
                fputcsv($file, [$row->kode, $row->nama, $row->stok, $row->expired_date]);
            }
            fputcsv($file, []);

            fputcsv($file, ['BARANG DIBUANG / RETUR / VOID']);
            fputcsv($file, ['Kode', 'Nama Barang', 'Total Qty', 'Status', 'Alasan']);
            foreach ($dibuangBarang as $row) {
                fputcsv($file, [$row->kode, $row->nama, $row->total_qty, strtoupper($row->status), $row->alasan_retur_void ?: '-']);
            }
            fclose($file);
        };

        return response()->streamDownload($callback, 'laporan-analisis.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
