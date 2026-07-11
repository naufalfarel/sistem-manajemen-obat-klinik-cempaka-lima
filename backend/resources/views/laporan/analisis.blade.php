<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>Laporan Analisis Kinerja & Aset</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 11px; color: #1f2937; }
        h1 { font-size: 16px; margin-bottom: 2px; }
        p.subtitle { margin: 0 0 14px; color: #6b7280; }
        h2 { font-size: 12px; margin-top: 15px; margin-bottom: 5px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
        .summary-card { background-color: #f3f4f6; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
        .summary-val { font-size: 18px; font-weight: bold; color: #0b7a5a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        th, td { border: 1px solid #d1d5db; padding: 4px 6px; text-align: left; }
        th { background-color: #f9fafb; font-weight: bold; }
        .text-right { text-align: right; }
    </style>
</head>
<body>
    <h1>Laporan Analisis Kinerja & Aset</h1>
    <p class="subtitle">Periode {{ $dari }} s/d {{ $sampai }} &middot; Dicetak {{ $dicetak }}</p>

    <div class="summary-card">
        <div>Nilai Total Aset Inventaris Aktif:</div>
        <div class="summary-val">Rp {{ number_format($nilai_inventaris, 0, ',', '.') }}</div>
    </div>

    <h2>Top 5 Barang Paling Sering Keluar</h2>
    <table>
        <thead>
            <tr>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Frekuensi Transaksi</th>
                <th>Total Qty Keluar</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($paling_sering_keluar as $row)
                <tr>
                    <td>{{ $row->kode }}</td>
                    <td>{{ $row->nama }}</td>
                    <td>{{ $row->frekuensi }} kali</td>
                    <td>{{ $row->total_qty }} unit</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4">Tidak ada data.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h2>Top 5 Barang Tercepat Habis (Volume Keluar Tertinggi)</h2>
    <table>
        <thead>
            <tr>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Total Qty Keluar</th>
                <th>Sisa Stok Saat Ini</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($tercepat_habis as $row)
                <tr>
                    <td>{{ $row->kode }}</td>
                    <td>{{ $row->nama }}</td>
                    <td>{{ $row->total_qty }} unit</td>
                    <td>{{ $row->stok }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4">Tidak ada data.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h2>Barang Expired pada Periode Ini</h2>
    <table>
        <thead>
            <tr>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Stok</th>
                <th>Tanggal Expired</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($expired_barang as $row)
                <tr>
                    <td>{{ $row->kode }}</td>
                    <td>{{ $row->nama }}</td>
                    <td>{{ $row->stok }}</td>
                    <td>{{ $row->expired_date }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4">Tidak ada barang expired dalam periode ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <h2>Barang Dibuang / Diretur / Divoid</h2>
    <table>
        <thead>
            <tr>
                <th>Kode</th>
                <th>Nama Barang</th>
                <th>Total Qty</th>
                <th>Status Transaksi</th>
                <th>Alasan Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($dibuang_barang as $row)
                <tr>
                    <td>{{ $row->kode }}</td>
                    <td>{{ $row->nama }}</td>
                    <td>{{ $row->total_qty }} unit</td>
                    <td><span style="text-transform: uppercase;">{{ $row->status }}</span></td>
                    <td>{{ $row->alasan_retur_void ?: '-' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="5">Tidak ada riwayat retur/void dalam periode ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <p style="font-size: 9px; color: #9ca3af; margin-top: 20px;">Sistem Manajemen Obat &amp; BMHP &middot; Klinik Utama Cempaka Lima</p>
</body>
</html>
