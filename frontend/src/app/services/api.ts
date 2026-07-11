/**
 * Pharmacy API Service — Laravel Sanctum backend
 *
 * Base URL dikonfigurasi via environment variable:
 *   VITE_API_URL=http://localhost:8000/api
 *
 * Autentikasi: Bearer token (Laravel Sanctum)
 * Token disimpan di localStorage key: `smo_token`
 *
 * Semua response Laravel Resource mengikuti format:
 *   { data: T, message?: string }
 *
 * Pagination mengikuti Laravel default paginator:
 *   { data: T[], meta: {...}, links: {...} }
 */

/* ── Configuration ──────────────────────────────────────────────────────────── */

const API_BASE = (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_API_URL
  ?? 'http://localhost:8000/api';

const TOKEN_KEY = 'smo_token';

/* ── Token helpers ──────────────────────────────────────────────────────────── */

export const token = {
  get:   (): string | null => localStorage.getItem(TOKEN_KEY),
  set:   (t: string)       => localStorage.setItem(TOKEN_KEY, t),
  clear: ()                => localStorage.removeItem(TOKEN_KEY),
};

/* ── Shared response types ──────────────────────────────────────────────────── */

/** Laravel paginator response */
export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    from:         number;
    last_page:    number;
    per_page:     number;
    to:           number;
    total:        number;
    path:         string;
  };
  links: {
    first: string;
    last:  string;
    prev:  string | null;
    next:  string | null;
  };
}

/** Single resource response */
export interface ApiResponse<T> {
  data:     T;
  message?: string;
}

/** Validation error (HTTP 422) */
export interface ValidationErrors {
  message: string;
  errors:  Record<string, string[]>;
}

