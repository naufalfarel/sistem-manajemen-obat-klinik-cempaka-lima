import { useState, useEffect } from 'react';
import {
  Package, Archive, Truck, Activity, ArrowDownCircle, ArrowUpCircle,
  AlertTriangle, PackagePlus, PackageMinus, UserPlus, Plus,
  AlertCircle, Clock, ChevronRight, Loader2, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { dashboardApi, monitoringApi, type DashboardSummary } from '../services/api';
import type { Page } from './data';

/* ── Design tokens ──────────────────────────────────────────────────────────── */
const C = {
  navy:   '#1B2A45',
  sage:   '#4F7A6B',
  amber:  '#C98A2C',
  slate:  '#7C8B93',
  brick:  '#B8483A',
  paper:  '#F7F7F4',
  border: '#D8DDE1',
  div:    '#E4E8EC',
};
const F = {
  head: "'Space Grotesk', system-ui, sans-serif",
  body: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};

const PIE_COLORS = ['#4F7A6B', '#C98A2C', '#1B2A45', '#7C8B93', '#B8483A', '#8B5CF6', '#EC4899', '#EF4444'];

/* ── Stat card ──────────────────────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
  color: string;
  loading: boolean;
}

function StatCard({ label, value, sub, icon: Icon, color, loading }: StatCardProps) {
  return (
    <div style={{
      backgroundColor: '#fff',
      border: `1px solid ${C.border}`,
      borderTop: `3px solid ${color}`,
      borderRadius: 4,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 4,
          backgroundColor: color + '14',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
      <div>
        <div style={{ fontFamily: F.mono, fontSize: 22, fontWeight: 700, color: C.navy, lineHeight: 1 }}>
          {loading ? (
            <Loader2 size={18} className="animate-spin text-slate-400" style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }} />
          ) : (
            value
          )}
        </div>
        <div style={{ fontFamily: F.body, fontSize: 11, color: C.slate, marginTop: 3 }}>{sub}</div>
        <div style={{ fontFamily: F.body, fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Section card wrapper ───────────────────────────────────────────────────── */
function Card({ title, subtitle, action, children }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ backgroundColor: '#fff', border: `1px solid ${C.border}`, borderRadius: 4, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 16px',
        borderBottom: `1px solid ${C.div}`,
        backgroundColor: C.paper,
      }}>
        <div>
          <span style={{ fontFamily: F.head, fontSize: 13, fontWeight: 700, color: C.navy }}>{title}</span>
          {subtitle && (
            <span style={{ fontFamily: F.body, fontSize: 11, color: C.slate, marginLeft: 8 }}>{subtitle}</span>
          )}
        </div>
        {action}
      </div>
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}

interface NotificationItem {
  id: string;
  message: string;
  time: string;
  severity: 'red' | 'orange' | 'yellow';
}

interface MonitoringSummary {
  stok_kritis: number;
  stok_habis: number;
  expired: number;
  near_30: number;
  near_90: number;
}

