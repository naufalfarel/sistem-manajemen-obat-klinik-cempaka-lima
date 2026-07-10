import { useState, useEffect } from 'react';
import {
  User, Shield, Clock, Sliders, Eye, EyeOff, Save,
  CheckCircle2, AlertTriangle, LogOut, Camera, ChevronRight,
} from 'lucide-react';
import type { LoginUser } from './Login';

/* ── Design tokens ──────────────────────────────────────────────────────────── */
const C = {
  navy:    '#1B2A45',
  sage:    '#4F7A6B',
  amber:   '#C98A2C',
  slate:   '#7C8B93',
  brick:   '#B8483A',
  paper:   '#F7F7F4',
  border:  '#D8DDE1',
  divider: '#E4E8EC',
  white:   '#FFFFFF',
};
const F = {
  head: "'Space Grotesk', system-ui, sans-serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', 'Courier New', monospace",
};

/* ── useWindowWidth hook ────────────────────────────────────────────────────── */
function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

/* ── Role config ────────────────────────────────────────────────────────────── */
const ROLE_CFG: Record<string, { color: string; bg: string }> = {
  'Administrator': { color: C.navy,  bg: '#EEF1F7' },
  'Apoteker':      { color: C.sage,  bg: '#EDF3F1' },
  'Staf Gudang':   { color: C.slate, bg: '#F0F2F3' },
  'Kasir':         { color: C.amber, bg: '#FBF4E8' },
};
function roleStyle(role: string) {
  return ROLE_CFG[role] ?? { color: C.slate, bg: '#F0F2F3' };
}

/* ── Extended profile data per user ────────────────────────────────────────── */
interface ProfileExt {
  email:           string;
  hp:              string;
  alamat:          string;
  nip:             string;
  bergabung:       string; // YYYY-MM-DD
  lastLogin:       string; // ISO
  passwordChanged: string; // YYYY-MM-DD
}

const PROFILE_EXT: Record<string, ProfileExt> = {
  'andi.k': {
    email: 'andi.k@cempakallima.id', hp: '081298765432',
    alamat: 'Jl. Mampang Prapatan No. 15, Jakarta Selatan 12790',
    nip: 'NIP-2020-0001', bergabung: '2020-03-15',
    lastLogin: '2026-07-08T11:30:15', passwordChanged: '2026-04-01',
  },
  'sari.d': {
    email: 'sari.d@cempakallima.id', hp: '081234567890',
    alamat: 'Jl. Tebet Barat No. 8, Jakarta Selatan 12810',
    nip: 'NIP-2021-0005', bergabung: '2021-06-05',
    lastLogin: '2026-07-08T11:28:42', passwordChanged: '2026-06-15',
  },
  'budi.h': {
    email: 'budi.h@cempakallima.id', hp: '085678901234',
    alamat: 'Jl. Ragunan No. 22, Jakarta Selatan 12550',
    nip: 'NIP-2019-0008', bergabung: '2019-08-20',
    lastLogin: '2026-07-07T16:45:22', passwordChanged: '2025-12-10',
  },
  'nita.r': {
    email: 'nita.r@cempakallima.id', hp: '087654321012',
    alamat: 'Jl. Condet No. 3, Jakarta Timur 13710',
    nip: 'NIP-2022-0012', bergabung: '2022-02-14',
    lastLogin: '2026-07-08T10:14:33', passwordChanged: '2026-05-20',
  },
  'hendra.w': {
    email: 'hendra.w@cempakallima.id', hp: '081345678901',
    alamat: 'Jl. Pancoran No. 11, Jakarta Selatan 12780',
    nip: 'NIP-2018-0002', bergabung: '2018-09-01',
    lastLogin: '2026-07-05T09:10:22', passwordChanged: '2025-09-15',
  },
};
const EXT_DEFAULT: ProfileExt = {
  email: 'pengguna@cempakallima.id', hp: '', alamat: '',
  nip: 'NIP-0000-0000', bergabung: '2024-01-01',
  lastLogin: new Date().toISOString(), passwordChanged: '2024-01-01',
};

/* ── Login history dummy data ───────────────────────────────────────────────── */
interface LoginRecord {
  id: number; timestamp: string; ip: string; device: string; status: 'berhasil' | 'gagal';
}
const LOGIN_HISTORY: LoginRecord[] = [
  { id:  1, timestamp: '2026-07-08T11:30:15', ip: '192.168.1.10',  device: 'Chrome 126 · Windows 11',  status: 'berhasil' },
  { id:  2, timestamp: '2026-07-07T09:15:44', ip: '192.168.1.10',  device: 'Chrome 126 · Windows 11',  status: 'berhasil' },
  { id:  3, timestamp: '2026-07-06T09:05:12', ip: '192.168.2.10',  device: 'Chrome 126 · Windows 11',  status: 'berhasil' },
  { id:  4, timestamp: '2026-07-05T08:50:33', ip: '192.168.1.10',  device: 'Chrome 126 · Windows 11',  status: 'berhasil' },
  { id:  5, timestamp: '2026-07-04T10:22:08', ip: '192.168.1.10',  device: 'Edge 126 · Windows 11',    status: 'berhasil' },
  { id:  6, timestamp: '2026-07-03T08:45:22', ip: '10.0.0.15',     device: 'Chrome 126 · Android 14',  status: 'gagal'    },
  { id:  7, timestamp: '2026-07-03T08:44:05', ip: '10.0.0.15',     device: 'Chrome 126 · Android 14',  status: 'berhasil' },
  { id:  8, timestamp: '2026-07-02T09:30:18', ip: '192.168.1.10',  device: 'Chrome 126 · Windows 11',  status: 'berhasil' },
  { id:  9, timestamp: '2026-07-01T10:15:30', ip: '192.168.1.10',  device: 'Firefox 127 · Windows 11', status: 'berhasil' },
  { id: 10, timestamp: '2026-06-30T09:00:44', ip: '192.168.1.10',  device: 'Chrome 126 · Windows 11',  status: 'berhasil' },
];

