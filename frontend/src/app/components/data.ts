export type Page =
  | 'dashboard'
  | 'master-barang'
  | 'harga-barang'
  | 'kategori-barang'
  | 'stock-barang'
  | 'monitoring-expired'
  | 'supplier'
  | 'transaksi'
  | 'laporan'
  | 'manajemen-user'
  | 'pengaturan'
  | 'audit-log'
  | 'profil';

export interface Drug {
  id: number;
  kode: string;
  nama: string;
  kategori: string;
  bentukSediaan: string;
  satuan: string;
  stok: number;
  minStok: number;
  supplier: string;
  hargaBeli: number;
  produsen: string;
  lokasi: string;
  deskripsi: string;
  merk: string;
  foto?: string; // data URL or URL path
}

export type StockStatus = 'aman' | 'low-stock' | 'critical';

export function getDrugStockStatus(drug: Drug): StockStatus {
  const ratio = drug.stok / drug.minStok;
  if (ratio < 0.5) return 'critical';
  if (ratio < 1) return 'low-stock';
  return 'aman';
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    aman: 'bg-emerald-100 text-emerald-700',
    'low-stock': 'bg-yellow-100 text-yellow-700',
    critical: 'bg-orange-100 text-orange-700',
    'near-30': 'bg-orange-100 text-orange-700',
    'near-90': 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
    aktif: 'bg-emerald-100 text-emerald-700',
    nonaktif: 'bg-red-100 text-red-700',
    selesai: 'bg-emerald-100 text-emerald-700',
    proses: 'bg-blue-100 text-blue-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-600';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    aman: 'Aman',
    'low-stock': 'Stok Rendah',
    critical: 'Kritis',
    'near-30': '< 30 Hari',
    'near-90': '30–90 Hari',
    expired: 'Expired',
    aktif: 'Aktif',
    nonaktif: 'Nonaktif',
    selesai: 'Selesai',
    proses: 'Dalam Proses',
  };
  return labels[status] ?? status;
}

