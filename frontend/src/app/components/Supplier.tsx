import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Search, X, Eye, Pencil, Trash2, AlertTriangle,
  Package, Phone, Mail, MapPin, Ban, CheckCircle2,
  Building2, FileText, Download, RefreshCw, Loader2
} from 'lucide-react';
import { 
  supplierApi, 
  obatApi, 
  obatMasukApi, 
  type Supplier as ApiSupplier, 
  type Obat as ApiObat, 
  type ObatMasuk as ApiObatMasuk 
} from '../services/api';
import { toast } from 'sonner';

const PRIMARY = '#0F9D74';

function daysDiff(dateStr: string | null): number {
  if (!dateStr) return 999;
  return Math.floor((new Date(dateStr).getTime() - new Date().getTime()) / 86400000);
}

function pbfBadge(dateStr: string | null) {
  if (!dateStr) return { label: 'Tidak Ada', cls: 'bg-gray-100 text-gray-500', icon: false };
  const d = daysDiff(dateStr);
  if (d < 0)   return { label: 'Expired',    cls: 'bg-red-100 text-red-700',      icon: true };
  if (d <= 30) return { label: `${d}h lagi`, cls: 'bg-orange-100 text-orange-700', icon: true };
  if (d <= 90) return { label: `${d}h lagi`, cls: 'bg-yellow-100 text-yellow-700', icon: false };
  return { label: 'Valid', cls: 'bg-emerald-100 text-emerald-700', icon: false };
}

function formatRupiah(num: number): string {
  return 'Rp ' + num.toLocaleString('id-ID');
}

const TERMIN: Record<string, string> = { cash: 'Cash', tempo30: 'Net 30', tempo60: 'Net 60', tempo90: 'Net 90' };

const STATUS_CFG: Record<ApiSupplier['status'], { dot: string; text: string; label: string }> = {
  aktif:     { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Aktif' },
  nonaktif:  { dot: 'bg-gray-400',    text: 'text-gray-500',    label: 'Nonaktif' },
  blacklist: { dot: 'bg-red-500',     text: 'text-red-700',     label: 'Blacklist' },
};

function StatusBadge({ status }: { status: ApiSupplier['status'] }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.nonaktif;
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
    </span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-xs font-medium text-gray-800">{value}</p>
    </div>
  );
}

interface FormState {
  nama: string;
  alamat: string;
  kota: string;
  telepon: string;
  email: string;
  npwp: string;
  pic: string;
  no_izin_pbf: string;
  sertifikat_cdob: string;
  exp_izin_pbf: string;
  exp_cdob: string;
  termin_pembayaran: ApiSupplier['termin_pembayaran'];
  lead_time: string;
  status: ApiSupplier['status'];
  alasan_blacklist: string;
}

const emptyForm = (): FormState => ({
  nama: '', alamat: '', kota: '', telepon: '', email: '', npwp: '',
  pic: '', no_izin_pbf: '', sertifikat_cdob: '', exp_izin_pbf: '', exp_cdob: '',
  termin_pembayaran: 'cash', lead_time: '3', status: 'aktif', alasan_blacklist: ''
});