/* ── Helpers ────────────────────────────────────────────────────────────────── */
function fmtDate(iso: string): string {
  return new Date(iso.includes('T') ? iso : iso + 'T00:00:00')
    .toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
function fmtTime(iso: string): string {
  return iso.slice(11, 19);
}
function daysSince(dateStr: string): number {
  const d   = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  const now = new Date('2026-07-08T00:00:00');
  return Math.floor((now.getTime() - d.getTime()) / 86400000);
}
function initials(nama: string): string {
  return nama.split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase();
}

/* ── Password strength ──────────────────────────────────────────────────────── */
function calcStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: C.divider };
  let s = 0;
  if (pw.length >= 8)         s++;
  if (pw.length >= 12)        s++;
  if (/[A-Z]/.test(pw))       s++;
  if (/[0-9]/.test(pw))       s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: s, label: 'Lemah',       color: C.brick  };
  if (s === 2) return { score: s, label: 'Cukup',       color: C.amber  };
  if (s === 3) return { score: s, label: 'Kuat',        color: '#5B9A74' };
  return             { score: s, label: 'Sangat Kuat',  color: C.sage   };
}

/* ── Atom: Toggle (capsule) ─────────────────────────────────────────────────── */
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        backgroundColor: on ? C.sage : C.border, position: 'relative',
        transition: 'background-color 0.18s', flexShrink: 0,
        padding: 0,
      }}
      aria-checked={on} role="switch"
    >
      <span style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff',
        transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
        display: 'block',
      }} />
    </button>
  );
}

/* ── Atom: FieldGroup ───────────────────────────────────────────────────────── */
function FG({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 600, color: '#374151' }}>
        {label}
      </label>
      {children}
      {hint && (
        <span style={{ fontFamily: F.body, fontSize: 11, color: C.slate }}>{hint}</span>
      )}
    </div>
  );
}

/* ── Shared input / select style ────────────────────────────────────────────── */
const INP: React.CSSProperties = {
  padding: '8px 11px', borderRadius: 5,
  border: `1px solid ${C.border}`, backgroundColor: C.white,
  fontFamily: F.body, fontSize: 13, color: C.navy, outline: 'none',
  width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
const SEL: React.CSSProperties = {
  ...INP,
  appearance: 'none' as const, WebkitAppearance: 'none' as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%237C8B93'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28,
  cursor: 'pointer',
};

/* ── Panel header (sticky) ──────────────────────────────────────────────────── */
function PanelHeader({ title, desc, dirty, onSave, saving, isMobile }: {
  title: string; desc: string; dirty: boolean;
  onSave?: () => void; saving?: boolean; isMobile?: boolean;
}) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      backgroundColor: C.white,
      borderBottom: `1px solid ${C.divider}`,
      padding: isMobile ? '10px 14px' : '13px 20px',
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'flex-start',
      flexDirection: isMobile && onSave ? 'column' : 'row',
      justifyContent: 'space-between',
      gap: isMobile ? 8 : 12,
    }}>
      <div>
        <h2 style={{ fontFamily: F.head, fontSize: 14, fontWeight: 700, color: C.navy, margin: 0 }}>
          {title}
        </h2>
        <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.slate, margin: '2px 0 0' }}>
          {desc}
        </p>
      </div>
      {onSave && (
        <button
          onClick={onSave}
          disabled={!dirty || saving}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: isMobile ? '9px 16px' : '7px 16px',
            width: isMobile ? '100%' : 'auto',
            borderRadius: 5, border: 'none',
            backgroundColor: dirty ? C.sage : C.divider,
            color: dirty ? '#fff' : C.slate,
            fontFamily: F.body, fontSize: 12.5, fontWeight: 600,
            cursor: dirty ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s', flexShrink: 0,
            minHeight: isMobile ? 44 : undefined,
          }}
        >
          <Save size={13} />
          {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
        </button>
      )}
    </div>
  );
}