export const drugs: Drug[] = [
  { id: 1, kode: 'OBT-001', nama: 'Paracetamol 500mg', kategori: 'Tablet', bentukSediaan: 'Tablet', satuan: 'Strip', stok: 450, minStok: 100, supplier: 'PT Kimia Farma', hargaBeli: 5000, produsen: 'Kimia Farma Tbk', lokasi: 'Rak A-01', deskripsi: 'Analgesik dan antipiretik untuk demam dan nyeri ringan hingga sedang.', merk: 'Panadol' },
  { id: 2, kode: 'OBT-002', nama: 'Amoxicillin 500mg', kategori: 'Kapsul', bentukSediaan: 'Kapsul', satuan: 'Strip', stok: 85, minStok: 100, supplier: 'PT Kalbe Farma', hargaBeli: 12000, produsen: 'Kalbe Farma Tbk', lokasi: 'Rak B-02', deskripsi: 'Antibiotik golongan penisilin untuk infeksi bakteri gram positif dan negatif.', merk: 'Amoxan' },
  { id: 3, kode: 'OBT-003', nama: 'Ibuprofen 400mg', kategori: 'Tablet', bentukSediaan: 'Tablet', satuan: 'Tablet', stok: 320, minStok: 80, supplier: 'PT Sanbe Farma', hargaBeli: 7500, produsen: 'Sanbe Farma', lokasi: 'Rak A-03', deskripsi: 'Anti-inflamasi nonsteroid untuk meredakan nyeri dan demam.', merk: 'Brufen' },
  { id: 4, kode: 'OBT-004', nama: 'Vitamin C 1000mg', kategori: 'Vitamin', bentukSediaan: 'Effervescent', satuan: 'Tablet', stok: 1200, minStok: 200, supplier: 'PT Kalbe Farma', hargaBeli: 3500, produsen: 'Kalbe Farma Tbk', lokasi: 'Rak C-01', deskripsi: 'Suplemen vitamin C dosis tinggi untuk meningkatkan daya tahan tubuh.', merk: 'Redoxon' },
  { id: 5, kode: 'OBT-005', nama: 'Ambroxol 30mg Sirup', kategori: 'Sirup', bentukSediaan: 'Sirup', satuan: 'Botol', stok: 45, minStok: 60, supplier: 'PT Dexa Medica', hargaBeli: 18000, produsen: 'Dexa Medica', lokasi: 'Rak D-01', deskripsi: 'Ekspektoran untuk mengencerkan dahak pada infeksi saluran napas.', merk: 'Mucopect' },
  { id: 6, kode: 'OBT-006', nama: 'Metformin 500mg', kategori: 'Tablet', bentukSediaan: 'Tablet', satuan: 'Strip', stok: 280, minStok: 100, supplier: 'PT Kimia Farma', hargaBeli: 9000, produsen: 'Kimia Farma Tbk', lokasi: 'Rak A-05', deskripsi: 'Antidiabetik oral golongan biguanid untuk diabetes melitus tipe 2.', merk: 'Glucophage' },
  { id: 7, kode: 'OBT-007', nama: 'Amlodipine 10mg', kategori: 'Tablet', bentukSediaan: 'Tablet', satuan: 'Strip', stok: 150, minStok: 80, supplier: 'PT Pharos Indonesia', hargaBeli: 8500, produsen: 'Pharos Indonesia', lokasi: 'Rak A-07', deskripsi: 'Kalsium antagonis untuk hipertensi dan angina pektoris stabil.', merk: 'Norvasc' },
  { id: 8, kode: 'OBT-008', nama: 'Omeprazole 20mg', kategori: 'Kapsul', bentukSediaan: 'Kapsul', satuan: 'Strip', stok: 95, minStok: 60, supplier: 'PT Kalbe Farma', hargaBeli: 15000, produsen: 'Kalbe Farma Tbk', lokasi: 'Rak B-04', deskripsi: 'Penghambat pompa proton untuk gastritis dan GERD.', merk: 'Prilosec' },
  { id: 9, kode: 'OBT-009', nama: 'Cetirizine 10mg', kategori: 'Tablet', bentukSediaan: 'Tablet', satuan: 'Strip', stok: 60, minStok: 80, supplier: 'PT Sanbe Farma', hargaBeli: 6500, produsen: 'Sanbe Farma', lokasi: 'Rak A-09', deskripsi: 'Antihistamin generasi kedua untuk rinitis alergi dan urtikaria kronik.', merk: 'Zyrtec' },
  { id: 10, kode: 'OBT-010', nama: 'Dexamethasone 0.5mg', kategori: 'Tablet', bentukSediaan: 'Tablet', satuan: 'Strip', stok: 200, minStok: 60, supplier: 'PT Kimia Farma', hargaBeli: 4500, produsen: 'Kimia Farma Tbk', lokasi: 'Rak A-10', deskripsi: 'Kortikosteroid sintetis untuk kondisi peradangan dan alergi berat.', merk: 'Dexamethasone' },
  { id: 11, kode: 'OBT-011', nama: 'Salbutamol Inhaler', kategori: 'Inhaler', bentukSediaan: 'Inhaler', satuan: 'Pcs', stok: 25, minStok: 20, supplier: 'PT Dexa Medica', hargaBeli: 55000, produsen: 'Dexa Medica', lokasi: 'Rak E-01', deskripsi: 'Bronkodilator beta-2 agonis untuk serangan asma dan PPOK.', merk: 'Ventolin' },
  { id: 12, kode: 'OBT-012', nama: 'Betadine Solution 30ml', kategori: 'Cairan', bentukSediaan: 'Cairan', satuan: 'Botol', stok: 180, minStok: 40, supplier: 'PT Pharos Indonesia', hargaBeli: 22000, produsen: 'Mundipharma', lokasi: 'Rak F-01', deskripsi: 'Antiseptik topikal mengandung povidone-iodine 10% untuk luka.', merk: 'Betadine' },
  { id: 13, kode: 'OBT-013', nama: 'Cefixime 200mg', kategori: 'Kapsul', bentukSediaan: 'Kapsul', satuan: 'Strip', stok: 120, minStok: 50, supplier: 'PT Kalbe Farma', hargaBeli: 25000, produsen: 'Kalbe Farma Tbk', lokasi: 'Rak B-06', deskripsi: 'Antibiotik sefalosporin generasi ketiga untuk infeksi spektrum luas.', merk: 'Sporetik' },
  { id: 14, kode: 'OBT-014', nama: 'Vitamin B Complex', kategori: 'Vitamin', bentukSediaan: 'Tablet', satuan: 'Strip', stok: 340, minStok: 80, supplier: 'PT Kimia Farma', hargaBeli: 4000, produsen: 'Kimia Farma Tbk', lokasi: 'Rak C-02', deskripsi: 'Suplemen vitamin B kompleks untuk mendukung metabolisme energi dan fungsi saraf.', merk: 'Neurobion' },
  { id: 15, kode: 'OBT-015', nama: 'Antasida Doen Tablet', kategori: 'Tablet', bentukSediaan: 'Tablet', satuan: 'Strip', stok: 15, minStok: 60, supplier: 'PT Sanbe Farma', hargaBeli: 3500, produsen: 'Sanbe Farma', lokasi: 'Rak A-12', deskripsi: 'Antasida kombinasi Al(OH)3 dan Mg(OH)2 untuk menetralisir asam lambung.', merk: 'Promag' },
];

export interface Category {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string;
  jumlahObat: number;
  status: 'aktif' | 'nonaktif';
  dibuat: string;
  parentId?: number; // Level 2: Sub-kategori if parentId is present
}

