import { useState, useEffect, useMemo } from 'react';
import { Search, Download, ChevronDown, Clock, Shield, RefreshCw, Loader2 } from 'lucide-react';
import { auditLogApi, type AuditLog as ApiAuditLog, penggunaApi, type Pengguna } from '../services/api';
import { toast } from 'sonner';

const C = {
  navy:    '#064E3B', // Dark emerald/dark green
  sage:    '#0F9D74', // Emerald (consistent with Layout.tsx ACTIVE_CLR)
  amber:   '#C98A2C',
  slate:   '#7C8B93',
  brick:   '#B8483A',
  paper:   '#F7F7F4',
  border:  '#D8DDE1',
  divider: '#E4E8EC',
  bg:      '#FFFFFF',
};

const F = {
  heading: "'Poppins', 'Space Grotesk', system-ui, sans-serif",
  body:    "'Poppins', 'IBM Plex Sans', system-ui, sans-serif",
  mono:    "'IBM Plex Mono', 'Courier New', monospace",
};

const ACTION_CFG: Record<string, { label: string; color: string; bg: string }> = {
  tambah:  { label: 'Tambah',  color: C.sage,  bg: '#EAF6F2' },
  ubah:    { label: 'Ubah',    color: C.amber, bg: '#FBF4E8' },
  hapus:   { label: 'Hapus',   color: C.brick, bg: '#FDF2F0' },
  login:   { label: 'Login',   color: C.slate, bg: '#F0F2F3' },
  logout:  { label: 'Logout',  color: C.slate, bg: '#F0F2F3' },
  ekspor:  { label: 'Ekspor',  color: '#1E3A8A', bg: '#EFF6FF' }, // blue/navy for export
};

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  admin:         { label: 'Admin',       color: C.navy,  bg: '#EAF6F2' },
  apoteker:      { label: 'Apoteker',    color: C.sage,  bg: '#EAF6F2' },
  'staf-gudang': { label: 'Staf Gudang', color: C.slate, bg: '#F0F2F3' },
  kasir:         { label: 'Kasir',       color: C.amber, bg: '#FBF4E8' },
};

const MODULE_LABELS: Record<string, string> = {
  pengguna: 'Pengguna',
  obat: 'Obat',
  kategori: 'Kategori Obat',
  supplier: 'Supplier',
  'obat-masuk': 'Obat Masuk',
  'obat-keluar': 'Obat Keluar',
  pengaturan: 'Pengaturan Sistem',
  auth: 'Autentikasi',
  'audit-log': 'Audit Log',
};

function fmtTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtFullDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase();
}

function formatValue(val: any): string {
  if (val === undefined || val === null) return '—';
  if (typeof val === 'boolean') return val ? 'Ya' : 'Tidak';
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

function UserAvatar({ nama, role }: { nama: string; role: string }) {
  const isSystem = nama === 'Sistem';
  const roleColor = ROLE_CFG[role]?.color || C.slate;
  const roleBg = ROLE_CFG[role]?.bg || '#F0F2F3';

  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: isSystem ? '#EEF1F7' : roleBg,
      border: `1.5px solid ${isSystem ? C.navy : roleColor}22`,
      fontFamily: F.heading, fontWeight: 700,
      fontSize: 10, color: isSystem ? C.navy : roleColor,
      letterSpacing: '0.03em',
    }}>
      {isSystem ? '⚙' : initials(nama)}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CFG[role] || { label: role, color: C.slate, bg: '#F0F2F3' };
  return (
    <span style={{
      display: 'inline-block', padding: '1px 7px', borderRadius: '0 3px 3px 0',
      borderLeft: `2.5px solid ${cfg.color}`, backgroundColor: cfg.bg,
      fontFamily: F.body, fontSize: 10, fontWeight: 600, color: cfg.color,
      letterSpacing: '0.04em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const,
    }}>
      {cfg.label}
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CFG[action] || { label: action, color: C.slate, bg: '#F0F2F3' };
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 3,
      backgroundColor: cfg.bg, border: `1px solid ${cfg.color}33`,
      fontFamily: F.body, fontSize: 10, fontWeight: 700, color: cfg.color,
      letterSpacing: '0.05em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const,
    }}>
      {cfg.label}
    </span>
  );
}