/* ── Dialog: Keluar Semua Perangkat ─────────────────────────────────────────── */
function LogoutAllDialog({ onConfirm, onCancel, isMobile }: {
  onConfirm: () => void; onCancel: () => void; isMobile?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: isMobile ? 'stretch' : 'center',
      backgroundColor: 'rgba(0,0,0,0.40)',
    }}>
      <div style={{
        width: isMobile ? '100%' : 420,
        backgroundColor: C.white,
        borderRadius: isMobile ? '16px 16px 0 0' : 6,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.divider}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#FDF2F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={15} style={{ color: C.brick }} />
          </div>
          <span style={{ fontFamily: F.head, fontSize: 14, fontWeight: 700, color: C.navy }}>
            Keluar dari Semua Perangkat Lain?
          </span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontFamily: F.body, fontSize: 13, color: '#475569', margin: '0 0 4px', lineHeight: 1.55 }}>
            Semua sesi aktif di perangkat lain akan segera diakhiri. Anda tetap masuk di perangkat ini.
          </p>
          <p style={{ fontFamily: F.body, fontSize: 12, color: C.slate, margin: 0 }}>
            Gunakan fitur ini jika Anda menduga akun diakses oleh pihak yang tidak sah.
          </p>
        </div>
        <div style={{
          padding: isMobile ? '12px 20px 24px' : '12px 20px 16px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: isMobile ? 'stretch' : 'flex-end',
          gap: 8,
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: isMobile ? '14px 16px' : '7px 16px',
              minHeight: isMobile ? 48 : undefined,
              borderRadius: 5, border: `1px solid ${C.border}`,
              backgroundColor: C.white, fontFamily: F.body, fontSize: 12.5, color: C.navy, cursor: 'pointer',
              order: isMobile ? 2 : 1,
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: isMobile ? '14px 16px' : '7px 16px',
              minHeight: isMobile ? 48 : undefined,
              borderRadius: 5, border: 'none',
              backgroundColor: C.brick, color: '#fff',
              fontFamily: F.body, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              order: isMobile ? 1 : 2,
            }}
          >
            Ya, Keluar Semua
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SECTION: Informasi Pribadi
   ══════════════════════════════════════════════════════════════════════════════ */