export const categories: Category[] = [
  // Parent Categories (Induk)
  { id: 1, kode: 'KTG-001', nama: 'Antibiotik', deskripsi: 'Obat untuk infeksi bakteri', jumlahObat: 12, status: 'aktif', dibuat: '2026-01-10' },
  { id: 2, kode: 'KTG-002', nama: 'Analgesik', deskripsi: 'Obat pereda nyeri', jumlahObat: 25, status: 'aktif', dibuat: '2026-01-12' },
  { id: 3, kode: 'KTG-003', nama: 'Vitamin', deskripsi: 'Suplemen nutrisi', jumlahObat: 18, status: 'aktif', dibuat: '2026-01-15' },
  { id: 4, kode: 'KTG-004', nama: 'Antipiretik', deskripsi: 'Obat penurun demam', jumlahObat: 10, status: 'aktif', dibuat: '2026-02-01' },
  { id: 5, kode: 'KTG-005', nama: 'Antihistamin', deskripsi: 'Obat alergi', jumlahObat: 8, status: 'nonaktif', dibuat: '2026-02-05' },
  
  // Sub-categories for Antibiotik
  { id: 6, kode: 'KTG-006', nama: 'Tablet', deskripsi: 'Sediaan tablet antibiotik', jumlahObat: 5, status: 'aktif', dibuat: '2026-01-11', parentId: 1 },
  { id: 7, kode: 'KTG-007', nama: 'Sirup', deskripsi: 'Sediaan sirup antibiotik', jumlahObat: 4, status: 'aktif', dibuat: '2026-01-11', parentId: 1 },
  { id: 8, kode: 'KTG-008', nama: 'Injeksi', deskripsi: 'Sediaan injeksi antibiotik', jumlahObat: 3, status: 'aktif', dibuat: '2026-01-11', parentId: 1 },
  
  // Sub-categories for Analgesik
  { id: 9, kode: 'KTG-009', nama: 'Tablet', deskripsi: 'Sediaan tablet analgesik', jumlahObat: 15, status: 'aktif', dibuat: '2026-01-13', parentId: 2 },
  { id: 10, kode: 'KTG-010', nama: 'Kapsul', deskripsi: 'Sediaan kapsul analgesik', jumlahObat: 10, status: 'aktif', dibuat: '2026-01-13', parentId: 2 },
];

export interface SupplierPIC {
  nama: string;
  jabatan: string;
  telepon: string;
  email: string;
}

export interface SupplierEvaluation {
  id: number;
  tanggal: string;
  noTransaksiRef: string;
  ketepatanWaktu: number;
  kualitasBarang: number;
  hargaKompetitif: number;
  catatan?: string;
  petugas: string;
}

export interface Supplier {
  id: number;
  nama: string;
  alamat: string;
  kota: string;
  telepon: string;
  email: string;
  pic: string;
  pics: SupplierPIC[];
  npwp: string;
  status: 'aktif' | 'nonaktif' | 'blacklist';
  alasanBlacklist?: string;
  noIzinPBF: string;
  sertifikatCDOB: string;
  expiredIzinPBF: string;
  expiredCDOB: string;
  terminPembayaran: 'cash' | 'tempo30' | 'tempo60' | 'tempo90';
  leadTime: number;
  minimumOrder: number;
  totalTransaksi: number;
  rating: number;
  evaluations: SupplierEvaluation[];
}

