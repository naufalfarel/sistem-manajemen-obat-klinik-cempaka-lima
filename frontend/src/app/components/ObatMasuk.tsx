import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Save, Search,
  ChevronLeft, ChevronRight, Eye, Calendar, X,
  RefreshCw, Loader2, CheckCircle2, ArrowRight
} from 'lucide-react';
import { 
  obatMasukApi, 
  obatApi, 
  supplierApi, 
  type ObatMasuk as ApiObatMasuk, 
  type Obat as ApiObat, 
  type Supplier as ApiSupplier 
} from '../services/api';
import { toast } from 'sonner';

const PRIMARY = '#0F9D74';

interface FormItem {
  id: string;
  obat_id: string;
  jumlah: number;
  harga_satuan: number;
  no_batch: string;
  expired_date: string;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    diterima: 'bg-emerald-100 text-emerald-700',
    sebagian: 'bg-blue-100 text-blue-700',
    dikembalikan: 'bg-red-100 text-red-700',
  };
  const labelMap: Record<string, string> = {
    draft: 'Draft',
    diterima: 'Diterima',
    sebagian: 'Sebagian',
    dikembalikan: 'Dikembalikan',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100'}`}>
      {labelMap[status] || status}
    </span>
  );
}

function formatRupiah(num: number): string {
  return 'Rp ' + num.toLocaleString('id-ID');
}

const emptyItem = (): FormItem => ({
  id: Math.random().toString(36).substr(2, 9),
  obat_id: '',
  jumlah: 1,
  harga_satuan: 0,
  no_batch: '',
  expired_date: '',
});

