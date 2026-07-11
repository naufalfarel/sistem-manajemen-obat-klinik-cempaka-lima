import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Edit2, Loader2, RefreshCw, ChevronLeft, ChevronRight, 
  History, AlertCircle, Check, X, TrendingUp, HelpCircle, FileText 
} from 'lucide-react';
import { 
  kategoriApi, 
  hargaBarangApi, 
  type KategoriObat as ApiKategori, 
  type HargaBarangItem, 
  type HargaProposal, 
  type HargaLog 
} from '../services/api';
import { toast } from 'sonner';

const PRIMARY = '#0F9D74';

function formatRupiah(num: number): string {
  return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

export function HargaBarang() {
  const [activeTab, setActiveTab] = useState<'daftar' | 'usulan'>('daftar');
  
  // Tab 1: Daftar Harga States
  const [search, setSearch] = useState('');
  const [filterKategoriId, setFilterKategoriId] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [barangList, setBarangList] = useState<HargaBarangItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab 2: Usulan Perubahan States
  const [proposals, setProposals] = useState<HargaProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);

  // Categories
  const [categories, setCategories] = useState<ApiKategori[]>([]);

  // Manual Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetBarang, setTargetBarang] = useState<HargaBarangItem | null>(null);
  const [hargaBeli, setHargaBeli] = useState('');
  const [hargaJual, setHargaJual] = useState('');
  const [saving, setSaving] = useState(false);

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<HargaBarangItem | null>(null);
  const [historyLogs, setHistoryLogs] = useState<HargaLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchFilters = async () => {
    try {
      const res = await kategoriApi.list();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrices = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await hargaBarangApi.list({
        page,
        per_page: 10,
        search: search.trim() || undefined,
        kategori_id: filterKategoriId ? parseInt(filterKategoriId) : undefined,
      });
      setBarangList(res.data);
      setLastPage(res.meta.last_page);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat daftar harga barang');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProposals = async (isSilent = false) => {
    if (!isSilent) setLoadingProposals(true);
    try {
      const res = await hargaBarangApi.listProposals();
      setProposals(res.data);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat daftar usulan harga');
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    fetchFilters();
    // Cek jika ada search dari MasterBarang
    const passedFilter = localStorage.getItem('harga_barang_filter_search');
    if (passedFilter) {
      setSearch(passedFilter);
      localStorage.removeItem('harga_barang_filter_search');
      
      const fetchWithSearch = async () => {
        setLoading(true);
        try {
          const res = await hargaBarangApi.list({
            page: 1,
            per_page: 10,
            search: passedFilter,
          });
          setBarangList(res.data);
          setLastPage(res.meta.last_page);
          setTotalCount(res.meta.total);
        } catch (err: any) {
          toast.error(err?.message || 'Gagal memuat daftar harga barang');
        } finally {
          setLoading(false);
        }
      };
      fetchWithSearch();
    }
  }, []);

  useEffect(() => {
    const passedFilter = localStorage.getItem('harga_barang_filter_search');
    if (!passedFilter) {
      fetchPrices();
    }
  }, [page, filterKategoriId]);

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPrices();
  };

  const openEditPrice = (b: HargaBarangItem) => {
    setTargetBarang(b);
    setHargaBeli(String(Math.round(b.harga_beli)));
    setHargaJual(String(Math.round(b.harga_jual)));
    setShowEditModal(true);
  };

  const handleSavePrice = async () => {
    if (!targetBarang) return;
    const beli = parseFloat(hargaBeli);
    const jual = parseFloat(hargaJual);

    if (isNaN(beli) || beli < 0 || isNaN(jual) || jual < 0) {
      toast.error('Nilai harga tidak valid.');
      return;
    }

    setSaving(true);
    try {
      await hargaBarangApi.update(targetBarang.id, {
        harga_beli: beli,
        harga_jual: jual
      });
      toast.success('Harga barang berhasil diperbarui secara manual.');
      setShowEditModal(false);
      fetchPrices(true);
      fetchProposals(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memperbarui harga barang');
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (b: HargaBarangItem) => {
    setHistoryTarget(b);
    setLoadingHistory(true);
    setShowHistoryModal(true);
    try {
      const res = await hargaBarangApi.getHistory(b.id);
      setHistoryLogs(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat riwayat harga barang');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleConfirmProposal = async (id: number) => {
    if (!confirm('Apakah Anda yakin menyetujui perubahan harga beli barang ini dari faktur?')) {
      return;
    }
    try {
      await hargaBarangApi.confirmProposal(id);
      toast.success('Usulan perubahan harga berhasil disetujui.');
      fetchProposals(true);
      fetchPrices(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyetujui usulan');
    }
  };

  const handleRejectProposal = async (id: number) => {
    if (!confirm('Apakah Anda yakin menolak usulan perubahan harga beli ini?')) {
      return;
    }
    try {
      await hargaBarangApi.rejectProposal(id);
      toast.success('Usulan perubahan harga berhasil ditolak.');
      fetchProposals(true);
      fetchPrices(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menolak usulan');
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-900">Modul Manajemen Harga & Tarif</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau riwayat harga beli/jual secara transparan, setujui penyesuaian harga faktur, dan pertahankan margin laba ideal.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('daftar')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all px-1 ${
            activeTab === 'daftar' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Daftar Harga Barang
        </button>
        <button
          onClick={() => setActiveTab('usulan')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all px-1 flex items-center gap-1.5 ${
            activeTab === 'usulan' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Usulan Perubahan Harga
          {proposals.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              {proposals.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'daftar' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-48">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  type="text"
                  placeholder="Cari barang…"
                  className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
                />
              </div>
              <select
                value={filterKategoriId}
                onChange={e => { setFilterKategoriId(e.target.value); setPage(1); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 bg-white"
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
              </select>

              <div className="flex gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => fetchPrices(true)}
                  className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                  disabled={refreshing}
                >
                  <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                </button>
              </div>
            </form>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="ml-2 text-slate-600 font-medium">Memuat data harga...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Kode</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Nama Barang</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Kategori</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Satuan</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Harga Beli Terakhir</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Harga Jual / Tarif</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Margin Keuntungan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Terakhir Diubah</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {barangList.map(b => {
                      return (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{b.kode}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{b.nama}</span>
                              {b.has_proposal && (
                                <span className="bg-orange-100 text-orange-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full" title="Ada usulan perubahan harga dari faktur">
                                  Usulan
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{b.kategori?.nama || '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{b.satuan}</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-600">{formatRupiah(b.harga_beli)}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-gray-800">{formatRupiah(b.harga_jual)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.margin_persen >= 30 ? 'bg-emerald-50 text-emerald-700' : 'bg-yellow-50 text-yellow-700'}`}>
                              +{b.margin_persen}% ({formatRupiah(b.margin)})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {new Date(b.tanggal_diubah).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditPrice(b)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-600 border border-emerald-200 rounded-md hover:bg-emerald-50 transition-colors"
                                title="Ubah Harga"
                              >
                                <Edit2 size={11} />
                                Ubah
                              </button>
                              <button
                                onClick={() => openHistory(b)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                                title="Log Perubahan"
                              >
                                <History size={11} />
                                Log
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {barangList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                          Tidak ada data harga barang ditemukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Halaman {page} dari {lastPage} ({totalCount} barang)
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
        </div>
      )}

      {activeTab === 'usulan' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-xs text-amber-900">Mengapa ada usulan perubahan harga?</h4>
              <p className="text-[11px] mt-0.5 leading-relaxed">
                Ketika faktur baru dicatat di menu <strong>Stock Barang</strong> dengan harga beli yang berbeda dari harga berjalan di sistem, harga beli induk tidak akan diubah langsung. Sistem melahirkannya sebagai usulan perubahan terlebih dahulu agar tidak mengacaukan margin keuntungan sebelum ditinjau secara manual oleh Admin/Apoteker.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">Menunggu Peninjauan Usulan Perubahan Harga</h3>
              <button
                onClick={() => fetchProposals()}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emerald-600 transition-colors"
              >
                <RefreshCw size={12} className={loadingProposals ? 'animate-spin' : ''} /> Segarkan
              </button>
            </div>

            {loadingProposals ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="ml-2 text-slate-600 font-medium">Memuat daftar usulan...</span>
              </div>
            ) : proposals.length === 0 ? (
              <div className="px-5 py-12 text-center text-gray-400 text-xs">
                <TrendingUp size={28} className="mx-auto mb-2 text-gray-200" />
                Semua harga berjalan sinkron dengan faktur. Tidak ada usulan perubahan baru.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {proposals.map(p => {
                  const selisih = p.harga_beli_baru - p.harga_beli_lama;
                  const selisihPersen = p.harga_beli_lama > 0 ? (selisih / p.harga_beli_lama) * 100 : 0;
                  const currentJual = p.obat?.harga_jual_sekarang || 0;
                  const newMargin = currentJual - p.harga_beli_baru;
                  const newMarginPersen = p.harga_beli_baru > 0 ? (newMargin / p.harga_beli_baru) * 100 : 0;

                  return (
                    <div key={p.id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className="space-y-1 flex-1 min-w-64">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-sm">{p.obat?.nama}</span>
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.obat?.kode}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <FileText size={12} />
                          <span>Diusulkan dari Faktur: <strong className="font-semibold text-slate-700">{p.no_transaksi}</strong></span>
                          <span>•</span>
                          <span>{new Date(p.tanggal_diusulkan).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        
                        {/* Comparison box */}
                        <div className="grid grid-cols-3 gap-3 mt-3 max-w-lg bg-gray-50 border rounded-xl p-3 text-[11px]">
                          <div>
                            <span className="text-gray-400 block font-medium">Harga Beli Lama</span>
                            <span className="font-semibold text-gray-600 font-mono mt-0.5 block">{formatRupiah(p.harga_beli_lama)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-medium">Harga Beli Baru (Faktur)</span>
                            <span className="font-bold text-slate-900 font-mono mt-0.5 block flex items-center gap-1">
                              {formatRupiah(p.harga_beli_baru)}
                              <span className={`text-[9px] font-bold ${selisih > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {selisih > 0 ? '+' : ''}{selisihPersen.toFixed(0)}%
                              </span>
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block font-medium">Margin Baru (Estimasi)</span>
                            <span className={`font-semibold font-mono mt-0.5 block ${newMarginPersen < 20 ? 'text-yellow-600' : 'text-emerald-700'}`}>
                              +{newMarginPersen.toFixed(0)}% ({formatRupiah(newMargin)})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleConfirmProposal(p.id)}
                          className="flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                        >
                          <Check size={14} /> Setujui Perubahan
                        </button>
                        <button
                          onClick={() => handleRejectProposal(p.id)}
                          className="flex items-center gap-1 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <X size={14} /> Abaikan / Tolak
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Edit Modal */}
      {showEditModal && targetBarang && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Update Harga: {targetBarang.nama}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Harga Beli Baru (Rp)</label>
                <input
                  type="number"
                  value={hargaBeli}
                  onChange={e => setHargaBeli(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  placeholder="Contoh: 15000"
                />
                <p className="text-[10px] text-gray-400 mt-1">Ganti harga beli dasar/induk untuk kalkulasi keuntungan.</p>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Harga Jual / Tarif Klinik (Rp)</label>
                <input
                  type="number"
                  value={hargaJual}
                  onChange={e => setHargaJual(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  placeholder="Contoh: 20000"
                />
                <p className="text-[10px] text-gray-400 mt-1">Batas tarif akhir yang ditagihkan pada pasien/pelanggan.</p>
              </div>

              {/* Dynamic Margin Preview */}
              {parseFloat(hargaBeli) > 0 && parseFloat(hargaJual) > 0 && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-[11px] text-emerald-800">
                  <div className="flex justify-between">
                    <span>Proyeksi Laba Bersih:</span>
                    <span className="font-bold font-mono">
                      {formatRupiah(parseFloat(hargaJual) - parseFloat(hargaBeli))}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1 pt-1 border-t border-emerald-200/50">
                    <span>Margin Persentase:</span>
                    <span className="font-bold">
                      +{Math.round(((parseFloat(hargaJual) - parseFloat(hargaBeli)) / parseFloat(hargaBeli)) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 text-xs font-semibold pt-3 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSavePrice}
                disabled={saving}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                Simpan Harga Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Log Modal */}
      {showHistoryModal && historyTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Histori Perubahan Harga</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Log lengkap tren kenaikan/penurunan harga untuk "{historyTarget.nama}"</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                  <span className="text-xs">Memuat histori log...</span>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  <HelpCircle size={32} className="mx-auto mb-2 text-gray-200" />
                  Belum ada log perubahan harga tercatat untuk barang ini.
                </div>
              ) : (
                <div className="relative border-l-2 border-slate-100 pl-4 space-y-6 ml-2 text-xs">
                  {historyLogs.map(log => {
                    const selisihBeli = log.harga_beli_baru - log.harga_beli_lama;
                    const selisihJual = log.harga_jual_baru - log.harga_jual_lama;

                    return (
                      <div key={log.id} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border bg-white" style={{ borderColor: PRIMARY }} />
                        
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="font-semibold text-slate-700">
                              Diubah oleh: {log.user?.nama || 'Sistem (Transaksi)'}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              Sumber: <span className="capitalize font-semibold text-gray-600">{log.sumber}</span>
                              {log.no_transaksi && ` (No. Faktur: ${log.no_transaksi})`}
                            </span>

                            {/* Diffs */}
                            <div className="grid grid-cols-2 gap-4 mt-2 max-w-sm text-[11px] bg-slate-50 border rounded-lg p-2.5">
                              <div>
                                <span className="text-gray-400 block font-medium">Harga Beli</span>
                                <span className="font-mono text-gray-700 block mt-0.5">
                                  {formatRupiah(log.harga_beli_lama)} → {formatRupiah(log.harga_beli_baru)}
                                </span>
                                {selisihBeli !== 0 && (
                                  <span className={`text-[10px] font-bold ${selisihBeli > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                    ({selisihBeli > 0 ? '▲' : '▼'} {formatRupiah(Math.abs(selisihBeli))})
                                  </span>
                                )}
                              </div>
                              <div>
                                <span className="text-gray-400 block font-medium">Harga Jual / Tarif</span>
                                <span className="font-mono text-gray-700 block mt-0.5">
                                  {formatRupiah(log.harga_jual_lama)} → {formatRupiah(log.harga_jual_baru)}
                                </span>
                                {selisihJual !== 0 && (
                                  <span className={`text-[10px] font-bold ${selisihJual > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    ({selisihJual > 0 ? '▲' : '▼'} {formatRupiah(Math.abs(selisihJual))})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(log.tanggal).toLocaleDateString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t bg-gray-50 flex justify-end flex-shrink-0">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 border bg-white rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