export const suppliers: Supplier[] = [
  {
    id: 1, nama: 'PT Kimia Farma', alamat: 'Jl. Veteran No. 9', kota: 'Jakarta',
    telepon: '021-4785-3123', email: 'info@kimiafarma.co.id',
    pic: 'Budi Santoso',
    pics: [{ nama: 'Budi Santoso', jabatan: 'Sales Manager', telepon: '021-4785-3123', email: 'budi.s@kimiafarma.co.id' }],
    npwp: '01.234.567.8-001.000',
    status: 'aktif',
    noIzinPBF: 'PBF-2023-001234', sertifikatCDOB: 'CDOB-2023-KF-001',
    expiredIzinPBF: '2027-04-15', expiredCDOB: '2027-04-15',
    terminPembayaran: 'tempo30', leadTime: 3, minimumOrder: 5000000,
    totalTransaksi: 48500000, rating: 4.5,
    evaluations: [
      { id: 1, tanggal: '2026-07-01', noTransaksiRef: 'OM-2026-0701', ketepatanWaktu: 5, kualitasBarang: 4, hargaKompetitif: 5, catatan: 'Pengiriman tepat waktu, kualitas barang sesuai spesifikasi.', petugas: 'Andi Kurniawan' },
      { id: 2, tanggal: '2026-06-10', noTransaksiRef: 'OM-2026-0610', ketepatanWaktu: 4, kualitasBarang: 4, hargaKompetitif: 5, petugas: 'Sari Dewi' },
    ],
  },
  {
    id: 2, nama: 'PT Kalbe Farma', alamat: 'Jl. Letjen Suprapto Kav. 4', kota: 'Jakarta',
    telepon: '021-4288-9000', email: 'supply@kalbe.co.id',
    pic: 'Siti Rahayu',
    pics: [
      { nama: 'Siti Rahayu', jabatan: 'Key Account Manager', telepon: '021-4288-9001', email: 'siti.r@kalbe.co.id' },
      { nama: 'Anton Wijaya', jabatan: 'Sales Executive', telepon: '021-4288-9002', email: 'anton.w@kalbe.co.id' },
    ],
    npwp: '02.345.678.9-002.000',
    status: 'aktif',
    noIzinPBF: 'PBF-2023-002345', sertifikatCDOB: 'CDOB-2023-KB-002',
    expiredIzinPBF: '2027-08-20', expiredCDOB: '2027-08-20',
    terminPembayaran: 'tempo30', leadTime: 2, minimumOrder: 10000000,
    totalTransaksi: 65200000, rating: 4.7,
    evaluations: [
      { id: 3, tanggal: '2026-07-03', noTransaksiRef: 'OM-2026-0703', ketepatanWaktu: 5, kualitasBarang: 5, hargaKompetitif: 4, catatan: 'Produk lengkap, pengiriman cepat.', petugas: 'Andi Kurniawan' },
    ],
  },
  {
    id: 3, nama: 'PT Sanbe Farma', alamat: 'Jl. Industri Utara IV No. 8', kota: 'Bandung',
    telepon: '022-5201-6789', email: 'order@sanbe.co.id',
    pic: 'Ahmad Fauzi',
    pics: [{ nama: 'Ahmad Fauzi', jabatan: 'Regional Sales', telepon: '022-5201-6789', email: 'a.fauzi@sanbe.co.id' }],
    npwp: '03.456.789.0-003.000',
    status: 'aktif',
    noIzinPBF: 'PBF-2022-003456', sertifikatCDOB: 'CDOB-2022-SB-003',
    expiredIzinPBF: '2026-09-01', expiredCDOB: '2026-09-01',
    terminPembayaran: 'tempo60', leadTime: 4, minimumOrder: 3000000,
    totalTransaksi: 32100000, rating: 4.0,
    evaluations: [
      { id: 4, tanggal: '2026-07-05', noTransaksiRef: 'OM-2026-0705', ketepatanWaktu: 4, kualitasBarang: 4, hargaKompetitif: 4, petugas: 'Budi Hartono' },
    ],
  },
  {
    id: 4, nama: 'PT Dexa Medica', alamat: 'Jl. Jend. Sudirman No. 123', kota: 'Palembang',
    telepon: '0711-5636-123', email: 'sales@dexa.co.id',
    pic: 'Dewi Kusuma',
    pics: [{ nama: 'Dewi Kusuma', jabatan: 'Area Sales Manager', telepon: '0711-5636-124', email: 'd.kusuma@dexa.co.id' }],
    npwp: '04.567.890.1-004.000',
    status: 'aktif',
    noIzinPBF: 'PBF-2023-004567', sertifikatCDOB: 'CDOB-2023-DX-004',
    expiredIzinPBF: '2027-12-31', expiredCDOB: '2027-12-31',
    terminPembayaran: 'cash', leadTime: 5, minimumOrder: 2000000,
    totalTransaksi: 28750000, rating: 4.2,
    evaluations: [
      { id: 5, tanggal: '2026-07-07', noTransaksiRef: 'OM-2026-0707', ketepatanWaktu: 4, kualitasBarang: 4, hargaKompetitif: 5, catatan: 'Harga kompetitif, leadtime agak lama.', petugas: 'Andi Kurniawan' },
    ],
  },
  {
    id: 5, nama: 'PT Pharos Indonesia', alamat: 'Jl. Melawai Raya No. 50', kota: 'Jakarta',
    telepon: '021-5792-5000', email: 'info@pharos.co.id',
    pic: 'Rudi Hartono',
    pics: [{ nama: 'Rudi Hartono', jabatan: 'Sales Representative', telepon: '021-5792-5001', email: 'r.hartono@pharos.co.id' }],
    npwp: '05.678.901.2-005.000',
    status: 'nonaktif',
    noIzinPBF: 'PBF-2021-005678', sertifikatCDOB: 'CDOB-2021-PH-005',
    expiredIzinPBF: '2026-07-20', expiredCDOB: '2026-07-20',
    terminPembayaran: 'tempo30', leadTime: 3, minimumOrder: 5000000,
    totalTransaksi: 15400000, rating: 3.2,
    evaluations: [],
  },
  {
    id: 6, nama: 'PT Indo Farma', alamat: 'Jl. Raya Bogor Km. 38.6', kota: 'Bekasi',
    telepon: '021-8710-9999', email: 'sales@indofarma.co.id',
    pic: 'Hendra Wijaya',
    pics: [{ nama: 'Hendra Wijaya', jabatan: 'Sales Manager', telepon: '021-8710-9998', email: 'h.wijaya@indofarma.co.id' }],
    npwp: '06.789.012.3-006.000',
    status: 'blacklist',
    alasanBlacklist: 'Pengiriman barang palsu pada batch CFX-2025-XX — ditemukan saat inspeksi 15 Juni 2026. Kasus dilaporkan ke BPOM.',
    noIzinPBF: 'PBF-2020-006789', sertifikatCDOB: 'CDOB-2020-IF-006',
    expiredIzinPBF: '2026-06-01', expiredCDOB: '2026-06-01',
    terminPembayaran: 'tempo60', leadTime: 7, minimumOrder: 1000000,
    totalTransaksi: 8200000, rating: 1.5,
    evaluations: [
      { id: 6, tanggal: '2026-06-15', noTransaksiRef: 'OM-2026-0615', ketepatanWaktu: 2, kualitasBarang: 1, hargaKompetitif: 2, catatan: 'BLACKLIST: Produk terbukti tidak sesuai sertifikasi.', petugas: 'Andi Kurniawan' },
    ],
  },
];

