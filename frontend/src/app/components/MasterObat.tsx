import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Download, Plus, Eye, Edit2, Trash2,
  X, ChevronLeft, ChevronRight, Package, QrCode, MapPin, Barcode,
  AlertTriangle, RefreshCw, Loader2
} from 'lucide-react';
import { 
  obatApi, 
  kategoriApi, 
  supplierApi, 
  type Obat as ApiObat, 
  type KategoriObat as ApiKategori, 
  type Supplier as ApiSupplier 
} from '../services/api';
import { toast } from 'sonner';

const PRIMARY = '#0F9D74';

function StatusBadge({ status }: { status: 'aktif' | 'nonaktif' }) {
  const badgeClass = status === 'aktif' 
    ? 'bg-emerald-100 text-emerald-700' 
    : 'bg-red-100 text-red-700';
  
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
      {status === 'aktif' ? 'Aktif' : 'Nonaktif'}
    </span>
  );
}

function StockStatusBadge({ status }: { status: 'aman' | 'rendah' | 'kritis' | 'habis' }) {
  const map: Record<string, string> = {
    aman: 'bg-emerald-100 text-emerald-700',
    rendah: 'bg-yellow-100 text-yellow-700',
    kritis: 'bg-orange-100 text-orange-700',
    habis: 'bg-red-100 text-red-700',
  };
  const labelMap: Record<string, string> = {
    aman: 'Aman',
    rendah: 'Rendah',
    kritis: 'Kritis',
    habis: 'Habis',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100'}`}>
      {labelMap[status] || status}
    </span>
  );
}

function getDrugStockStatus(stok: number, minStok: number): 'aman' | 'rendah' | 'kritis' | 'habis' {
  if (stok <= 0) return 'habis';
  if (stok <= minStok) return 'kritis';
  if (stok <= minStok * 1.5) return 'rendah';
  return 'aman';
}

function formatRupiah(num: number): string {
  return 'Rp ' + num.toLocaleString('id-ID');
}

/* ── Drug avatar: colored initials ──────────────────── */
function DrugAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const colors = ['#0F9D74', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899', '#4F7A6B'];
  const color  = colors[name.charCodeAt(0) % colors.length];
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const radius = size >= 64 ? 12 : 8;

  return (
    <div
      style={{ 
        width: size, height: size, borderRadius: radius, backgroundColor: color, 
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', 
        color: '#fff', fontWeight: 700, fontSize: size >= 64 ? 22 : 12 
      }}
    >
      {initials}
    </div>
  );
}

interface FormState {
  kode: string;
  nama: string;
  nama_generik: string;
  kategori_id: string;
  supplier_id: string;
  satuan: string;
  stok: string;
  stok_minimum: string;
  harga_beli: string;
  harga_jual: string;
  golongan: 'bebas' | 'bebas-terbatas' | 'keras' | 'narkotika' | 'psikotropika';
  lokasi_rak: string;
  expired_date: string;
  status: 'aktif' | 'nonaktif';
}

const emptyForm: FormState = {
  kode: '', nama: '', nama_generik: '', kategori_id: '', supplier_id: '', satuan: '',
  stok: '', stok_minimum: '', harga_beli: '', harga_jual: '',
  golongan: 'bebas', lokasi_rak: '', expired_date: '', status: 'aktif'
};