function SectionInfoPribadi({ user, ext, isMobile }: { user: LoginUser; ext: ProfileExt; isMobile: boolean }) {
  const [form, setForm]     = useState({ nama: user.nama, email: ext.email, hp: ext.hp, alamat: ext.alamat });
  const [dirty, setDirty]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  function update(field: string, val: string) {
    setForm(p => ({ ...p, [field]: val }));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PanelHeader
        title="Informasi Pribadi"
        desc="Nama lengkap, alamat surel, dan kontak yang terdaftar pada akun ini"
        dirty={dirty}
        onSave={handleSave}
        saving={saving}
        isMobile={isMobile}
      />
      <div style={{ padding: isMobile ? '14px' : '20px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>

        {/* Success notice */}
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', backgroundColor: '#EDF3F1', border: `1px solid ${C.sage}44`, borderLeft: `3px solid ${C.sage}`, borderRadius: '0 4px 4px 0' }}>
            <CheckCircle2 size={14} style={{ color: C.sage }} />
            <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.sage, fontWeight: 600 }}>Informasi berhasil disimpan.</span>
          </div>
        )}

        {/* ID akun — read only */}
        <div style={{ padding: '10px 14px', backgroundColor: C.paper, borderRadius: 5, border: `1px solid ${C.divider}` }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 10 : 24,
            flexWrap: isMobile ? undefined : 'wrap',
          }}>
            {[
              { label: 'Username', value: user.username },
              { label: 'NIP / ID Staf', value: ext.nip },
              { label: 'Role', value: user.role },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                  {label}
                </div>
                <div style={{ fontFamily: F.mono, fontSize: 12.5, color: C.navy }}>{value}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: F.body, fontSize: 10.5, color: C.slate, margin: '8px 0 0' }}>
            Username, NIP, dan role hanya dapat diubah oleh Administrator melalui halaman Manajemen Pengguna.
          </p>
        </div>

        {/* Grid 2 col → 1 col on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <FG label="Nama Lengkap">
            <input
              value={form.nama} onChange={e => update('nama', e.target.value)}
              style={INP}
              onFocus={e => (e.target.style.borderColor = C.sage)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </FG>
          <FG label="Alamat Surel (Email)">
            <input
              type="email" value={form.email} onChange={e => update('email', e.target.value)}
              style={INP}
              onFocus={e => (e.target.style.borderColor = C.sage)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </FG>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <FG label="Nomor HP / WhatsApp" hint="Digunakan untuk notifikasi darurat sistem">
            <input
              type="tel" value={form.hp} onChange={e => update('hp', e.target.value)}
              style={{ ...INP, fontFamily: F.mono }}
              onFocus={e => (e.target.style.borderColor = C.sage)}
              onBlur={e => (e.target.style.borderColor = C.border)}
            />
          </FG>
        </div>

        <FG label="Alamat Lengkap">
          <textarea
            rows={2}
            value={form.alamat}
            onChange={e => update('alamat', e.target.value)}
            style={{ ...INP, resize: 'vertical' as const, fontFamily: F.body }}
            onFocus={e => (e.target.style.borderColor = C.sage)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
        </FG>

        {/* Unsaved changes reminder */}
        {dirty && (
          <div style={{ padding: '8px 12px', backgroundColor: '#FBF4E8', border: `1px solid ${C.amber}44`, borderLeft: `3px solid ${C.amber}`, borderRadius: '0 4px 4px 0' }}>
            <span style={{ fontFamily: F.body, fontSize: 12, color: C.amber, fontWeight: 600 }}>
              Ada perubahan yang belum disimpan
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SECTION: Keamanan Akun
   ══════════════════════════════════════════════════════════════════════════════ */
function SectionKeamanan({ ext, isMobile }: { ext: ProfileExt; isMobile: boolean }) {
  const [form, setForm] = useState({ oldPw: '', newPw: '', confirmPw: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const strength  = calcStrength(form.newPw);
  const daysPw    = daysSince(ext.passwordChanged);
  const pwWarning = daysPw > 90;

  function toggle(field: 'old' | 'new' | 'confirm') {
    setShow(p => ({ ...p, [field]: !p[field] }));
  }

  async function handleChange() {
    setError('');
    if (!form.oldPw)     { setError('Masukkan password saat ini.'); return; }
    if (!form.newPw)     { setError('Masukkan password baru.'); return; }
    if (form.newPw.length < 8) { setError('Password baru minimal 8 karakter.'); return; }
    if (form.newPw !== form.confirmPw) { setError('Konfirmasi password tidak cocok.'); return; }

    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setSuccess(true);
    setForm({ oldPw: '', newPw: '', confirmPw: '' });
    setTimeout(() => setSuccess(false), 4000);
  }

  const pwInp = (field: 'old' | 'new' | 'confirm', value: string, onChange: (v: string) => void) => (
    <div style={{ position: 'relative' }}>
      <input
        type={show[field] ? 'text' : 'password'}
        value={value}
        onChange={e => { onChange(e.target.value); setError(''); setSuccess(false); }}
        style={{ ...INP, paddingRight: 38, fontFamily: F.mono }}
        onFocus={e => (e.target.style.borderColor = C.sage)}
        onBlur={e => (e.target.style.borderColor = C.border)}
      />
      <button type="button" onClick={() => toggle(field)} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.slate, display: 'flex', padding: 2 }}>
        {show[field] ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PanelHeader
        title="Keamanan Akun"
        desc="Perbarui password dan pantau rekam jejak akses masuk ke akun Anda"
        dirty={false}
        isMobile={isMobile}
      />
      <div style={{ padding: isMobile ? '14px' : '20px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

        {/* Password status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', backgroundColor: C.paper, border: `1px solid ${C.divider}`, borderRadius: 5 }}>
          <Shield size={16} style={{ color: pwWarning ? C.amber : C.sage, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.navy, fontWeight: 600 }}>
              Terakhir diubah {daysPw} hari lalu
            </span>
            <span style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, marginLeft: 8 }}>
              {fmtDate(ext.passwordChanged)}
            </span>
          </div>
          {pwWarning && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: '0 3px 3px 0', borderLeft: `2.5px solid ${C.amber}`, backgroundColor: '#FBF4E8', fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.amber, whiteSpace: 'nowrap' }}>
              <AlertTriangle size={11} />
              Sebaiknya ganti password
            </span>
          )}
        </div>

        {/* Change password form */}
        <div style={{ backgroundColor: C.white, border: `1px solid ${C.border}`, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ padding: '11px 16px', backgroundColor: C.paper, borderBottom: `1px solid ${C.divider}` }}>
            <span style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: C.navy }}>Ganti Password</span>
          </div>
          <div style={{ padding: isMobile ? '14px' : '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', backgroundColor: '#FEF2F2', border: `1px solid ${C.brick}33`, borderLeft: `3px solid ${C.brick}`, borderRadius: '0 4px 4px 0' }}>
                <AlertTriangle size={13} style={{ color: C.brick, flexShrink: 0 }} />
                <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.brick }}>{error}</span>
              </div>
            )}
            {success && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 11px', backgroundColor: '#EDF3F1', border: `1px solid ${C.sage}44`, borderLeft: `3px solid ${C.sage}`, borderRadius: '0 4px 4px 0' }}>
                <CheckCircle2 size={13} style={{ color: C.sage }} />
                <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.sage, fontWeight: 600 }}>Password berhasil diubah.</span>
              </div>
            )}

            <FG label="Password Saat Ini">
              {pwInp('old', form.oldPw, v => setForm(p => ({ ...p, oldPw: v })))}
            </FG>

            {/* 2-col on desktop, single col on mobile */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <FG label="Password Baru">
                {pwInp('new', form.newPw, v => setForm(p => ({ ...p, newPw: v })))}
                {/* Strength bar — always full width */}
                {form.newPw && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= strength.score ? strength.color : C.divider, transition: 'background-color 0.2s' }} />
                      ))}
                    </div>
                    <span style={{ fontFamily: F.body, fontSize: 11, color: strength.color }}>
                      Kekuatan: {strength.label}
                    </span>
                  </div>
                )}
              </FG>
              <FG label="Konfirmasi Password Baru">
                {pwInp('confirm', form.confirmPw, v => setForm(p => ({ ...p, confirmPw: v })))}
                {form.confirmPw && form.newPw && (
                  <span style={{ fontFamily: F.body, fontSize: 11, color: form.newPw === form.confirmPw ? C.sage : C.brick, marginTop: 3, display: 'block' }}>
                    {form.newPw === form.confirmPw ? '✓ Cocok' : '✗ Tidak cocok'}
                  </span>
                )}
              </FG>
            </div>

            <div style={{ display: 'flex', justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
              <button
                onClick={handleChange}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: isMobile ? '12px 18px' : '8px 18px',
                  width: isMobile ? '100%' : 'auto',
                  minHeight: isMobile ? 44 : undefined,
                  borderRadius: 5, border: 'none',
                  backgroundColor: C.sage, color: '#fff',
                  fontFamily: F.body, fontSize: 12.5, fontWeight: 600,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                <Shield size={13} />
                {saving ? 'Menyimpan…' : 'Ubah Password'}
              </button>
            </div>
          </div>
        </div>

        {/* Password requirements */}
        <div style={{ padding: '10px 14px', backgroundColor: C.paper, border: `1px solid ${C.divider}`, borderRadius: 5 }}>
          <p style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.navy, margin: '0 0 6px' }}>Syarat password yang kuat:</p>
          {[
            'Minimal 8 karakter (disarankan 12+)',
            'Kombinasi huruf besar dan kecil',
            'Minimal satu angka',
            'Minimal satu karakter khusus (!, @, #, dst.)',
          ].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: C.slate, flexShrink: 0 }} />
              <span style={{ fontFamily: F.body, fontSize: 11.5, color: '#475569' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SECTION: Riwayat Login
   ══════════════════════════════════════════════════════════════════════════════ */
function SectionRiwayat({ isMobile }: { isMobile: boolean }) {
  const [showDialog, setShowDialog] = useState(false);
  const [done, setDone]             = useState(false);

  function handleLogoutAll() {
    setShowDialog(false);
    setDone(true);
    setTimeout(() => setDone(false), 4000);
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PanelHeader
        title="Riwayat Login"
        desc="10 sesi masuk terakhir — periksa jika ada akses yang tidak Anda kenali"
        dirty={false}
        isMobile={isMobile}
      />
      <div style={{ padding: isMobile ? '14px' : '20px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>

        {done && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', backgroundColor: '#EDF3F1', border: `1px solid ${C.sage}44`, borderLeft: `3px solid ${C.sage}`, borderRadius: '0 4px 4px 0' }}>
            <CheckCircle2 size={13} style={{ color: C.sage }} />
            <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.sage, fontWeight: 600 }}>
              Semua sesi lain telah diakhiri. Anda tetap masuk di perangkat ini.
            </span>
          </div>
        )}

        {/* Login list */}
        {isMobile ? (
          /* Mobile: stacked cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LOGIN_HISTORY.map((rec, i) => (
              <div
                key={rec.id}
                style={{
                  padding: '12px 14px',
                  border: `1px solid ${C.border}`,
                  borderRadius: 5,
                  backgroundColor: rec.status === 'gagal' ? '#FFF9F8' : C.white,
                }}
              >
                {/* Time + date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: C.navy, fontWeight: 600 }}>
                      {fmtTime(rec.timestamp)}
                    </span>
                    <span style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, marginLeft: 8 }}>
                      {new Date(rec.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {/* Status badge */}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '2px 8px', borderRadius: '0 3px 3px 0',
                    borderLeft: `2.5px solid ${rec.status === 'berhasil' ? C.sage : C.brick}`,
                    backgroundColor: rec.status === 'berhasil' ? '#EDF3F1' : '#FDF2F0',
                    fontFamily: F.body, fontSize: 10.5, fontWeight: 700,
                    color: rec.status === 'berhasil' ? C.sage : C.brick,
                    whiteSpace: 'nowrap',
                  }}>
                    {rec.status === 'berhasil' ? 'Berhasil' : 'Gagal'}
                  </span>
                </div>
                {/* Device */}
                <div style={{ fontFamily: F.body, fontSize: 12, color: '#475569', marginBottom: 4 }}>
                  {rec.device}
                  {i === 0 && (
                    <span style={{ marginLeft: 7, padding: '1px 6px', backgroundColor: '#EEF1F7', borderRadius: 3, fontSize: 10, fontWeight: 700, color: C.navy, fontFamily: F.body }}>
                      Sesi ini
                    </span>
                  )}
                </div>
                {/* IP */}
                <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate }}>{rec.ip}</div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop: grid table */
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 5, overflow: 'hidden' }}>
            {/* Header row */}
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 90px', gap: 0, padding: '7px 14px', backgroundColor: C.paper, borderBottom: `1px solid ${C.divider}` }}>
              {['Waktu', 'Perangkat', 'IP Address', 'Status'].map(h => (
                <span key={h} style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {h}
                </span>
              ))}
            </div>
            {/* Rows */}
            {LOGIN_HISTORY.map((rec, i) => (
              <div
                key={rec.id}
                style={{
                  display: 'grid', gridTemplateColumns: '90px 1fr 130px 90px',
                  padding: '9px 14px', gap: 0,
                  borderBottom: i < LOGIN_HISTORY.length - 1 ? `1px solid ${C.divider}` : 'none',
                  backgroundColor: rec.status === 'gagal' ? '#FFF9F8' : C.white,
                  alignItems: 'center',
                }}
              >
                {/* Time */}
                <div>
                  <div style={{ fontFamily: F.mono, fontSize: 11.5, color: C.navy }}>
                    {fmtTime(rec.timestamp)}
                  </div>
                  <div style={{ fontFamily: F.mono, fontSize: 10, color: C.slate }}>
                    {new Date(rec.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                {/* Device */}
                <span style={{ fontFamily: F.body, fontSize: 12, color: '#475569' }}>
                  {rec.device}
                  {i === 0 && (
                    <span style={{ marginLeft: 7, padding: '1px 6px', backgroundColor: '#EEF1F7', borderRadius: 3, fontSize: 10, fontWeight: 700, color: C.navy, fontFamily: F.body }}>
                      Sesi ini
                    </span>
                  )}
                </span>
                {/* IP */}
                <span style={{ fontFamily: F.mono, fontSize: 11.5, color: C.slate }}>{rec.ip}</span>
                {/* Status pill */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 8px', borderRadius: '0 3px 3px 0',
                  borderLeft: `2.5px solid ${rec.status === 'berhasil' ? C.sage : C.brick}`,
                  backgroundColor: rec.status === 'berhasil' ? '#EDF3F1' : '#FDF2F0',
                  fontFamily: F.body, fontSize: 10.5, fontWeight: 700,
                  color: rec.status === 'berhasil' ? C.sage : C.brick,
                  whiteSpace: 'nowrap',
                }}>
                  {rec.status === 'berhasil' ? 'Berhasil' : 'Gagal'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Logout all section */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? 10 : 0,
          padding: '12px 14px',
          backgroundColor: '#FDF2F0',
          border: `1px solid ${C.brick}22`,
          borderRadius: 5,
        }}>
          <div>
            <p style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.navy, margin: '0 0 2px' }}>
              Keluar dari Semua Perangkat Lain
            </p>
            <p style={{ fontFamily: F.body, fontSize: 11.5, color: C.slate, margin: 0 }}>
              Mengakhiri semua sesi aktif selain perangkat yang sedang digunakan.
            </p>
          </div>
          <button
            onClick={() => setShowDialog(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 16px',
              width: isMobile ? '100%' : 'auto',
              minHeight: isMobile ? 44 : undefined,
              borderRadius: 5, border: `1px solid ${C.brick}`,
              backgroundColor: C.white, color: C.brick,
              fontFamily: F.body, fontSize: 12.5, fontWeight: 600,
              cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.brick; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.white; e.currentTarget.style.color = C.brick; }}
          >
            <LogOut size={14} /> Keluar Semua
          </button>
        </div>
      </div>

      {showDialog && <LogoutAllDialog onConfirm={handleLogoutAll} onCancel={() => setShowDialog(false)} isMobile={isMobile} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SECTION: Preferensi
   ══════════════════════════════════════════════════════════════════════════════ */
function SectionPreferensi({ isMobile }: { isMobile: boolean }) {
  const [prefs, setPrefs] = useState({
    tema:        'terang',
    bahasa:      'id',
    notifSistem: true,
    notifEmail:  false,
    notifStok:   true,
    notifExpired: true,
  });
  const [dirty, setDirty]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  function update<K extends keyof typeof prefs>(key: K, val: (typeof prefs)[K]) {
    setPrefs(p => ({ ...p, [key]: val }));
    setDirty(true);
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <PanelHeader
        title="Preferensi"
        desc="Tampilan, bahasa antarmuka, dan notifikasi yang berlaku untuk akun ini"
        dirty={dirty}
        onSave={handleSave}
        saving={saving}
        isMobile={isMobile}
      />
      <div style={{ padding: isMobile ? '14px' : '20px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', backgroundColor: '#EDF3F1', border: `1px solid ${C.sage}44`, borderLeft: `3px solid ${C.sage}`, borderRadius: '0 4px 4px 0' }}>
            <CheckCircle2 size={13} style={{ color: C.sage }} />
            <span style={{ fontFamily: F.body, fontSize: 12.5, color: C.sage, fontWeight: 600 }}>Preferensi berhasil disimpan.</span>
          </div>
        )}

        {/* Tampilan & Bahasa */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', backgroundColor: C.paper, borderBottom: `1px solid ${C.divider}` }}>
            <span style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: C.navy }}>Tampilan &amp; Bahasa</span>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Tema — segmented control */}
            <FG label="Tema Tampilan">
              <div style={{
                display: 'flex',
                border: `1px solid ${C.border}`,
                borderRadius: 5,
                overflow: 'hidden',
                width: isMobile ? '100%' : 'fit-content',
              }}>
                {[
                  { id: 'terang', label: 'Terang' },
                  { id: 'gelap',  label: 'Gelap' },
                  { id: 'sistem', label: 'Ikuti Sistem' },
                ].map(({ id, label }, idx, arr) => (
                  <button
                    key={id}
                    onClick={() => update('tema', id)}
                    style={{
                      flex: isMobile ? 1 : undefined,
                      padding: '7px 16px', border: 'none', cursor: 'pointer',
                      fontFamily: F.body, fontSize: 12.5, fontWeight: prefs.tema === id ? 600 : 400,
                      backgroundColor: prefs.tema === id ? C.navy : C.white,
                      color: prefs.tema === id ? '#fff' : C.slate,
                      borderRight: idx < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                      transition: 'all 0.12s',
                      minHeight: isMobile ? 44 : undefined,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </FG>

            {/* Bahasa */}
            <div style={{ maxWidth: isMobile ? '100%' : 280 }}>
              <FG label="Bahasa Antarmuka">
                <select value={prefs.bahasa} onChange={e => update('bahasa', e.target.value)} style={SEL}>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </FG>
            </div>
          </div>
        </div>

        {/* Notifikasi */}
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 5, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', backgroundColor: C.paper, borderBottom: `1px solid ${C.divider}` }}>
            <span style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: C.navy }}>Notifikasi Personal</span>
          </div>
          <div style={{ padding: '4px 0' }}>
            {[
              { key: 'notifSistem',  label: 'Notifikasi Sistem',       desc: 'Pesan dari administrator dan pembaruan sistem' },
              { key: 'notifEmail',   label: 'Notifikasi via Email',     desc: 'Kirim salinan notifikasi ke alamat surel akun' },
              { key: 'notifStok',    label: 'Peringatan Stok Kritis',   desc: 'Notifikasi saat stok obat di bawah ambang batas' },
              { key: 'notifExpired', label: 'Peringatan Obat Kadaluarsa', desc: 'Notifikasi 30 dan 7 hari sebelum tanggal kadaluarsa' },
            ].map(({ key, label, desc }, i, arr) => (
              <div
                key={key}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${C.divider}` : 'none', minHeight: isMobile ? 44 : undefined }}
              >
                <div>
                  <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 500, color: C.navy }}>{label}</div>
                  <div style={{ fontFamily: F.body, fontSize: 11.5, color: C.slate, marginTop: 1 }}>{desc}</div>
                </div>
                <Toggle on={prefs[key as keyof typeof prefs] as boolean} onToggle={() => update(key as keyof typeof prefs, !prefs[key as keyof typeof prefs] as boolean)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   IDENTITY CARD (left column / top on mobile)
   ══════════════════════════════════════════════════════════════════════════════ */
function IdentityCard({ user, ext, onNav, isMobile }: {
  user: LoginUser; ext: ProfileExt; onNav: (s: string) => void; isMobile: boolean;
}) {
  const rStyle = roleStyle(user.role);
  const daysPw = daysSince(ext.passwordChanged);

  if (isMobile) {
    /* Mobile: compact horizontal card */
    return (
      <div style={{
        width: '100%',
        backgroundColor: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 5,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar 50px */}
          <div style={{
            width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
            backgroundColor: rStyle.bg,
            border: `2px solid ${rStyle.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: F.head, fontSize: 16, fontWeight: 700, color: rStyle.color }}>
              {initials(user.nama)}
            </span>
          </div>
          {/* Name + role + username */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: F.head, fontSize: 13.5, fontWeight: 700, color: C.navy, margin: '0 0 4px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.nama}
            </p>
            <span style={{
              display: 'inline-block', padding: '1px 8px',
              borderRadius: '0 3px 3px 0', borderLeft: `2.5px solid ${rStyle.color}`,
              backgroundColor: rStyle.bg,
              fontFamily: F.body, fontSize: 10, fontWeight: 700, color: rStyle.color,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              marginBottom: 3,
            }}>
              {user.role}
            </span>
            <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate }}>{user.username}</div>
          </div>
        </div>

        {/* Password warning — show on mobile too */}
        {daysPw > 90 && (
          <button
            onClick={() => onNav('keamanan')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', border: 'none', borderTop: `1px solid ${C.divider}`,
              backgroundColor: '#FBF4E8', cursor: 'pointer', textAlign: 'left',
              minHeight: 44,
            }}
          >
            <AlertTriangle size={13} style={{ color: C.amber, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 600, color: C.amber }}>
                Ganti password sekarang
              </div>
              <div style={{ fontFamily: F.body, fontSize: 10.5, color: '#92611C' }}>
                Sudah {daysPw} hari tidak diganti
              </div>
            </div>
            <ChevronRight size={12} style={{ color: C.amber, flexShrink: 0 }} />
          </button>
        )}
      </div>
    );
  }

  /* Desktop: original full card */
  return (
    <div style={{
      width: 252, flexShrink: 0,
      backgroundColor: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 5,
      overflow: 'hidden',
      alignSelf: 'flex-start',
    }}>
      {/* Avatar area */}
      <div style={{ padding: '28px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, borderBottom: `1px solid ${C.divider}` }}>
        {/* Avatar ring */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            backgroundColor: rStyle.bg,
            border: `3px solid ${rStyle.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: F.head, fontSize: 24, fontWeight: 700, color: rStyle.color }}>
              {initials(user.nama)}
            </span>
          </div>
        </div>

        {/* Name */}
        <p style={{ fontFamily: F.head, fontSize: 14.5, fontWeight: 700, color: C.navy, margin: '0 0 7px', textAlign: 'center', lineHeight: 1.3 }}>
          {user.nama}
        </p>

        {/* Role badge */}
        <span style={{
          display: 'inline-block', padding: '2px 10px',
          borderRadius: '0 3px 3px 0', borderLeft: `3px solid ${rStyle.color}`,
          backgroundColor: rStyle.bg,
          fontFamily: F.body, fontSize: 11, fontWeight: 700, color: rStyle.color,
          letterSpacing: '0.05em', textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          {user.role}
        </span>

        {/* Username / NIP */}
        <span style={{ fontFamily: F.mono, fontSize: 12, color: C.slate }}>
          {user.username}
        </span>
        <span style={{ fontFamily: F.mono, fontSize: 10.5, color: C.slate, marginTop: 2 }}>
          {ext.nip}
        </span>

        {/* Ganti Foto — desktop only */}
        <button
          title="Fitur unggah foto segera hadir"
          style={{
            marginTop: 12, display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 4,
            border: `1px solid ${C.border}`, backgroundColor: C.paper,
            fontFamily: F.body, fontSize: 11.5, color: C.slate, cursor: 'pointer',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = C.sage, e.currentTarget.style.color = C.sage)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = C.border, e.currentTarget.style.color = C.slate)}
        >
          <Camera size={12} /> Ganti Foto
        </button>
      </div>

      {/* Info rows */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Bergabung sejak', value: fmtDate(ext.bergabung) },
          { label: 'Login terakhir',  value: fmtDateTime(ext.lastLogin), mono: true },
        ].map(({ label, value, mono }) => (
          <div key={label}>
            <div style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
              {label}
            </div>
            <div style={{ fontFamily: mono ? F.mono : F.body, fontSize: 12, color: C.navy }}>
              {value}
            </div>
          </div>
        ))}

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 2 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: C.sage }} />
          <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.sage }}>Aktif</span>
        </div>
      </div>

      {/* Password warning shortcut */}
      {daysPw > 90 && (
        <button
          onClick={() => onNav('keamanan')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 16px', border: 'none', borderTop: `1px solid ${C.divider}`,
            backgroundColor: '#FBF4E8', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <AlertTriangle size={13} style={{ color: C.amber, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: F.body, fontSize: 11.5, fontWeight: 600, color: C.amber }}>
              Ganti password sekarang
            </div>
            <div style={{ fontFamily: F.body, fontSize: 10.5, color: '#92611C' }}>
              Sudah {daysPw} hari tidak diganti
            </div>
          </div>
          <ChevronRight size={12} style={{ color: C.amber, flexShrink: 0 }} />
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
type SectionId = 'informasi' | 'keamanan' | 'riwayat' | 'preferensi';

const SECTIONS: { id: SectionId; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'informasi', label: 'Informasi Pribadi', desc: 'Nama, surel, dan kontak',          icon: User    },
  { id: 'keamanan',  label: 'Keamanan Akun',     desc: 'Ganti password, pantau akses',     icon: Shield  },
  { id: 'riwayat',   label: 'Riwayat Login',     desc: '10 sesi terakhir, kendali sesi',   icon: Clock   },
  { id: 'preferensi',label: 'Preferensi',         desc: 'Tampilan, bahasa, notifikasi',     icon: Sliders },
];

export function ProfilPengguna({ user }: { user: LoginUser }) {
  const [active, setActive] = useState<SectionId>('informasi');
  const ext = PROFILE_EXT[user.username] ?? EXT_DEFAULT;
  const width = useWindowWidth();
  const isMobile = width < 768;

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: '100%' }}>

        {/* Identity card — full width, compact */}
        <IdentityCard user={user} ext={ext} onNav={(s) => setActive(s as SectionId)} isMobile={true} />

        {/* Horizontal scroll tab bar */}
        <div style={{
          backgroundColor: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 5,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            overflowX: 'auto',
            flexWrap: 'nowrap',
            scrollbarWidth: 'none',
            borderBottom: `1px solid ${C.divider}`,
            // Hide webkit scrollbar
            msOverflowStyle: 'none',
          } as React.CSSProperties}>
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 16px',
                    minHeight: 44,
                    flexShrink: 0,
                    border: 'none',
                    borderBottom: isActive ? `3px solid ${C.sage}` : '3px solid transparent',
                    backgroundColor: isActive ? '#EDF3F1' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: F.body, fontSize: 12.5,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? C.navy : '#475569',
                    transition: 'all 0.12s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon size={14} style={{ color: isActive ? C.sage : C.slate, flexShrink: 0 }} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Section panel — full width */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 400 }}>
            {active === 'informasi'  && <SectionInfoPribadi user={user} ext={ext} isMobile={true} />}
            {active === 'keamanan'   && <SectionKeamanan ext={ext} isMobile={true} />}
            {active === 'riwayat'    && <SectionRiwayat isMobile={true} />}
            {active === 'preferensi' && <SectionPreferensi isMobile={true} />}
          </div>
        </div>
      </div>
    );
  }

  /* Desktop layout — unchanged */
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', minHeight: '100%' }}>

      {/* ── Left: Identity card ──────────────────────────────────────── */}
      <IdentityCard user={user} ext={ext} onNav={(s) => setActive(s as SectionId)} isMobile={false} />

      {/* ── Right: Sub-nav + panel ───────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', gap: 0, minWidth: 0, border: `1px solid ${C.border}`, borderRadius: 5, overflow: 'hidden', backgroundColor: C.white }}>

        {/* Sub-nav */}
        <div style={{ width: 190, flexShrink: 0, borderRight: `1px solid ${C.divider}`, backgroundColor: C.paper }}>
          {/* Sub-nav header */}
          <div style={{ padding: '12px 14px 8px', borderBottom: `1px solid ${C.divider}` }}>
            <span style={{ fontFamily: F.body, fontSize: 10, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Pengaturan Akun
            </span>
          </div>

          {/* Nav items */}
          <nav style={{ padding: '6px 0' }}>
            {SECTIONS.map(({ id, label, desc, icon: Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => setActive(id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                    width: '100%', padding: '9px 14px 9px 11px',
                    border: 'none', borderLeft: isActive ? `3px solid ${C.sage}` : '3px solid transparent',
                    backgroundColor: isActive ? '#EDF3F1' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'background-color 0.12s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#F0F4F2'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Icon size={14} style={{ color: isActive ? C.sage : C.slate, marginTop: 2, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: isActive ? 600 : 400, color: isActive ? C.navy : '#475569', lineHeight: 1.2 }}>
                      {label}
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: 10.5, color: C.slate, marginTop: 2, lineHeight: 1.3 }}>
                      {desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 520 }}>
          {active === 'informasi'  && <SectionInfoPribadi user={user} ext={ext} isMobile={false} />}
          {active === 'keamanan'   && <SectionKeamanan ext={ext} isMobile={false} />}
          {active === 'riwayat'    && <SectionRiwayat isMobile={false} />}
          {active === 'preferensi' && <SectionPreferensi isMobile={false} />}
        </div>
      </div>
    </div>
  );
}
