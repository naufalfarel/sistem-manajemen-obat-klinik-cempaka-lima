import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  ChevronRight, Download, Calendar, Filter, FileText, Printer,
  TrendingUp, Activity, Package, AlertTriangle, RefreshCw, Loader2, Search
} from 'lucide-react';
import { laporanApi } from '../services/api';
import { toast } from 'sonner';

const PRIMARY = '#0F9D74';

type TabKey = 'transaksi' | 'logistik' | 'persediaan' | 'expired';

function formatRupiah(num: number): string {
  return 'Rp ' + num.toLocaleString('id-ID');
}

function fmtAxisRupiah(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
  return String(v);
}

function CustomTooltip({ active, payload, label, rupiah }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-36">
      <p className="font-semibold text-gray-600 mb-2 pb-1.5 border-b border-gray-100">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-gray-500">{p.name}</span>
          </div>
          <span className="font-semibold text-gray-800 font-mono">
            {rupiah ? formatRupiah(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Laporan() {
  const [activeTab, setActiveTab] = useState<TabKey>('transaksi');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Date range filters
  const [dari, setDari] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [sampai, setSampai] = useState(() => new Date().toISOString().split('T')[0]);

  // Data lists
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [totalPenjualan, setTotalPenjualan] = useState(0);
  const [stokList, setStokList] = useState<any[]>([]);
  const [kadaluarsaList, setKadaluarsaList] = useState<any[]>([]);

  // Logistik data lists
  const [logistikChart, setLogistikChart] = useState<any[]>([]);
  const [totalMasukUnit, setTotalMasukUnit] = useState(0);
  const [totalKeluarUnit, setTotalKeluarUnit] = useState(0);
  const [nilaiMasukTotal, setNilaiMasukTotal] = useState(0);
  const [nilaiKeluarTotal, setNilaiKeluarTotal] = useState(0);

  // Search/filter lokal
  const [search, setSearch] = useState('');

  const fetchLaporanData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      if (activeTab === 'transaksi') {
        const res = await laporanApi.penjualan(dari, sampai);
        setTransaksiList(res.data.items || []);
        setTotalPenjualan(res.data.total || 0);
      } else if (activeTab === 'logistik') {
        const res = await laporanApi.logistik(dari, sampai);
        setLogistikChart(res.data.chart || []);
        setTotalMasukUnit(res.data.total_item_masuk || 0);
        setTotalKeluarUnit(res.data.total_item_keluar || 0);
        setNilaiMasukTotal(res.data.nilai_item_masuk || 0);
        setNilaiKeluarTotal(res.data.nilai_item_keluar || 0);
      } else if (activeTab === 'persediaan') {
        const res = await laporanApi.stok();
        setStokList(res.data || []);
      } else if (activeTab === 'expired') {
        const res = await laporanApi.kadaluarsa();
        setKadaluarsaList(res.data || []);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLaporanData();
  }, [activeTab, dari, sampai]);

  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (activeTab === 'transaksi') {
      if (!q) return transaksiList;
      return transaksiList.filter(t => 
        t.no_transaksi?.toLowerCase().includes(q) || 
        t.pasien?.toLowerCase().includes(q) ||
        (t.dokter && t.dokter.toLowerCase().includes(q))
      );
    } else if (activeTab === 'logistik') {
      if (!q) return logistikChart;
      return logistikChart.filter(l => l.tanggal?.toLowerCase().includes(q));
    } else if (activeTab === 'persediaan') {
      if (!q) return stokList;
      return stokList.filter(s => 
        s['Nama Obat']?.toLowerCase().includes(q) || 
        s['Kode Obat']?.toLowerCase().includes(q) ||
        s['Kategori']?.toLowerCase().includes(q)
      );
    } else {
      if (!q) return kadaluarsaList;
      return kadaluarsaList.filter(k => 
        k.nama?.toLowerCase().includes(q) || 
        k.kode?.toLowerCase().includes(q)
      );
    }
  }, [activeTab, search, transaksiList, logistikChart, stokList, kadaluarsaList]);

  // Chart data builder
  const chartData = useMemo(() => {
    if (activeTab === 'transaksi') {
      // Kelompokkan total penjualan per tanggal
      const map: Record<string, number> = {};
      transaksiList.forEach(t => {
        const date = t.tanggal;
        map[date] = (map[date] || 0) + (t.total || 0);
      });
      return Object.entries(map).map(([tgl, val]) => ({
        tgl: new Date(tgl).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        nilai: val
      }));
    } else if (activeTab === 'logistik') {
      return logistikChart.map(l => ({
        tgl: new Date(l.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        masuk: l.total_masuk,
        keluar: l.total_keluar,
        nilai: l.total_masuk // fallback
      }));
    } else if (activeTab === 'persediaan') {
      // Nilai stok per obat (top 8)
      return stokList
        .slice(0, 8)
        .map(s => ({
          tgl: s['Nama Obat']?.substring(0, 12) || 'Obat',
          nilai: (s['Stok'] || 0) * (s['Harga Beli'] || 0)
        }));
    } else {
      // Hari expired monitoring (top 8)
      return kadaluarsaList
        .slice(0, 8)
        .map(k => ({
          tgl: k.nama?.substring(0, 12) || 'Obat',
          nilai: k.hari_expired || 0
        }));
    }
  }, [activeTab, transaksiList, logistikChart, stokList, kadaluarsaList]);

  const handleExport = (format: 'csv' | 'pdf') => {
    let url = '';
    if (activeTab === 'transaksi') {
      url = laporanApi.penjualan(dari, sampai, format) as string;
    } else if (activeTab === 'logistik') {
      url = laporanApi.logistik(dari, sampai, format) as string;
    } else if (activeTab === 'persediaan') {
      url = laporanApi.stok(format) as string;
    } else {
      url = laporanApi.kadaluarsa(format) as string;
    }
    window.open(url, '_blank');
  };

  const currentTabLabel = activeTab === 'transaksi' 
    ? 'Transaksi Penjualan' 
    : activeTab === 'logistik' 
      ? 'Logistik Masuk vs Keluar' 
      : activeTab === 'persediaan' 
        ? 'Stok Persediaan' 
        : 'Kedaluwarsa Obat';

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <span>Laporan</span>
            <ChevronRight size={12} />
            <span style={{ color: PRIMARY }} className="font-semibold">{currentTabLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: PRIMARY }}>
              {activeTab === 'transaksi' || activeTab === 'logistik' ? <Activity size={17} className="text-white" /> : activeTab === 'persediaan' ? <Package size={17} className="text-white" /> : <AlertTriangle size={17} className="text-white" />}
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm">Laporan &amp; Analitik</h1>
              <p className="text-xs text-slate-400">Analisis data real-time, cetak PDF resmi, dan ekspor CSV</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Printer size={14} /> Cetak PDF
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white font-semibold hover:opacity-90"
            style={{ backgroundColor: PRIMARY }}
          >
            <Download size={14} /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* Segmented tab control */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-1 flex gap-0.5 w-fit">
        {[
          { key: 'transaksi', label: 'Laporan Penjualan', icon: Activity },
          { key: 'logistik', label: 'Laporan Logistik', icon: Activity },
          { key: 'persediaan', label: 'Laporan Stok', icon: Package },
          { key: 'expired', label: 'Laporan Expired', icon: AlertTriangle },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as TabKey)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === key ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
            style={activeTab === key ? { backgroundColor: PRIMARY } : {}}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {(activeTab === 'transaksi' || activeTab === 'logistik') && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Rentang Tanggal:</span>
              <input
                type="date"
                value={dari}
                onChange={e => setDari(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 text-slate-600 bg-white font-medium"
              />
              <span className="text-slate-400 text-xs">—</span>
              <input
                type="date"
                value={sampai}
                onChange={e => setSampai(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-emerald-500 text-slate-600"
              />
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 flex-1 min-w-[200px]">
            <Search size={14} className="text-slate-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Cari data ${currentTabLabel.toLowerCase()}...`}
              className="bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400 w-full"
            />
          </div>

          <button 
            onClick={() => fetchLaporanData(true)}
            className="flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* Left Column: Tren Chart */}
        <div className="xl:col-span-3 bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden flex flex-col justify-between p-5 min-h-[340px]">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Visualisasi Grafis Tren {currentTabLabel}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Berdasarkan data operasional terbaru dari database</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">Tidak ada data untuk dirender dalam grafik</div>
          ) : (
            <div className="h-48 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={PRIMARY} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="tgl" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={activeTab === 'transaksi' || activeTab === 'persediaan' ? fmtAxisRupiah : undefined} />
                  <Tooltip content={<CustomTooltip rupiah={activeTab === 'transaksi' || activeTab === 'persediaan'} />} />
                  {activeTab === 'logistik' ? (
                    <>
                      <Area type="monotone" dataKey="masuk" name="Obat Masuk (Unit)" stroke={PRIMARY} strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                      <Area type="monotone" dataKey="keluar" name="Obat Keluar (Unit)" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorBlue)" />
                    </>
                  ) : (
                    <Area type="monotone" dataKey="nilai" name={activeTab === 'expired' ? 'Hari Expired' : 'Nilai (Rp)'} stroke={PRIMARY} strokeWidth={2} fillOpacity={1} fill="url(#colorVal)" />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Column: Summary Data Strip */}
        <div className="xl:col-span-2 bg-white border border-slate-100 shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Ringkasan Nilai Operasional</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Hasil kalkulasi agregat data</p>
          </div>

          <div className="space-y-3 mt-4">
            {activeTab === 'transaksi' && (
              <>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Pendapatan Penjualan</p>
                  <p className="text-lg font-bold text-slate-800 mt-1 font-mono">{formatRupiah(totalPenjualan)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Jumlah Transaksi Penjualan</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{transaksiList.length} Transaksi</p>
                </div>
              </>
            )}

            {activeTab === 'logistik' && (
              <>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Penerimaan (Obat Masuk)</p>
                  <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                    {totalMasukUnit} Unit ({formatRupiah(nilaiMasukTotal)})
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Pengeluaran (Obat Keluar)</p>
                  <p className="text-sm font-bold text-blue-600 mt-1 font-mono">
                    {totalKeluarUnit} Unit ({formatRupiah(nilaiKeluarTotal)})
                  </p>
                </div>
              </>
            )}

            {activeTab === 'persediaan' && (
              <>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Nilai Aset Stok</p>
                  <p className="text-lg font-bold text-slate-800 mt-1 font-mono">
                    {formatRupiah(stokList.reduce((s, it) => s + ((it['Stok'] || 0) * (it['Harga Beli'] || 0)), 0))}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Jenis Obat Terdaftar</p>
                  <p className="text-lg font-bold text-slate-800 mt-1">{stokList.length} Item</p>
                </div>
              </>
            )}

            {activeTab === 'expired' && (
              <>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Obat Berstatus Expired</p>
                  <p className="text-lg font-bold text-red-600 mt-1">{kadaluarsaList.filter(k => k.status_exp === 'expired').length} Item</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Mendekati Kadaluarsa (Near 30/90)</p>
                  <p className="text-lg font-bold text-amber-500 mt-1">
                    {kadaluarsaList.filter(k => k.status_exp === 'near-30' || k.status_exp === 'near-90').length} Item
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Rincian Data Laporan</span>
          <span className="text-xs text-slate-400">{filteredItems.length} baris data</span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'transaksi' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">No. Transaksi</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Nama Pasien</th>
                    <th className="px-4 py-3">Dokter</th>
                    <th className="px-4 py-3">Metode Bayar</th>
                    <th className="px-4 py-3 text-right">Total Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {filteredItems.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">{t.no_transaksi}</td>
                      <td className="px-4 py-3">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{t.pasien}</td>
                      <td className="px-4 py-3">{t.dokter || '-'}</td>
                      <td className="px-4 py-3 uppercase text-[10px]">{t.metode_bayar}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatRupiah(t.total)}</td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400">Tidak ada riwayat transaksi penjualan</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'logistik' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3 text-right">Total Item Masuk</th>
                    <th className="px-4 py-3 text-right">Nilai Masuk (Rp)</th>
                    <th className="px-4 py-3 text-right">Total Item Keluar</th>
                    <th className="px-4 py-3 text-right">Nilai Keluar (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {filteredItems.map((l, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {new Date(l.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{l.total_masuk} unit</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600">{formatRupiah(l.nilai_masuk)}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{l.total_keluar} unit</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-blue-600">{formatRupiah(l.nilai_keluar)}</td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-10 text-slate-400">Tidak ada riwayat logistik masuk vs keluar</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'persediaan' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Kode Obat</th>
                    <th className="px-4 py-3">Nama Obat</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3 text-right">Stok</th>
                    <th className="px-4 py-3 text-right">Harga Beli</th>
                    <th className="px-4 py-3 text-right">Harga Jual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {filteredItems.map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">{s['Kode Obat']}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{s['Nama Obat']}</td>
                      <td className="px-4 py-3">{s['Kategori'] || '-'}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{s['Stok']} {s['Satuan']}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatRupiah(s['Harga Beli'] || 0)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">{formatRupiah(s['Harga Jual'] || 0)}</td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400">Tidak ada data persediaan</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'expired' && (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Kode</th>
                    <th className="px-4 py-3">Nama Obat</th>
                    <th className="px-4 py-3">Sisa Stok</th>
                    <th className="px-4 py-3 text-right">Hari Expired</th>
                    <th className="px-4 py-3 text-right">Tanggal Expired</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                  {filteredItems.map((k, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">{k.kode}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{k.nama}</td>
                      <td className="px-4 py-3 font-semibold">{k.stok}</td>
                      <td className="px-4 py-3 text-right font-mono">{k.hari_expired !== null ? `${k.hari_expired} Hari` : '-'}</td>
                      <td className="px-4 py-3 text-right font-mono">{k.expired_date ? new Date(k.expired_date).toLocaleDateString('id-ID') : '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          k.status_exp === 'expired' ? 'bg-red-100 text-red-700' : k.status_exp === 'near-30' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {k.status_exp?.toUpperCase() || 'AMAN'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-slate-400">Tidak ada laporan obat kadaluarsa</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