export const monthlyData = [
  { bulan: 'Jan', masuk: 180, keluar: 120 },
  { bulan: 'Feb', masuk: 210, keluar: 150 },
  { bulan: 'Mar', masuk: 195, keluar: 160 },
  { bulan: 'Apr', masuk: 240, keluar: 180 },
  { bulan: 'Mei', masuk: 185, keluar: 155 },
  { bulan: 'Jun', masuk: 220, keluar: 190 },
  { bulan: 'Jul', masuk: 156, keluar: 89 },
];

export const stockByCategory = [
  { name: 'Tablet', value: 2450, color: '#0F9D74' },
  { name: 'Kapsul', value: 1820, color: '#3B82F6' },
  { name: 'Sirup', value: 980, color: '#F59E0B' },
  { name: 'Vitamin', value: 1200, color: '#8B5CF6' },
  { name: 'Inhaler', value: 430, color: '#EC4899' },
  { name: 'Cairan', value: 650, color: '#EF4444' },
];

export type ExpiredStatus = 'expired' | 'near-30' | 'near-90' | 'aman';

export interface ExpiredItem {
  id: number;
  namaObat: string;
  kode: string;
  batch: string;
  expiredDate: string;
  sisaHari: number;
  stok: number;
  lokasi: string;
  status: ExpiredStatus;
}

export const expiredItems: ExpiredItem[] = [
  { id: 1, namaObat: 'Amoxicillin 500mg', kode: 'OBT-002', batch: 'AMX-2024-03', expiredDate: '2026-07-01', sisaHari: -7, stok: 24, lokasi: 'Rak B-02', status: 'expired' },
  { id: 2, namaObat: 'Salbutamol Inhaler', kode: 'OBT-011', batch: 'SLB-2024-01', expiredDate: '2026-07-10', sisaHari: 2, stok: 8, lokasi: 'Rak E-01', status: 'near-30' },
  { id: 3, namaObat: 'Cefixime 200mg', kode: 'OBT-013', batch: 'CFX-2024-02', expiredDate: '2026-07-25', sisaHari: 17, stok: 15, lokasi: 'Rak B-06', status: 'near-30' },
  { id: 4, namaObat: 'Antasida Doen', kode: 'OBT-015', batch: 'ATS-2024-05', expiredDate: '2026-08-05', sisaHari: 28, stok: 10, lokasi: 'Rak A-12', status: 'near-30' },
  { id: 5, namaObat: 'Paracetamol 500mg', kode: 'OBT-001', batch: 'PCT-2024-08', expiredDate: '2026-09-15', sisaHari: 69, stok: 200, lokasi: 'Rak A-01', status: 'near-90' },
  { id: 6, namaObat: 'Ibuprofen 400mg', kode: 'OBT-003', batch: 'IBU-2024-06', expiredDate: '2026-09-30', sisaHari: 84, stok: 150, lokasi: 'Rak A-03', status: 'near-90' },
  { id: 7, namaObat: 'Metformin 500mg', kode: 'OBT-006', batch: 'MET-2025-01', expiredDate: '2027-03-15', sisaHari: 250, stok: 280, lokasi: 'Rak A-05', status: 'aman' },
  { id: 8, namaObat: 'Vitamin C 1000mg', kode: 'OBT-004', batch: 'VTC-2025-02', expiredDate: '2027-06-20', sisaHari: 347, stok: 1200, lokasi: 'Rak C-01', status: 'aman' },
];

export interface IncomingRecord {
  id: number;
  noTransaksi: string;
  tanggal: string;
  supplier: string;
  petugas: string;
  totalItem: number;
  totalNilai: number;
  status: 'selesai' | 'proses';
}

