import { useState, useEffect } from 'react';
import {
  Plus, Search, X, Pencil, Trash2, Eye, EyeOff,
  ChevronLeft, ChevronRight, UserX, RefreshCw, Loader2, Key, Camera
} from 'lucide-react';
import { penggunaApi, rolesApi, type Pengguna, type RoleOption } from '../services/api';
import { toast } from 'sonner';

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

type Role = Pengguna['role'];
type Status = 'aktif' | 'nonaktif';

const ROLE_CFG: Record<Role, { label: string; accent: string; bg: string }> = {
  admin:         { label: 'Admin',       accent: C.navy,  bg: '#EEF1F7' },
  apoteker:      { label: 'Apoteker',    accent: C.sage,  bg: '#EDF3F1' },
  'staf-gudang': { label: 'Staf Gudang', accent: C.slate, bg: '#F0F2F3' },
  kasir:         { label: 'Kasir',       accent: C.amber, bg: '#FBF4E8' },
};

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function UserAvatar({ name, role, fotoUrl }: { name: string; role: Role; fotoUrl?: string | null }) {
  const cfg = ROLE_CFG[role] || { accent: C.slate, bg: '#F0F2F3' };
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
      backgroundColor: fotoUrl ? 'transparent' : cfg.bg, border: `1.5px solid ${cfg.accent}44`,
      color: cfg.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, fontFamily: F.body, letterSpacing: '0.05em',
      overflow: 'hidden',
    }}>
      {fotoUrl
        ? <img src={fotoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initials(name)
      }
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CFG[role] || { label: role, accent: C.slate, bg: '#F0F2F3' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      borderTop: `1px solid ${cfg.accent}2E`,
      borderRight: `1px solid ${cfg.accent}2E`,
      borderBottom: `1px solid ${cfg.accent}2E`,
      borderLeft: `3px solid ${cfg.accent}`,
      backgroundColor: cfg.bg, color: cfg.accent,
      padding: '2px 8px 2px 7px', borderRadius: '0 3px 3px 0',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      fontFamily: F.body, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

interface FormState {
  nama: string;
  username: string;
  email: string;
  nip: string;
  role: Role;
  status: Status;
  password?: string;
  foto?: File | null;
}

export function ManajemenUser() {
  const [users, setUsers] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<Role | ''>('');
  const [filterStatus, setFilterStatus] = useState<Status | ''>('');

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Pengguna | null>(null);

  const [showResetPwModal, setShowResetPwModal] = useState<Pengguna | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Pengguna | null>(null);

  /* Roles dari API */
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  useEffect(() => {
    rolesApi.list().then(res => setRoleOptions(res.data)).catch(() => {
      /* Fallback jika endpoint belum tersedia */
      setRoleOptions([
        { value: 'admin', label: 'Administrator' },
        { value: 'apoteker', label: 'Apoteker' },
        { value: 'staf-gudang', label: 'Staf Gudang' },
        { value: 'kasir', label: 'Kasir' },
      ]);
    });
  }, []);

  const fetchUsers = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await penggunaApi.list({
        page,
        per_page: 8,
        search: search.trim() || undefined,
        role: filterRole || undefined,
        status: filterStatus || undefined
      });
      setUsers(res.data);
      setLastPage(res.meta.last_page);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat daftar pengguna');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, filterRole, filterStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleSave = async (form: FormState) => {
    try {
      if (editTarget) {
        /* UPDATE — gunakan FormData jika ada foto, JSON biasa jika tidak */
        if (form.foto) {
          const fd = new FormData();
          fd.append('nama', form.nama);
          fd.append('username', form.username);
          fd.append('email', form.email);
          if (form.nip) fd.append('nip', form.nip);
          fd.append('role', form.role);
          fd.append('status', form.status);
          fd.append('foto', form.foto);
          fd.append('_method', 'PUT'); // Laravel method spoofing for FormData
          // Use POST with _method=PUT for FormData (multipart doesn't support PUT natively)
          await penggunaApi.update(editTarget.id, fd as any);
        } else {
          await penggunaApi.update(editTarget.id, {
            nama: form.nama,
            username: form.username,
            email: form.email,
            nip: form.nip || null,
            role: form.role,
            status: form.status
          });
        }
        toast.success('Profil pengguna berhasil diperbarui.');
      } else {
        /* CREATE */
        if (!form.password || form.password.length < 8) {
          toast.error('Kata sandi minimal 8 karakter.');
          return;
        }
        if (form.foto) {
          const fd = new FormData();
          fd.append('nama', form.nama);
          fd.append('username', form.username);
          fd.append('email', form.email);
          if (form.nip) fd.append('nip', form.nip);
          fd.append('role', form.role);
          fd.append('status', form.status);
          fd.append('password', form.password);
          fd.append('foto', form.foto);
          await penggunaApi.create(fd as any);
        } else {
          await penggunaApi.create({
            nama: form.nama,
            username: form.username,
            email: form.email,
            nip: form.nip || null,
            role: form.role,
            status: form.status,
            password: form.password
          });
        }
        toast.success('Pengguna baru berhasil ditambahkan.');
      }
      setShowModal(false);
      fetchUsers(true);
    } catch (err: any) {
      if (err?.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        toast.error(String(firstErr) || err.message);
      } else {
        toast.error(err?.message || 'Gagal menyimpan data pengguna');
      }
    }
  };

  const handleResetPassword = async () => {
    if (!showResetPwModal) return;
    if (newPassword.length < 8) {
      toast.error('Kata sandi minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      await penggunaApi.resetPassword(showResetPwModal.id, newPassword, confirmPassword);
      toast.success(`Kata sandi untuk ${showResetPwModal.nama} berhasil direset.`);
      setShowResetPwModal(null);
      setNewPassword('');
      setConfirmPassword('');
      setShowNewPw(false);
    } catch (err: any) {
      if (err?.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        toast.error(String(firstErr) || err.message);
      } else {
        toast.error(err?.message || 'Gagal mereset kata sandi');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await penggunaApi.delete(deleteTarget.id);
      toast.success('Akun pengguna berhasil dihapus.');
      setDeleteTarget(null);
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus pengguna');
    }
  };

  const handleToggleStatus = async (user: Pengguna) => {
    try {
      await penggunaApi.toggleStatus(user.id);
      toast.success(`Status ${user.nama} berhasil diperbarui.`);
      fetchUsers(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memperbarui status');
    }
  };

  return (
    <div style={{ fontFamily: F.body }} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ margin: 0, fontFamily: F.heading, fontSize: 21, fontWeight: 700, color: C.navy }}>
            Manajemen Pengguna
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: C.slate }}>
            Kelola hak akses dan profil akun staf instalasi farmasi Klinik Cempaka Lima
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, backgroundColor: C.sage,
            color: '#fff', border: 'none', borderRadius: 6, padding: '9px 16px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          Tambah Pengguna
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, color: C.slate, pointerEvents: 'none' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari nama, username, email…"
              className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={filterRole}
            onChange={e => { setFilterRole(e.target.value as any); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white text-slate-600"
          >
            <option value="">Semua Role</option>
            {roleOptions.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => { setFilterStatus(e.target.value as any); setPage(1); }}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white text-slate-600"
          >
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>

          <button
            type="button"
            onClick={() => fetchUsers(true)}
            className="flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-slate-600 font-medium">Memuat data pengguna...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Nama Lengkap / Username</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">NIP / Karyawan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Role / Hak Akses</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 flex items-center gap-3">
                      <UserAvatar name={u.nama} role={u.role} fotoUrl={u.foto_url} />
                      <div>
                        <p className="font-semibold text-slate-800 m-0 leading-tight">{u.nama}</p>
                        <code className="text-xs text-slate-400 font-mono">@{u.username}</code>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{u.nip || '—'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{u.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`w-9 h-5 rounded-full transition-all relative ${u.status === 'aktif' ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                          <span className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${u.status === 'aktif' ? 'right-[3px]' : 'left-[3px]'}`} />
                        </button>
                        <span className="text-xs font-medium text-slate-600 capitalize">{u.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setEditTarget(u); setShowModal(true); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600" title="Edit Profil">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => { setShowResetPwModal(u); setNewPassword(''); setConfirmPassword(''); setShowNewPw(false); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600" title="Reset Password">
                          <Key size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500" title="Hapus Akun">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">Total {totalCount} pengguna</span>
          <div className="flex gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              disabled={page === lastPage}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showModal && (
        <UserSaveModal
          editTarget={editTarget}
          roleOptions={roleOptions}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPwModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">Reset Password</h3>
              <p className="text-xs text-slate-400">Ganti kata sandi baru untuk {showResetPwModal.nama}</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Kata Sandi Baru</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(p => !p)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex' }}
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Konfirmasi Kata Sandi</label>
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Kata sandi tidak cocok</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowResetPwModal(null); setNewPassword(''); setConfirmPassword(''); setShowNewPw(false); }} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Batal</button>
              <button onClick={handleResetPassword} className="flex-1 py-2 rounded-lg text-sm text-white font-semibold" style={{ backgroundColor: C.sage }}>Reset Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-3 text-red-700">
              <UserX size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">Hapus Akun Pengguna?</p>
                <p className="text-xs mt-0.5">Akun {deleteTarget.nama} (@{deleteTarget.username}) akan dihapus secara permanen.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 font-semibold">Konfirmasi Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SAVE USER MODAL ──────────────────────────────────────────────────── */
function UserSaveModal({
  editTarget, roleOptions, onSave, onClose
}: {
  editTarget: Pengguna | null;
  roleOptions: RoleOption[];
  onSave: (form: FormState) => void;
  onClose: () => void;
}) {
  const [nama, setNama] = useState(editTarget?.nama || '');
  const [username, setUsername] = useState(editTarget?.username || '');
  const [email, setEmail] = useState(editTarget?.email || '');
  const [nip, setNip] = useState(editTarget?.nip || '');
  const [role, setRole] = useState<Role>(editTarget?.role || 'kasir');
  const [status, setStatus] = useState<Status>(editTarget?.status || 'aktif');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(editTarget?.foto_url || null);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2 MB.');
      return;
    }
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleConfirm = () => {
    if (!nama.trim() || !username.trim() || !email.trim()) {
      toast.error('Nama, username, dan email wajib diisi.');
      return;
    }
    if (!editTarget && (!password || password.length < 8)) {
      toast.error('Kata sandi minimal 8 karakter.');
      return;
    }
    onSave({ nama, username, email, nip, role, status, password, foto: fotoFile });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800 text-sm">{editTarget ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Foto Profil */}
          <div className="flex items-center gap-4">
            <div style={{
              width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
              backgroundColor: '#EDF3F1', border: '2px dashed #D5DBE2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', position: 'relative',
            }}>
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Camera size={22} style={{ color: C.slate }} />
              )}
            </div>
            <div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors">
                <Camera size={12} />
                {fotoPreview ? 'Ganti Foto' : 'Upload Foto'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
              </label>
              <p className="text-[10px] text-slate-400 mt-1">JPG, PNG maks 2 MB</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Lengkap *</label>
              <input value={nama} onChange={e => setNama(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="Apoteker Utama" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Username *</label>
              <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="sari.dewi" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">NIP / Karyawan</label>
              <input value={nip} onChange={e => setNip(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 font-mono" placeholder="19920305..." />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500" placeholder="sari@cempakalima.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Role / Hak Akses *</label>
              <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white">
                {roleOptions.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status Keaktifan</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 bg-white">
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>
            {!editTarget && (
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Kata Sandi Awal *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 pr-10"
                    placeholder="Minimal 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex' }}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 pb-5 flex gap-2 border-t border-slate-50 pt-4">
          <button onClick={onClose} className="ml-auto px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button onClick={handleConfirm} className="px-4 py-2 rounded-lg text-sm text-white font-semibold hover:opacity-90" style={{ backgroundColor: C.sage }}>
            {editTarget ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </button>
        </div>
      </div>
    </div>
  );
}