export function MasterObat() {
  const [search, setSearch] = useState('');
  const [filterKategoriId, setFilterKategoriId] = useState('');
  const [filterGolongan, setFilterGolongan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStokKritis, setFilterStokKritis] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [categories, setCategories] = useState<ApiKategori[]>([]);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [drugList, setDrugList] = useState<ApiObat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [drawerDrug, setDrawerDrug] = useState<ApiObat | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingDrug, setEditingDrug] = useState<ApiObat | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>('');

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState<string>('');

  const [sortBy, setSortBy] = useState<'nama' | 'stok' | 'expired_date' | 'harga_jual'>('nama');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const fetchFiltersData = async () => {
    try {
      const catRes = await kategoriApi.list();
      setCategories(catRes.data);
      const supRes = await supplierApi.list({ per_page: 100 });
      setSuppliers(supRes.data);
    } catch (err) {
      console.error('Gagal memuat kategori & supplier filter', err);
    }
  };

  const fetchDrugs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await obatApi.list({
        page,
        per_page: 8,
        search: search.trim() || undefined,
        kategori_id: filterKategoriId ? parseInt(filterKategoriId) : undefined,
        golongan: (filterGolongan || undefined) as any,
        status: (filterStatus || undefined) as any,
        stok_kritis: filterStokKritis ? true : undefined,
        sort: sortBy,
        direction: sortDir
      });
      setDrugList(res.data);
      setLastPage(res.meta.last_page);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat daftar obat');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchDrugs();
  }, [page, filterKategoriId, filterGolongan, filterStatus, filterStokKritis, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDrugs();
  };

  function openAdd() {
    setEditingDrug(null);
    setFotoFile(null);
    setFotoPreview('');
    setForm({ 
      ...emptyForm, 
      kode: ''
    });
    setShowModal(true);
  }

  function openEdit(d: ApiObat) {
    setEditingDrug(d);
    setFotoFile(null);
    setFotoPreview(d.foto || '');
    setForm({
      kode: d.kode,
      nama: d.nama,
      nama_generik: d.nama_generik || '',
      kategori_id: String(d.kategori_id),
      supplier_id: d.supplier_id ? String(d.supplier_id) : '',
      satuan: d.satuan,
      stok: String(d.stok),
      stok_minimum: String(d.stok_minimum),
      harga_beli: String(d.harga_beli),
      harga_jual: String(d.harga_jual),
      golongan: d.golongan,
      lokasi_rak: d.lokasi_rak || '',
      expired_date: d.expired_date || '',
      status: d.status,
    });
    setShowModal(true);
    setDrawerDrug(null);
  }

  async function saveForm() {
    if (!form.nama.trim() || !form.kategori_id) {
      toast.error('Nama obat dan Kategori wajib diisi');
      return;
    }

    const formData = new FormData();
    formData.append('nama', form.nama);
    formData.append('nama_generik', form.nama_generik || '');
    formData.append('kategori_id', form.kategori_id);
    if (form.supplier_id) {
      formData.append('supplier_id', form.supplier_id);
    }
    formData.append('satuan', form.satuan);
    formData.append('stok', form.stok || '0');
    formData.append('stok_minimum', form.stok_minimum || '0');
    formData.append('harga_beli', form.harga_beli || '0');
    formData.append('harga_jual', form.harga_jual || '0');
    formData.append('golongan', form.golongan);
    formData.append('lokasi_rak', form.lokasi_rak || '');
    formData.append('expired_date', form.expired_date || '');
    formData.append('status', form.status);

    if (fotoFile) {
      formData.append('foto', fotoFile);
    }

    try {
      if (editingDrug) {
        formData.append('_method', 'PUT');
        await obatApi.update(editingDrug.id, formData);
        toast.success('Obat berhasil diperbarui');
      } else {
        await obatApi.create(formData);
        toast.success('Obat baru berhasil ditambahkan');
      }
      setShowModal(false);
      fetchDrugs(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan obat');
    }
  }

  const confirmDelete = (id: number, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
  };

  async function executeDelete() {
    if (!deleteTargetId) return;
    try {
      await obatApi.delete(deleteTargetId);
      toast.success('Obat berhasil dihapus');
      setDeleteTargetId(null);
      fetchDrugs(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus obat');
      setDeleteTargetId(null);
    }
  }

  const handleSort = (field: 'nama' | 'stok' | 'expired_date' | 'harga_jual') => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const exportUrl = (format: 'csv' | 'xlsx') => {
    const url = obatApi.export(format);
    window.open(url, '_blank');
  };

  return (
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
              placeholder="Cari nama, generik atau kode obat…"
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
          <select
            value={filterGolongan}
            onChange={e => { setFilterGolongan(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 bg-white"
          >
            <option value="">Semua Golongan</option>
            <option value="bebas">Bebas</option>
            <option value="bebas-terbatas">Bebas Terbatas</option>
            <option value="keras">Keras</option>
            <option value="narkotika">Narkotika</option>
            <option value="psikotropika">Psikotropika</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 bg-white"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border px-3 py-2 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={filterStokKritis}
              onChange={e => { setFilterStokKritis(e.target.checked); setPage(1); }}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            Stok Kritis
          </label>

          <div className="flex gap-2 ml-auto">
            <button
              type="button"
              onClick={() => fetchDrugs(true)}
              className="flex items-center gap-1 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={() => exportUrl('xlsx')}
              className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download size={14} /> Excel
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-1.5 text-sm text-white rounded-lg px-3 py-2 transition-colors hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
            >
              <Plus size={14} /> Tambah Obat
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-400 mt-3">{totalCount} obat ditemukan</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-slate-600 font-medium">Memuat data obat...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Foto</th>
                  <th 
                    onClick={() => handleSort('nama')}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      Nama Obat
                      {sortBy === 'nama' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Kategori</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Satuan</th>
                  <th 
                    onClick={() => handleSort('stok')}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      Stok
                      {sortBy === 'stok' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Min Stok</th>
                  <th 
                    onClick={() => handleSort('harga_jual')}
                    className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      Harga Jual
                      {sortBy === 'harga_jual' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                    </div>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Golongan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {drugList.map(d => {
                  const stockStatus = getDrugStockStatus(d.stok, d.stok_minimum);
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setDrawerDrug(d)}
                    >
                      <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(d)} title="Klik untuk ubah">
                          {d.foto ? (
                            <img src={d.foto} alt={d.nama} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 8 }} />
                          ) : (
                            <DrugAvatar name={d.nama} size={36} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-800 text-sm">{d.nama}</div>
                          <div className="text-xs text-gray-400 font-mono">{d.kode} {d.nama_generik && `• ${d.nama_generik}`}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{d.kategori?.nama || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{d.satuan}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${stockStatus === 'aman' ? 'text-gray-800' : stockStatus === 'rendah' ? 'text-yellow-600' : 'text-orange-600'}`}>
                          {d.stok.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{d.stok_minimum}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{formatRupiah(d.harga_beli)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs border px-2 py-0.5 rounded-md capitalize bg-slate-50">{d.golongan.replace('-', ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setDrawerDrug(d)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Detail">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Edit">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => confirmDelete(d.id, d.nama)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {drugList.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                      <Package size={32} className="mx-auto mb-2 text-gray-200" />
                      Tidak ada data obat ditemukan
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

      {/* ── Detail Drawer ──────────────────────────────────────────────────────── */}
      {drawerDrug && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setDrawerDrug(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-800">Detail Obat</h2>
              <button onClick={() => setDrawerDrug(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Header info */}
              <div className="flex items-center gap-4">
                {drawerDrug.foto ? (
                  <img src={drawerDrug.foto} alt={drawerDrug.nama} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 12 }} />
                ) : (
                  <DrugAvatar name={drawerDrug.nama} size={56} />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{drawerDrug.nama}</h3>
                  <p className="text-sm text-gray-500 font-mono">{drawerDrug.kode} {drawerDrug.nama_generik && `· ${drawerDrug.nama_generik}`}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <StatusBadge status={drawerDrug.status} />
                    <StockStatusBadge status={getDrugStockStatus(drawerDrug.stok, drawerDrug.stok_minimum)} />
                  </div>
                </div>
              </div>

              {/* Fake QR / Barcode */}
              <div className="flex gap-3">
                <div className="flex-1 border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2">
                  <QrCode size={40} className="text-gray-300" />
                  <span className="text-xs text-gray-400">QR Code</span>
                </div>
                <div className="flex-1 border border-gray-200 rounded-xl p-3 flex flex-col items-center gap-2">
                  <Barcode size={40} className="text-gray-300" />
                  <span className="text-xs text-gray-400">Barcode</span>
                </div>
              </div>

              {/* Detail rows */}
              {[
                { label: 'Kategori',      value: drawerDrug.kategori?.nama || '-' },
                { label: 'Supplier',      value: drawerDrug.supplier?.nama || '-' },
                { label: 'Satuan',         value: drawerDrug.satuan },
                { label: 'Stok Saat Ini',  value: `${drawerDrug.stok} ${drawerDrug.satuan}` },
                { label: 'Minimum Stok',   value: `${drawerDrug.stok_minimum} ${drawerDrug.satuan}` },
                { label: 'Harga Beli',     value: formatRupiah(drawerDrug.harga_beli) },
                { label: 'Harga Jual',     value: formatRupiah(drawerDrug.harga_jual) },
                { label: 'Golongan',       value: drawerDrug.golongan.replace('-', ' ') },
                { label: 'Expired Date',   value: drawerDrug.expired_date ? new Date(drawerDrug.expired_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs font-medium text-gray-800 capitalize">{value}</span>
                </div>
              ))}

              <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
                <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Lokasi Penyimpanan (Rak)</p>
                  <p className="text-xs text-gray-800 mt-0.5">{drawerDrug.lokasi_rak || '-'}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => openEdit(drawerDrug)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: PRIMARY }}
              >
                <Edit2 size={14} /> Edit Obat
              </button>
              <button
                onClick={() => { deleteDrug(drawerDrug.id); setDrawerDrug(null); }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Add/Edit Modal ──────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-800">{editingDrug ? 'Edit Obat' : 'Tambah Obat Baru'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Foto Upload & Preview */}
              <div className="flex items-center gap-4 border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <div className="relative w-16 h-16 rounded-xl border bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Package size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Foto Obat</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFotoFile(file);
                        setFotoPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="block w-full text-xs text-slate-500
                      file:mr-4 file:py-1.5 file:px-3
                      file:rounded-lg file:border-0
                      file:text-xs file:font-semibold
                      file:bg-emerald-50 file:text-emerald-700
                      hover:file:bg-emerald-100 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Maksimal file 2MB, format JPG, PNG, atau WEBP</p>
                </div>
                {fotoPreview && (
                  <button
                    type="button"
                    onClick={() => { setFotoFile(null); setFotoPreview(''); }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-md hover:bg-red-50"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {/* ── Text fields ─────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama Obat *</label>
                  <input
                    type="text"
                    value={form.nama}
                    onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                    placeholder="Contoh: Paracetamol 500mg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama Generik</label>
                  <input
                    type="text"
                    value={form.nama_generik}
                    onChange={e => setForm(f => ({ ...f, nama_generik: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                    placeholder="Contoh: Paracetamol"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kategori *</label>
                  <select
                    value={form.kategori_id}
                    onChange={e => setForm(f => ({ ...f, kategori_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
                  <select
                    value={form.supplier_id}
                    onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white"
                  >
                    <option value="">Pilih Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Satuan *</label>
                  <input
                    type="text"
                    value={form.satuan}
                    onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                    placeholder="Contoh: Tablet, Botol, Pcs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Stok Awal *</label>
                  <input
                    type="number"
                    value={form.stok}
                    onChange={e => setForm(f => ({ ...f, stok: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Minimum Stok *</label>
                  <input
                    type="number"
                    value={form.stok_minimum}
                    onChange={e => setForm(f => ({ ...f, stok_minimum: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Harga Beli * (Rp)</label>
                  <input
                    type="number"
                    value={form.harga_beli}
                    onChange={e => setForm(f => ({ ...f, harga_beli: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Harga Jual * (Rp)</label>
                  <input
                    type="number"
                    value={form.harga_jual}
                    onChange={e => setForm(f => ({ ...f, harga_jual: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Golongan Obat *</label>
                  <select
                    value={form.golongan}
                    onChange={e => setForm(f => ({ ...f, golongan: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white"
                  >
                    <option value="bebas">Bebas</option>
                    <option value="bebas-terbatas">Bebas Terbatas</option>
                    <option value="keras">Keras</option>
                    <option value="narkotika">Narkotika</option>
                    <option value="psikotropika">Psikotropika</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lokasi Simpan (Rak)</label>
                  <input
                    type="text"
                    value={form.lokasi_rak}
                    onChange={e => setForm(f => ({ ...f, lokasi_rak: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                    placeholder="Contoh: Rak A-01"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Kedaluwarsa</label>
                  <input
                    type="date"
                    value={form.expired_date}
                    onChange={e => setForm(f => ({ ...f, expired_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status Keaktifan</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Batal
              </button>
              <button
                onClick={saveForm}
                className="flex-1 py-2.5 rounded-lg text-sm text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: PRIMARY }}
              >
                {editingDrug ? 'Simpan Perubahan' : 'Tambah Obat'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle size={24} />
              <h3 className="font-semibold text-slate-800 text-sm">Hapus Obat</h3>
            </div>
            <p className="text-xs text-slate-500">Apakah Anda yakin ingin menghapus obat "{deleteTargetName}"? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end gap-2 text-xs font-semibold">
              <button onClick={() => setDeleteTargetId(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
              <button onClick={executeDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
