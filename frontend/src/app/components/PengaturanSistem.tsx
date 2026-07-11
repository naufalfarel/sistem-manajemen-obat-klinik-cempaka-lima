import { useState, useEffect } from 'react';
import {
  Building2, Package, Bell, Shield, Zap, Database,
  Save, Check, AlertTriangle, RefreshCw,
  Download, Eye, EyeOff, Copy, Mail, Server, Printer, Loader2
} from 'lucide-react';
import { pengaturanApi, type PengaturanData } from '../services/api';
import { toast } from 'sonner';

const PRIMARY = '#0F9D74';

const C = {
  navy:    '#1B2A45',
  sage:    '#0F9D74',
  amber:   '#C98A2C',
  slate:   '#7C8B93',
  brick:   '#B8483A',
  paper:   '#F7F7F4',
  border:  '#D5DBE2',
  divider: '#ECEEF1',
} as const;

const F = {
  heading: "'Space Grotesk', 'Segoe UI', sans-serif",
  body:    "'IBM Plex Sans', 'Inter', sans-serif",
  mono:    "'IBM Plex Mono', 'Cascadia Code', monospace",
} as const;

type Section = 'umum' | 'stok' | 'notifikasi' | 'keamanan' | 'integrasi' | 'cadangan';

const SECTIONS: { id: Section; label: string; desc: string; Icon: React.ElementType }[] = [
  { id: 'umum',        label: 'Umum',               desc: 'Identitas instansi & preferensi regional',    Icon: Building2 },
  { id: 'stok',        label: 'Stok & Kadaluarsa',  desc: 'Ambang batas monitoring dan notifikasi',       Icon: Package   },
  { id: 'notifikasi',  label: 'Notifikasi & Email',  desc: 'Kanal dan trigger peringatan sistem',          Icon: Bell      },
  { id: 'keamanan',    label: 'Kebijakan Akun',      desc: 'Autentikasi & aturan sesi pengguna',           Icon: Shield    },
  { id: 'integrasi',   label: 'Koneksi & SMTP',      desc: 'Pengaturan email keluar & printer struk',      Icon: Zap       },
  { id: 'cadangan',    label: 'Backup Database',     desc: 'Arsip backup data sistem',                    Icon: Database  },
];

