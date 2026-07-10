import { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, Package, Tag, Truck, PackagePlus, PackageMinus,
  AlertTriangle, FileBarChart, Users, Settings, ClipboardList,
  Bell, X, LogOut, ChevronRight, Clock, Menu, Loader2
} from 'lucide-react';
import logoImg from '../../imports/logo_cemmpaka_lima.jpg';
import type { Page, Notification } from './data';
import { notifications } from './data';
import { ROLE_LABELS } from './Login';
import type { LoginUser } from './Login';
import { monitoringApi } from '../services/api';

/* ── Design tokens ──────────────────────────────────────────────────────────── */
const SIDEBAR_BG  = '#0B3B2E';
const ACTIVE_CLR  = '#0F9D74';
const NAVY   = '#1B2A45';
const SLATE  = '#7C8B93';
const BRICK  = '#B8483A';
const AMBER  = '#C98A2C';

/* ── Responsive hook ────────────────────────────────────────────────────────── */
function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}

interface LayoutProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  children: React.ReactNode;
  user: LoginUser;
  onLogout: () => void;
  appConfig?: {
    namaKlinik: string;
    logoUrl: string | null;
  };
}

/* ── Sidebar menu groups ────────────────────────────────────────────────────── */
const MENU_GROUPS: {
  label: string;
  items: { id: Page; label: string; icon: React.ElementType; badge?: number }[];
}[] = [
  {
    label: 'Ikhtisar',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Inventaris Obat',
    items: [
      { id: 'master-obat',         label: 'Master Obat',         icon: Package },
      { id: 'kategori',            label: 'Kategori Obat',       icon: Tag },
      { id: 'monitoring-expired',  label: 'Stok Kritis & Expired', icon: AlertTriangle, badge: 0 },
    ],
  },
  {
    label: 'Logistik',
    items: [
      { id: 'supplier',    label: 'Supplier',         icon: Truck },
      { id: 'obat-masuk',  label: 'Penerimaan Obat',  icon: PackagePlus },
      { id: 'obat-keluar', label: 'Pengeluaran Obat', icon: PackageMinus },
    ],
  },
  {
    label: 'Pelaporan',
    items: [
      { id: 'laporan', label: 'Laporan & Analisis', icon: FileBarChart },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { id: 'manajemen-user', label: 'Manajemen Pengguna', icon: Users },
      { id: 'pengaturan',     label: 'Pengaturan Sistem',  icon: Settings },
      { id: 'audit-log',      label: 'Audit Log',          icon: ClipboardList },
    ],
  },
];

const PAGE_LABELS: Record<Page, string> = {
  'dashboard':          'Dashboard',
  'master-obat':        'Master Obat',
  'kategori':           'Kategori Obat',
  'supplier':           'Supplier',
  'obat-masuk':         'Penerimaan Obat',
  'obat-keluar':        'Pengeluaran Obat',
  'monitoring-expired': 'Stok Kritis & Expired',
  'laporan':            'Laporan & Analisis',
  'manajemen-user':     'Manajemen Pengguna',
  'pengaturan':         'Pengaturan Sistem',
  'audit-log':          'Audit Log',
  'profil':             'Profil Saya',
};

const PAGE_SECTIONS: Record<Page, string> = {
  'dashboard':          'Ikhtisar',
  'master-obat':        'Inventaris Obat',
  'kategori':           'Inventaris Obat',
  'supplier':           'Logistik',
  'obat-masuk':         'Logistik',
  'obat-keluar':        'Logistik',
  'monitoring-expired': 'Inventaris Obat',
  'laporan':            'Pelaporan',
  'manajemen-user':     'Administrasi',
  'pengaturan':         'Administrasi',
  'audit-log':          'Administrasi',
  'profil':             'Akun',
};

/* ── Clock component ────────────────────────────────────────────────────────── */
function SysClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <Clock size={12} style={{ color: SLATE }} />
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11.5, color: '#334155', letterSpacing: '0.02em' }}>
        {time}
      </span>
      <span style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 11, color: SLATE }}>
        {date}
      </span>
    </div>
  );
}