export const incomingHistory: IncomingRecord[] = [
  { id: 1, noTransaksi: 'OM-2026-0701', tanggal: '2026-07-01', supplier: 'PT Kimia Farma', petugas: 'Andi Kurniawan', totalItem: 5, totalNilai: 2850000, status: 'selesai' },
  { id: 2, noTransaksi: 'OM-2026-0703', tanggal: '2026-07-03', supplier: 'PT Kalbe Farma', petugas: 'Sari Dewi', totalItem: 3, totalNilai: 1750000, status: 'selesai' },
  { id: 3, noTransaksi: 'OM-2026-0705', tanggal: '2026-07-05', supplier: 'PT Sanbe Farma', petugas: 'Budi Hartono', totalItem: 4, totalNilai: 3200000, status: 'selesai' },
  { id: 4, noTransaksi: 'OM-2026-0707', tanggal: '2026-07-07', supplier: 'PT Dexa Medica', petugas: 'Andi Kurniawan', totalItem: 2, totalNilai: 980000, status: 'proses' },
];

export interface Notification {
  id: number;
  type: 'low-stock' | 'near-expired' | 'expired';
  message: string;
  time: string;
  severity: 'red' | 'orange' | 'yellow';
}

export const notifications: Notification[] = [
  { id: 1, type: 'expired', message: 'Amoxicillin 500mg batch AMX-2024-03 sudah EXPIRED!', time: '1 hari lalu', severity: 'red' },
  { id: 2, type: 'near-expired', message: 'Salbutamol Inhaler akan expired dalam 2 hari', time: '5 jam lalu', severity: 'red' },
  { id: 3, type: 'near-expired', message: 'Cefixime 200mg batch CFX-2024-02 expired 17 hari lagi', time: '1 hari lalu', severity: 'orange' },
  { id: 4, type: 'low-stock', message: 'Antasida Doen stok kritis! (15 unit, min: 60)', time: '2 jam lalu', severity: 'orange' },
  { id: 5, type: 'low-stock', message: 'Ambroxol 30mg Sirup hampir habis (45 unit, min: 60)', time: '3 hari lalu', severity: 'yellow' },
];

export function formatRupiah(num: number): string {
  return 'Rp ' + num.toLocaleString('id-ID');
}

export const doctors = [
  'dr. Ahmad Fauzi',
  'dr. Dewi Kusuma',
  'dr. Rudi Hartono',
  'dr. Siti Rahayu',
  'dr. Budi Santoso',
];

export interface DrugBatch {
  id: number;
  drugId: number;
  batch: string;
  expiredDate: string;
  stok: number;
  hargaJual: number;
}

export const drugBatches: DrugBatch[] = [
  // Paracetamol 500mg (id:1) — FEFO: PCT-2024-08 expires sooner
  { id: 1, drugId: 1, batch: 'PCT-2024-08', expiredDate: '2026-09-15', stok: 200, hargaJual: 8500 },
  { id: 2, drugId: 1, batch: 'PCT-2025-B', expiredDate: '2027-03-01', stok: 250, hargaJual: 8500 },
  // Amoxicillin 500mg (id:2)
  { id: 3, drugId: 2, batch: 'AMX-2024-03', expiredDate: '2026-07-15', stok: 20, hargaJual: 18000 },
  { id: 4, drugId: 2, batch: 'AMX-2025-01', expiredDate: '2027-01-20', stok: 65, hargaJual: 18000 },
  // Ibuprofen 400mg (id:3)
  { id: 5, drugId: 3, batch: 'IBU-2024-06', expiredDate: '2026-09-30', stok: 150, hargaJual: 12000 },
  { id: 6, drugId: 3, batch: 'IBU-2025-01', expiredDate: '2027-06-15', stok: 170, hargaJual: 12000 },
  // Vitamin C 1000mg (id:4)
  { id: 7, drugId: 4, batch: 'VTC-2025-02', expiredDate: '2027-06-20', stok: 1200, hargaJual: 5500 },
  // Ambroxol Sirup (id:5)
  { id: 8, drugId: 5, batch: 'AMB-2025-01', expiredDate: '2027-02-28', stok: 45, hargaJual: 28000 },
  // Metformin 500mg (id:6)
  { id: 9, drugId: 6, batch: 'MET-2025-01', expiredDate: '2027-03-15', stok: 280, hargaJual: 15000 },
  // Amlodipine 10mg (id:7)
  { id: 10, drugId: 7, batch: 'AML-2025-01', expiredDate: '2027-05-10', stok: 150, hargaJual: 14000 },
  // Omeprazole 20mg (id:8)
  { id: 11, drugId: 8, batch: 'OMP-2025-01', expiredDate: '2027-04-20', stok: 95, hargaJual: 22000 },
  // Cetirizine 10mg (id:9)
  { id: 12, drugId: 9, batch: 'CTZ-2025-01', expiredDate: '2026-11-30', stok: 60, hargaJual: 10000 },
  // Dexamethasone (id:10)
  { id: 13, drugId: 10, batch: 'DEX-2025-01', expiredDate: '2027-02-15', stok: 200, hargaJual: 7500 },
  // Salbutamol Inhaler (id:11)
  { id: 14, drugId: 11, batch: 'SLB-2024-01', expiredDate: '2026-07-10', stok: 5, hargaJual: 75000 },
  { id: 15, drugId: 11, batch: 'SLB-2025-01', expiredDate: '2027-08-15', stok: 20, hargaJual: 75000 },
  // Betadine (id:12)
  { id: 16, drugId: 12, batch: 'BTD-2025-01', expiredDate: '2027-10-01', stok: 180, hargaJual: 32000 },
  // Cefixime 200mg (id:13) — FEFO: CFX-2024-02 expires sooner
  { id: 17, drugId: 13, batch: 'CFX-2024-02', expiredDate: '2026-07-25', stok: 12, hargaJual: 38000 },
  { id: 18, drugId: 13, batch: 'CFX-2025-01', expiredDate: '2027-05-10', stok: 108, hargaJual: 38000 },
  // Vitamin B Complex (id:14)
  { id: 19, drugId: 14, batch: 'VTB-2025-01', expiredDate: '2027-09-01', stok: 340, hargaJual: 7000 },
  // Antasida (id:15)
  { id: 20, drugId: 15, batch: 'ATS-2024-05', expiredDate: '2026-08-05', stok: 10, hargaJual: 6500 },
  { id: 21, drugId: 15, batch: 'ATS-2025-01', expiredDate: '2027-07-20', stok: 5, hargaJual: 6500 },
];

