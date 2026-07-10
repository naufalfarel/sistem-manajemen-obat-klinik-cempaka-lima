import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Trash2, Save, Printer, Search, Download, Eye, X,
  AlertTriangle, ShoppingCart, TrendingUp, RotateCcw,
  Receipt, User, Stethoscope, Package,
  CheckCircle, ArrowLeft, Banknote, CreditCard, QrCode, Shield,
  Clock, RefreshCw, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  obatKeluarApi, 
  obatApi, 
  type ObatKeluar as ApiObatKeluar, 
  type Obat as ApiObat 
} from '../services/api';
import { toast } from 'sonner';

const PRIMARY = '#0F9D74';

const JENIS_LABEL: Record<string, string> = { resep: 'Resep', otc: 'Obat Bebas', retur: 'Retur', void: 'Void' };
const JENIS_COLOR: Record<string, string> = {
  resep: 'bg-blue-100 text-blue-700',
  otc: 'bg-emerald-100 text-emerald-700',
  retur: 'bg-orange-100 text-orange-700',
  void: 'bg-red-100 text-red-700',
};
const METODE_LABEL: Record<string, string> = { tunai: 'Tunai', debit: 'Debit', qris: 'QRIS', bpjs: 'BPJS/Asuransi' };
const METODE_ICON: Record<string, React.ElementType> = { tunai: Banknote, debit: CreditCard, qris: QrCode, bpjs: Shield };