/* ── Collapsed sidebar (tablet: icon only) ───────────────────────────────────── */
function CollapsedSidebar({
  activePage,
  setActivePage,
  user,
  onLogout,
  badgeCount,
  appConfig,
}: {
  activePage: Page;
  setActivePage: (p: Page) => void;
  user: LoginUser;
  onLogout: () => void;
  badgeCount: number;
  appConfig?: {
    namaKlinik: string;
    logoUrl: string | null;
  };
}) {
  const isAdmin = user.role === 'admin';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: SIDEBAR_BG, width: 60, alignItems: 'center' }}>
      {/* Logo */}
      <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 34, height: 34, borderRadius: 6, backgroundColor: '#fff', overflow: 'hidden', padding: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>
          <img src={appConfig?.logoUrl || logoImg} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, scrollbarWidth: 'none' }}>
        {MENU_GROUPS
          .filter(g => g.label !== 'Administrasi' || isAdmin)
          .flatMap(g => g.items)
          .map(({ id, label, icon: Icon, badge }) => {
            const active = activePage === id;
            const actualBadge = id === 'monitoring-expired' ? badgeCount : badge;
            return (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                title={label}
                style={{
                  width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, border: 'none', cursor: 'pointer', position: 'relative',
                  backgroundColor: active ? 'rgba(15,157,116,0.20)' : 'transparent',
                  transition: 'background-color 0.12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <Icon size={17} style={{ color: active ? ACTIVE_CLR : 'rgba(255,255,255,0.55)' }} />
                {actualBadge > 0 && !active && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 7, height: 7, borderRadius: '50%',
                    backgroundColor: BRICK, border: '1.5px solid ' + SIDEBAR_BG,
                  }} />
                )}
              </button>
            );
          })}
      </nav>

      {/* User avatar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 0', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <button
          onClick={() => setActivePage('profil')}
          title={user.nama}
          style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: ACTIVE_CLR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', system-ui", fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', padding: 0 }}
        >
          {user.fotoUrl
            ? <img src={user.fotoUrl} alt={user.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user.initials
          }
        </button>
        <button
          onClick={onLogout}
          title="Keluar"
          style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', borderRadius: 6, transition: 'color 0.1s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.80)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

/* ── Full sidebar content ────────────────────────────────────────────────────── */
function SidebarContent({
  activePage,
  setActivePage,
  onClose,
  user,
  onLogout,
  badgeCount,
  appConfig,
}: {
  activePage: Page;
  setActivePage: (p: Page) => void;
  onClose?: () => void;
  user: LoginUser;
  onLogout: () => void;
  badgeCount: number;
  appConfig?: {
    namaKlinik: string;
    logoUrl: string | null;
  };
}) {
  const isAdmin = user.role === 'admin';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: SIDEBAR_BG }}>

      {/* Logo / identity */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px 13px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        flexShrink: 0,
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 6, backgroundColor: '#fff', flexShrink: 0, overflow: 'hidden', padding: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>
          <img src={appConfig?.logoUrl || logoImg} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Grotesk', system-ui", fontSize: 12.5, fontWeight: 700, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {appConfig?.namaKlinik || "Klinik Utama Cempaka Lima"}
          </div>
          <div style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 2, letterSpacing: '0.04em' }}>
            SISTEM MANAJEMEN OBAT
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 2, display: 'flex' }}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 0', scrollbarWidth: 'thin' }}>
        {MENU_GROUPS
          .filter(group => group.label !== 'Administrasi' || isAdmin)
          .map((group) => (
          <div key={group.label} style={{ marginBottom: 4 }}>
            <div style={{ padding: '7px 14px 3px', fontFamily: "'IBM Plex Sans', system-ui", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.28)' }}>
              {group.label}
            </div>
            {group.items.map(({ id, label, icon: Icon, badge }) => {
              const active = activePage === id;
              const actualBadge = id === 'monitoring-expired' ? badgeCount : badge;
              return (
                <button
                  key={id}
                  onClick={() => { setActivePage(id); onClose?.(); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    width: '100%', padding: '8px 14px 8px 11px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderLeft: active ? `3px solid ${ACTIVE_CLR}` : '3px solid transparent',
                    backgroundColor: active ? 'rgba(15,157,116,0.15)' : 'transparent',
                    transition: 'background-color 0.12s', textAlign: 'left' as const,
                    minHeight: 44,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <Icon size={15} style={{ flexShrink: 0, color: active ? ACTIVE_CLR : 'rgba(255,255,255,0.50)' }} />
                  <span style={{ flex: 1, fontFamily: "'IBM Plex Sans', system-ui", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.62)', letterSpacing: '0.01em' }}>
                    {label}
                  </span>
                  {actualBadge > 0 && !active && (
                    <span style={{ minWidth: 18, height: 16, borderRadius: 8, backgroundColor: BRICK, color: '#fff', fontFamily: "'IBM Plex Sans', system-ui", fontSize: 10, fontWeight: 700, padding: '0 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {actualBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User info */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 14px' }}>
        <div
          role="button"
          onClick={() => { setActivePage('profil'); onClose?.(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderRadius: 4, padding: '2px 4px', transition: 'background-color 0.12s' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, backgroundColor: ACTIVE_CLR, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', system-ui", fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden' }}>
            {user.fotoUrl
              ? <img src={user.fotoUrl} alt={user.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user.initials
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 12.5, fontWeight: 600, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.nama}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ padding: '1px 6px', borderRadius: '0 2px 2px 0', borderLeft: `2px solid ${ACTIVE_CLR}`, backgroundColor: 'rgba(15,157,116,0.2)', fontFamily: "'IBM Plex Sans', system-ui", fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onLogout(); }}
            title="Keluar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 4, display: 'flex', borderRadius: 4, transition: 'color 0.1s', minWidth: 32, minHeight: 32, alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile full-nav sheet ─────────────────────────────────────────────────── */
function MobileMenuSheet({
  activePage,
  setActivePage,
  user,
  onLogout,
  onClose,
  badgeCount,
  appConfig,
}: {
  activePage: Page;
  setActivePage: (p: Page) => void;
  user: LoginUser;
  onLogout: () => void;
  onClose: () => void;
  badgeCount: number;
  appConfig?: {
    namaKlinik: string;
    logoUrl: string | null;
  };
}) {
  const isAdmin = user.role === 'admin';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.50)' }} onClick={onClose} />
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 260, backgroundColor: SIDEBAR_BG, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyComposite: 'space-between', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 5, overflow: 'hidden', backgroundColor: '#fff' }}>
              <img src={appConfig?.logoUrl || logoImg} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', system-ui", fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
              {appConfig?.namaKlinik || "Klinik Cempaka Lima"}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4, display: 'flex', minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>
        {/* Nav items */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
          {MENU_GROUPS
            .filter(g => g.label !== 'Administrasi' || isAdmin)
            .map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{ padding: '6px 16px 2px', fontFamily: "'IBM Plex Sans', system-ui", fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.28)' }}>
                {group.label}
              </div>
              {group.items.map(({ id, label, icon: Icon, badge }) => {
                const active = activePage === id;
                const actualBadge = id === 'monitoring-expired' ? badgeCount : badge;
                return (
                  <button
                    key={id}
                    onClick={() => { setActivePage(id); onClose(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%', padding: '12px 16px 12px 13px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderLeft: active ? `3px solid ${ACTIVE_CLR}` : '3px solid transparent',
                      backgroundColor: active ? 'rgba(15,157,116,0.15)' : 'transparent',
                      textAlign: 'left' as const, minHeight: 48,
                    }}
                  >
                    <Icon size={18} style={{ flexShrink: 0, color: active ? ACTIVE_CLR : 'rgba(255,255,255,0.55)' }} />
                    <span style={{ flex: 1, fontFamily: "'IBM Plex Sans', system-ui", fontSize: 14, fontWeight: active ? 600 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.70)' }}>
                      {label}
                    </span>
                    {actualBadge > 0 && !active && (
                      <span style={{ padding: '2px 7px', borderRadius: 8, backgroundColor: BRICK, color: '#fff', fontFamily: "'IBM Plex Sans', system-ui", fontSize: 11, fontWeight: 700 }}>{actualBadge}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {/* Logout */}
        <div style={{ padding: '10px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
          <button onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'none', cursor: 'pointer', minHeight: 48 }}>
            <LogOut size={18} style={{ color: 'rgba(255,255,255,0.55)' }} />
            <span style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 14, color: 'rgba(255,255,255,0.70)', fontWeight: 500 }}>Keluar dari Sistem</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Notification panel ─────────────────────────────────────────────────────── */
function NotifPanel({
  onNavigate,
  notificationsList,
  loading,
  onDismiss
}: {
  onNavigate: (p: Page) => void;
  notificationsList: Notification[];
  loading: boolean;
  onDismiss: (id: string) => void;
}) {
  return (
    <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 300, backgroundColor: '#fff', border: `1px solid #D8DDE1`, borderRadius: 6, boxShadow: '0 6px 20px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #E4E8EC', backgroundColor: '#F7F7F4' }}>
        <span style={{ fontFamily: "'Space Grotesk', system-ui", fontSize: 13, fontWeight: 700, color: NAVY }}>Notifikasi</span>
        <span style={{ padding: '1px 8px', borderRadius: 10, backgroundColor: '#FDF2F0', border: `1px solid ${BRICK}33`, fontFamily: "'IBM Plex Sans', system-ui", fontSize: 10.5, fontWeight: 700, color: BRICK }}>
          {notificationsList.length} perlu tindakan
        </span>
      </div>
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Loader2 size={18} className="animate-spin text-emerald-600" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : notificationsList.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 6 }}>
            <span style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 11, color: SLATE }}>
              Semua aman! Tidak ada peringatan sistem.
            </span>
          </div>
        ) : (
          notificationsList.map((n) => (
            <div key={n.id} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderBottom: '1px solid #F0F2F4', borderLeft: `3px solid ${{ red: BRICK, orange: AMBER, yellow: '#D97706' }[n.severity] ?? SLATE}`, position: 'relative' }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 12, color: '#334155', margin: '0 0 3px', lineHeight: 1.45 }}>{n.message}</p>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: SLATE, margin: 0 }}>{n.time}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
                title="Tandai telah dibaca"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: SLATE, display: 'flex', alignSelf: 'start', padding: 2, borderRadius: 4, transition: 'background-color 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X size={12} />
              </button>
            </div>
          ))
        )}
      </div>
      <div style={{ padding: '8px 14px', backgroundColor: '#F7F7F4', borderTop: '1px solid #E4E8EC', textAlign: 'center' as const }}>
        <button onClick={() => onNavigate('monitoring-expired')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'IBM Plex Sans', system-ui", fontSize: 12, fontWeight: 600, color: '#0B7A5A', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
          Lihat semua di Monitoring Stok <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

/* ── Main Layout ────────────────────────────────────────────────────────────── */
export function Layout({ activePage, setActivePage, children, user, onLogout, appConfig }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const windowWidth = useWindowWidth();

  const [badgeCount, setBadgeCount] = useState<number>(0);
  const [notifItems, setNotifItems] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState<boolean>(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDismissNotif = (id: string) => {
    const next = [...dismissedIds, id];
    setDismissedIds(next);
    localStorage.setItem('dismissed_notifications', JSON.stringify(next));
    setNotifItems(prev => prev.filter(n => n.id !== id));
    setBadgeCount(prev => Math.max(0, prev - 1));
  };

  const isMobile  = windowWidth < 768;
  const isTablet  = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  const fetchSidebarData = async () => {
    try {
      setNotifLoading(true);
      const summaryRes = await monitoringApi.summary();

      // Ambil notifikasi dari database secara riil (per_page: 100 agar lengkap seluruh data kritis & expired)
      const notifList: Notification[] = [];
      const kritisRes = await monitoringApi.kritis({ page: 1, per_page: 100 });
      kritisRes.data.forEach((item) => {
        notifList.push({
          id: `kritis-${item.obat_id}`,
          type: item.stok === 0 ? 'expired' : 'low-stock',
          message: `${item.nama} (${item.kode}) stok kritis! Tersisa ${item.stok} unit (minimum: ${item.stok_minimum}).`,
          time: 'Baru saja',
          severity: item.stok === 0 ? 'red' : 'orange'
        });
      });

      const expiredRes = await monitoringApi.expired({ page: 1, per_page: 100, status: 'expired' });
      expiredRes.data.forEach((item) => {
        notifList.push({
          id: `expired-${item.obat_id}`,
          type: 'expired',
          message: `${item.nama} (${item.kode}) telah melewati tanggal kedaluwarsa (${item.expired_date})!`,
          time: 'Hari ini',
          severity: 'red'
        });
      });

      const filtered = notifList.filter(n => !dismissedIds.includes(n.id));
      setBadgeCount(filtered.length);
      setNotifItems(filtered.slice(0, 5));
    } catch (err) {
      console.error('Gagal memuat data sidebar & notifikasi', err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchSidebarData();
  }, [activePage]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pageLabel    = PAGE_LABELS[activePage];
  const sectionLabel = PAGE_SECTIONS[activePage];
  const unreadCount  = notifItems.length;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#F7F7F4' }}>

      {/* Desktop sidebar */}
      {isDesktop && (
        <aside style={{ width: 220, flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <SidebarContent activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} badgeCount={badgeCount} appConfig={appConfig} />
        </aside>
      )}

      {/* Tablet sidebar (collapsed) */}
      {isTablet && (
        <aside style={{ width: 60, flexShrink: 0, height: '100%' }}>
          <CollapsedSidebar activePage={activePage} setActivePage={setActivePage} user={user} onLogout={onLogout} badgeCount={badgeCount} appConfig={appConfig} />
        </aside>
      )}

      {/* Mobile: full nav sheet */}
      {isMobile && mobileMenuOpen && (
        <MobileMenuSheet
          activePage={activePage}
          setActivePage={setActivePage}
          user={user}
          onLogout={onLogout}
          onClose={() => setMobileMenuOpen(false)}
          badgeCount={badgeCount}
          appConfig={appConfig}
        />
      )}

      {/* Right side: topbar + content */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>

        {/* ── Topbar ────────────────────────────────────────────────── */}
        <header style={{ height: 52, display: 'flex', alignItems: 'center', padding: isMobile ? '0 12px' : '0 20px', gap: isMobile ? 8 : 12, backgroundColor: '#fff', borderBottom: '1px solid #D8DDE1', flexShrink: 0, zIndex: 30 }}>

          {/* Mobile: hamburger + logo + page title */}
          {isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <button
                onClick={() => setMobileMenuOpen(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 5, border: '1px solid #D8DDE1', backgroundColor: '#fff', cursor: 'pointer', color: NAVY, flexShrink: 0 }}
              >
                <Menu size={18} />
              </button>
              <div style={{ width: 26, height: 26, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
                <img src={appConfig?.logoUrl || logoImg} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontFamily: "'Space Grotesk', system-ui", fontSize: 13, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pageLabel}
              </span>
            </div>
          )}

          {/* Desktop/tablet: breadcrumb */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 12, color: SLATE, whiteSpace: 'nowrap' }}>
                {sectionLabel}
              </span>
              <ChevronRight size={11} style={{ color: '#CBD5E1', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Space Grotesk', system-ui", fontSize: 13.5, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {pageLabel}
              </span>
            </div>
          )}

          {/* Clock — hide on mobile */}
          {isDesktop && (
            <div style={{ flexShrink: 0 }}>
              <SysClock />
            </div>
          )}

          {!isMobile && <div style={{ width: 1, height: 22, backgroundColor: '#E4E8EC', flexShrink: 0 }} />}

          {/* Notification bell */}
          <div style={{ position: 'relative', flexShrink: 0 }} ref={notifRef}>
            <button
              onClick={() => setShowNotif(p => !p)}
              style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 5, border: `1px solid ${showNotif ? NAVY + '33' : '#D8DDE1'}`, backgroundColor: showNotif ? '#EEF1F7' : '#fff', cursor: 'pointer', color: showNotif ? NAVY : SLATE, transition: 'all 0.12s' }}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', backgroundColor: BRICK, border: '1.5px solid #fff' }} />
              )}
            </button>
            {showNotif && <NotifPanel onNavigate={(p) => { setActivePage(p); setShowNotif(false); }} notificationsList={notifItems} loading={notifLoading} onDismiss={handleDismissNotif} />}
          </div>

          {/* User chip — desktop/tablet */}
          {!isMobile && (
            <div
              onClick={() => setActivePage('profil')}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 10px 4px 5px', borderRadius: 5, border: '1px solid #E4E8EC', backgroundColor: activePage === 'profil' ? '#EEF1F7' : '#F7F7F4', flexShrink: 0, cursor: 'pointer', transition: 'background-color 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#EEF1F7')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = activePage === 'profil' ? '#EEF1F7' : '#F7F7F4')}
            >
              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: ACTIVE_CLR, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', system-ui", fontSize: 9.5, fontWeight: 700, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                {user.fotoUrl
                  ? <img src={user.fotoUrl} alt={user.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : user.initials
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 12, fontWeight: 600, color: NAVY, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{user.nama}</div>
                <div style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 10, color: SLATE }}>{ROLE_LABELS[user.role] ?? user.role}</div>
              </div>
            </div>
          )}
        </header>

        {/* ── Page content ──────────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 12 : 20, boxSizing: 'border-box', paddingBottom: 20 }}>
          {children}
        </main>
      </div>

    </div>
  );
}