export interface OutgoingItem {
  drugId: number;
  namaObat: string;
  batch: string;
  expiredDate: string;
  jumlah: number;
  hargaJual: number;
  diskon: number;
  subtotal: number;
}

export interface OutgoingRecord {
  id: number;
  noTransaksi: string;
  tanggal: string;
  jenis: 'resep' | 'otc' | 'retur';
  namaPasien: string;
  noRekamMedis?: string;
  dokter?: string;
  petugas: string;
  jumlahItem: number;
  totalBayar: number;
  metodeBayar: 'tunai' | 'debit' | 'qris' | 'bpjs';
  status: 'selesai' | 'retur';
  items: OutgoingItem[];
  refTransaksi?: string;
  alasanRetur?: string;
}

export const outgoingHistory: OutgoingRecord[] = [
  {
    id: 1, noTransaksi: 'OK-2026-07001',
    tanggal: '2026-07-01T09:30:00', jenis: 'resep',
    namaPasien: 'Budi Santoso', noRekamMedis: 'RM-001245',
    dokter: 'dr. Ahmad Fauzi', petugas: 'Andi Kurniawan',
    jumlahItem: 3, totalBayar: 45000, metodeBayar: 'tunai', status: 'selesai',
    items: [
      { drugId: 1, namaObat: 'Paracetamol 500mg', batch: 'PCT-2024-08', expiredDate: '2026-09-15', jumlah: 2, hargaJual: 8500, diskon: 0, subtotal: 17000 },
      { drugId: 2, namaObat: 'Amoxicillin 500mg', batch: 'AMX-2024-03', expiredDate: '2026-07-15', jumlah: 1, hargaJual: 18000, diskon: 0, subtotal: 18000 },
      { drugId: 9, namaObat: 'Cetirizine 10mg', batch: 'CTZ-2025-01', expiredDate: '2026-11-30', jumlah: 1, hargaJual: 10000, diskon: 0, subtotal: 10000 },
    ],
  },
  {
    id: 2, noTransaksi: 'OK-2026-07002',
    tanggal: '2026-07-02T10:15:00', jenis: 'otc',
    namaPasien: 'Pasien Umum', petugas: 'Sari Dewi',
    jumlahItem: 2, totalBayar: 28500, metodeBayar: 'qris', status: 'selesai',
    items: [
      { drugId: 4, namaObat: 'Vitamin C 1000mg', batch: 'VTC-2025-02', expiredDate: '2027-06-20', jumlah: 3, hargaJual: 5500, diskon: 0, subtotal: 16500 },
      { drugId: 3, namaObat: 'Ibuprofen 400mg', batch: 'IBU-2024-06', expiredDate: '2026-09-30', jumlah: 1, hargaJual: 12000, diskon: 0, subtotal: 12000 },
    ],
  },
  {
    id: 3, noTransaksi: 'OK-2026-07003',
    tanggal: '2026-07-03T08:45:00', jenis: 'resep',
    namaPasien: 'Siti Aminah', noRekamMedis: 'RM-000891',
    dokter: 'dr. Dewi Kusuma', petugas: 'Andi Kurniawan',
    jumlahItem: 2, totalBayar: 0, metodeBayar: 'bpjs', status: 'selesai',
    items: [
      { drugId: 6, namaObat: 'Metformin 500mg', batch: 'MET-2025-01', expiredDate: '2027-03-15', jumlah: 3, hargaJual: 15000, diskon: 100, subtotal: 0 },
      { drugId: 7, namaObat: 'Amlodipine 10mg', batch: 'AML-2025-01', expiredDate: '2027-05-10', jumlah: 1, hargaJual: 14000, diskon: 100, subtotal: 0 },
    ],
  },
  {
    id: 4, noTransaksi: 'OK-2026-07004',
    tanggal: '2026-07-04T14:20:00', jenis: 'otc',
    namaPasien: 'Rina Susanti', petugas: 'Budi Hartono',
    jumlahItem: 1, totalBayar: 32000, metodeBayar: 'debit', status: 'selesai',
    items: [
      { drugId: 12, namaObat: 'Betadine Solution 30ml', batch: 'BTD-2025-01', expiredDate: '2027-10-01', jumlah: 1, hargaJual: 32000, diskon: 0, subtotal: 32000 },
    ],
  },
  {
    id: 5, noTransaksi: 'OK-2026-07005',
    tanggal: '2026-07-05T11:00:00', jenis: 'resep',
    namaPasien: 'Rudi Hartono', noRekamMedis: 'RM-002310',
    dokter: 'dr. Ahmad Fauzi', petugas: 'Sari Dewi',
    jumlahItem: 2, totalBayar: 32000, metodeBayar: 'debit', status: 'selesai',
    items: [
      { drugId: 8, namaObat: 'Omeprazole 20mg', batch: 'OMP-2025-01', expiredDate: '2027-04-20', jumlah: 1, hargaJual: 22000, diskon: 0, subtotal: 22000 },
      { drugId: 9, namaObat: 'Cetirizine 10mg', batch: 'CTZ-2025-01', expiredDate: '2026-11-30', jumlah: 1, hargaJual: 10000, diskon: 0, subtotal: 10000 },
    ],
  },
  {
    id: 6, noTransaksi: 'OK-2026-07006',
    tanggal: '2026-07-06T09:00:00', jenis: 'resep',
    namaPasien: 'Ahmad Mulyadi', noRekamMedis: 'RM-003122',
    dokter: 'dr. Siti Rahayu', petugas: 'Andi Kurniawan',
    jumlahItem: 2, totalBayar: 46500, metodeBayar: 'tunai', status: 'selesai',
    items: [
      { drugId: 13, namaObat: 'Cefixime 200mg', batch: 'CFX-2024-02', expiredDate: '2026-07-25', jumlah: 1, hargaJual: 38000, diskon: 0, subtotal: 38000 },
      { drugId: 1, namaObat: 'Paracetamol 500mg', batch: 'PCT-2024-08', expiredDate: '2026-09-15', jumlah: 1, hargaJual: 8500, diskon: 0, subtotal: 8500 },
    ],
  },
  {
    id: 7, noTransaksi: 'OK-2026-07007',
    tanggal: '2026-07-07T13:30:00', jenis: 'retur',
    namaPasien: 'Budi Santoso', noRekamMedis: 'RM-001245',
    petugas: 'Sari Dewi', jumlahItem: 1, totalBayar: 18000,
    metodeBayar: 'tunai', status: 'retur',
    refTransaksi: 'OK-2026-07001',
    alasanRetur: 'Obat tidak cocok, diganti generik',
    items: [
      { drugId: 2, namaObat: 'Amoxicillin 500mg', batch: 'AMX-2024-03', expiredDate: '2026-07-15', jumlah: 1, hargaJual: 18000, diskon: 0, subtotal: 18000 },
    ],
  },
  {
    id: 8, noTransaksi: 'OK-2026-07008',
    tanggal: '2026-07-08T09:15:00', jenis: 'resep',
    namaPasien: 'Rina Wulandari', noRekamMedis: 'RM-004058',
    dokter: 'dr. Dewi Kusuma', petugas: 'Andi Kurniawan',
    jumlahItem: 2, totalBayar: 28000, metodeBayar: 'tunai', status: 'selesai',
    items: [
      { drugId: 1, namaObat: 'Paracetamol 500mg', batch: 'PCT-2024-08', expiredDate: '2026-09-15', jumlah: 2, hargaJual: 8500, diskon: 0, subtotal: 17000 },
      { drugId: 4, namaObat: 'Vitamin C 1000mg', batch: 'VTC-2025-02', expiredDate: '2027-06-20', jumlah: 2, hargaJual: 5500, diskon: 0, subtotal: 11000 },
    ],
  },
  {
    id: 9, noTransaksi: 'OK-2026-07009',
    tanggal: '2026-07-08T11:30:00', jenis: 'otc',
    namaPasien: 'Pasien Umum', petugas: 'Budi Hartono',
    jumlahItem: 2, totalBayar: 19000, metodeBayar: 'qris', status: 'selesai',
    items: [
      { drugId: 3, namaObat: 'Ibuprofen 400mg', batch: 'IBU-2024-06', expiredDate: '2026-09-30', jumlah: 1, hargaJual: 12000, diskon: 0, subtotal: 12000 },
      { drugId: 14, namaObat: 'Vitamin B Complex', batch: 'VTB-2025-01', expiredDate: '2027-09-01', jumlah: 1, hargaJual: 7000, diskon: 0, subtotal: 7000 },
    ],
  },
];