export function Dashboard({ setActivePage }: { setActivePage: (page: Page) => void }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monitoringSum, setMonitoringSum] = useState<MonitoringSummary | null>(null);
  const [chartData, setChartData] = useState<{ label: string; masuk: number; keluar: number }[]>([]);
  const [kategoriData, setKategoriData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expiredDays, setExpiredDays] = useState<number>(30);

  const fetchDashboardData = async (isSilent = false, days = expiredDays) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Ambil Ringkasan/Summary Dashboard dengan parameter expiredDays
      const summaryRes = await dashboardApi.summary(days);
      setSummary(summaryRes.data);

      // 2. Ambil Monitoring Summary (untuk expired near_30 dan near_90)
      const monitorSumRes = await monitoringApi.summary();
      setMonitoringSum(monitorSumRes.data);

      // 3. Ambil Chart Penjualan (Bulan ini)
      const now = new Date();
      const chartRes = await dashboardApi.chartPenjualan(now.getMonth() + 1, now.getFullYear());
      setChartData(chartRes.data);

      // 4. Ambil Stok per Kategori
      const kategoriRes = await dashboardApi.stockByKategori();
      const categoriesMapped = kategoriRes.data.map((item, index) => ({
        name: item.name,
        value: item.value,
        color: PIE_COLORS[index % PIE_COLORS.length]
      }));
      setKategoriData(categoriesMapped);

      // 5. Generate Notifikasi dinamis berdasarkan obat kritis & expired
      const notifList: NotificationItem[] = [];
      
      const kritisRes = await monitoringApi.kritis({ page: 1, per_page: 5 });
      kritisRes.data.forEach((item) => {
        notifList.push({
          id: `kritis-${item.obat_id}`,
          message: `${item.nama} (${item.kode}) stok kritis! Tersisa ${item.stok} unit (minimum: ${item.stok_minimum}).`,
          time: 'Baru saja',
          severity: item.stok === 0 ? 'red' : 'orange'
        });
      });

      const expiredRes = await monitoringApi.expired({ page: 1, per_page: 5, status: 'expired' });
      expiredRes.data.forEach((item) => {
        notifList.push({
          id: `expired-${item.obat_id}`,
          message: `${item.nama} (${item.kode}) telah melewati tanggal kedaluwarsa (${item.expired_date})!`,
          time: 'Hari ini',
          severity: 'red'
        });
      });

      const near30Res = await monitoringApi.expired({ page: 1, per_page: 5, status: 'near-30' });
      near30Res.data.forEach((item) => {
        notifList.push({
          id: `near-30-${item.obat_id}`,
          message: `${item.nama} (${item.kode}) mendekati kedaluwarsa dalam kurang dari 30 hari (${item.expired_date}).`,
          time: 'Kemarin',
          severity: 'yellow'
        });
      });

      setNotifications(notifList.slice(0, 5)); // Batasi maksimal 5 notifikasi saja
    } catch (err) {
      console.error('Gagal memuat data dashboard', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false, expiredDays);
  }, [expiredDays]);

  const totalStock = kategoriData.reduce((s, c) => s + c.value, 0);

  const stats = [
    { label: 'Total Obat (Jenis)', value: summary?.total_jenis_obat ?? 0,    sub: 'terdaftar aktif',     icon: Package,       color: C.navy  },
    { label: 'Total Kategori',     value: summary?.total_kategori ?? 0,      sub: 'kategori terdaftar',  icon: Archive,       color: C.sage  },
    { label: 'Stok Kritis & Habis', value: summary?.stok_kritis ?? 0,        sub: 'perlu re-order',      icon: AlertTriangle, color: C.brick },
    { label: `Kedaluwarsa < ${expiredDays} Hari`, value: summary?.near_expired ?? 0, sub: `dalam ${expiredDays} hari ke depan`, icon: Clock, color: C.amber },
    { label: 'Transaksi Masuk (Bulan Ini)', value: summary?.transaksi_masuk_bulan_ini ?? 0, sub: 'bulan berjalan', icon: ArrowDownCircle, color: C.sage },
    { label: 'Transaksi Keluar (Bulan Ini)', value: summary?.transaksi_keluar_bulan_ini ?? 0, sub: 'bulan berjalan', icon: ArrowUpCircle, color: C.brick },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: F.head, fontSize: 20, fontWeight: 700, color: C.navy, margin: 0 }}>
          Dashboard Ringkasan
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600, color: C.slate }}>Ambang Expired:</span>
            <select
              value={expiredDays}
              onChange={e => setExpiredDays(Number(e.target.value))}
              style={{
                padding: '5px 10px',
                fontSize: 11,
                fontFamily: F.body,
                fontWeight: 600,
                color: C.navy,
                backgroundColor: '#fff',
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={30}>30 Hari</option>
              <option value={60}>60 Hari</option>
              <option value={90}>90 Hari</option>
            </select>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', border: `1px solid ${C.border}`,
              borderRadius: 4, backgroundColor: '#fff', cursor: 'pointer',
              fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.navy,
              transition: 'background-color 0.12s'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.paper}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fff'}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Perbarui Data
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {summary && (summary.stok_kritis > 0 || summary.expired > 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          backgroundColor: '#FDF2F0',
          border: `1px solid ${C.brick}33`,
          borderLeft: `4px solid ${C.brick}`,
          borderRadius: 4,
        }}>
          <AlertCircle size={15} style={{ color: C.brick, flexShrink: 0 }} />
          <span style={{ fontFamily: F.body, fontSize: 12.5, color: '#7F1D1D', flex: 1 }}>
            Perhatian:{' '}
            {summary.expired > 0 && <strong>{summary.expired} obat expired </strong>}
            {summary.expired > 0 && summary.stok_kritis > 0 && 'dan '}
            {summary.stok_kritis > 0 && <strong>{summary.stok_kritis} obat stok kritis </strong>}
            memerlukan tindakan segera.
          </span>
          <button
            onClick={() => setActivePage('monitoring-expired')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.brick,
              display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            Lihat Detail <ChevronRight size={12} />
          </button>
        </div>
      )}

      {/* Stat cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {stats.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }} className="dash-chart-grid">
        <style>{`@media (max-width: 900px) { .dash-chart-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* Bar chart */}
        <Card
          title="Nilai Transaksi Harian"
          subtitle="Obat Masuk vs Keluar Bulan Ini (Rupiah)"
          action={
            <span style={{
              fontFamily: F.mono, fontSize: 10.5, color: C.slate,
              padding: '2px 8px', borderRadius: 3,
              border: `1px solid ${C.border}`, backgroundColor: C.paper,
            }}>
              Real-time
            </span>
          }
        >
          {loading ? (
            <div style={{ height: 195, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: C.sage }} />
            </div>
          ) : chartData.length === 0 ? (
            <div style={{ height: 195, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body, fontSize: 12, color: C.slate }}>
              Tidak ada data transaksi bulan ini
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={195}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.div} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: C.slate, fontFamily: F.body }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: C.slate, fontFamily: F.body }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(1)}jt` : value >= 1000 ? `${value/1000}rb` : value}
                />
                <Tooltip
                  formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`]}
                  contentStyle={{ borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: F.body }}
                  cursor={{ fill: C.paper }}
                />
                <Legend
                  iconType="square" iconSize={9}
                  wrapperStyle={{ fontSize: 11, paddingTop: 10, fontFamily: F.body }}
                />
                <Bar dataKey="masuk"  name="Nilai Masuk"  fill={C.sage}  radius={[3, 3, 0, 0]} maxBarSize={16} />
                <Bar dataKey="keluar" name="Nilai Keluar (Penjualan)" fill={C.amber} radius={[3, 3, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Donut chart */}
        <div className="dash-donut">
          <Card title="Stok per Kategori" subtitle={`${totalStock.toLocaleString('id-ID')} unit`}>
            {loading ? (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: C.sage }} />
              </div>
            ) : kategoriData.length === 0 ? (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.body, fontSize: 12, color: C.slate }}>
                Belum ada data obat
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={kategoriData}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={62}
                      paddingAngle={3} dataKey="value"
                    >
                      {kategoriData.map((entry, i) => (
                        <Cell key={`c-${i}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [v.toLocaleString('id-ID') + ' unit']}
                      contentStyle={{ borderRadius: 4, border: `1px solid ${C.border}`, fontSize: 11, fontFamily: F.body }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4, maxHeight: 110, overflowY: 'auto' }}>
                  {kategoriData.map(({ name, value, color }) => (
                    <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 1, backgroundColor: color, flexShrink: 0 }} />
                        <span style={{ fontFamily: F.body, fontSize: 11, color: '#475569' }}>{name}</span>
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 11, color: C.navy, fontWeight: 500 }}>
                        {value.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }} className="dash-bottom-grid">
        <style>{`@media (max-width: 900px) { .dash-bottom-grid { grid-template-columns: 1fr !important; } }`}</style>

        {/* Notifications */}
        <Card
          title="Peringatan &amp; Notifikasi Sistem"
          action={
            <button
              onClick={() => setActivePage('monitoring-expired')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: F.body, fontSize: 12, fontWeight: 600, color: C.sage,
                display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              Lihat semua <ChevronRight size={12} />
            </button>
          }
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: C.sage }} />
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={16} style={{ color: '#16A34A' }} />
              </div>
              <span style={{ fontFamily: F.body, fontSize: 12, color: C.slate }}>
                Semua aman! Tidak ada peringatan sistem saat ini.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {notifications.map((n) => {
                const borderLeftColor = n.severity === 'red' ? C.brick : n.severity === 'orange' ? C.amber : '#D97706';
                return (
                  <div key={n.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '9px 12px',
                    backgroundColor: C.paper,
                    border: `1px solid ${C.div}`,
                    borderLeft: `3px solid ${borderLeftColor}`,
                    borderRadius: '0 3px 3px 0',
                  }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: F.body, fontSize: 12, color: '#334155', margin: 0, lineHeight: 1.45 }}>
                        {n.message}
                      </p>
                    </div>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      fontFamily: F.mono, fontSize: 10, color: C.slate, flexShrink: 0, marginTop: 1,
                    }}>
                      <Clock size={10} />{n.time}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Quick Actions */}
          <Card title="Aksi Cepat">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Tambah Obat',      icon: Plus,        page: 'master-obat' as Page, color: C.navy  },
                { label: 'Tambah Supplier',  icon: UserPlus,    page: 'supplier'    as Page, color: C.slate },
                { label: 'Penerimaan Obat',  icon: PackagePlus, page: 'obat-masuk'  as Page, color: C.sage  },
                { label: 'Pengeluaran Obat', icon: PackageMinus,page: 'obat-keluar' as Page, color: C.amber },
              ].map(({ label, icon: Icon, page, color }) => (
                <button
                  key={label}
                  onClick={() => setActivePage(page)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                    padding: '10px 6px',
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    backgroundColor: '#fff', cursor: 'pointer',
                    transition: 'border-color 0.12s, background-color 0.12s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = color + '66';
                    e.currentTarget.style.backgroundColor = color + '08';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 4,
                    backgroundColor: color + '14',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} style={{ color }} />
                  </div>
                  <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 600, color: '#475569', lineHeight: 1.3, textAlign: 'center' }}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Expired summary */}
          <Card title="Ringkasan Expired">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { label: 'Sudah Expired', count: monitoringSum?.expired ?? 0, color: C.brick, bg: '#FDF2F0' },
                { label: '< 30 Hari',     count: monitoringSum?.near_30 ?? 0,  color: C.amber, bg: '#FBF4E8' },
                { label: '30 – 90 Hari',  count: monitoringSum?.near_90 ?? 0,  color: '#D97706', bg: '#FEFCE8' },
              ].map(({ label, count, color, bg }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyComposite: 'space-between', justifyContent: 'space-between',
                  padding: '7px 10px', borderRadius: 3,
                  backgroundColor: bg,
                  border: `1px solid ${color}22`,
                  borderLeft: `3px solid ${color}`,
                }}>
                  <span style={{ fontFamily: F.body, fontSize: 12, color: '#475569' }}>{label}</span>
                  <span style={{ fontFamily: F.mono, fontSize: 14, fontWeight: 700, color }}>{count}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setActivePage('monitoring-expired')}
              style={{
                marginTop: 10, width: '100%', padding: '7px 0',
                borderRadius: 4, cursor: 'pointer',
                border: `1px solid ${C.sage}`,
                backgroundColor: '#EDF3F1',
                fontFamily: F.body, fontSize: 12.5, fontWeight: 600, color: C.sage,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                transition: 'background-color 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.sage, e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#EDF3F1', e.currentTarget.style.color = C.sage)}
            >
              <AlertTriangle size={13} />
              Kelola Monitoring
            </button>
          </Card>
        </div>
      </div>
      {/* Keyframe animation for spinner */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