export function ObatMasuk() {
  const [activeTab, setActiveTab] = useState<'form' | 'riwayat'>('form');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [supplierId, setSupplierId] = useState('');
  const [catatan, setCatatan] = useState('');
  const [items, setItems] = useState<FormItem[]>([emptyItem()]);

  const [fotoNotaFile, setFotoNotaFile] = useState<File | null>(null);
  const [fotoNotaPreview, setFotoNotaPreview] = useState<string>('');
  
  // Data list
  const [historyList, setHistoryList] = useState<ApiObatMasuk[]>([]);
  const [drugs, setDrugs] = useState<ApiObat[]>([]);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  
  // Loading states
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [detailRecord, setDetailRecord] = useState<ApiObatMasuk | null>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch init data
  const fetchFormMetadata = async () => {
    try {
      const drugRes = await obatApi.list({ per_page: 200, status: 'aktif' });
      setDrugs(drugRes.data);

      const supRes = await supplierApi.list({ per_page: 100, status: 'aktif' });
      setSuppliers(supRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async (isSilent = false) => {
    if (!isSilent) setLoadingHistory(true);
    else setRefreshing(true);

    try {
      const res = await obatMasukApi.list({
        page,
        per_page: 8,
        search: search.trim() || undefined,
        supplier_id: filterSupplierId ? parseInt(filterSupplierId) : undefined,
        status: (filterStatus || undefined) as any
      });
      setHistoryList(res.data);
      setLastPage(res.meta.last_page);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat riwayat transaksi');
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFormMetadata();
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [page, filterSupplierId, filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const grandTotal = useMemo(() => {
    return items.reduce((s, it) => s + (it.jumlah * it.harga_satuan), 0);
  }, [items]);

  function updateItem(id: string, key: keyof FormItem, value: string | number) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [key]: value } : it));
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem()]);
  }

  function removeItem(id: string) {
    if (items.length === 1) return;
    setItems(prev => prev.filter(it => it.id !== id));
  }

  async function handleSave() {
    if (!supplierId || items.some(i => !i.obat_id || i.jumlah <= 0)) {
      toast.error('Lengkapi data supplier dan detail obat terlebih dahulu.');
      return;
    }

    // Validasi
    for (const it of items) {
      if (it.jumlah <= 0) {
        toast.error('Jumlah kuantitas obat harus lebih dari 0.');
        return;
      }
      if (it.expired_date && it.expired_date < tanggal) {
        toast.error('Tanggal expired obat tidak boleh sebelum tanggal penerimaan.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('tanggal', tanggal);
      formData.append('supplier_id', supplierId);
      formData.append('petugas_id', '1'); // Diisi default, di backend diganti user ter-autentikasi jika kosong
      if (catatan) formData.append('catatan', catatan.trim());
      formData.append('status', 'draft');

      const itemsPayload = items.map(it => ({
        obat_id: parseInt(it.obat_id),
        jumlah: it.jumlah,
        harga_satuan: it.harga_satuan,
        no_batch: it.no_batch.trim() || null,
        expired_date: it.expired_date || null
      }));
      formData.append('items', JSON.stringify(itemsPayload));

      if (fotoNotaFile) {
        formData.append('foto_nota', fotoNotaFile);
      }

      await obatMasukApi.create(formData);
      toast.success('Transaksi obat masuk berhasil disimpan sebagai Draft.');
      
      // Reset Form
      setItems([emptyItem()]);
      setSupplierId('');
      setCatatan('');
      setFotoNotaFile(null);
      setFotoNotaPreview('');
      setPage(1);
      setActiveTab('riwayat');
      fetchHistory(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan transaksi');
    } finally {
      setSubmitting(false);
    }
  }

  const handleOpenDetail = async (record: ApiObatMasuk) => {
    setDetailRecord(record);
    setLoadingDetail(true);
    try {
      const res = await obatMasukApi.get(record.id);
      setDetailItems((res as any).data.items || []);
    } catch (err: any) {
      toast.error('Gagal memuat rincian item obat masuk');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTerimaTransaksi = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin memproses transaksi ini dan menambahkan stok obat ke database? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    try {
      await obatMasukApi.terima(id);
      toast.success('Transaksi berhasil diterima dan stok obat telah diperbarui.');
      setDetailRecord(null);
      fetchHistory(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menerima transaksi');
    }
  };

  const handleDeleteDraft = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus draft transaksi ini?')) {
      return;
    }
    try {
      await obatMasukApi.delete(id);
      toast.success('Draft transaksi berhasil dihapus.');
      setDetailRecord(null);
      fetchHistory(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus draft');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-gray-100 shadow-sm p-1 w-fit">
        {[
          { key: 'form', label: 'Buat Transaksi Baru' },
          { key: 'riwayat', label: `Riwayat (${totalCount})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === key ? 'text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
            style={activeTab === key ? { backgroundColor: PRIMARY } : {}}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'form' && (
        <div className="space-y-4">
          {/* Header form */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-sm">Informasi Transaksi</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-lg font-mono font-medium">Draft Otomatis</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal *</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors bg-white text-gray-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white text-gray-800 font-semibold"
                >
                  <option value="">Pilih Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Nomor invoice atau pengiriman"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lampiran Foto Nota / Faktur</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFotoNotaFile(file);
                      setFotoNotaPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full text-xs text-slate-500
                    file:mr-2 file:py-1 file:px-2.5
                    file:rounded-md file:border-0
                    file:text-xs file:font-semibold
                    file:bg-emerald-50 file:text-emerald-700
                    hover:file:bg-emerald-100 cursor-pointer"
                />
                {fotoNotaPreview && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Berkas terpilih</p>
                )}
              </div>
            </div>
          </div>

          {/* Item rows */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Detail Item Obat</h3>
            </div>

            <div className="overflow-x-auto font-sans">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 min-w-44">Nama Obat *</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 min-w-28">No. Batch</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 min-w-32">Tanggal Expired</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 min-w-20">Kuantitas / Jumlah *</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 min-w-28">Harga Satuan (Rp) *</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 min-w-32">Subtotal</th>
                    <th className="px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <select
                          value={item.obat_id}
                          onChange={e => {
                            const d = drugs.find(dr => dr.id === parseInt(e.target.value));
                            updateItem(item.id, 'obat_id', e.target.value);
                            if (d) updateItem(item.id, 'harga_satuan', d.harga_beli);
                          }}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 bg-white"
                        >
                          <option value="">Pilih obat…</option>
                          {drugs.map(d => <option key={d.id} value={d.id}>{d.nama} ({d.kode}) - Stok: {d.stok}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.no_batch}
                          onChange={e => updateItem(item.id, 'no_batch', e.target.value)}
                          placeholder="BATCH-001"
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 transition-colors font-mono"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={item.expired_date}
                          onChange={e => updateItem(item.id, 'expired_date', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 transition-colors font-sans text-gray-700 font-medium"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={item.jumlah}
                          onChange={e => updateItem(item.id, 'jumlah', Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 transition-colors text-center font-mono"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={item.harga_satuan}
                          onChange={e => updateItem(item.id, 'harga_satuan', Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 transition-colors font-mono"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="text-xs font-semibold text-gray-800 whitespace-nowrap font-mono">
                          {formatRupiah(item.jumlah * item.harga_satuan)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add row + footer */}
            <div className="px-4 py-3 border-t border-gray-100">
              <button
                onClick={addItem}
                className="flex items-center gap-2 text-xs font-medium hover:opacity-90 transition-opacity text-emerald-600"
              >
                <Plus size={14} /> Tambah Baris
              </button>
            </div>

            {/* Grand total */}
            <div className="bg-gray-50 px-5 py-4 border-t border-gray-100">
              <div className="flex justify-end items-center gap-8">
                <div className="text-right space-y-1">
                  <div className="flex justify-between gap-8 text-xs text-gray-500">
                    <span>Jumlah jenis obat:</span>
                    <span className="font-medium text-gray-700">{items.length} jenis</span>
                  </div>
                  <div className="flex justify-between gap-8 pt-2 border-t border-gray-200">
                    <span className="text-sm font-semibold text-gray-800">Grand Total Nilai:</span>
                    <span className="text-sm font-bold font-mono" style={{ color: PRIMARY }}>{formatRupiah(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => { setItems([emptyItem()]); setSupplierId(''); setCatatan(''); }}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Bersihkan Form
            </button>
            <button
              onClick={handleSave}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: PRIMARY }}
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Simpan sebagai Draft
            </button>
          </div>
        </div>
      )}

      {activeTab === 'riwayat' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-48">
              <Search size={14} className="text-gray-400 flex-shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                type="text"
                placeholder="Cari nomor transaksi…"
                className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
              />
            </div>
            <select
              value={filterSupplierId}
              onChange={e => { setFilterSupplierId(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 bg-white"
            >
              <option value="">Semua Supplier</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="diterima">Diterima</option>
              <option value="sebagian">Sebagian</option>
              <option value="dikembalikan">Dikembalikan</option>
            </select>
            <button
              type="button"
              onClick={() => fetchHistory(true)}
              className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50"
              disabled={refreshing}
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
          </form>

          {loadingHistory ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-slate-600 font-medium">Memuat riwayat obat masuk...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['No. Transaksi', 'Tanggal', 'Supplier', 'Petugas', 'Jml. Jenis', 'Total Nilai', 'Status', 'Aksi'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historyList.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-gray-800 font-medium">{r.no_transaksi}</code>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {r.tanggal ? new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-700">{r.supplier?.nama || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{r.petugas?.nama || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{r.total_item} jenis</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 font-mono">{formatRupiah(r.nilai_total)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleOpenDetail(r)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {historyList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                        <CheckCircle2 size={32} className="mx-auto mb-2 text-gray-200" />
                        Tidak ada riwayat transaksi ditemukan
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
      )}

      {/* Detail Modal */}
      {detailRecord && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-800 text-sm">Detail Transaksi Obat Masuk</h2>
              <button onClick={() => { setDetailRecord(null); setDetailItems([]); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                {[
                  ['No. Transaksi', detailRecord.no_transaksi],
                  ['Tanggal', detailRecord.tanggal ? new Date(detailRecord.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'],
                  ['Supplier', detailRecord.supplier?.nama || '-'],
                  ['Petugas Penanggung Jawab', detailRecord.petugas?.nama || '-'],
                  ['Keterangan', detailRecord.catatan || '-'],
                  ['Total Nilai Transaksi', formatRupiah(detailRecord.nilai_total)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">{k}</span>
                    <span className="text-xs font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Status Transaksi</span>
                  <StatusBadge status={detailRecord.status} />
                </div>
              </div>

              {/* Rincian obat */}
              <div className="space-y-2 font-sans">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Item Obat</h4>
                
                {loadingDetail ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <span className="ml-2 text-xs text-slate-500">Memuat rincian...</span>
                  </div>
                ) : detailItems.length > 0 ? (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100/60">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500">Nama Obat</th>
                          <th className="text-left px-3 py-2 text-gray-500">No. Batch</th>
                          <th className="text-left px-3 py-2 text-gray-500">Expired Date</th>
                          <th className="text-center px-3 py-2 text-gray-500 w-20">Jumlah</th>
                          <th className="text-right px-3 py-2 text-gray-500">Harga Satuan</th>
                          <th className="text-right px-3 py-2 text-gray-500">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {detailItems.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 font-medium">{item.obat?.nama || 'Obat terhapus'}</td>
                            <td className="px-3 py-2 font-mono text-gray-600">{item.no_batch || '-'}</td>
                            <td className="px-3 py-2 text-gray-600">{item.expired_date ? new Date(item.expired_date).toLocaleDateString('id-ID') : '-'}</td>
                            <td className="px-3 py-2 text-center font-mono">{item.jumlah} {item.obat?.satuan}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatRupiah(item.harga_satuan)}</td>
                            <td className="px-3 py-2 text-right font-mono font-semibold">{formatRupiah(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Tidak ada rincian item untuk transaksi ini</p>
                )}
              </div>

              {/* Lampiran Foto Nota / Faktur */}
              {detailRecord.foto_nota && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lampiran Faktur / Nota Penerimaan</h4>
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center p-2 max-h-60">
                    <img
                      src={detailRecord.foto_nota}
                      alt="Foto Nota Penerimaan"
                      className="max-h-56 rounded-lg object-contain border shadow-sm"
                    />
                  </div>
                  <div className="text-right">
                    <a
                      href={detailRecord.foto_nota}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold underline"
                    >
                      Buka di Tab Baru
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
              {detailRecord.status === 'draft' && (
                <>
                  <button
                    onClick={() => handleDeleteDraft(detailRecord.id)}
                    className="px-4 py-2.5 rounded-lg text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors font-medium flex-1"
                  >
                    Hapus Draft
                  </button>
                  <button
                    onClick={() => handleTerimaTransaksi(detailRecord.id)}
                    className="px-4 py-2.5 rounded-lg text-sm text-white hover:opacity-90 transition-opacity font-semibold flex-1 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    Terima &amp; Update Stok <ArrowRight size={14} />
                  </button>
                </>
              )}
              {detailRecord.status !== 'draft' && (
                <button
                  onClick={() => { setDetailRecord(null); setDetailItems([]); }}
                  className="w-full py-2.5 rounded-lg text-sm text-gray-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