function formatRupiah(num: number): string {
  return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

interface SaleItem {
  id: string;
  obat_id: string;
  jumlah: number;
  harga: number;
  stokTersedia: number;
  nama: string;
  satuan: string;
}

function calcSubtotal(item: SaleItem) {
  return Math.round(item.jumlah * item.harga);
}

function emptySaleItem(): SaleItem {
  return {
    id: Math.random().toString(36).substring(2, 9),
    obat_id: '',
    jumlah: 1,
    harga: 0,
    stokTersedia: 0,
    nama: '',
    satuan: ''
  };
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{text}</span>;
}

function StatCard({
  icon: Icon, label, value, sub, color,
}: { icon: React.ElementType; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-800 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export function ObatKeluar() {
  const [transactions, setTransactions] = useState<ApiObatKeluar[]>([]);
  const [drugs, setDrugs] = useState<ApiObat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<ApiObatKeluar | null>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showRetur, setShowRetur] = useState<ApiObatKeluar | null>(null);
  const [showPrint, setShowPrint] = useState<any | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterMetode, setFilterMetode] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterObatId, setFilterObatId] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Today stats dari database (dihitung lokal dari list saat ini atau dummy)
  const todayTx = useMemo(() =>
    transactions.filter(t => t.tanggal?.startsWith(new Date().toISOString().split('T')[0]) && t.status !== 'retur' && t.status !== 'void'), [transactions]);
  
  const todayRetur = useMemo(() =>
    transactions.filter(t => t.tanggal?.startsWith(new Date().toISOString().split('T')[0]) && (t.status === 'retur' || t.status === 'void')), [transactions]);

  const stats = useMemo(() => ({
    obatTerjual: todayTx.reduce((s, t) => s + t.total_item, 0),
    transaksi: todayTx.length,
    pendapatan: todayTx.reduce((s, t) => s + t.nilai_total, 0),
    retur: todayRetur.length,
  }), [todayTx, todayRetur]);

  const fetchDrugsMetadata = async () => {
    try {
      const res = await obatApi.list({ per_page: 200, status: 'aktif' });
      setDrugs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await obatKeluarApi.list({
        page,
        per_page: 8,
        search: search.trim() || undefined,
        jenis: (filterJenis || undefined) as any, // backend status/jenis map
        obat_id: filterObatId ? parseInt(filterObatId) : undefined,
        dari: filterDate || undefined,
        sampai: filterDate || undefined
      });
      // Pindahkan response backend ke mapping state
      const mappedList: ApiObatKeluar[] = res.data.map(item => ({
        id: item.id,
        no_transaksi: item.no_transaksi,
        tanggal: item.tanggal,
        jenis: item.jenis,
        nama_pasien: item.nama_pasien,
        no_rekam_medis: item.no_rekam_medis,
        dokter: item.dokter,
        total: item.total,
        metode_pembayaran: item.metode_pembayaran,
        status: item.status,
        petugas_id: item.petugas_id,
        petugas: item.petugas,
        catatan: item.catatan,
        created_at: item.created_at,
        // Properti computed untuk stat
        total_item: (item as any).items?.reduce((acc: number, it: any) => acc + it.jumlah, 0) || 1,
        nilai_total: item.total
      }));
      setTransactions(mappedList);
      setLastPage(res.meta.last_page);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat riwayat transaksi obat keluar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDrugsMetadata();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, filterJenis, filterMetode, filterDate, filterObatId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleOpenDetail = async (record: ApiObatKeluar) => {
    setShowDetail(record);
    setLoadingDetail(true);
    try {
      const res = await obatKeluarApi.get(record.id);
      setDetailItems((res as any).data.items || []);
    } catch (err: any) {
      toast.error('Gagal memuat rincian item obat keluar');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSaveTransaction = async (payload: any) => {
    try {
      const res = await obatKeluarApi.create(payload);
      toast.success('Transaksi obat keluar berhasil disimpan.');
      setShowForm(false);
      fetchTransactions(true);
      fetchDrugsMetadata(); // Refresh stok obat terbaru
      
      // Tampilkan nota setelah save
      const newRecord = res.data;
      setShowPrint({
        noTransaksi: newRecord.no_transaksi,
        tanggal: newRecord.tanggal,
        namaPasien: newRecord.nama_pasien,
        dokter: newRecord.dokter,
        petugas: newRecord.petugas?.nama || 'Apoteker',
        totalBayar: newRecord.total,
        metodeBayar: newRecord.metode_pembayaran,
        items: newRecord.items?.map((it: any) => ({
          namaObat: it.obat?.nama || 'Obat',
          jumlah: it.jumlah,
          hargaJual: it.harga,
          diskon: 0,
          subtotal: it.subtotal
        })) || []
      });
    } catch (err: any) {
      toast.error(err?.message || 'Gagal membuat transaksi obat keluar');
    }
  };

  const processRetur = async (alasan: string, itemsToRetur: any[]) => {
    if (!showRetur) return;
    try {
      await obatKeluarApi.retur(showRetur.id, {
        alasan: alasan
      });
      toast.success('Transaksi berhasil diretur dan stok obat dikembalikan.');
      setShowRetur(null);
      fetchTransactions(true);
      fetchDrugsMetadata();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memproses retur');
    }
  };

  const formatRupiahLocal = (num: number) => formatRupiah(num);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Obat Terjual Hari Ini" value={`${stats.obatTerjual} item`} sub="dari transaksi hari ini" color="bg-emerald-500" />
        <StatCard icon={Receipt} label="Transaksi Hari Ini" value={String(stats.transaksi)} sub="resep & bebas" color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="Pendapatan Hari Ini" value={formatRupiahLocal(stats.pendapatan)} sub="real-time" color="bg-violet-500" />
        <StatCard icon={RotateCcw} label="Retur/Void Hari Ini" value={String(stats.retur)} sub="item dibatalkan" color="bg-orange-500" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-52">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari pasien atau no. transaksi…"
              className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
            />
          </div>

          {/* Filter date */}
          <div className="relative">
            <input
              type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 text-gray-600"
            />
          </div>

          {/* Filter jenis */}
          <select
            value={filterJenis} onChange={e => { setFilterJenis(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white text-gray-600"
          >
            <option value="">Semua Jenis</option>
            <option value="resep">Resep Dokter</option>
            <option value="otc">Obat Bebas (OTC)</option>
            <option value="retur">Retur</option>
            <option value="void">Void</option>
          </select>

          {/* Filter obat */}
          <select
            value={filterObatId} onChange={e => { setFilterObatId(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white text-gray-600 max-w-44"
          >
            <option value="">Semua Obat</option>
            {drugs.map(d => (
              <option key={d.id} value={d.id}>{d.nama}</option>
            ))}
          </select>

          <button 
            type="button"
            onClick={() => fetchTransactions(true)}
            className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-sm text-white rounded-lg px-4 py-2 hover:opacity-90 transition-opacity font-medium ml-auto"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus size={14} /> Transaksi Obat Keluar
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Riwayat Transaksi Obat Keluar</span>
          <span className="text-xs text-gray-400">{totalCount} transaksi</span>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-slate-600 font-medium">Memuat riwayat transaksi...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['No. Transaksi', 'Tanggal', 'Nama Pasien', 'Jenis', 'Jml. Jenis', 'Total Bayar', 'Metode', 'Petugas', 'Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map(t => {
                  const MetodeIcon = METODE_ICON[t.metode_pembayaran] || Banknote;
                  return (
                    <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${t.status === 'retur' || t.status === 'void' ? 'bg-orange-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-gray-700 font-medium">{t.no_transaksi}</code>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {t.tanggal ? new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs font-medium text-gray-800">{t.nama_pasien}</p>
                          {t.no_rekam_medis && <p className="text-xs text-gray-400 font-mono">{t.no_rekam_medis}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge text={JENIS_LABEL[t.jenis] || t.jenis} color={JENIS_COLOR[t.jenis] || 'bg-gray-100'} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{t.total_item}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold font-mono ${t.status === 'retur' || t.status === 'void' ? 'text-orange-600' : 'text-gray-800'}`}>
                          {formatRupiahLocal(t.total)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MetodeIcon size={12} />
                          {METODE_LABEL[t.metode_pembayaran] || t.metode_pembayaran}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{t.petugas?.nama || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenDetail(t)}
                            title="Detail"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={() => {
                              // generate printer preview format
                              setShowPrint({
                                noTransaksi: t.no_transaksi,
                                tanggal: t.tanggal,
                                namaPasien: t.nama_pasien,
                                dokter: t.dokter,
                                petugas: t.petugas?.nama || 'Apoteker',
                                totalBayar: t.total,
                                metodeBayar: t.metode_pembayaran,
                                items: [] // akan di-load jika diprint dari detail
                              });
                            }}
                            title="Cetak nota"
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          >
                            <Printer size={13} />
                          </button>
                          {t.status === 'selesai' && (
                            <button
                              onClick={() => setShowRetur(t)}
                              title="Retur"
                              className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              <RotateCcw size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            Halaman {page} dari {lastPage}
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? 'text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                style={page === p ? { backgroundColor: PRIMARY } : {}}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === lastPage}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      {showForm && (
        <TransactionFormModal
          drugs={drugs}
          onSave={handleSaveTransaction}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Detail Modal */}
      {showDetail && (
        <DetailModal
          record={showDetail}
          items={detailItems}
          loading={loadingDetail}
          onClose={() => { setShowDetail(null); setDetailItems([]); }}
          onPrint={() => {
            setShowPrint({
              noTransaksi: showDetail.no_transaksi,
              tanggal: showDetail.tanggal,
              namaPasien: showDetail.nama_pasien,
              dokter: showDetail.dokter,
              petugas: showDetail.petugas?.nama || 'Apoteker',
              totalBayar: showDetail.total,
              metodeBayar: showDetail.metode_pembayaran,
              items: detailItems.map(it => ({
                namaObat: it.obat?.nama || 'Obat',
                jumlah: it.jumlah,
                hargaJual: it.harga,
                diskon: 0,
                subtotal: it.subtotal
              }))
            });
            setShowDetail(null);
          }}
          onRetur={() => { setShowRetur(showDetail); setShowDetail(null); }}
        />
      )}

      {/* Retur Modal */}
      {showRetur && (
        <ReturFormModal
          record={showRetur}
          onSave={processRetur}
          onClose={() => setShowRetur(null)}
        />
      )}

      {/* Print Modal */}
      {showPrint && (
        <PrintPreviewModal record={showPrint} onClose={() => setShowPrint(null)} />
      )}
    </div>
  );
}

/* ─── MODAL TRANSACTION FORM ───────────────────────────────────────────── */
function TransactionFormModal({
  drugs, onSave, onClose
}: {
  drugs: ApiObat[];
  onSave: (payload: any) => void;
  onClose: () => void;
}) {
  const [jenis, setJenis] = useState<'resep' | 'otc'>('resep');
  const [namaPasien, setNamaPasien] = useState('');
  const [noRekamMedis, setNoRekamMedis] = useState('');
  const [dokter, setDokter] = useState('');
  const [items, setItems] = useState<SaleItem[]>([emptySaleItem()]);
  const [metodeBayar, setMetodeBayar] = useState<'tunai' | 'debit' | 'qris' | 'bpjs'>('tunai');
  const [jumlahDibayar, setJumlahDibayar] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = useMemo(() => items.reduce((s, i) => s + calcSubtotal(i), 0), [items]);
  const totalBayar = metodeBayar === 'bpjs' ? 0 : subtotal;
  const kembalian = metodeBayar === 'tunai' ? Math.max(0, jumlahDibayar - totalBayar) : 0;
  const kurang = metodeBayar === 'tunai' && jumlahDibayar > 0 && jumlahDibayar < totalBayar;

  function updateItem(id: string, patch: Partial<SaleItem>) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  }

  function selectDrug(itemId: string, drugId: string) {
    const d = drugs.find(x => x.id === parseInt(drugId));
    if (!d) return;
    updateItem(itemId, {
      obat_id: drugId,
      nama: d.nama,
      satuan: d.satuan,
      stokTersedia: d.stok,
      harga: d.harga_jual,
      jumlah: 1
    });
  }

  function handleSave() {
    if (jenis === 'resep' && !namaPasien.trim()) { toast.error('Nama pasien wajib diisi untuk transaksi resep.'); return; }
    if (items.some(i => !i.obat_id)) { toast.error('Lengkapi semua item obat terlebih dahulu.'); return; }
    if (items.some(i => i.jumlah > i.stokTersedia)) { toast.error('Stok tidak mencukupi untuk satu atau lebih item.'); return; }
    if (metodeBayar === 'tunai' && jumlahDibayar < totalBayar) { toast.error('Jumlah uang yang dibayarkan kurang.'); return; }

    setSubmitting(true);
    const payload = {
      tanggal: new Date().toISOString(),
      pasien: namaPasien.trim() || 'Pasien Umum',
      dokter: jenis === 'resep' ? dokter.trim() || 'Dokter Jaga' : null,
      metode_bayar: metodeBayar,
      status: 'selesai',
      items: items.map(it => ({
        obat_id: parseInt(it.obat_id),
        jumlah: it.jumlah,
        harga: it.harga
      }))
    };

    onSave(payload);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0" style={{ background: `linear-gradient(135deg, ${PRIMARY}10, white)` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: PRIMARY }}>
              <ShoppingCart size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Transaksi Obat Keluar Baru</h2>
              <span className="text-xs text-slate-400">Kasir Pintar</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 border-r border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Jenis Transaksi *</label>
                <select
                  value={jenis} onChange={e => setJenis(e.target.value as any)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white"
                >
                  <option value="resep">Resep Dokter</option>
                  <option value="otc">Obat Bebas (OTC)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nama Pasien {jenis === 'resep' ? '*' : '(opsional)'}
                </label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={namaPasien} onChange={e => setNamaPasien(e.target.value)}
                    placeholder={jenis === 'otc' ? 'Pasien Umum' : 'Nama lengkap…'}
                    className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">No. Rekam Medis</label>
                <input
                  value={noRekamMedis} onChange={e => setNoRekamMedis(e.target.value)}
                  placeholder="RM-…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 font-mono"
                />
              </div>
              {jenis === 'resep' && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama Dokter Peresep</label>
                  <input
                    type="text"
                    value={dokter}
                    onChange={e => setDokter(e.target.value)}
                    placeholder="Contoh: dr. Andi Wijaya"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
              )}
            </div>

            {/* Items */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-gray-100 bg-white">
                      {['Nama Obat *', 'Stok Tersedia', 'Qty *', 'Harga Satuan (Rp)', 'Subtotal', 'Aksi'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map(item => {
                      const overStock = item.stokTersedia > 0 && item.jumlah > item.stokTersedia;
                      return (
                        <tr key={item.id} className={overStock ? 'bg-red-50' : ''}>
                          <td className="px-3 py-2 min-w-44">
                            <select
                              value={item.obat_id}
                              onChange={e => selectDrug(item.id, e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 bg-white"
                            >
                              <option value="">Pilih obat…</option>
                              {drugs.map(d => (
                                <option key={d.id} value={d.id} disabled={d.stok <= 0}>{d.nama} ({d.kode}) - Stok: {d.stok}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            {item.obat_id ? (
                              <span className={`px-1.5 py-0.5 rounded font-mono font-medium ${item.stokTersedia <= 5 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {item.stokTersedia} {item.satuan}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-3 py-2 min-w-16">
                            <input
                              type="number" min={1}
                              value={item.jumlah}
                              onChange={e => updateItem(item.id, { jumlah: Math.max(1, parseInt(e.target.value) || 0) })}
                              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none text-center font-mono"
                            />
                          </td>
                          <td className="px-3 py-2 font-mono">
                            {formatRupiah(item.harga)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-800 font-mono whitespace-nowrap">
                            {formatRupiah(calcSubtotal(item))}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => items.length > 1 && setItems(prev => prev.filter(i => i.id !== item.id))}
                              disabled={items.length === 1}
                              className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-gray-50">
                <button
                  onClick={() => setItems(prev => [...prev, emptySaleItem()])}
                  className="flex items-center gap-1.5 text-xs font-medium hover:opacity-85 text-emerald-600"
                >
                  <Plus size={13} /> Tambah Item
                </button>
              </div>
            </div>
          </div>

          {/* Right panel (Payment) */}
          <div className="w-72 flex-shrink-0 p-5 flex flex-col gap-4 bg-gray-50/60 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-3">Ringkasan Pembayaran</p>
              <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-500 font-mono">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 border-t border-gray-100 font-mono">
                  <span>Total Bayar</span>
                  <span style={{ color: PRIMARY }}>{formatRupiah(totalBayar)}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Metode Pembayaran</p>
              <div className="grid grid-cols-2 gap-2">
                {(['tunai', 'debit', 'qris', 'bpjs'] as const).map(m => {
                  const Icon = METODE_ICON[m];
                  return (
                    <button
                      key={m}
                      onClick={() => setMetodeBayar(m)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                        metodeBayar === m ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      {METODE_LABEL[m]}
                    </button>
                  );
                })}
              </div>
            </div>

            {metodeBayar === 'tunai' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Uang Diterima</label>
                  <input
                    type="number" min={0}
                    value={jumlahDibayar || ''}
                    onChange={e => setJumlahDibayar(parseFloat(e.target.value) || 0)}
                    placeholder="Masukkan jumlah nominal"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
                {jumlahDibayar > 0 && (
                  <div className={`rounded-xl p-3 border ${kurang ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    {kurang ? (
                      <p className="text-xs font-medium text-red-700 font-mono">Kurang: {formatRupiah(totalBayar - jumlahDibayar)}</p>
                    ) : (
                      <p className="text-xs font-medium text-emerald-700 font-mono">Kembalian: {formatRupiah(kembalian)}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-auto space-y-2">
              <button
                onClick={handleSave}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: PRIMARY }}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Simpan &amp; Selesaikan Transaksi
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-xl text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL DETAIL TRANSACTION ─────────────────────────────────────────── */
interface DetailModalProps {
  record: ApiObatKeluar;
  items: any[];
  loading: boolean;
  onClose: () => void;
  onPrint: () => void;
  onRetur: () => void;
}
function DetailModal({ record, items, loading, onClose, onPrint, onRetur }: DetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Detail Transaksi Obat Keluar</h2>
            <code className="text-xs text-gray-500 font-mono">{record.no_transaksi}</code>
          </div>
          <div className="flex items-center gap-2">
            <Badge text={JENIS_LABEL[record.jenis] || record.jenis} color={JENIS_COLOR[record.jenis] || 'bg-gray-100'} />
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {[
              ['Tanggal & Waktu', record.tanggal ? new Date(record.tanggal).toLocaleString('id-ID') : '-'],
              ['Pasien', record.nama_pasien],
              ...(record.no_rekam_medis ? [['No. RM', record.no_rekam_medis]] : []),
              ...(record.dokter ? [['Dokter Peresep', record.dokter]] : []),
              ['Petugas Kasir', record.petugas?.nama || 'Apoteker'],
              ['Metode Pembayaran', METODE_LABEL[record.metode_pembayaran] || record.metode_pembayaran],
            ].map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                <p className="text-gray-400 mb-0.5">{k}</p>
                <p className="font-medium text-gray-800">{v}</p>
              </div>
            ))}
          </div>

          {record.status === 'retur' && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs">
              <p className="font-medium text-orange-700">STATUS TRANSAKSI: DI-RETUR</p>
              {(record as any).alasan_retur_void && <p className="text-orange-600 mt-0.5">Alasan: {(record as any).alasan_retur_void}</p>}
            </div>
          )}

          {record.status === 'void' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs">
              <p className="font-medium text-red-700">STATUS TRANSAKSI: DI-VOID</p>
              {(record as any).alasan_retur_void && <p className="text-red-600 mt-0.5">Alasan: {(record as any).alasan_retur_void}</p>}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Detail Item Obat</p>
            {loading ? (
              <div className="flex justify-center items-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                <span className="ml-2 text-xs text-slate-500">Memuat detail...</span>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-3 py-2 text-gray-500">Nama Obat</th>
                      <th className="text-center px-3 py-2 text-gray-500">Qty</th>
                      <th className="text-right px-3 py-2 text-gray-500">Harga Satuan</th>
                      <th className="text-right px-3 py-2 text-gray-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((it, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-medium text-gray-800">{it.obat?.nama || 'Obat terhapus'}</td>
                        <td className="px-3 py-2 text-center text-gray-700 font-mono">{it.jumlah} {it.obat?.satuan}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatRupiah(it.harga)}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-800 font-mono">{formatRupiah(it.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1 min-w-48">
              <div className="flex justify-between text-xs text-gray-500 font-mono">
                <span>Total Transaksi</span>
                <span className="font-bold text-gray-800 font-mono">{formatRupiah(record.total)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-2 flex-shrink-0 border-t border-gray-100 pt-4">
          {record.status === 'selesai' && (
            <button
              onClick={onRetur}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors font-semibold"
            >
              <RotateCcw size={13} /> Retur / Void
            </button>
          )}
          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Printer size={13} /> Cetak Nota
          </button>
          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 rounded-lg text-sm text-white hover:opacity-90 font-medium"
            style={{ backgroundColor: PRIMARY }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── MODAL FORM RETUR ─────────────────────────────────────────────────── */
function ReturFormModal({ record, onSave, onClose }: { record: ApiObatKeluar; onSave: (alasan: string, items: any[]) => void; onClose: () => void }) {
  const [alasan, setAlasan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = () => {
    if (!alasan.trim()) { toast.error('Alasan pembatalan/retur wajib diisi.'); return; }
    setSubmitting(true);
    onSave(alasan, []);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">Form Pembatalan / Retur Transaksi</h2>
            <p className="text-xs text-gray-500 font-mono">Ref: {record.no_transaksi} — {record.nama_pasien}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-700">
            Seluruh item obat dalam transaksi ini akan dikembalikan secara otomatis ke stok inventori setelah retur diproses.
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alasan Retur / Pembatalan *</label>
            <textarea
              value={alasan} onChange={e => setAlasan(e.target.value)}
              placeholder="Contoh: Salah resep, pasien membatalkan penebusan obat, dsb…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-400 resize-none h-24"
            />
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Batal</button>
          <button 
            onClick={handleConfirm} 
            disabled={submitting}
            className="flex-1 py-2 rounded-lg text-sm text-white bg-orange-500 hover:bg-orange-600 transition-colors font-semibold flex items-center justify-center gap-1.5"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            Konfirmasi Retur
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── PRINT PREVIEW NOTA ────────────────────────────────────────────────── */
function PrintPreviewModal({ record, onClose }: { record: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="font-semibold text-gray-800 text-sm">Preview Nota Pembayaran</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="p-5 font-mono text-xs space-y-1" id="nota-print">
          <div className="text-center mb-3">
            <p className="font-bold text-sm">KLINIK UTAMA CEMPAKA LIMA</p>
            <p className="text-gray-500">Jl. Cempaka Lima, Banda Aceh</p>
            <div className="border-t border-dashed border-gray-300 my-2" />
          </div>
          <div className="space-y-0.5 text-gray-700">
            <div className="flex justify-between"><span>No Nota</span><span className="font-bold">{record.noTransaksi}</span></div>
            <div className="flex justify-between"><span>Tanggal</span><span>{record.tanggal ? new Date(record.tanggal).toLocaleString('id-ID') : '-'}</span></div>
            <div className="flex justify-between"><span>Pasien</span><span>{record.namaPasien}</span></div>
            {record.dokter && <div className="flex justify-between"><span>Dokter</span><span>{record.dokter}</span></div>}
            <div className="flex justify-between"><span>Kasir</span><span>{record.petugas}</span></div>
          </div>
          <div className="border-t border-dashed border-gray-300 my-2" />
          <div className="space-y-1">
            {record.items?.map((it: any, i: number) => (
              <div key={i}>
                <p className="font-medium text-gray-800">{it.namaObat}</p>
                <div className="flex justify-between text-gray-600 pl-2">
                  <span>{it.jumlah} x {formatRupiah(it.hargaJual)}</span>
                  <span>{formatRupiah(it.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-dashed border-gray-300 my-2" />
          <div className="flex justify-between font-bold text-gray-800">
            <span>TOTAL</span><span>{formatRupiah(record.totalBayar)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Metode</span><span>{METODE_LABEL[record.metodeBayar] || record.metodeBayar}</span>
          </div>
          <div className="border-t border-dashed border-gray-300 my-2" />
          <p className="text-center text-gray-400">Terima kasih atas kunjungan Anda</p>
          <p className="text-center text-gray-400">Semoga lekas sembuh</p>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Tutup</button>
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-white hover:opacity-90 font-semibold"
            style={{ backgroundColor: PRIMARY }}
          >
            <Printer size={14} /> Cetak
          </button>
        </div>
      </div>
    </div>
  );
}
