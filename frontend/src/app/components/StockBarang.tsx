import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Save, Search,
  ChevronLeft, ChevronRight, Eye, Calendar, X,
  RefreshCw, Loader2, CheckCircle2, ArrowRight, Package, AlertTriangle, FileText, Download, TrendingUp, History,
  ClipboardList, MinusCircle, PlusCircle, Settings2
} from 'lucide-react';
import { 
  obatMasukApi, 
  obatApi, 
  supplierApi, 
  kategoriApi,
  stokRevisiApi,
  type ObatMasuk as ApiObatMasuk, 
  type Obat as ApiObat, 
  type Supplier as ApiSupplier,
  type KategoriObat as ApiKategori,
  type StokRevisi,
  type RevisiTipe,
  type RevisiAlasan,
} from '../services/api';
import { toast } from 'sonner';

const PRIMARY = '#0F9D74';

interface FormItem {
  id: string;
  obat_id: string;
  jumlah: number;
  harga_satuan: number;
  no_batch: string;
  expired_date: string;
}

function emptyItem(): FormItem {
  return {
    id: Math.random().toString(36).substring(2, 9),
    obat_id: '',
    jumlah: 1,
    harga_satuan: 0,
    no_batch: '',
    expired_date: '',
  };
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    diterima: 'bg-emerald-100 text-emerald-700',
    sebagian: 'bg-blue-100 text-blue-700',
    dikembalikan: 'bg-red-100 text-red-700',
  };
  const labelMap: Record<string, string> = {
    draft: 'Draft',
    diterima: 'Diterima',
    sebagian: 'Sebagian',
    dikembalikan: 'Dikembalikan',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100'}`}>
      {labelMap[status] || status}
    </span>
  );
}

function getDrugStockStatus(stok: number, minStok: number): 'aman' | 'rendah' | 'kritis' | 'habis' {
  if (stok <= 0) return 'habis';
  if (stok <= minStok) return 'kritis';
  if (stok <= minStok * 1.5) return 'rendah';
  return 'aman';
}