/** Generic API error thrown by the client */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/* ── Base HTTP client ───────────────────────────────────────────────────────── */

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: any): Promise<T> {
  const t = token.get();
  const headers: Record<string, string> = {
    'Accept':       'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  const isFormData = body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (t) headers['Authorization'] = `Bearer ${t}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const json = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));

  if (!res.ok) {
    throw new ApiError(
      json.message ?? `HTTP ${res.status}`,
      res.status,
      json.errors,
    );
  }

  return json as T;
}

/* ── Query string builder ───────────────────────────────────────────────────── */

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DOMAIN TYPES — mirrors Laravel API Resources
   ═══════════════════════════════════════════════════════════════════════════════ */

export interface AuthUser {
  id:         number;
  nama:       string;
  username:   string;
  email:      string;
  foto_url:   string | null;
  role:       'admin' | 'apoteker' | 'staf-gudang' | 'kasir';
  status:     'aktif' | 'nonaktif';
  created_at: string;
  updated_at: string;
}

export interface KategoriObat {
  id:          number;
  nama:        string;
  kode:        string;
  deskripsi:   string | null;
  jumlah_obat: number;
  created_at:  string;
}

export interface Obat {
  id:                  number;
  kode:                string;
  nama:                string;
  nama_generik:        string | null;
  kategori_id:         number;
  kategori:            KategoriObat;
  satuan:              string;
  stok:                number;
  stok_minimum:        number;
  harga_beli:          number;
  harga_jual:          number;
  golongan:            'bebas' | 'bebas-terbatas' | 'keras' | 'narkotika' | 'psikotropika';
  lokasi_rak:          string | null;
  expired_date:        string | null;
  status:              'aktif' | 'nonaktif';
  supplier_id?:        number | null;
  supplier?:           Supplier | null;
  foto?:               string | null;
  created_at:          string;
  updated_at:          string;
}

export interface Supplier {
  id:                number;
  kode:              string;
  nama:              string;
  alamat:            string;
  kota:              string;
  telepon:           string;
  email:             string | null;
  pic:               string;
  npwp:              string | null;
  no_izin_pbf:       string | null;
  sertifikat_cdob:   string | null;
  exp_izin_pbf:      string | null;
  exp_cdob:          string | null;
  termin_pembayaran: 'cash' | 'tempo30' | 'tempo60' | 'tempo90';
  lead_time:         number;
  status:            'aktif' | 'nonaktif' | 'blacklist';
  foto?:             string | null;
  jumlah_obat_masuk?: number;
  created_at:        string;
  updated_at:        string;
}

export interface ObatMasukItem {
  id:           number;
  obat_id:      number;
  obat?:        Pick<Obat, 'id' | 'kode' | 'nama' | 'satuan'>;
  jumlah:       number;
  harga_satuan: number;
  subtotal:     number;
  no_batch?:    string | null;
  expired_date?: string | null;
}

export interface ObatMasuk {
  id:                number;
  no_transaksi:      string;
  tanggal:           string;
  supplier_id:       number;
  supplier:          Pick<Supplier, 'id' | 'nama' | 'kode'>;
  total_item:        number;
  nilai_total:       number;
  status:            'draft' | 'diterima' | 'sebagian' | 'dikembalikan';
  petugas_id:        number;
  petugas:           Pick<AuthUser, 'id' | 'nama'>;
  catatan:           string | null;
  foto_nota?:        string | null;
  items?:            ObatMasukItem[];
  created_at:        string;
}

export interface ObatKeluarItem {
  obat_id:   number;
  obat:      Pick<Obat, 'id' | 'kode' | 'nama' | 'satuan'>;
  jumlah:    number;
  harga:     number;
  subtotal:  number;
}

export interface ObatKeluar {
  id:            number;
  no_transaksi:  string;
  tanggal:       string;
  pasien:        string;
  dokter:        string | null;
  tipe_resep:    'racik' | 'non-racik' | null;
  metode_bayar:  'cash' | 'qris' | 'debit' | 'kredit' | 'bpjs';
  total:         number;
  status:        'selesai' | 'retur' | 'void';
  kasir_id:      number;
  kasir:         Pick<AuthUser, 'id' | 'nama'>;
  items:         ObatKeluarItem[];
  created_at:    string;
  riwayat_cetak?: { id: number; jenis: 'nota' | 'resep' | 'copy_resep'; actor: string; created_at: string }[];
}

export interface AuditLogEntry {
  id:          number;
  user_id:     number;
  user:        Pick<AuthUser, 'id' | 'nama' | 'username' | 'role'>;
  action:      'tambah' | 'ubah' | 'hapus' | 'login' | 'logout' | 'ekspor';
  module:      string;
  description: string;
  ip_address:  string;
  user_agent:  string;
  before:      Record<string, string> | null;
  after:       Record<string, string> | null;
  created_at:  string;
}

export interface Pengguna {
  id:         number;
  nama:       string;
  username:   string;
  email:      string;
  nip:        string | null;
  foto:       string | null;
  foto_url:   string | null;
  role:       'admin' | 'apoteker' | 'staf-gudang' | 'kasir';
  status:     'aktif' | 'nonaktif';
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

/* ═══════════════════════════════════════════════════════════════════════════════
   API ENDPOINTS
   ═══════════════════════════════════════════════════════════════════════════════ */

/* ── Authentication (Laravel Sanctum) ──────────────────────────────────────── */

export const authApi = {
  /** POST /auth/login → { token, user } */
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>('POST', '/auth/login', { email, password }),

  /** POST /auth/logout */
  logout: () => request<void>('POST', '/auth/logout'),

  /** GET /auth/me */
  me: () => request<ApiResponse<AuthUser>>('GET', '/auth/me'),

  /** POST /auth/refresh */
  refresh: () => request<{ token: string }>('POST', '/auth/refresh'),

  /** POST /auth/profile */
  updateProfile: (data: FormData) => request<ApiResponse<AuthUser>>('POST', '/auth/profile', data),

  /** PATCH /auth/password */
  updatePassword: (data: any) => request<void>('PATCH', '/auth/password', data),
};

/* ── Obat (Master Drug) ─────────────────────────────────────────────────────── */

export interface ObatFilters {
  page?:         number;
  per_page?:     number;
  search?:       string;
  kategori_id?:  number;
  golongan?:     Obat['golongan'];
  status?:       Obat['status'];
  stok_kritis?:  boolean;
  sort?:         'nama' | 'stok' | 'expired_date' | 'harga_jual';
  direction?:    'asc' | 'desc';
}

export const obatApi = {
  list:   (f?: ObatFilters)             => request<Paginated<Obat>>('GET', `/obat${qs(f ?? {})}`),
  get:    (id: number)                  => request<ApiResponse<Obat>>('GET', `/obat/${id}`),
  create: (data: FormData | Omit<Obat, 'id' | 'kategori' | 'created_at' | 'updated_at'>) =>
    request<ApiResponse<Obat>>('POST', '/obat', data),
  update: (id: number, data: FormData | Partial<Omit<Obat, 'id' | 'kategori' | 'created_at' | 'updated_at'>>) =>
    request<ApiResponse<Obat>>(data instanceof FormData ? 'POST' : 'PUT', `/obat/${id}`, data),
  delete: (id: number)                  => request<void>('DELETE', `/obat/${id}`),
  export: (format: 'csv' | 'xlsx')     => `${API_BASE}/obat/export?format=${format}&token=${token.get()}`,
  kartuStok: (id: number)               => request<ApiResponse<any[]>>('GET', `/obat/${id}/kartu-stok`),
};

/* ── Kategori ───────────────────────────────────────────────────────────────── */

export const kategoriApi = {
  list:   ()             => request<ApiResponse<KategoriObat[]>>('GET', '/kategori'),
  get:    (id: number)   => request<ApiResponse<KategoriObat>>('GET', `/kategori/${id}`),
  create: (data: Pick<KategoriObat, 'nama' | 'kode' | 'deskripsi'>) =>
    request<ApiResponse<KategoriObat>>('POST', '/kategori', data),
  update: (id: number, data: Partial<Pick<KategoriObat, 'nama' | 'kode' | 'deskripsi'>>) =>
    request<ApiResponse<KategoriObat>>('PUT', `/kategori/${id}`, data),
  delete: (id: number)   => request<void>('DELETE', `/kategori/${id}`),
};

/* ── Supplier ───────────────────────────────────────────────────────────────── */

export interface SupplierFilters {
  page?:    number;
  per_page?: number;
  search?:  string;
  status?:  Supplier['status'];
  kota?:    string;
}

export const supplierApi = {
  list:   (f?: SupplierFilters) => request<Paginated<Supplier>>('GET', `/supplier${qs(f ?? {})}`),
  get:    (id: number)          => request<ApiResponse<Supplier>>('GET', `/supplier/${id}`),
  create: (data: FormData | Omit<Supplier, 'id' | 'kode' | 'created_at' | 'updated_at'>) =>
    request<ApiResponse<Supplier>>('POST', '/supplier', data),
  update: (id: number, data: FormData | Partial<Omit<Supplier, 'id' | 'kode' | 'created_at' | 'updated_at'>>) =>
    request<ApiResponse<Supplier>>(data instanceof FormData ? 'POST' : 'PUT', `/supplier/${id}`, data),
  delete: (id: number)          => request<void>('DELETE', `/supplier/${id}`),
  blacklist: (id: number, alasan: string) =>
    request<ApiResponse<Supplier>>('PATCH', `/supplier/${id}/blacklist`, { alasan }),
  restore:   (id: number) =>
    request<ApiResponse<Supplier>>('PATCH', `/supplier/${id}/restore`),
};

/* ── Obat Masuk (Receiving) ─────────────────────────────────────────────────── */

export interface ObatMasukFilters {
  page?:        number;
  per_page?:    number;
  search?:      string;
  supplier_id?: number;
  status?:      ObatMasuk['status'];
  dari?:        string; // YYYY-MM-DD
  sampai?:      string; // YYYY-MM-DD
}

export const obatMasukApi = {
  list:   (f?: ObatMasukFilters) => request<Paginated<ObatMasuk>>('GET', `/obat-masuk${qs(f ?? {})}`),
  get:    (id: number)           => request<ApiResponse<ObatMasuk>>('GET', `/obat-masuk/${id}`),
  create: (data: FormData | Omit<ObatMasuk, 'id' | 'no_transaksi' | 'supplier' | 'petugas' | 'total_item' | 'nilai_total' | 'created_at'>) =>
    request<ApiResponse<ObatMasuk>>('POST', '/obat-masuk', data),
  terima: (id: number) =>
    request<ApiResponse<ObatMasuk>>('PATCH', `/obat-masuk/${id}/terima`),
  delete: (id: number) => request<void>('DELETE', `/obat-masuk/${id}`),
  checkFaktur: (supplierId: number, faktur: string) =>
    request<{ exists: boolean }>('GET', `/obat-masuk/check-faktur${qs({ supplier_id: supplierId, faktur })}`),
};

/* ── Obat Keluar (Dispensing) ───────────────────────────────────────────────── */

export interface ObatKeluarFilters {
  page?:       number;
  per_page?:   number;
  search?:     string;
  status?:     ObatKeluar['status'];
  dari?:       string;
  sampai?:     string;
  kasir_id?:   number;
  jenis?:      string;
}

export const obatKeluarApi = {
  list:   (f?: ObatKeluarFilters) => request<Paginated<ObatKeluar>>('GET', `/obat-keluar${qs(f ?? {})}`),
  get:    (id: number)            => request<ApiResponse<ObatKeluar>>('GET', `/obat-keluar/${id}`),
  create: (data: Omit<ObatKeluar, 'id' | 'no_transaksi' | 'total' | 'kasir' | 'created_at' | 'riwayat_cetak'> & { items: Omit<ObatKeluarItem, 'obat' | 'subtotal'>[] }) =>
    request<ApiResponse<ObatKeluar>>('POST', '/obat-keluar', data),
  retur:  (id: number, alasan: string) =>
    request<ApiResponse<ObatKeluar>>('PATCH', `/obat-keluar/${id}/retur`, { alasan }),
  void:   (id: number, alasan: string) =>
    request<ApiResponse<ObatKeluar>>('PATCH', `/obat-keluar/${id}/void`, { alasan }),
  logCetak: (id: number, jenis: 'nota' | 'resep' | 'copy_resep') =>
    request<ApiResponse<any>>('POST', `/obat-keluar/${id}/cetak`, { jenis }),
};

/* ── Monitoring Stok & Expired ──────────────────────────────────────────────── */

export interface MonitoringItem {
  obat_id:      number;
  nama:         string;
  kode:         string;
  stok:         number;
  stok_minimum: number;
  expired_date: string | null;
  status_stok:  'aman' | 'rendah' | 'kritis' | 'habis';
  hari_expired: number | null;
  status_exp:   'aman' | 'near-90' | 'near-30' | 'expired' | null;
}

export const monitoringApi = {
  kritis: (p?: { page?: number; per_page?: number }) =>
    request<Paginated<MonitoringItem>>('GET', `/monitoring/kritis${qs(p ?? {})}`),
  expired: (p?: { page?: number; per_page?: number; status?: MonitoringItem['status_exp'] }) =>
    request<Paginated<MonitoringItem>>('GET', `/monitoring/expired${qs(p ?? {})}`),
  summary: () =>
    request<ApiResponse<{
      stok_kritis: number;
      stok_habis:  number;
      expired:     number;
      near_30:     number;
      near_90:     number;
    }>>('GET', '/monitoring/summary'),
};

/* ── Laporan (Reports) ──────────────────────────────────────────────────────── */

export const laporanApi = {
  penjualan: (dari: string, sampai: string, format: 'json' | 'csv' | 'pdf' = 'json') =>
    format === 'json'
      ? request<ApiResponse<{ total: number; items: unknown[] }>>('GET', `/laporan/penjualan${qs({ dari, sampai })}`)
      : `${API_BASE}/laporan/penjualan/export${qs({ dari, sampai, format, token: token.get() })}`,
  stok: (format: 'json' | 'csv' | 'pdf' = 'json') =>
    format === 'json'
      ? request<ApiResponse<unknown[]>>('GET', '/laporan/stok')
      : `${API_BASE}/laporan/stok/export${qs({ format, token: token.get() })}`,
  kadaluarsa: (format: 'json' | 'csv' | 'pdf' = 'json') =>
    format === 'json'
      ? request<ApiResponse<unknown[]>>('GET', '/laporan/kadaluarsa')
      : `${API_BASE}/laporan/kadaluarsa/export${qs({ format, token: token.get() })}`,
  logistik: (dari: string, sampai: string, format: 'json' | 'csv' | 'pdf' = 'json') =>
    format === 'json'
      ? request<ApiResponse<{ total_item_masuk: number; nilai_item_masuk: number; total_item_keluar: number; nilai_item_keluar: number; chart: any[] }>>('GET', `/laporan/logistik${qs({ dari, sampai })}`)
      : `${API_BASE}/laporan/logistik/export${qs({ dari, sampai, format, token: token.get() })}`,
  analisis: (dari: string, sampai: string, format: 'json' | 'csv' | 'pdf' = 'json') =>
    format === 'json'
      ? request<ApiResponse<{
          nilai_inventaris: number;
          paling_sering_keluar: any[];
          tercepat_habis: any[];
          expired_barang: any[];
          dibuang_barang: any[];
        }>>('GET', `/laporan/analisis${qs({ dari, sampai })}`)
      : `${API_BASE}/laporan/analisis/export${qs({ dari, sampai, format, token: token.get() })}`,
};

/* ── Pengguna (User Management) ─────────────────────────────────────────────── */

export interface PenggunaFilters {
  page?:    number;
  per_page?: number;
  search?:  string;
  role?:    Pengguna['role'];
  status?:  Pengguna['status'];
}

export const penggunaApi = {
  list:   (f?: PenggunaFilters) => request<Paginated<Pengguna>>('GET', `/pengguna${qs(f ?? {})}`),
  get:    (id: number)          => request<ApiResponse<Pengguna>>('GET', `/pengguna/${id}`),
  create: (data: FormData | (Omit<Pengguna, 'id' | 'foto' | 'foto_url' | 'last_login' | 'created_at' | 'updated_at'> & { password: string })) =>
    request<ApiResponse<Pengguna>>('POST', '/pengguna', data),
  update: (id: number, data: FormData | Partial<Omit<Pengguna, 'id' | 'foto' | 'foto_url' | 'last_login' | 'created_at' | 'updated_at'>>) =>
    request<ApiResponse<Pengguna>>(data instanceof FormData ? 'POST' : 'PUT', `/pengguna/${id}`, data),
  resetPassword: (id: number, password: string, password_confirmation: string) =>
    request<void>('PATCH', `/pengguna/${id}/reset-password`, { password, password_confirmation }),
  toggleStatus: (id: number) =>
    request<ApiResponse<Pengguna>>('PATCH', `/pengguna/${id}/toggle-status`),
  delete: (id: number) => request<void>('DELETE', `/pengguna/${id}`),
};

/* ── Roles (daftar role yang tersedia) ──────────────────────────────────────── */

export interface RoleOption {
  value: AuthUser['role'];
  label: string;
}

export const rolesApi = {
  list: () => request<ApiResponse<RoleOption[]>>('GET', '/roles'),
};

/* ── Pengaturan Sistem ──────────────────────────────────────────────────────── */

export interface PengaturanData {
  umum:        Record<string, string | number | boolean>;
  stok:        Record<string, number | boolean>;
  notifikasi:  Record<string, boolean | number>;
  keamanan:    Record<string, number | boolean>;
  integrasi:   Record<string, string | boolean>;
}

export const pengaturanApi = {
  get:    ()                           => request<ApiResponse<PengaturanData>>('GET', '/pengaturan'),
  update: (data: Partial<PengaturanData>) => request<ApiResponse<PengaturanData>>('PUT', '/pengaturan', data),
  publik: ()                           => request<ApiResponse<{ umum: Record<string, any>; stok: Record<string, any> }>>('GET', '/pengaturan/publik'),
  uploadLogo: (formData: FormData)     => request<ApiResponse<{ logo_klinik: string; logo_klinik_url: string }>>('POST', '/pengaturan/logo', formData),
  backup: ()                           => request<ApiResponse<{ file: string; size: string }>>('POST', '/pengaturan/backup'),
  testSmtp: ()                         => request<ApiResponse<{ success: boolean; message: string }>>('POST', '/pengaturan/test-smtp'),
};

/* ── Audit Log ──────────────────────────────────────────────────────────────── */

export interface AuditLogFilters {
  page?:      number;
  per_page?:  number;
  search?:    string;
  user_id?:   number;
  action?:    AuditLogEntry['action'];
  module?:    string;
  dari?:      string; // YYYY-MM-DD
  sampai?:    string; // YYYY-MM-DD
}

export const auditLogApi = {
  list:   (f?: AuditLogFilters) => request<Paginated<AuditLogEntry>>('GET', `/audit-log${qs(f ?? {})}`),
  get:    (id: number)          => request<ApiResponse<AuditLogEntry>>('GET', `/audit-log/${id}`),
  export: (f: AuditLogFilters, format: 'csv' | 'pdf') =>
    `${API_BASE}/audit-log/export${qs({ ...f, format, token: token.get() })}`,
};

/* ── Dashboard summary ──────────────────────────────────────────────────────── */

export interface DashboardSummary {
  total_jenis_obat:     number;
  total_stok_unit:      number;
  total_supplier_aktif: number;
  transaksi_hari_ini:   number;
  obat_masuk_hari_ini:  number;
  obat_keluar_hari_ini: number;
  stok_kritis:          number;
  expired:              number;
  near_30_days:         number;
  total_kategori:       number;
  near_expired:         number;
  transaksi_masuk_bulan_ini:  number;
  transaksi_keluar_bulan_ini: number;
}

export const dashboardApi = {
  summary: (expiredDays?: number) =>
    request<ApiResponse<DashboardSummary>>('GET', `/dashboard/summary${qs(expiredDays ? { expired_days: expiredDays } : {})}`),
  chartPenjualan: (bulan: number, tahun: number) =>
    request<ApiResponse<{ label: string; masuk: number; keluar: number }[]>>(
      'GET', `/dashboard/chart-penjualan${qs({ bulan, tahun })}`
    ),
  stockByKategori: () =>
    request<ApiResponse<{ name: string; value: number }[]>>('GET', '/dashboard/stok-per-kategori'),
};

/* ── Harga Barang ───────────────────────────────────────────────────────────── */

export interface HargaBarangItem {
  id: number;
  kode: string;
  nama: string;
  kategori: { id: number; nama: string } | null;
  satuan: string;
  harga_beli: number;
  harga_jual: number;
  margin: number;
  margin_persen: number;
  tanggal_diubah: string;
  has_proposal: boolean;
  proposals_count: number;
}

export interface HargaProposal {
  id: number;
  obat: {
    id: number;
    nama: string;
    kode: string;
    harga_beli_sekarang: number;
    harga_jual_sekarang: number;
  } | null;
  user: { id: number; nama: string } | null;
  harga_beli_lama: number;
  harga_beli_baru: number;
  harga_jual_lama: number;
  harga_jual_baru: number;
  sumber: string;
  no_transaksi: string | null;
  tanggal_diusulkan: string;
}

export interface HargaLog {
  id: number;
  user: { id: number; nama: string } | null;
  harga_beli_lama: number;
  harga_beli_baru: number;
  harga_jual_lama: number;
  harga_jual_baru: number;
  sumber: string;
  no_transaksi: string | null;
  tanggal: string;
}

export interface HargaBarangFilters {
  page?: number;
  per_page?: number;
  search?: string;
  kategori_id?: number;
}

export const hargaBarangApi = {
  list: (f?: HargaBarangFilters) =>
    request<Paginated<HargaBarangItem>>('GET', `/harga-barang${qs(f ?? {})}`),
  update: (id: number, data: { harga_beli: number; harga_jual: number }) =>
    request<ApiResponse<any>>('PUT', `/harga-barang/${id}`, data),
  listProposals: () =>
    request<ApiResponse<HargaProposal[]>>('GET', '/harga-barang/proposals'),
  confirmProposal: (id: number) =>
    request<ApiResponse<any>>('POST', `/harga-barang/proposals/${id}/confirm`),
  rejectProposal: (id: number) =>
    request<ApiResponse<any>>('POST', `/harga-barang/proposals/${id}/reject`),
  getHistory: (id: number) =>
    request<ApiResponse<HargaLog[]>>('GET', `/harga-barang/${id}/history`),
};

/* ── Revisi / Penyesuaian Stok ─────────────────────────────────────────────── */

export type RevisiTipe   = 'tambah' | 'kurang' | 'set';
export type RevisiAlasan =
  | 'rusak'
  | 'kadaluarsa'
  | 'hilang'
  | 'temuan'
  | 'koreksi_sistem'
  | 'penerimaan_lain'
  | 'lainnya';

export interface StokRevisi {
  id:           number;
  no_revisi:    string;
  obat_id:      number;
  petugas_id:   number;
  tanggal:      string;
  tipe:         RevisiTipe;
  stok_sebelum: number;
  jumlah:       number;
  stok_sesudah: number;
  alasan:       RevisiAlasan;
  catatan:      string | null;
  obat?:        { id: number; nama: string; kode: string; satuan: string };
  petugas?:     { id: number; nama: string };
  created_at:   string;
}

export interface StokRevisiFilters {
  page?:     number;
  per_page?: number;
  search?:   string;
  obat_id?:  number;
  tipe?:     RevisiTipe;
  alasan?:   RevisiAlasan;
  dari?:     string;
  sampai?:   string;
}

export interface StokRevisiPayload {
  obat_id: number;
  tipe:    RevisiTipe;
  jumlah:  number;
  alasan:  RevisiAlasan;
  catatan?: string;
  tanggal?: string;
}

export const stokRevisiApi = {
  list:   (f?: StokRevisiFilters) =>
    request<Paginated<StokRevisi>>('GET', `/stok-revisi${qs(f ?? {})}`),
  create: (data: StokRevisiPayload) =>
    request<ApiResponse<StokRevisi>>('POST', '/stok-revisi', data),
  get:    (id: number) =>
    request<ApiResponse<StokRevisi>>('GET', `/stok-revisi/${id}`),
};