export function Supplier() {
  const [list, setList] = useState<ApiSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<'nama' | 'kode'>('nama');

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiSupplier | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>('');

  const [drawer, setDrawer] = useState<ApiSupplier | null>(null);
  const [suppliedDrugs, setSuppliedDrugs] = useState<ApiObat[]>([]);
  const [suppliedHistory, setSuppliedHistory] = useState<ApiObatMasuk[]>([]);
  const [loadingDrawerData, setLoadingDrawerData] = useState(false);

  const fetchSuppliers = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await supplierApi.list();
      setList(res.data);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat daftar supplier');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const filtered = useMemo(() => {
    let data = list;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(s =>
        s.nama.toLowerCase().includes(q) ||
        s.kode.toLowerCase().includes(q) ||
        (s.kota && s.kota.toLowerCase().includes(q))
      );
    }
    if (filterStatus) data = data.filter(s => s.status === filterStatus);
    if (sortBy === 'nama') data = [...data].sort((a, b) => a.nama.localeCompare(b.nama));
    if (sortBy === 'kode') data = [...data].sort((a, b) => a.kode.localeCompare(b.kode));
    return data;
  }, [list, search, filterStatus, sortBy]);

  const stats = useMemo(() => ({
    total: list.length,
    aktif: list.filter(s => s.status === 'aktif').length,
    inaktif: list.filter(s => s.status !== 'aktif').length,
  }), [list]);

  const handleOpenAdd = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setFotoFile(null);
    setFotoPreview('');
    setShowModal(true);
  };

  const handleOpenEdit = (s: ApiSupplier) => {
    setEditTarget(s);
    setForm({
      nama: s.nama,
      alamat: s.alamat || '',
      kota: s.kota || '',
      telepon: s.telepon,
      email: s.email || '',
      npwp: s.npwp || '',
      pic: s.pic || '',
      no_izin_pbf: s.no_izin_pbf || '',
      sertifikat_cdob: s.sertifikat_cdob || '',
      exp_izin_pbf: s.exp_izin_pbf || '',
      exp_cdob: s.exp_cdob || '',
      termin_pembayaran: s.termin_pembayaran,
      lead_time: String(s.lead_time),
      status: s.status,
      alasan_blacklist: s.alasan_blacklist || ''
    });
    setFotoFile(null);
    setFotoPreview(s.foto || '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama.trim() || !form.telepon.trim()) {
      toast.error('Nama supplier dan telepon wajib diisi.');
      return;
    }
    if (form.status === 'blacklist' && !form.alasan_blacklist.trim()) {
      toast.error('Alasan blacklist wajib diisi.');
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append('nama', form.nama);
    formDataPayload.append('telepon', form.telepon);
    formDataPayload.append('termin_pembayaran', form.termin_pembayaran);
    formDataPayload.append('lead_time', String(parseInt(form.lead_time) || 3));
    formDataPayload.append('status', form.status);

    if (form.alamat) formDataPayload.append('alamat', form.alamat);
    if (form.kota) formDataPayload.append('kota', form.kota);
    if (form.email) formDataPayload.append('email', form.email);
    if (form.npwp) formDataPayload.append('npwp', form.npwp);
    if (form.pic) formDataPayload.append('pic', form.pic);
    if (form.no_izin_pbf) formDataPayload.append('no_izin_pbf', form.no_izin_pbf);
    if (form.sertifikat_cdob) formDataPayload.append('sertifikat_cdob', form.sertifikat_cdob);
    if (form.exp_izin_pbf) formDataPayload.append('exp_izin_pbf', form.exp_izin_pbf);
    if (form.exp_cdob) formDataPayload.append('exp_cdob', form.exp_cdob);
    if (form.status === 'blacklist' && form.alasan_blacklist) {
      formDataPayload.append('alasan_blacklist', form.alasan_blacklist);
    }

    if (fotoFile) {
      formDataPayload.append('foto', fotoFile);
    }

    try {
      if (editTarget) {
        formDataPayload.append('_method', 'PUT');
        await supplierApi.update(editTarget.id, formDataPayload);
        toast.success('Supplier berhasil diperbarui.');
      } else {
        await supplierApi.create(formDataPayload);
        toast.success('Supplier baru berhasil ditambahkan.');
      }
      setShowModal(false);
      fetchSuppliers(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan supplier');
    }
  };

  const handleDelete = async (s: ApiSupplier) => {
    if (s.jumlah_obat_masuk && s.jumlah_obat_masuk > 0) {
      toast.error(`Supplier tidak dapat dihapus karena memiliki ${s.jumlah_obat_masuk} riwayat transaksi obat masuk.`);
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus supplier "${s.nama}"?`)) return;
    try {
      await supplierApi.delete(s.id);
      toast.success('Supplier berhasil dihapus.');
      fetchSuppliers(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus supplier');
    }
  };

  const handleOpenDrawer = async (s: ApiSupplier) => {
    setDrawer(s);
    setLoadingDrawerData(true);
    try {
      // Ambil daftar obat dari supplier ini
      const obatRes = await obatApi.list({ per_page: 100 });
      setSuppliedDrugs(obatRes.data.filter((d: any) => d.supplier?.id === s.id || d.supplier_id === s.id));

      // Ambil riwayat pembelian
      const masukRes = await obatMasukApi.list({ supplier_id: s.id, per_page: 50 });
      setSuppliedHistory(masukRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDrawerData(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Building2} label="Total Supplier" value={String(stats.total)} color="bg-emerald-500" />
        <StatCard icon={CheckCircle2} label="Supplier Aktif" value={String(stats.aktif)} color="bg-blue-500" />
        <StatCard icon={Ban} label="Nonaktif / Blacklist" value={String(stats.inaktif)} color="bg-orange-500" />
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-52">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, kode, kota…"
              className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
            />
          </div>

          <select
            value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white text-gray-600"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
            <option value="blacklist">Blacklist</option>
          </select>

          <select
            value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white text-gray-600"
          >
            <option value="nama">Urutkan: Nama</option>
            <option value="kode">Urutkan: Kode</option>
          </select>

          <button 
            onClick={() => fetchSuppliers(true)}
            className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 text-sm text-white rounded-lg px-4 py-2 hover:opacity-90 transition-opacity font-medium ml-auto"
            style={{ backgroundColor: PRIMARY }}
          >
            <Plus size={14} /> Tambah Supplier
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-slate-600 font-medium">Memuat data supplier...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Logo', 'Kode', 'Nama Supplier', 'Kota / Alamat', 'Telepon / Kontak', 'Pasokan', 'Termin', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleOpenDrawer(s)}>
                    <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
                      {s.foto ? (
                        <img src={s.foto} alt={s.nama} className="w-8 h-8 rounded-lg object-cover border border-gray-100 shadow-sm" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                          <Building2 size={14} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-800">{s.kode}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{s.nama}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-48">{s.kota ? `${s.kota} - ${s.alamat}` : (s.alamat || '-')}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{s.telepon} {s.email && `(${s.email})`}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{s.jumlah_obat_masuk ?? 0} Kali</td>
                    <td className="px-4 py-3 text-xs text-gray-600 capitalize">{TERMIN[s.termin_pembayaran] || s.termin_pembayaran}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenDrawer(s)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Detail">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleOpenEdit(s)} className="p-1.5 rounded-lg text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(s)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                      Tidak ada supplier ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <SupplierFormModal
          editTarget={editTarget}
          form={form}
          setForm={setForm}
          fotoFile={fotoFile}
          setFotoFile={setFotoFile}
          fotoPreview={fotoPreview}
          setFotoPreview={setFotoPreview}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Detail Drawer */}
      {drawer && (
        <SupplierDetailDrawer
          supplier={drawer}
          drugs={suppliedDrugs}
          history={suppliedHistory}
          loading={loadingDrawerData}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}

/* ─── MODAL ADD/EDIT SUPPLIER ─────────────────────────────────────────── */
interface FormModalProps {
  editTarget: ApiSupplier | null;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  fotoFile: File | null;
  setFotoFile: (file: File | null) => void;
  fotoPreview: string;
  setFotoPreview: (url: string) => void;
  onSave: () => void;
  onClose: () => void;
}
function SupplierFormModal({
  editTarget, form, setForm,
  fotoFile, setFotoFile, fotoPreview, setFotoPreview,
  onSave, onClose
}: FormModalProps) {
  const [tab, setTab] = useState<'umum' | 'legalitas' | 'kerjasama' | 'status'>('umum');

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors';

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800 text-sm">
              {editTarget ? 'Edit Supplier' : 'Tambah Supplier Baru'}
            </h2>
            {editTarget && <p className="text-xs text-gray-400 mt-0.5">{editTarget.nama}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        {/* tabs */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
          {[
            { key: 'umum', label: 'Data Umum' },
            { key: 'legalitas', label: 'Legalitas & Dokumen' },
            { key: 'kerjasama', label: 'Kemitraan' },
            { key: 'status', label: 'Keaktifan' }
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {tab === 'umum' && (
            <div className="space-y-4">
              {/* Logo / Foto Upload */}
              <div className="flex items-center gap-4 border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50/50">
                <div className="relative w-16 h-16 rounded-xl border bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 size={24} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Logo / Foto Supplier</label>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama Supplier *</label>
                  <input value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} className={inputClass} placeholder="PT Kimia Farma" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alamat Lengkap</label>
                  <input value={form.alamat} onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))} className={inputClass} placeholder="Jl. Veteran No. 9" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kota</label>
                  <input value={form.kota} onChange={e => setForm(p => ({ ...p, kota: e.target.value }))} className={inputClass} placeholder="Jakarta" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">NPWP</label>
                  <input value={form.npwp} onChange={e => setForm(p => ({ ...p, npwp: e.target.value }))} className={inputClass} placeholder="01.234.567.8-001.000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Telepon *</label>
                  <input value={form.telepon} onChange={e => setForm(p => ({ ...p, telepon: e.target.value }))} className={inputClass} placeholder="021-4785-3123" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClass} placeholder="info@kimiafarma.co.id" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nama PIC Utama</label>
                  <input value={form.pic} onChange={e => setForm(p => ({ ...p, pic: e.target.value }))} className={inputClass} placeholder="Budi Santoso" />
                </div>
              </div>
            </div>
          )}

          {tab === 'legalitas' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">No. Izin PBF</label>
                  <input value={form.no_izin_pbf} onChange={e => setForm(p => ({ ...p, no_izin_pbf: e.target.value }))} className={inputClass} placeholder="PBF-2023-001234" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Masa Berlaku Izin PBF</label>
                  <input type="date" value={form.exp_izin_pbf} onChange={e => setForm(p => ({ ...p, exp_izin_pbf: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Sertifikat CDOB</label>
                  <input value={form.sertifikat_cdob} onChange={e => setForm(p => ({ ...p, sertifikat_cdob: e.target.value }))} className={inputClass} placeholder="CDOB-2023-KF-001" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Masa Berlaku CDOB</label>
                  <input type="date" value={form.exp_cdob} onChange={e => setForm(p => ({ ...p, exp_cdob: e.target.value }))} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {tab === 'kerjasama' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Termin Pembayaran</label>
                <select value={form.termin_pembayaran} onChange={e => setForm(p => ({ ...p, termin_pembayaran: e.target.value as any }))} className={inputClass + ' bg-white'}>
                  <option value="cash">Cash (Langsung)</option>
                  <option value="tempo30">Tempo 30 Hari (Net 30)</option>
                  <option value="tempo60">Tempo 60 Hari (Net 60)</option>
                  <option value="tempo90">Tempo 90 Hari (Net 90)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Lead Time Pengiriman (Hari)</label>
                <input type="number" min={1} value={form.lead_time} onChange={e => setForm(p => ({ ...p, lead_time: e.target.value }))} className={inputClass} />
              </div>
            </div>
          )}

          {tab === 'status' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-3">Status Kerjasama</label>
                <div className="space-y-2">
                  {(['aktif', 'nonaktif', 'blacklist'] as const).map(s => (
                    <label key={s} className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                      form.status === s ? 'border-emerald-400 bg-emerald-50/40' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input type="radio" name="status" value={s} checked={form.status === s}
                        onChange={() => setForm(p => ({ ...p, status: s }))} className="mt-0.5 accent-emerald-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${STATUS_CFG[s]?.dot || 'bg-slate-400'}`} />
                          <span className="text-sm font-medium text-gray-800">{STATUS_CFG[s]?.label || s}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {form.status === 'blacklist' && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Alasan Blacklist *</label>
                  <textarea value={form.alasan_blacklist} onChange={e => setForm(p => ({ ...p, alasan_blacklist: e.target.value }))}
                    rows={4} placeholder="Jelaskan secara hukum atau operasional mengapa supplier diblacklist..."
                    className={inputClass + ' resize-none'} />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="flex gap-2 ml-auto">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Batal</button>
            <button onClick={onSave} className="px-4 py-2 rounded-lg text-sm text-white hover:opacity-90 font-semibold"
              style={{ backgroundColor: PRIMARY }}>
              {editTarget ? 'Simpan Perubahan' : 'Tambah Supplier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── SUPPLIER DETAIL DRAWER ─────────────────────────────────────────── */
interface DetailDrawerProps {
  supplier: ApiSupplier;
  drugs: ApiObat[];
  history: ApiObatMasuk[];
  loading: boolean;
  onClose: () => void;
}
function SupplierDetailDrawer({ supplier, drugs, history, loading, onClose }: DetailDrawerProps) {
  const [tab, setTab] = useState<'info' | 'riwayat' | 'obat'>('info');

  const pbfIzin = pbfBadge(supplier.exp_izin_pbf);
  const pbfCDOB = pbfBadge(supplier.exp_cdob);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside className="w-[480px] bg-white h-full shadow-2xl flex flex-col">
        {/* header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-start gap-3">
            {supplier.foto ? (
              <img src={supplier.foto} alt={supplier.nama} className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-sm flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Building2 size={18} />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-800 text-sm">{supplier.nama}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={supplier.status} />
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        {/* tabs */}
        <div className="flex border-b border-gray-100 px-5 flex-shrink-0">
          {[
            { key: 'info', label: 'Info Kemitraan' },
            { key: 'riwayat', label: `Riwayat Pasokan (${history.length})` },
            { key: 'obat', label: `Katalog Obat (${drugs.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className={`px-3 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                tab === t.key ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="ml-2 text-xs text-slate-500">Memuat info relasi...</span>
            </div>
          ) : (
            <div className="space-y-5">
              {tab === 'info' && (
                <div className="space-y-5 text-xs">
                  {supplier.status === 'blacklist' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700">
                      <p className="font-bold">DIBLACKLIST</p>
                      <p className="mt-0.5">{supplier.alasan_blacklist || 'Tidak dicantumkan alasan'}</p>
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-gray-700 mb-2">Informasi Kontak &amp; Alamat</p>
                    <Field label="Alamat" value={supplier.alamat || '-'} />
                    <Field label="Kota" value={supplier.kota || '-'} />
                    <Field label="Telepon" value={supplier.telepon} />
                    <Field label="Email" value={supplier.email || '-'} />
                    <Field label="NPWP" value={supplier.npwp || '-'} />
                    <Field label="PIC Penanggung Jawab" value={supplier.pic || '-'} />
                  </div>

                  <div>
                    <p className="font-bold text-gray-700 mb-2">Aspek Legalitas PBF</p>
                    <Field label="No. Izin PBF" value={
                      <span className="flex items-center gap-2">
                        <span>{supplier.no_izin_pbf || '-'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pbfIzin.cls}`}>{pbfIzin.label}</span>
                      </span>
                    } />
                    <Field label="Masa Berlaku Izin PBF" value={supplier.exp_izin_pbf ? new Date(supplier.exp_izin_pbf).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'} />
                    <Field label="Sertifikat CDOB" value={
                      <span className="flex items-center gap-2">
                        <span>{supplier.sertifikat_cdob || '-'}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pbfCDOB.cls}`}>{pbfCDOB.label}</span>
                      </span>
                    } />
                    <Field label="Masa Berlaku CDOB" value={supplier.exp_cdob ? new Date(supplier.exp_cdob).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'} />
                  </div>

                  <div>
                    <p className="font-bold text-gray-700 mb-2">Ketentuan Kerjasama</p>
                    <Field label="Termin Pembayaran" value={TERMIN[supplier.termin_pembayaran] || supplier.termin_pembayaran} />
                    <Field label="Lead Time Pengiriman" value={`${supplier.lead_time} hari`} />
                  </div>
                </div>
              )}

              {tab === 'riwayat' && (
                <div>
                  {history.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Belum ada riwayat transaksi dengan supplier ini</div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-3 py-2 font-semibold text-gray-500">No. Transaksi</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-500">Tanggal</th>
                          <th className="text-right px-3 py-2 font-semibold text-gray-500">Total Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {history.map(tx => (
                          <tr key={tx.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2"><code className="font-mono text-gray-700 font-semibold">{tx.no_transaksi}</code></td>
                            <td className="px-3 py-2 text-gray-500">{new Date(tx.tanggal).toLocaleDateString('id-ID')}</td>
                            <td className="px-3 py-2 text-right font-mono font-semibold text-gray-800">{formatRupiah(tx.nilai_total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tab === 'obat' && (
                <div>
                  {drugs.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">Belum ada catalog obat untuk supplier ini</div>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                          <th className="text-left px-3 py-2 font-semibold text-gray-500">Nama Obat</th>
                          <th className="text-right px-3 py-2 font-semibold text-gray-500">Harga Beli</th>
                          <th className="text-right px-3 py-2 font-semibold text-gray-500">Stok</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {drugs.map(d => (
                          <tr key={d.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <p className="font-medium text-gray-800">{d.nama}</p>
                              <code className="text-[10px] text-gray-400 font-mono">{d.kode}</code>
                            </td>
                            <td className="px-3 py-2 text-right font-mono">{formatRupiah(d.harga_beli)}</td>
                            <td className="px-3 py-2 text-right font-mono font-semibold">{d.stok} {d.satuan}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, color,
}: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-800 leading-tight">{value}</p>
      </div>
    </div>
  );
}