function StockStatusBadge({ status }: { status: 'aman' | 'rendah' | 'kritis' | 'habis' }) {
  const map: Record<string, string> = {
    aman: 'bg-emerald-100 text-emerald-700',
    rendah: 'bg-yellow-100 text-yellow-700',
    kritis: 'bg-orange-100 text-orange-700',
    habis: 'bg-red-100 text-red-700',
  };
  const labelMap: Record<string, string> = {
    aman: 'Aman',
    rendah: 'Rendah',
    kritis: 'Kritis',
    habis: 'Habis',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || 'bg-gray-100'}`}>
      {labelMap[status] || status}
    </span>
  );
}

function formatRupiah(num: number): string {
  return 'Rp ' + num.toLocaleString('id-ID');
}

const ALASAN_LABELS: Record<string, string> = {
  rusak: 'Barang Rusak',
  kadaluarsa: 'Barang Kadaluarsa',
  hilang: 'Kehilangan / Susut',
  temuan: 'Temuan Stok',
  koreksi_sistem: 'Koreksi Sistem',
  penerimaan_lain: 'Penerimaan dari Sumber Lain',
  lainnya: 'Lainnya',
};

export function StockBarang() {
  const [activeTab, setActiveTab] = useState<'stok' | 'form' | 'riwayat' | 'revisi'>('stok');
  
  // Tab 1: Daftar Stok State
  const [stokSearch, setStokSearch] = useState('');
  const [stokKategoriId, setStokKategoriId] = useState('');
  const [stokKritisOnly, setStokKritisOnly] = useState(false);
  const [stokPage, setStokPage] = useState(1);
  const [stokLastPage, setStokLastPage] = useState(1);
  const [stokTotalCount, setStokTotalCount] = useState(0);
  const [stokList, setStokList] = useState<ApiObat[]>([]);
  const [loadingStok, setLoadingStok] = useState(true);

  // Kartu Stok Detail State
  const [selectedDrugForCard, setSelectedDrugForCard] = useState<ApiObat | null>(null);
  const [stockCardHistory, setStockCardHistory] = useState<any[]>([]);
  const [loadingStockCard, setLoadingStockCard] = useState(false);

  // Tab 2: Faktur Masuk State
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [supplierId, setSupplierId] = useState('');
  const [catatan, setCatatan] = useState(''); // invoice/faktur number
  const [items, setItems] = useState<FormItem[]>([emptyItem()]);
  const [fotoNotaFile, setFotoNotaFile] = useState<File | null>(null);
  const [fotoNotaPreview, setFotoNotaPreview] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Metadata
  const [drugs, setDrugs] = useState<ApiObat[]>([]);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [categories, setCategories] = useState<ApiKategori[]>([]);
  
  // Tab 3: Riwayat Penerimaan State
  const [historyList, setHistoryList] = useState<ApiObatMasuk[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [search, setSearch] = useState('');
  const [filterSupplierId, setFilterSupplierId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDari, setFilterDari] = useState('');
  const [filterSampai, setFilterSampai] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [detailRecord, setDetailRecord] = useState<ApiObatMasuk | null>(null);
  const [detailItems, setDetailItems] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Revisi Stok ────────────────────────────────────────────
  const [revisiList, setRevisiList] = useState<StokRevisi[]>([]);
  const [loadingRevisi, setLoadingRevisi] = useState(true);
  const [revisiPage, setRevisiPage] = useState(1);
  const [revisiLastPage, setRevisiLastPage] = useState(1);
  const [revisiTotal, setRevisiTotal] = useState(0);
  const [revisiSearch, setRevisiSearch] = useState('');
  const [revisiFilterTipe, setRevisiFilterTipe] = useState('');
  const [revisiFilterAlasan, setRevisiFilterAlasan] = useState('');

  // Modal Buat Revisi
  const [showRevisiModal, setShowRevisiModal] = useState(false);
  const [revisiTargetObat, setRevisiTargetObat] = useState<ApiObat | null>(null);
  const [revisiForm, setRevisiForm] = useState<{
    tipe: RevisiTipe;
    jumlah: string;
    alasan: RevisiAlasan;
    catatan: string;
    tanggal: string;
  }>({
    tipe: 'set',
    jumlah: '',
    alasan: 'koreksi_sistem',
    catatan: '',
    tanggal: new Date().toISOString().split('T')[0],
  });
  const [submittingRevisi, setSubmittingRevisi] = useState(false);

  // Fetch Daftar Stok
  const fetchStokList = async (isSilent = false) => {
    if (!isSilent) setLoadingStok(true);
    try {
      const res = await obatApi.list({
        page: stokPage,
        per_page: 10,
        search: stokSearch.trim() || undefined,
        kategori_id: stokKategoriId ? parseInt(stokKategoriId) : undefined,
        stok_kritis: stokKritisOnly ? true : undefined,
      });
      setStokList(res.data);
      setStokLastPage(res.meta.last_page);
      setStokTotalCount(res.meta.total);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat daftar stok barang');
    } finally {
      setLoadingStok(false);
    }
  };

  // Fetch Kartu Stok
  const fetchStockCard = async (id: number) => {
    setLoadingStockCard(true);
    try {
      const res = await obatApi.kartuStok(id);
      setStockCardHistory(res.data);
    } catch (err: any) {
      toast.error('Gagal memuat kartu stok.');
    } finally {
      setLoadingStockCard(false);
    }
  };

  // Fetch Metadata
  const fetchFormMetadata = async () => {
    try {
      const drugRes = await obatApi.list({ per_page: 200, status: 'aktif' });
      setDrugs(drugRes.data);

      const supRes = await supplierApi.list({ per_page: 100, status: 'aktif' });
      setSuppliers(supRes.data);

      const catRes = await kategoriApi.list();
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRevisiList = async (isSilent = false) => {
    if (!isSilent) setLoadingRevisi(true);
    try {
      const res = await stokRevisiApi.list({
        page: revisiPage,
        per_page: 10,
        search: revisiSearch.trim() || undefined,
        tipe: (revisiFilterTipe as RevisiTipe) || undefined,
        alasan: (revisiFilterAlasan as RevisiAlasan) || undefined,
      });
      setRevisiList(res.data);
      setRevisiLastPage(res.meta.last_page);
      setRevisiTotal(res.meta.total);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat riwayat revisi stok');
    } finally {
      setLoadingRevisi(false);
    }
  };

  const openRevisiModal = (obat: ApiObat) => {
    setRevisiTargetObat(obat);
    setRevisiForm({
      tipe: 'set',
      jumlah: String(obat.stok),
      alasan: 'koreksi_sistem',
      catatan: '',
      tanggal: new Date().toISOString().split('T')[0],
    });
    setShowRevisiModal(true);
  };

  const handleSubmitRevisi = async () => {
    if (!revisiTargetObat) return;
    const jumlahNum = parseInt(revisiForm.jumlah);
    if (isNaN(jumlahNum) || jumlahNum < 0) {
      toast.error('Jumlah harus berupa angka ≥ 0.');
      return;
    }
    setSubmittingRevisi(true);
    try {
      const res = await stokRevisiApi.create({
        obat_id: revisiTargetObat.id,
        tipe: revisiForm.tipe,
        jumlah: jumlahNum,
        alasan: revisiForm.alasan,
        catatan: revisiForm.catatan || undefined,
        tanggal: revisiForm.tanggal,
      });
      toast.success(res.message || 'Revisi stok berhasil disimpan.');
      setShowRevisiModal(false);
      // Refresh stok list supaya stok terupdate
      fetchStokList(true);
      // Refresh riwayat revisi
      if (activeTab === 'revisi') fetchRevisiList(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan revisi stok.');
    } finally {
      setSubmittingRevisi(false);
    }
  };

  const fetchHistory = async (isSilent = false) => {
    if (!isSilent) setLoadingHistory(true);
    else setRefreshing(true);

    try {
      const res = await obatMasukApi.list({
        page,
        per_page: 8,
        search: search.trim() || undefined,
        supplier_id: filterSupplierId ? parseInt(filterSupplierId) : undefined,
        status: (filterStatus || undefined) as any,
        dari: filterDari || undefined,
        sampai: filterSampai || undefined,
      });
      setHistoryList(res.data);
      setLastPage(res.meta.last_page);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat riwayat transaksi');
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFormMetadata();
    const passedFilter = localStorage.getItem('stock_barang_filter_search');
    if (passedFilter) {
      setStokSearch(passedFilter);
      localStorage.removeItem('stock_barang_filter_search');
      
      const fetchWithSearch = async () => {
        setLoadingStok(true);
        try {
          const res = await obatApi.list({
            page: 1,
            per_page: 10,
            search: passedFilter,
          });
          setStokList(res.data);
          setStokLastPage(res.meta.last_page);
          setStokTotalCount(res.meta.total);
        } catch (err: any) {
          toast.error(err?.message || 'Gagal memuat daftar stok barang');
        } finally {
          setLoadingStok(false);
        }
      };
      fetchWithSearch();
    }
  }, []);

  useEffect(() => {
    const passedFilter = localStorage.getItem('stock_barang_filter_search');
    if (!passedFilter) {
      fetchStokList();
    }
  }, [stokPage, stokKategoriId, stokKritisOnly]);

  useEffect(() => {
    fetchHistory();
  }, [page, filterSupplierId, filterStatus, filterDari, filterSampai]);

  useEffect(() => {
    if (selectedDrugForCard) {
      fetchStockCard(selectedDrugForCard.id);
    }
  }, [selectedDrugForCard]);

  useEffect(() => {
    if (activeTab === 'revisi') fetchRevisiList();
  }, [activeTab, revisiPage, revisiFilterTipe, revisiFilterAlasan]);

  const handleStokSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStokPage(1);
    fetchStokList();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const grandTotal = useMemo(() => {
    return items.reduce((s, it) => s + (it.jumlah * it.harga_satuan), 0);
  }, [items]);

  function updateItem(id: string, key: keyof FormItem, value: string | number) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [key]: value } : it));
  }

  function addItem() {
    setItems(prev => [...prev, emptyItem()]);
  }

  function removeItem(id: string) {
    if (items.length === 1) return;
    setItems(prev => prev.filter(it => it.id !== id));
  }

  async function handleSave(directProcess = false) {
    if (!supplierId || items.some(i => !i.obat_id || i.jumlah <= 0)) {
      toast.error('Lengkapi data supplier dan detail barang terlebih dahulu.');
      return;
    }

    for (const it of items) {
      if (it.jumlah <= 0) {
        toast.error('Jumlah kuantitas barang harus lebih dari 0.');
        return;
      }
      if (it.expired_date && it.expired_date < tanggal) {
        toast.error('Tanggal expired barang tidak boleh sebelum tanggal penerimaan faktur.');
        return;
      }
    }

    // Check if invoice number is duplicate for this supplier
    if (catatan.trim()) {
      try {
        const checkRes = await obatMasukApi.checkFaktur(parseInt(supplierId), catatan.trim());
        if (checkRes.exists) {
          if (!confirm(`Peringatan: Faktur dengan nomor "${catatan.trim()}" dari supplier ini sudah pernah diinput sebelumnya. Tetap simpan?`)) {
            return;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('tanggal', tanggal);
      formData.append('supplier_id', supplierId);
      formData.append('petugas_id', '1');
      if (catatan) formData.append('catatan', catatan.trim());
      formData.append('status', 'draft');

      const itemsPayload = items.map(it => ({
        obat_id: parseInt(it.obat_id),
        jumlah: it.jumlah,
        harga_satuan: it.harga_satuan,
        no_batch: it.no_batch.trim() || null,
        expired_date: it.expired_date || null
      }));
      formData.append('items', JSON.stringify(itemsPayload));

      if (fotoNotaFile) {
        formData.append('foto_nota', fotoNotaFile);
      }

      const res = await obatMasukApi.create(formData);
      const newRecord = res.data;

      if (directProcess) {
        await obatMasukApi.terima(newRecord.id);
        toast.success('Penerimaan faktur berhasil disimpan dan stok otomatis bertambah.');
      } else {
        toast.success('Penerimaan faktur berhasil disimpan sebagai Draft.');
      }
      
      // Reset Form
      setItems([emptyItem()]);
      setSupplierId('');
      setCatatan('');
      setFotoNotaFile(null);
      setFotoNotaPreview('');
      setPage(1);
      setActiveTab('riwayat');
      fetchHistory(true);
      fetchStokList(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan transaksi');
    } finally {
      setSubmitting(false);
    }
  }

  const handleOpenDetail = async (record: ApiObatMasuk) => {
    setDetailRecord(record);
    setLoadingDetail(true);
    try {
      const res = await obatMasukApi.get(record.id);
      setDetailItems((res as any).data.items || []);
    } catch (err: any) {
      toast.error('Gagal memuat rincian item penerimaan barang');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleTerimaTransaksi = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin memproses penerimaan ini dan menambahkan stok barang ke database?')) {
      return;
    }
    try {
      await obatMasukApi.terima(id);
      toast.success('Penerimaan barang berhasil diselesaikan dan stok telah diperbarui.');
      setDetailRecord(null);
      fetchHistory(true);
      fetchStokList(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menerima transaksi');
    }
  };

  const handleDeleteDraft = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus draft transaksi ini?')) {
      return;
    }
    try {
      await obatMasukApi.delete(id);
      toast.success('Draft penerimaan barang berhasil dihapus.');
      setDetailRecord(null);
      fetchHistory(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus draft');
    }
  };

  return (
    <div className="space-y-4 font-sans text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-900">Modul Kelola Stok &amp; Logistik</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pusat penerimaan faktur dari supplier, penambahan stok otomatis, dan pelacakan riwayat kartu stok per barang secara riil.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 flex-wrap">
        <button
          onClick={() => setActiveTab('stok')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all px-1 ${
            activeTab === 'stok' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Kartu Stok &amp; Saldo Barang
        </button>
        <button
          onClick={() => setActiveTab('form')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all px-1 ${
            activeTab === 'form' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Faktur Masuk Baru
        </button>
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all px-1 ${
            activeTab === 'riwayat' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Riwayat Faktur Masuk
        </button>
        <button
          onClick={() => setActiveTab('revisi')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all px-1 flex items-center gap-1.5 ${
            activeTab === 'revisi' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList size={13} /> Koreksi &amp; Opname Stok
        </button>
      </div>

      {/* Tab 1: Kartu Stok */}
      {activeTab === 'stok' && (
        <div className="space-y-4">
          {selectedDrugForCard ? (
            /* Selected Drug: Detail Stock Card Flow */
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border shadow-sm">
                <button
                  onClick={() => setSelectedDrugForCard(null)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg border text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  ←
                </button>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    {selectedDrugForCard.nama}
                    <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {selectedDrugForCard.kode}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Kategori: {selectedDrugForCard.kategori?.nama || '-'} | Satuan: {selectedDrugForCard.satuan} | Stok Saat Ini: <strong>{selectedDrugForCard.stok}</strong>
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <History size={14} className="text-emerald-600" /> Log Aliran Pergerakan Barang (Kartu Stok)
                  </h4>
                  <button
                    onClick={() => fetchStockCard(selectedDrugForCard.id)}
                    className="p-1.5 rounded-lg border text-gray-500 hover:bg-slate-50"
                  >
                    <RefreshCw size={12} className={loadingStockCard ? 'animate-spin' : ''} />
                  </button>
                </div>

                {loadingStockCard ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <span className="ml-2 text-slate-600 font-medium">Mengkalkulasi saldo berjalan...</span>
                  </div>
                ) : stockCardHistory.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">
                    <Package size={36} className="mx-auto mb-2 text-slate-200" />
                    Belum ada riwayat transaksi masuk atau keluar untuk barang ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b text-slate-600 text-xs font-semibold">
                          <th className="text-left px-4 py-3 whitespace-nowrap">Tanggal</th>
                          <th className="text-left px-4 py-3 whitespace-nowrap">Referensi Transaksi</th>
                          <th className="text-left px-4 py-3 whitespace-nowrap">Keterangan Aktivitas</th>
                          <th className="text-center px-4 py-3 whitespace-nowrap w-24">Jumlah Masuk</th>
                          <th className="text-center px-4 py-3 whitespace-nowrap w-24">Jumlah Keluar</th>
                          <th className="text-center px-4 py-3 whitespace-nowrap w-32 bg-emerald-50/50 text-emerald-950 font-bold">Stok Akhir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {stockCardHistory.map((log, idx) => {
                          const isMasuk = log.tipe === 'masuk';
                          const isRevisi = log.tipe === 'revisi';
                          const tipeBadge = isRevisi
                            ? { cls: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500', label: 'Koreksi Stok (Opname)' }
                            : isMasuk
                              ? { cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500', label: 'Barang Masuk (Faktur)' }
                              : { cls: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500', label: 'Barang Keluar (Transaksi)' };
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3 text-xs text-gray-600">
                                {new Date(log.tanggal).toLocaleDateString('id-ID', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })}
                              </td>
                              <td className="px-4 py-3 text-xs font-mono font-medium text-slate-800">{log.referensi}</td>
                              <td className="px-4 py-3 text-xs">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${tipeBadge.cls}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${tipeBadge.dot}`} />
                                  {tipeBadge.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-emerald-700 font-semibold">
                                {log.masuk > 0 ? `+${log.masuk}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-center font-mono text-orange-700 font-semibold">
                                {log.keluar > 0 ? `-${log.keluar}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold bg-emerald-50/20 text-emerald-900">{log.saldo}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* General Stock List View */
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <form onSubmit={handleStokSearchSubmit} className="flex flex-wrap gap-3 items-center">
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-48">
                    <Search size={14} className="text-gray-400 flex-shrink-0" />
                    <input
                      value={stokSearch}
                      onChange={e => setStokSearch(e.target.value)}
                      type="text"
                      placeholder="Cari nama atau kode barang…"
                      className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
                    />
                  </div>
                  <select
                    value={stokKategoriId}
                    onChange={e => { setStokKategoriId(e.target.value); setStokPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 bg-white"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 border px-3 py-2 rounded-lg cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={stokKritisOnly}
                      onChange={e => { setStokKritisOnly(e.target.checked); setStokPage(1); }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    Stok Kritis / Habis
                  </label>
                  <button
                    type="button"
                    onClick={() => fetchStokList(true)}
                    className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 ml-auto"
                  >
                    <RefreshCw size={13} />
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {loadingStok ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    <span className="ml-2 text-slate-600 font-medium">Memuat data stok...</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Kode</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Nama Barang</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Kategori</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Satuan</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Stok Saat Ini</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Stok Minimum</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Status Stok</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Expired Date</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Rak</th>
                          <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {stokList.map(item => {
                          const stockStatus = getDrugStockStatus(item.stok, item.stok_minimum);
                          return (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.kode}</td>
                              <td className="px-4 py-3 font-medium text-gray-800">{item.nama}</td>
                              <td className="px-4 py-3">
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{item.kategori?.nama || '-'}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-600 text-xs">{item.satuan}</td>
                              <td className="px-4 py-3 text-center font-semibold font-mono text-gray-800">{item.stok}</td>
                              <td className="px-4 py-3 text-center font-mono text-gray-500">{item.stok_minimum}</td>
                              <td className="px-4 py-3 text-center">
                                <StockStatusBadge status={stockStatus} />
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">
                                {item.expired_date ? new Date(item.expired_date).toLocaleDateString('id-ID') : '-'}
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-600">{item.lokasi_rak || '-'}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => openRevisiModal(item)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                                    title="Koreksi / Sesuaikan Stok"
                                  >
                                    <Settings2 size={11} /> Koreksi Stok
                                  </button>
                                  <button
                                    onClick={() => setSelectedDrugForCard(item)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-50 transition-colors"
                                  >
                                    <History size={11} /> Kartu Stok
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {stokList.length === 0 && (
                          <tr>
                            <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-sm">
                              <Package size={32} className="mx-auto mb-2 text-gray-200" />
                              Tidak ada data stok ditemukan
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Halaman {stokPage} dari {stokLastPage}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={stokPage === 1}
                      onClick={() => setStokPage(p => p - 1)}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: stokLastPage }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setStokPage(p)}
                        className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${stokPage === p ? 'text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        style={stokPage === p ? { backgroundColor: PRIMARY } : {}}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      disabled={stokPage === stokLastPage}
                      onClick={() => setStokPage(p => p + 1)}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Faktur Masuk Baru */}
      {activeTab === 'form' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Informasi Faktur &amp; Dokumen Masuk</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Penerimaan *</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors bg-white text-gray-800 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier *</label>
                <select
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 bg-white text-gray-800 font-semibold"
                >
                  <option value="">Pilih Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor Faktur / Invoice *</label>
                <input
                  type="text"
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder="Contoh: INV-2026-001"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Upload Berkas Scan Faktur</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFotoNotaFile(file);
                      setFotoNotaPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="w-full text-xs text-slate-500
                    file:mr-2 file:py-1 file:px-2.5
                    file:rounded-md file:border-0
                    file:text-xs file:font-semibold
                    file:bg-emerald-50 file:text-emerald-700
                    hover:file:bg-emerald-100 cursor-pointer"
                />
                {fotoNotaPreview && (
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">✓ Berkas Faktur Terlampir</p>
                )}
              </div>
            </div>
          </div>

          {/* Item rows */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm">Daftar Detail Barang Diterima</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 min-w-44">Nama Barang *</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 min-w-28">No. Batch</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 min-w-32">Tanggal Expired</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 min-w-20">Jumlah *</th>
                    <th className="text-left px-3 py-3 text-xs font-semibold text-gray-500 min-w-28">Harga Beli Satuan (Rp) *</th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 min-w-32">Subtotal</th>
                    <th className="px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2">
                        <select
                          value={item.obat_id}
                          onChange={e => {
                            const d = drugs.find(dr => dr.id === parseInt(e.target.value));
                            updateItem(item.id, 'obat_id', e.target.value);
                            if (d) updateItem(item.id, 'harga_satuan', d.harga_beli);
                          }}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 bg-white"
                        >
                          <option value="">Pilih barang…</option>
                          {drugs.map(d => <option key={d.id} value={d.id}>{d.nama} ({d.kode}) - Stok: {d.stok}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.no_batch}
                          onChange={e => updateItem(item.id, 'no_batch', e.target.value)}
                          placeholder="BATCH-01"
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 transition-colors font-mono"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={item.expired_date}
                          onChange={e => updateItem(item.id, 'expired_date', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 transition-colors font-sans text-gray-700 font-medium"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={item.jumlah}
                          onChange={e => updateItem(item.id, 'jumlah', Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 transition-colors text-center font-mono"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          value={item.harga_satuan}
                          onChange={e => updateItem(item.id, 'harga_satuan', Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-emerald-400 transition-colors font-mono"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="text-xs font-semibold text-gray-800 whitespace-nowrap font-mono">
                          {formatRupiah(item.jumlah * item.harga_satuan)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={items.length === 1}
                          className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={addItem}
                className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:opacity-85 transition-opacity"
              >
                <Plus size={14} /> Tambah Baris Detail
              </button>
            </div>

            <div className="bg-gray-50 px-5 py-4 border-t border-gray-100">
              <div className="flex justify-end items-center">
                <div className="text-right space-y-1">
                  <div className="flex justify-between gap-8 text-xs text-gray-500">
                    <span>Jumlah Item:</span>
                    <span className="font-semibold text-gray-700">{items.length} jenis</span>
                  </div>
                  <div className="flex justify-between gap-8 pt-2 border-t border-gray-200">
                    <span className="text-xs font-bold text-gray-800">Total Nilai Faktur:</span>
                    <span className="text-sm font-bold font-mono text-emerald-600">{formatRupiah(grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setItems([emptyItem()]); setSupplierId(''); setCatatan(''); setFotoNotaFile(null); setFotoNotaPreview(''); }}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Bersihkan Form
            </button>
            
            <button
              onClick={() => handleSave(false)}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              Simpan Draft
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Simpan &amp; Proses Stok
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Riwayat Faktur Masuk */}
      {activeTab === 'riwayat' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-48">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  type="text"
                  placeholder="Cari nomor transaksi…"
                  className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
                />
              </div>
              <select
                value={filterSupplierId}
                onChange={e => { setFilterSupplierId(e.target.value); setPage(1); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 bg-white"
              >
                <option value="">Semua Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 bg-white"
              >
                <option value="">Semua Status</option>
                <option value="draft">Draft</option>
                <option value="diterima">Diterima</option>
                <option value="sebagian">Sebagian</option>
                <option value="dikembalikan">Dikembalikan</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg bg-white">
                <span>Periode:</span>
                <input
                  type="date"
                  value={filterDari}
                  onChange={e => { setFilterDari(e.target.value); setPage(1); }}
                  className="outline-none border-b border-gray-200 bg-transparent py-0.5"
                />
                <span>s/d</span>
                <input
                  type="date"
                  value={filterSampai}
                  onChange={e => { setFilterSampai(e.target.value); setPage(1); }}
                  className="outline-none border-b border-gray-200 bg-transparent py-0.5"
                />
              </div>

              <button
                type="button"
                onClick={() => fetchHistory(true)}
                className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 ml-auto"
                disabled={refreshing}
              >
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingHistory ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="ml-2 text-slate-600 font-medium">Memuat riwayat penerimaan...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['No. Transaksi', 'Tanggal', 'No. Faktur', 'Supplier', 'Petugas', 'Jml. Jenis', 'Total Nilai', 'Status', 'Aksi'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {historyList.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-xs font-mono text-gray-800 font-medium">{r.no_transaksi}</code>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {r.tanggal ? new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">{r.catatan || '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">{r.supplier?.nama || '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{r.petugas?.nama || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{r.total_item} jenis</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-800 font-mono">{formatRupiah(r.nilai_total)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleOpenDetail(r)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {historyList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-gray-400 text-sm">
                          <CheckCircle2 size={32} className="mx-auto mb-2 text-gray-200" />
                          Tidak ada riwayat transaksi ditemukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Halaman {page} dari {lastPage}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? 'text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    style={page === p ? { backgroundColor: PRIMARY } : {}}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={page === lastPage}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailRecord && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-semibold text-gray-800 text-sm">Detail Transaksi Penerimaan Barang</h2>
              <button onClick={() => { setDetailRecord(null); setDetailItems([]); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                {[
                  ['No. Transaksi', detailRecord.no_transaksi],
                  ['Tanggal', detailRecord.tanggal ? new Date(detailRecord.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'],
                  ['Supplier', detailRecord.supplier?.nama || '-'],
                  ['Petugas Penanggung Jawab', detailRecord.petugas?.nama || '-'],
                  ['Nomor Faktur / Invoice', detailRecord.catatan || '-'],
                  ['Total Nilai Transaksi', formatRupiah(detailRecord.nilai_total)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">{k}</span>
                    <span className="text-xs font-semibold text-gray-800">{v}</span>
                  </div>
                ))}
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Status Transaksi</span>
                  <StatusBadge status={detailRecord.status} />
                </div>
              </div>

              {/* Rincian barang */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Daftar Item Barang Diterima</h4>
                
                {loadingDetail ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    <span className="ml-2 text-xs text-slate-500">Memuat rincian...</span>
                  </div>
                ) : detailItems.length > 0 ? (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100/60">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500">Nama Barang</th>
                          <th className="text-left px-3 py-2 text-gray-500">No. Batch</th>
                          <th className="text-left px-3 py-2 text-gray-500">Expired Date</th>
                          <th className="text-center px-3 py-2 text-gray-500 w-20">Jumlah</th>
                          <th className="text-right px-3 py-2 text-gray-500">Harga Satuan</th>
                          <th className="text-right px-3 py-2 text-gray-500">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {detailItems.map((item: any) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 font-medium">{item.obat?.nama || 'Barang terhapus'}</td>
                            <td className="px-3 py-2 font-mono text-gray-600">{item.no_batch || '-'}</td>
                            <td className="px-3 py-2 text-gray-600">{item.expired_date ? new Date(item.expired_date).toLocaleDateString('id-ID') : '-'}</td>
                            <td className="px-3 py-2 text-center font-mono">{item.jumlah} {item.obat?.satuan}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatRupiah(item.harga_satuan)}</td>
                            <td className="px-3 py-2 text-right font-mono font-semibold">{formatRupiah(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">Tidak ada rincian item untuk transaksi ini</p>
                )}
              </div>

              {/* Lampiran Foto Nota / Faktur */}
              {detailRecord.foto_nota && (
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <FileText size={14} className="text-slate-500" /> Lampiran Faktur / Nota Penerimaan
                  </h4>
                  <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center p-2 max-h-60">
                    <img
                      src={detailRecord.foto_nota}
                      alt="Foto Nota Penerimaan"
                      className="max-h-56 rounded-lg object-contain border shadow-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2 text-xs font-semibold">
                    <a
                      href={detailRecord.foto_nota}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <Eye size={12} /> Buka di Tab Baru
                    </a>
                    <a
                      href={detailRecord.foto_nota}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      <Download size={12} /> Unduh Berkas
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
              {detailRecord.status === 'draft' && (
                <>
                  <button
                    onClick={() => handleDeleteDraft(detailRecord.id)}
                    className="px-4 py-2.5 rounded-lg text-sm text-red-500 border border-red-200 hover:bg-red-50 transition-colors font-medium flex-1"
                  >
                    Hapus Draft
                  </button>
                  <button
                    onClick={() => handleTerimaTransaksi(detailRecord.id)}
                    className="px-4 py-2.5 rounded-lg text-sm text-white hover:opacity-90 transition-opacity font-semibold flex-1 flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: PRIMARY }}
                  >
                    Terima &amp; Update Stok <ArrowRight size={14} />
                  </button>
                </>
              )}
              {detailRecord.status !== 'draft' && (
                <button
                  onClick={() => { setDetailRecord(null); setDetailItems([]); }}
                  className="w-full py-2.5 rounded-lg text-sm text-gray-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Koreksi & Opname Stok ─────────────────────────────── */}
      {activeTab === 'revisi' && (
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
            <ClipboardList size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Koreksi &amp; Opname Stok</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Formulir ini digunakan untuk mengoreksi jumlah stok barang yang tidak sesuai hasil penghitungan fisik—
                misalnya akibat barang rusak, hilang, temuan, atau koreksi data sistem.
                Setiap perubahan tercatat otomatis pada Audit Log dan Kartu Stok masing-masing barang.
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <form onSubmit={e => { e.preventDefault(); setRevisiPage(1); fetchRevisiList(); }} className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 flex-1 min-w-48">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  value={revisiSearch}
                  onChange={e => setRevisiSearch(e.target.value)}
                  type="text"
                  placeholder="Cari nama atau kode barang…"
                  className="bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400 w-full"
                />
              </div>
              <select
                value={revisiFilterTipe}
                onChange={e => { setRevisiFilterTipe(e.target.value); setRevisiPage(1); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 bg-white"
              >
                <option value="">Semua Jenis Koreksi</option>
                <option value="tambah">Penambahan Stok</option>
                <option value="kurang">Pengurangan Stok</option>
                <option value="set">Penetapan Stok (Opname)</option>
              </select>
              <select
                value={revisiFilterAlasan}
                onChange={e => { setRevisiFilterAlasan(e.target.value); setRevisiPage(1); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none text-gray-600 bg-white"
              >
                <option value="">Semua Keterangan</option>
                {Object.entries(ALASAN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => fetchRevisiList(true)}
                className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50"
              >
                <RefreshCw size={13} />
              </button>
            </form>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {loadingRevisi ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="ml-2 text-slate-600 font-medium">Memuat riwayat koreksi stok…</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">No. Dokumen</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Tanggal</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Nama Barang</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Jenis Koreksi</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Stok Sebelum</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Selisih</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Stok Sesudah</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Keterangan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">Petugas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {revisiList.map(r => {
                      const tipeMap: Record<string, { cls: string; icon: JSX.Element; label: string }> = {
                        tambah: { cls: 'bg-emerald-50 text-emerald-700', icon: <PlusCircle size={11} />, label: 'Penambahan' },
                        kurang: { cls: 'bg-red-50 text-red-700', icon: <MinusCircle size={11} />, label: 'Pengurangan' },
                        set:    { cls: 'bg-slate-100 text-slate-700', icon: <Settings2 size={11} />, label: 'Penetapan (Opname)' },
                      };
                      const t = tipeMap[r.tipe] ?? tipeMap.set;
                      const diff = r.stok_sesudah - r.stok_sebelum;
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-emerald-700 font-semibold">{r.no_revisi}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            {new Date(r.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800 text-xs">{r.obat?.nama || '-'}</div>
                            <div className="text-[10px] text-gray-400 font-mono">{r.obat?.kode}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${t.cls}`}>
                              {t.icon} {t.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-gray-700">{r.stok_sebelum}</td>
                          <td className="px-4 py-3 text-center font-mono font-bold">
                            <span className={diff >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                              {diff >= 0 ? '+' : ''}{diff}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">{r.stok_sesudah}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">
                            <div>{ALASAN_LABELS[r.alasan] || r.alasan}</div>
                            {r.catatan && <div className="text-[10px] text-gray-400 italic mt-0.5">{r.catatan}</div>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-600">{r.petugas?.nama || '-'}</td>
                        </tr>
                      );
                    })}
                    {revisiList.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-4 py-14 text-center text-gray-400 text-sm">
                          <ClipboardList size={32} className="mx-auto mb-2 text-gray-200" />
                          Belum ada riwayat koreksi stok
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {revisiLastPage > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Total {revisiTotal} dokumen koreksi</span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={revisiPage === 1}
                    onClick={() => setRevisiPage(p => p - 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  ><ChevronLeft size={14} /></button>
                  {Array.from({ length: revisiLastPage }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setRevisiPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${revisiPage === p ? 'text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      style={revisiPage === p ? { backgroundColor: PRIMARY } : {}}
                    >{p}</button>
                  ))}
                  <button
                    disabled={revisiPage === revisiLastPage}
                    onClick={() => setRevisiPage(p => p + 1)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  ><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Koreksi Stok ─────────────────────────────────────────── */}
      {showRevisiModal && revisiTargetObat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRevisiModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">

            {/* Header */}
            <div className="px-6 py-5 border-b border-emerald-100 bg-emerald-700 flex items-start justify-between">
              <div>
                <p className="text-[11px] text-emerald-200 font-medium uppercase tracking-widest mb-0.5">Formulir Koreksi Stok</p>
                <h3 className="font-bold text-white text-base leading-tight">
                  {revisiTargetObat.nama}
                </h3>
                <p className="text-emerald-300 text-xs mt-0.5 font-mono">{revisiTargetObat.kode} &nbsp;·&nbsp; {revisiTargetObat.satuan}</p>
              </div>
              <button
                onClick={() => setShowRevisiModal(false)}
                className="text-emerald-300 hover:text-white transition-colors mt-0.5 ml-4 flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stok current info */}
            <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">
              <div className="px-6 py-4 text-center">
                <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">Stok Tercatat Saat Ini</div>
                <div className="text-3xl font-bold text-slate-800 font-mono">{revisiTargetObat.stok}</div>
                <div className="text-xs text-gray-400 mt-0.5">{revisiTargetObat.satuan}</div>
              </div>
              <div className="px-6 py-4 text-center">
                <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">Stok Setelah Koreksi</div>
                <div className={`text-3xl font-bold font-mono ${
                  (() => {
                    const j = parseInt(revisiForm.jumlah) || 0;
                    const sesudah = revisiForm.tipe === 'set' ? j : revisiForm.tipe === 'tambah' ? revisiTargetObat.stok + j : Math.max(0, revisiTargetObat.stok - j);
                    return sesudah < revisiTargetObat.stok ? 'text-red-600' : sesudah > revisiTargetObat.stok ? 'text-emerald-600' : 'text-slate-800';
                  })()
                }`}>
                  {(() => {
                    const j = parseInt(revisiForm.jumlah) || 0;
                    if (revisiForm.tipe === 'set') return j;
                    if (revisiForm.tipe === 'tambah') return revisiTargetObat.stok + j;
                    return Math.max(0, revisiTargetObat.stok - j);
                  })()}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{revisiTargetObat.satuan}</div>
              </div>
            </div>

            {/* Form */}
            <div className="px-6 py-5 space-y-4">
              {/* Jenis Koreksi */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Jenis Koreksi Stok <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'tambah' as RevisiTipe, label: 'Penambahan', cls: 'border-emerald-400 bg-emerald-50 text-emerald-800', icon: <PlusCircle size={14} /> },
                    { v: 'kurang' as RevisiTipe, label: 'Pengurangan', cls: 'border-red-400 bg-red-50 text-red-800', icon: <MinusCircle size={14} /> },
                    { v: 'set' as RevisiTipe, label: 'Penetapan', cls: 'border-slate-400 bg-slate-100 text-slate-800', icon: <Settings2 size={14} /> },
                  ] as const).map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setRevisiForm(f => ({ ...f, tipe: opt.v }))}
                      className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                        revisiForm.tipe === opt.v ? opt.cls : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {revisiForm.tipe === 'tambah' && 'Stok bertambah sejumlah nilai yang dimasukkan.'}
                  {revisiForm.tipe === 'kurang' && 'Stok berkurang sejumlah nilai yang dimasukkan.'}
                  {revisiForm.tipe === 'set' && 'Stok ditetapkan tepat sesuai angka hasil opname fisik.'}
                </p>
              </div>

              {/* Jumlah */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {revisiForm.tipe === 'set' ? 'Jumlah Stok Hasil Opname Fisik' : 'Jumlah'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={revisiForm.jumlah}
                  onChange={e => setRevisiForm(f => ({ ...f, jumlah: e.target.value }))}
                  placeholder="Masukkan angka…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 font-mono text-gray-800"
                />
              </div>

              {/* Keterangan Penyebab */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Keterangan Penyebab <span className="text-red-500">*</span></label>
                <select
                  value={revisiForm.alasan}
                  onChange={e => setRevisiForm(f => ({ ...f, alasan: e.target.value as RevisiAlasan }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 text-gray-700 bg-white"
                >
                  {Object.entries(ALASAN_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              {/* Tanggal */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tanggal Koreksi <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={revisiForm.tanggal}
                  onChange={e => setRevisiForm(f => ({ ...f, tanggal: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 text-gray-700"
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Catatan / Keterangan Tambahan</label>
                <textarea
                  value={revisiForm.catatan}
                  onChange={e => setRevisiForm(f => ({ ...f, catatan: e.target.value }))}
                  rows={2}
                  placeholder="Contoh: Ditemukan 5 tablet rusak saat opname gudang tanggal …"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 text-gray-700 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowRevisiModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitRevisi}
                disabled={submittingRevisi || !revisiForm.jumlah}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: submittingRevisi || !revisiForm.jumlah ? undefined : PRIMARY }}
              >
                {submittingRevisi ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Simpan Dokumen Koreksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
