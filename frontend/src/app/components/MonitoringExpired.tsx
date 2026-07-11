import { useState, useEffect } from 'react';
import {
  AlertTriangle, AlertCircle, Clock, CheckCircle2, Search,
  X, Calendar, Loader2, RefreshCw, Settings
} from 'lucide-react';
import { monitoringApi, type MonitoringItem } from '../services/api';
import { toast } from 'sonner';
import type { Page } from './data';

interface MonitoringExpiredProps {
  setActivePage: (page: Page) => void;
}

const tabs = [
  { key: 'kritis', label: 'Kritis', color: 'text-amber-600' },
  { key: 'near', label: 'Akan Expired', color: 'text-orange-600' },
  { key: 'expired', label: 'Sudah Expired', color: 'text-red-600' },
] as const;

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    expired: 'bg-red-100 text-red-700 border border-red-200',
    'near-30': 'bg-orange-100 text-orange-700 border border-orange-200',
    'near-90': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    aman: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  };
  const labelMap: Record<string, string> = {
    expired: 'Expired',
    'near-30': '< 30 Hari',
    'near-90': 'Mendekati',
    aman: 'Aman',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100'}`}>
      {labelMap[status] || status}
    </span>
  );
}

function SisaHariBar({ sisaHari }: { sisaHari: number | null }) {
  if (sisaHari === null) return <span className="text-xs text-gray-400">-</span>;
  if (sisaHari < 0) return <span className="text-xs font-semibold text-red-600 font-mono">Expired {Math.abs(sisaHari)} hari lalu</span>;
  if (sisaHari === 0) return <span className="text-xs font-semibold text-red-600 font-mono">Hari ini</span>;
  
  const color = sisaHari <= 7 ? '#EF4444' : sisaHari <= 30 ? '#F97316' : sisaHari <= 90 ? '#EAB308' : '#0F9D74';
  const max = Math.max(sisaHari, 365);
  const pct = Math.min((sisaHari / max) * 100, 100);
  return (
    <div className="flex items-center gap-2 min-w-24">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-mono font-medium" style={{ color }}>{sisaHari}h</span>
    </div>
  );
}