export function PengaturanSistem() {
  const [activeSec, setActiveSec] = useState<Section>('umum');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  // States settings
  const [umum, setUmum] = useState<Record<string, any>>({});
  const [stok, setStok] = useState<Record<string, any>>({});
  const [notifikasi, setNotifikasi] = useState<Record<string, any>>({});
  const [keamanan, setKeamanan] = useState<Record<string, any>>({});
  const [integrasi, setIntegrasi] = useState<Record<string, any>>({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await pengaturanApi.get();
      setUmum(res.data.umum || {});
      setStok(res.data.stok || {});
      setNotifikasi(res.data.notifikasi || {});
      setKeamanan(res.data.keamanan || {});
      setIntegrasi(res.data.integrasi || {});
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat pengaturan sistem');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('logo', file);

    const toastId = toast.loading('Mengunggah logo...');
    try {
      const res = await pengaturanApi.uploadLogo(formData);
      setUmum(p => ({
        ...p,
        logo_klinik: res.data.logo_klinik,
        logo_klinik_url: res.data.logo_klinik_url
      }));
      toast.success('Logo klinik berhasil diperbarui.', { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengunggah logo', { id: toastId });
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<PengaturanData> = {
        umum,
        stok,
        notifikasi,
        keamanan,
        integrasi
      };
      await pengaturanApi.update(payload);
      toast.success('Pengaturan sistem berhasil disimpan.');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      // Simpan dulu setting SMTP terbaru ke server
      await pengaturanApi.update({ integrasi });
      const res = await pengaturanApi.testSmtp();
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menguji SMTP server');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res = await pengaturanApi.backup();
      toast.success(`Backup berhasil dibuat: ${res.data.file} (${res.data.size})`);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal membuat backup');
    } finally {
      setBackingUp(false);
    }
  };

  const inputClass = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 transition-colors";
  const labelClass = "block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider";

  return (
    <div className="space-y-4" style={{ fontFamily: F.body }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ margin: 0, fontFamily: F.heading, fontSize: 21, fontWeight: 700, color: C.navy }}>
            Pengaturan Sistem
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.slate }}>
            Konfigurasi preferensi global, batasan stok, SMTP email, keamanan akun, dan backup data
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-white font-semibold hover:opacity-90 disabled:opacity-50 flex-shrink-0"
          style={{ backgroundColor: PRIMARY }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Simpan Semua Pengaturan
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-slate-100 p-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-slate-600 font-medium">Memuat konfigurasi...</span>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-5">
          {/* Navigation Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-1.5">
            {SECTIONS.map(s => {
              const Icon = s.Icon;
              const isSelected = activeSec === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSec(s.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                    isSelected ? 'border-emerald-500 bg-emerald-50/30 text-emerald-800 font-semibold' : 'border-transparent bg-white text-slate-600 hover:bg-slate-50/60'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg flex-shrink-0 ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs leading-none mt-0.5">{s.label}</p>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal font-normal">{s.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Form Container */}
          <div className="flex-1 bg-white rounded-xl border border-slate-100 p-6 shadow-sm min-h-[400px]">
            {activeSec === 'umum' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Identitas Klinik</h3>
                  <p className="text-xs text-slate-400">Identitas utama ini tercantum pada header nota pembayaran.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelClass}>Nama Klinik / Apotek</label>
                    <input
                      value={umum.nama_klinik || ''}
                      onChange={e => setUmum(p => ({ ...p, nama_klinik: e.target.value }))}
                      className={inputClass}
                      placeholder="Klinik Cempaka Lima"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Alamat Operasional</label>
                    <textarea
                      value={umum.alamat || ''}
                      onChange={e => setUmum(p => ({ ...p, alamat: e.target.value }))}
                      rows={2}
                      className={inputClass + ' resize-none'}
                      placeholder="Banda Aceh"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>No. Telepon</label>
                    <input
                      value={umum.telepon || ''}
                      onChange={e => setUmum(p => ({ ...p, telepon: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email Resmi</label>
                    <input
                      type="email"
                      value={umum.email || ''}
                      onChange={e => setUmum(p => ({ ...p, email: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Zona Waktu Regional</label>
                    <select
                      value={umum.zona_waktu || 'Asia/Jakarta'}
                      onChange={e => setUmum(p => ({ ...p, zona_waktu: e.target.value }))}
                      className={inputClass + ' bg-white'}
                    >
                      <option value="Asia/Jakarta">WIB (Asia/Jakarta - UTC+7)</option>
                      <option value="Asia/Makassar">WITA (Asia/Makassar - UTC+8)</option>
                      <option value="Asia/Jayapura">WIT (Asia/Jayapura - UTC+9)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Format Tanggal</label>
                    <select
                      value={umum.format_tanggal || 'DD/MM/YYYY'}
                      onChange={e => setUmum(p => ({ ...p, format_tanggal: e.target.value }))}
                      className={inputClass + ' bg-white'}
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 10/07/2026)</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD (Contoh: 2026-07-10)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Logo Instansi / Klinik</label>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 flex-shrink-0">
                        {umum.logo_klinik_url ? (
                          <img src={umum.logo_klinik_url} alt="Logo Klinik" className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400">No Logo</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Format PNG/JPG, maksimal 2MB</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSec === 'stok' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Stok &amp; Kadaluarsa</h3>
                  <p className="text-xs text-slate-400">Tentukan durasi sisa hari untuk penandaan kategori kadaluarsa obat.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Batas Sangat Dekat Kadaluarsa (Hari)</label>
                    <input
                      type="number"
                      value={stok.near_30 || 30}
                      onChange={e => setStok(p => ({ ...p, near_30: parseInt(e.target.value) || 30 }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Batas Mendekati Kadaluarsa (Hari)</label>
                    <input
                      type="number"
                      value={stok.near_90 || 90}
                      onChange={e => setStok(p => ({ ...p, near_90: parseInt(e.target.value) || 90 }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Stok Minimum Default (Unit)</label>
                    <input
                      type="number"
                      value={stok.stok_minimum_default || 10}
                      onChange={e => setStok(p => ({ ...p, stok_minimum_default: parseInt(e.target.value) || 10 }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Ambang Kritis Stok Minimum (%)</label>
                    <input
                      type="number"
                      value={stok.ambang_kritis_persen || 100}
                      onChange={e => setStok(p => ({ ...p, ambang_kritis_persen: parseInt(e.target.value) || 100 }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Ambang Rendah Stok Minimum (%)</label>
                    <input
                      type="number"
                      value={stok.ambang_rendah_persen || 150}
                      onChange={e => setStok(p => ({ ...p, ambang_rendah_persen: parseInt(e.target.value) || 150 }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        checked={stok.auto_nonaktifkan_expired || false}
                        onChange={e => setStok(p => ({ ...p, auto_nonaktifkan_expired: e.target.checked }))}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        id="auto-expired"
                      />
                      <label htmlFor="auto-expired" className="text-xs font-semibold text-slate-600 select-none">
                        Nonaktifkan obat secara otomatis saat melewati tanggal kedaluwarsa (Expired)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSec === 'notifikasi' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Kanal Notifikasi Otomatis</h3>
                  <p className="text-xs text-slate-400">Kirim email otomatis ke admin/apoteker saat kondisi tertentu terpenuhi.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Kirim Email Stok Kritis</p>
                      <p className="text-[10px] text-slate-400">Trigger email otomatis saat stok obat menyentuh ambang kritis.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifikasi.email_stok_kritis || false}
                      onChange={e => setNotifikasi(p => ({ ...p, email_stok_kritis: e.target.checked }))}
                      className="w-5 h-5 accent-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Kirim Email Alert Expired</p>
                      <p className="text-[10px] text-slate-400">Trigger email mingguan berisi rekap obat yang mendekati tanggal expired.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifikasi.email_expired || false}
                      onChange={e => setNotifikasi(p => ({ ...p, email_expired: e.target.checked }))}
                      className="w-5 h-5 accent-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Alert Transaksi Nominal Besar</p>
                      <p className="text-[10px] text-slate-400">Flag penandaan khusus di audit log jika nilai transaksi melampaui batas.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifikasi.notif_transaksi_besar || false}
                      onChange={e => setNotifikasi(p => ({ ...p, notif_transaksi_besar: e.target.checked }))}
                      className="w-5 h-5 accent-emerald-500"
                    />
                  </div>

                  {notifikasi.notif_transaksi_besar && (
                    <div>
                      <label className={labelClass}>Minimal Nilai Transaksi Besar (Rp)</label>
                      <input
                        type="number"
                        value={notifikasi.batas_transaksi_besar || 1000000}
                        onChange={e => setNotifikasi(p => ({ ...p, batas_transaksi_besar: parseInt(e.target.value) || 1000000 }))}
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSec === 'keamanan' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Kebijakan Sesi &amp; Autentikasi</h3>
                  <p className="text-xs text-slate-400">Konfigurasikan batas lockout dan umur sesi login karyawan.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Panjang Sandi Minimum</label>
                    <input
                      type="number"
                      value={keamanan.panjang_password_minimum || 8}
                      onChange={e => setKeamanan(p => ({ ...p, panjang_password_minimum: parseInt(e.target.value) || 8 }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Default Role User Baru</label>
                    <select
                      value={keamanan.default_role_pengguna_baru || 'kasir'}
                      onChange={e => setKeamanan(p => ({ ...p, default_role_pengguna_baru: e.target.value }))}
                      className={inputClass + ' bg-white'}
                    >
                      <option value="admin">Administrator</option>
                      <option value="apoteker">Apoteker</option>
                      <option value="staf-gudang">Staf Gudang</option>
                      <option value="kasir">Kasir</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Maks. Percobaan Login Salah</label>
                    <input
                      type="number"
                      value={keamanan.maks_percobaan_login || 5}
                      onChange={e => setKeamanan(p => ({ ...p, maks_percobaan_login: parseInt(e.target.value) || 5 }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Masa Lockout Gagal Login (Menit)</label>
                    <input
                      type="number"
                      value={keamanan.durasi_lockout_menit || 15}
                      onChange={e => setKeamanan(p => ({ ...p, durasi_lockout_menit: parseInt(e.target.value) || 15 }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Masa Timeout Sesi Login (Menit)</label>
                    <input
                      type="number"
                      value={keamanan.sesi_timeout_menit || 480}
                      onChange={e => setKeamanan(p => ({ ...p, sesi_timeout_menit: parseInt(e.target.value) || 480 }))}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSec === 'integrasi' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Koneksi Layanan &amp; SMTP</h3>
                  <p className="text-xs text-slate-400">Atur server SMTP untuk pengiriman surat keluar resmi.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={labelClass}>Host SMTP Server</label>
                    <input
                      value={integrasi.smtp_host || 'smtp.gmail.com'}
                      onChange={e => setIntegrasi(p => ({ ...p, smtp_host: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Email SMTP Username</label>
                    <input
                      value={integrasi.smtp_user || 'noreply@cempakalima.id'}
                      onChange={e => setIntegrasi(p => ({ ...p, smtp_user: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Port SMTP</label>
                    <input
                      value={integrasi.smtp_port || '587'}
                      onChange={e => setIntegrasi(p => ({ ...p, smtp_port: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>Default Printer Struk Kasir</label>
                    <input
                      value={integrasi.printer_default || ''}
                      onChange={e => setIntegrasi(p => ({ ...p, printer_default: e.target.value }))}
                      className={inputClass}
                      placeholder="Contoh: Epson TM-T82"
                    />
                  </div>
                  <div className="col-span-2 pt-2 border-t border-slate-50 flex gap-2">
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={testingSmtp}
                      className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
                    >
                      {testingSmtp ? <Loader2 size={13} className="animate-spin" /> : null}
                      Kirim Email Uji Coba (Test SMTP)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSec === 'cadangan' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Cadangan &amp; Pemulihan</h3>
                  <p className="text-xs text-slate-400">Ambil arsip data database secara terenkripsi (.zip) untuk keperluan recovery.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-700">Backup Manual Sekarang</p>
                    <p className="text-[10px] text-slate-400">Snapshot instan database akan disimpan langsung di folder server backend.</p>
                  </div>
                  <button
                    onClick={handleBackup}
                    disabled={backingUp}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    {backingUp ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                    Buat Backup Database
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