function EntryDetail({ entry }: { entry: ApiAuditLog }) {
  const beforeKeys = entry.before ? Object.keys(entry.before) : [];
  const afterKeys = entry.after ? Object.keys(entry.after) : [];
  const allKeys = Array.from(new Set([...beforeKeys, ...afterKeys]));

  return (
    <div style={{
      marginTop: 10, borderRadius: 6, border: `1px solid ${C.divider}`,
      backgroundColor: C.paper, overflow: 'hidden',
    }}>
      {/* Meta info */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${C.divider}`,
        backgroundColor: '#FFFFFF',
      }}>
        <div style={{ flex: 1, padding: '8px 12px', borderRight: `1px solid ${C.divider}` }}>
          <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
            IP Address
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: C.navy }}>
            {entry.ip_address}
          </div>
        </div>
        <div style={{ flex: 1.5, padding: '8px 12px', borderRight: `1px solid ${C.divider}` }}>
          <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
            Perangkat / User Agent
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: C.navy }}>
            {entry.user_agent || '-'}
          </div>
        </div>
        <div style={{ flex: 1, padding: '8px 12px' }}>
          <div style={{ fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
            Modul
          </div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: C.navy, fontWeight: 600 }}>
            {MODULE_LABELS[entry.module] || entry.module}
          </div>
        </div>
      </div>

      {/* Changes list */}
      {allKeys.length > 0 ? (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr' }}>
            <div style={{ padding: '6px 12px', backgroundColor: '#F4F5F7', fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Field / Atribut
            </div>
            <div style={{ padding: '6px 12px', backgroundColor: '#FDF4F2', fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.brick, textTransform: 'uppercase', letterSpacing: '0.07em', borderLeft: `1px solid ${C.divider}` }}>
              Sebelum
            </div>
            <div style={{ padding: '6px 12px', backgroundColor: '#EEF5F2', fontFamily: F.body, fontSize: 9, fontWeight: 700, color: C.sage, textTransform: 'uppercase', letterSpacing: '0.07em', borderLeft: `1px solid ${C.divider}` }}>
              Sesudah
            </div>
          </div>
          {allKeys.map((field) => (
            <div key={field} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr', borderTop: `1px solid ${C.divider}` }}>
              <div style={{ padding: '5px 12px', fontFamily: F.body, fontSize: 11, color: C.slate }}>
                {field}
              </div>
              <div style={{ padding: '5px 12px', fontFamily: F.mono, fontSize: 11, color: C.brick, backgroundColor: '#FFF9F8', borderLeft: `1px solid ${C.divider}`, overflowX: 'auto' }}>
                {formatValue(entry.before?.[field])}
              </div>
              <div style={{ padding: '5px 12px', fontFamily: F.mono, fontSize: 11, color: C.sage, backgroundColor: '#F6FBF8', borderLeft: `1px solid ${C.divider}`, overflowX: 'auto' }}>
                {formatValue(entry.after?.[field])}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '8px 12px', fontFamily: F.body, fontSize: 11, color: C.slate, fontStyle: 'italic' }}>
          Tidak ada detail perubahan data (non-structural audit log).
        </div>
      )}
    </div>
  );
}

export function AuditLog() {
  const [logs, setLogs] = useState<ApiAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterUserId, setFilterUserId] = useState('');
  const [filterDari, setFilterDari] = useState('');
  const [filterSampai, setFilterSampai] = useState('');

  const [usersList, setUsersList] = useState<Pengguna[]>([]);
  
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Load daftar user untuk filter dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await penggunaApi.list({ per_page: 100 });
        setUsersList(res.data);
      } catch (err) {
        console.error('Gagal memuat daftar pengguna untuk filter', err);
      }
    };
    fetchUsers();
  }, []);

  const fetchLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await auditLogApi.list({
        page,
        per_page: 15,
        search: search.trim() || undefined,
        module: filterModule || undefined,
        action: (filterAction || undefined) as any,
        user_id: filterUserId ? parseInt(filterUserId) : undefined,
        dari: filterDari || undefined,
        sampai: filterSampai || undefined,
      });
      setLogs(res.data);
      setLastPage(res.meta.last_page);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat log audit');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filterModule, filterAction, filterUserId, filterDari, filterSampai]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    const url = auditLogApi.export({
      search: search.trim() || undefined,
      module: filterModule || undefined,
      action: (filterAction || undefined) as any,
      user_id: filterUserId ? parseInt(filterUserId) : undefined,
      dari: filterDari || undefined,
      sampai: filterSampai || undefined,
    }, format);
    window.open(url, '_blank');
  };

  // Group by date harian
  const groupedLogs = useMemo(() => {
    const groups: Record<string, ApiAuditLog[]> = {};
    logs.forEach(log => {
      const date = log.created_at ? log.created_at.split('T')[0] : 'Sebelumnya';
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return groups;
  }, [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: F.heading, fontSize: 18, fontWeight: 700, color: C.navy, margin: 0 }}>
            Audit Log Aktivitas
          </h2>
          <p style={{ fontFamily: F.body, fontSize: 13, color: C.slate, margin: '2px 0 0' }}>
            Riwayat lengkap seluruh aktivitas penting dalam sistem manajemen obat.
          </p>
        </div>
        <div style={{
          backgroundColor: '#EEF5F2', border: `1px solid ${C.sage}33`, borderRadius: 6,
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <Shield size={14} style={{ color: C.sage }} />
          <span style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.navy }}>
            {totalCount} Log Terdaftar
          </span>
        </div>
      </div>

      {/* Search & filters */}
      <div style={{
        backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Row 1: Search & dropdown filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.paper,
              border: `1px solid ${C.border}`, borderRadius: 4, padding: '6px 12px', flex: 1, minWidth: 200
            }}>
              <Search size={14} style={{ color: C.slate }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari deskripsi log..."
                style={{
                  background: 'none', border: 'none', outline: 'none', width: '100%',
                  fontFamily: F.body, fontSize: 13, color: C.navy
                }}
              />
            </div>

            <select
              value={filterModule}
              onChange={e => { setFilterModule(e.target.value); setPage(1); }}
              style={{
                padding: '8px 12px', borderRadius: 4, border: `1px solid ${C.border}`,
                backgroundColor: '#fff', fontSize: 13, fontFamily: F.body, color: C.navy, outline: 'none'
              }}
            >
              <option value="">Semua Modul</option>
              <option value="pengguna">Pengguna (Auth)</option>
              <option value="obat">Obat</option>
              <option value="kategori">Kategori Obat</option>
              <option value="supplier">Supplier</option>
              <option value="obat-masuk">Obat Masuk</option>
              <option value="obat-keluar">Obat Keluar</option>
              <option value="pengaturan">Pengaturan</option>
            </select>

            <select
              value={filterAction}
              onChange={e => { setFilterAction(e.target.value); setPage(1); }}
              style={{
                padding: '8px 12px', borderRadius: 4, border: `1px solid ${C.border}`,
                backgroundColor: '#fff', fontSize: 13, fontFamily: F.body, color: C.navy, outline: 'none'
              }}
            >
              <option value="">Semua Aksi</option>
              <option value="tambah">Tambah</option>
              <option value="ubah">Ubah</option>
              <option value="hapus">Hapus</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="ekspor">Ekspor</option>
            </select>

            <select
              value={filterUserId}
              onChange={e => { setFilterUserId(e.target.value); setPage(1); }}
              style={{
                padding: '8px 12px', borderRadius: 4, border: `1px solid ${C.border}`,
                backgroundColor: '#fff', fontSize: 13, fontFamily: F.body, color: C.navy, outline: 'none'
              }}
            >
              <option value="">Semua Pengguna</option>
              {usersList.map(u => (
                <option key={u.id} value={u.id}>{u.nama} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Row 2: Date Filters & Export */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', borderTop: `1px solid ${C.divider}`, paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontFamily: F.body, color: C.slate }}>Dari:</span>
              <input
                type="date"
                value={filterDari}
                onChange={e => { setFilterDari(e.target.value); setPage(1); }}
                style={{
                  padding: '7px 10px', borderRadius: 4, border: `1px solid ${C.border}`,
                  backgroundColor: '#fff', fontSize: 13, fontFamily: F.body, color: C.navy, outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontFamily: F.body, color: C.slate }}>Sampai:</span>
              <input
                type="date"
                value={filterSampai}
                onChange={e => { setFilterSampai(e.target.value); setPage(1); }}
                style={{
                  padding: '7px 10px', borderRadius: 4, border: `1px solid ${C.border}`,
                  backgroundColor: '#fff', fontSize: 13, fontFamily: F.body, color: C.navy, outline: 'none'
                }}
              />
            </div>

            {/* Clear date filters if filled */}
            {(filterDari || filterSampai) && (
              <button
                type="button"
                onClick={() => { setFilterDari(''); setFilterSampai(''); setPage(1); }}
                style={{
                  padding: '4px 8px', borderRadius: 4, border: 'none',
                  backgroundColor: '#fee2e2', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: F.body
                }}
              >
                Clear Tanggal
              </button>
            )}

            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                style={{
                  padding: '8px 12px', borderRadius: 4, border: `1px solid ${C.border}`,
                  backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontFamily: F.body, color: C.navy
                }}
              >
                <Download size={13} style={{ color: C.sage }} />
                <span>Ekspor CSV</span>
              </button>

              <button
                type="button"
                onClick={() => fetchLogs(true)}
                style={{
                  padding: '8px 12px', borderRadius: 4, border: `1px solid ${C.border}`,
                  backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}
                disabled={refreshing}
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', color: C.sage }} />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Logs timeline list */}
      <div style={{
        backgroundColor: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px', minHeight: 300,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260, gap: 8 }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: C.sage }} />
            <span style={{ fontFamily: F.body, fontSize: 13, color: C.slate }}>Memuat log aktivitas...</span>
          </div>
        ) : Object.keys(groupedLogs).length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
            <Clock size={32} style={{ color: C.slate, opacity: 0.5 }} />
            <span style={{ fontFamily: F.body, fontSize: 13, color: C.slate }}>Tidak ada log aktivitas ditemukan</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Object.entries(groupedLogs).map(([dateStr, entries], grpIdx) => (
              <div key={dateStr}>
                {/* Date header */}
                <div style={{ display: 'grid', gridTemplateColumns: '68px 22px 1fr', marginBottom: 6 }}>
                  <div />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {grpIdx > 0 && <div style={{ width: 2, flex: '0 0 10px', backgroundColor: C.divider }} />}
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%',
                      backgroundColor: '#fff', border: `2.5px solid ${C.navy}`,
                      zIndex: 1,
                    }} />
                    <div style={{ width: 2, flex: 1, backgroundColor: C.divider, minHeight: 6 }} />
                  </div>
                  <div style={{ paddingLeft: 10, paddingTop: 4 }}>
                    <span style={{ fontFamily: F.heading, fontSize: 13, fontWeight: 700, color: C.navy }}>
                      {dateStr === 'Sebelumnya' ? dateStr : fmtFullDate(dateStr)}
                    </span>
                    <span style={{ fontFamily: F.body, fontSize: 11, color: C.slate, marginLeft: 8 }}>
                      ({entries.length} aktivitas)
                    </span>
                  </div>
                </div>

                {/* Entry lines */}
                {entries.map((entry, entryIdx) => {
                  const isLast = entryIdx === entries.length - 1;
                  const isExpanded = expandedIds.has(entry.id);
                  const dotColor = ACTION_CFG[entry.action]?.color || C.slate;
                  const userNama = entry.user?.nama || 'Sistem / Anonim';
                  const userRole = entry.user?.role || 'admin';

                  return (
                    <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '68px 22px 1fr' }}>
                      <div style={{ textAlign: 'right', paddingRight: 10, paddingTop: 8 }}>
                        <span style={{ fontFamily: F.mono, fontSize: 10.5, color: C.slate }}>
                          {entry.created_at ? fmtTime(entry.created_at) : '-'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 2, flex: '0 0 8px', backgroundColor: C.divider }} />
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          backgroundColor: dotColor, border: '2.5px solid #fff',
                          zIndex: 1, boxShadow: `0 0 0 2px ${dotColor}30`,
                        }} />
                        <div style={{ width: 2, flex: 1, backgroundColor: isLast && !isExpanded ? 'transparent' : C.divider, minHeight: 8 }} />
                      </div>

                      <div style={{ paddingLeft: 10, paddingBottom: 10, paddingTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <UserAvatar nama={userNama} role={userRole} />
                          <span style={{ fontFamily: F.body, fontSize: 12.5, fontWeight: 600, color: C.navy }}>
                            {userNama}
                          </span>
                          {entry.user && <RoleBadge role={userRole} />}
                          <ActionBadge action={entry.action} />
                          <span style={{ fontFamily: F.body, fontSize: 12, color: '#334155', flex: 1, minWidth: 160 }}>
                            {entry.description}
                          </span>
                          <button
                            onClick={() => toggleExpand(entry.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 3,
                              fontSize: 11, fontFamily: F.body, fontWeight: 600,
                              color: isExpanded ? C.sage : C.slate,
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '2px 6px', borderRadius: 3,
                              backgroundColor: isExpanded ? '#EDF3F1' : 'transparent',
                            }}
                          >
                            {isExpanded ? 'Tutup' : 'Detail'}
                            <ChevronDown size={12} style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                          </button>
                        </div>

                        {isExpanded && (
                          <div style={{ paddingBottom: 6 }}>
                            <EntryDetail entry={entry} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTop: `1px solid ${C.divider}` }}>
          <span style={{ fontFamily: F.body, fontSize: 12, color: C.slate }}>
            Halaman {page} dari {lastPage}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              style={{
                padding: '6px 12px', border: `1px solid ${C.border}`, borderRadius: 4,
                backgroundColor: '#fff', fontSize: 12, fontFamily: F.body, cursor: 'pointer',
                opacity: page === 1 ? 0.5 : 1
              }}
            >
              Kembali
            </button>
            <button
              disabled={page === lastPage}
              onClick={() => setPage(p => p + 1)}
              style={{
                padding: '6px 12px', border: `1px solid ${C.border}`, borderRadius: 4,
                backgroundColor: '#fff', fontSize: 12, fontFamily: F.body, cursor: 'pointer',
                opacity: page === lastPage ? 0.5 : 1
              }}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