export function MonitoringExpired({ setActivePage }: MonitoringExpiredProps) {
  const [activeTab, setActiveTab] = useState<'kritis' | 'expired' | 'near'>('kritis');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<MonitoringItem[]>([]);
  const [summary, setSummary] = useState<{
    stok_kritis: number;
    stok_habis: number;
    expired: number;
    near_30: number;
    near_90: number;
  } | null>(null);
  const [showActionModal, setShowActionModal] = useState<MonitoringItem | null>(null);

  const fetchSummary = async () => {
    try {
      const res = await monitoringApi.summary();
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchItems = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      if (activeTab === 'kritis') {
        const res = await monitoringApi.kritis({ page: 1, per_page: 200 });
        setItems(res.data);
      } else {
        const res = await monitoringApi.expired({
          page: 1,
          per_page: 200,
          status: activeTab === 'near' ? 'near' : 'expired'
        });
        setItems(res.data);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat monitoring');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const filtered = items.filter(e => {
    const s = search.toLowerCase();
    return !s ||
      e.nama.toLowerCase().includes(s) ||
      e.kode.toLowerCase().includes(s);
  });

  const getTabCount = (key: 'kritis' | 'expired' | 'near') => {
    if (!summary) return 0;
    if (key === 'kritis') return summary.stok_kritis + summary.stok_habis;
    if (key === 'expired') return summary.expired;
    if (key === 'near') return summary.near_30 + summary.near_90;
    return 0;
  };

  return (
    <div className="space-y-5">
      {/* Header & Quick Route Links */}
      <div className="flex justify-between items-center bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="text-amber-500 w-5 h-5" />
            Monitoring Stok Kritis &amp; Expired
          </h1>
          <p className="text-xs text-slate-500 mt-1">Daftar barang yang membutuhkan perhatian segera berdasarkan kondisi stok dan tanggal kadaluarsa.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActivePage('pengaturan')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Settings size={13} /> Pengaturan Batasan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tabs.map(({ key, label, color }) => {
          const count = getTabCount(key);
          const isSelected = activeTab === key;
          const bgMap = {
            kritis: 'bg-amber-50 border-amber-100 hover:border-amber-300',
            expired: 'bg-red-50 border-red-100 hover:border-red-300',
            near: 'bg-orange-50 border-orange-100 hover:border-orange-300',
          };
          const borderSelectedMap = {
            kritis: 'border-amber-400 ring-2 ring-amber-400/20',
            expired: 'border-red-400 ring-2 ring-red-400/20',
            near: 'border-orange-400 ring-2 ring-orange-400/20',
          };

          return (
            <div
              key={key}
              onClick={() => setActiveTab(key)}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                isSelected ? borderSelectedMap[key] : bgMap[key]
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold uppercase tracking-wider ${color}`}>{label}</span>
                <span className={`text-2xl font-bold ${color}`}>{count}</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-medium">Klik untuk menyaring daftar di bawah</p>
            </div>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-48">
            <Search size={14} className="text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              type="text"
              placeholder="Cari nama atau kode barang…"
              className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
            />
          </div>
          <button 
            onClick={() => { fetchSummary(); fetchItems(true); }}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors ml-auto"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Perbarui
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {tabs.map(({ key, label, color }) => {
            const count = getTabCount(key);
            const isSelected = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  isSelected
                    ? 'border-emerald-600 text-emerald-700 font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  isSelected ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table List */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <span className="ml-2 text-slate-600 font-medium">Memuat data monitoring...</span>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100">
                  {activeTab === 'kritis' ? (
                    ['Nama Barang', 'Golongan/Jenis', 'Stok Saat Ini', 'Stok Minimum', 'Status Stok', 'Aksi'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))
                  ) : (
                    ['Nama Barang', 'Tgl. Expired', 'Sisa Hari', 'Stok Unit', 'Status Kedaluwarsa', 'Aksi'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(item => {
                  const isStockCritical = item.stok <= item.stok_minimum;
                  const isCriticalTab = activeTab === 'kritis';
                  
                  return (
                    <tr 
                      key={item.obat_id} 
                      className={`hover:bg-gray-50/50 transition-colors ${
                        item.status_exp === 'expired' ? 'bg-red-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-800 text-sm">{item.nama}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{item.kode}</div>
                      </td>
                      
                      {!isCriticalTab ? (
                        <>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} className="text-gray-400" />
                              {item.expired_date ? new Date(item.expired_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <SisaHariBar sisaHari={item.hari_expired} />
                          </td>
                          <td className="px-4 py-3 text-gray-700 font-semibold text-sm">{item.stok}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={item.status_exp || 'aman'} />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <span className="text-xs border px-2 py-0.5 rounded-md capitalize bg-slate-50">{item.golongan?.replace('-', ' ') || 'Bebas'}</span>
                          </td>
                          <td className="px-4 py-3 text-red-600 font-semibold text-sm">{item.stok}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">{item.stok_minimum}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                              item.stok === 0 
                                ? 'bg-red-100 text-red-700 border-red-200' 
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                              {item.stok === 0 ? 'Habis' : 'Stok Kritis'}
                            </span>
                          </td>
                        </>
                      )}

                      <td className="px-4 py-3">
                        <button
                          onClick={() => setShowActionModal(item)}
                          className={`text-xs px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                            activeTab === 'expired'
                              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          Tindak Lanjut
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                      <CheckCircle2 size={32} className="mx-auto mb-2 text-gray-200" />
                      Tidak ada data monitoring ditemukan pada filter ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Action Modal with Quick Route Redirects */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800">Tindak Lanjut Cepat</h2>
              <button onClick={() => setShowActionModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <p className="font-bold text-slate-800 text-sm">{showActionModal.nama}</p>
                <p className="text-xs text-slate-500 mt-1">Kode: {showActionModal.kode}</p>
                <p className="text-xs text-slate-500">Stok Saat Ini: <span className="font-semibold text-slate-700">{showActionModal.stok}</span> unit (Min: {showActionModal.stok_minimum})</p>
                {showActionModal.expired_date && (
                  <p className="text-xs text-slate-500">Kedaluwarsa: <span className="font-semibold text-red-600">{showActionModal.expired_date}</span></p>
                )}
              </div>
              
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Aksi Cepat Navigasi</p>
              
              <div className="space-y-2">
                {activeTab === 'kritis' ? (
                  <>
                    <button
                      onClick={() => {
                        setShowActionModal(null);
                        setActivePage('master-barang');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-sm font-semibold text-gray-700 transition-colors flex items-center justify-between"
                    >
                      <span>Update Stok Minimum (Master Barang)</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">Navigasi</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowActionModal(null);
                        setActivePage('stock-barang');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-sm font-semibold text-gray-700 transition-colors flex items-center justify-between"
                    >
                      <span>Restock Barang Baru (Stock Barang)</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">Navigasi</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setShowActionModal(null);
                        setActivePage('transaksi');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-sm font-semibold text-gray-700 transition-colors flex items-center justify-between"
                    >
                      <span>Retur / Buang Barang (Transaksi Keluar)</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">Navigasi</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowActionModal(null);
                        setActivePage('master-barang');
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-sm font-semibold text-gray-700 transition-colors flex items-center justify-between"
                    >
                      <span>Detail Informasi Barang (Master Barang)</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">Navigasi</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
