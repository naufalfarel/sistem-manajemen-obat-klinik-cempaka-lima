import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, 
  Info, Edit2, Eye, Trash2, Loader2, RefreshCw, FileText, X
} from 'lucide-react';
import { kategoriApi, obatApi, type KategoriObat as ApiKategori, type Obat as ApiObat } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { toast } from 'sonner';

export function KategoriBarang() {
  const [data, setData] = useState<ApiKategori[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ApiKategori | null>(null);
  
  // Drawer State
  const [selectedCategory, setSelectedCategory] = useState<ApiKategori | null>(null);
  const [categoryDrugs, setCategoryDrugs] = useState<ApiObat[]>([]);
  const [loadingDrugs, setLoadingDrugs] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    kode: '',
    deskripsi: ''
  });

  const fetchCategories = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await kategoriApi.list();
      setData(res.data);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memuat kategori barang');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const stats = useMemo(() => {
    return {
      total: data.length,
      totalObat: data.reduce((acc, curr) => acc + curr.jumlah_obat, 0)
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(c => {
      const matchesSearch = c.nama.toLowerCase().includes(search.toLowerCase()) || 
                           c.kode.toLowerCase().includes(search.toLowerCase()) ||
                           (c.deskripsi && c.deskripsi.toLowerCase().includes(search.toLowerCase()));
      return matchesSearch;
    });
  }, [data, search]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormData({
      nama: '',
      kode: `KTG-${String(data.length + 1).padStart(2, '0')}`,
      deskripsi: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (category: ApiKategori) => {
    setEditingCategory(category);
    setFormData({
      nama: category.nama,
      kode: category.kode,
      deskripsi: category.deskripsi || ''
    });
    setIsModalOpen(true);
  };

  const handleViewDetail = async (category: ApiKategori) => {
    setSelectedCategory(category);
    setIsDrawerOpen(true);
    setLoadingDrugs(true);
    try {
      // Ambil daftar obat dari API obat dengan filter kategori_id
      const res = await obatApi.list({ kategori_id: category.id, per_page: 100 });
      setCategoryDrugs(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error('Gagal memuat daftar barang untuk kategori ini');
    } finally {
      setLoadingDrugs(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama || !formData.kode) {
      toast.error('Nama dan Kode wajib diisi');
      return;
    }

    try {
      if (editingCategory) {
        await kategoriApi.update(editingCategory.id, formData);
        toast.success('Kategori berhasil diperbarui');
      } else {
        await kategoriApi.create(formData);
        toast.success('Kategori baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
      fetchCategories(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan kategori');
    }
  };

  const handleDelete = async (category: ApiKategori) => {
    if (category.jumlah_obat > 0) {
      toast.error(`Kategori tidak dapat dihapus karena masih memiliki ${category.jumlah_obat} barang terkait.`);
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus kategori "${category.nama}"?`)) {
      return;
    }

    try {
      await kategoriApi.delete(category.id);
      toast.success('Kategori berhasil dihapus');
      fetchCategories(true);
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus kategori');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kategori Barang</h1>
          <p className="text-slate-500">Kelola pengelompokan barang/obat berdasarkan fungsi dan sediaan.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fetchCategories(true)}
            variant="outline"
            className="gap-2"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Perbarui
          </Button>
          <Button onClick={handleOpenAddModal} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            <Plus className="w-4 h-4" /> Tambah Kategori
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard title="Total Kategori" value={loading ? '...' : stats.total} icon={<Info className="text-blue-600" />} />
        <StatCard title="Total Item Barang" value={loading ? '...' : stats.totalObat} icon={<FileText className="text-amber-600" />} />
      </div>

      {/* Toolbar */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-4 bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input 
                placeholder="Cari kategori atau kode..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-slate-600 font-medium">Memuat data kategori...</span>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah Barang</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((category) => (
                    <TableRow key={category.id} className="group hover:bg-slate-50/50">
                      <TableCell className="font-semibold text-slate-800">{category.nama}</TableCell>
                      <TableCell className="text-slate-600 font-mono text-xs">{category.kode}</TableCell>
                      <TableCell className="text-slate-500 max-w-xs truncate">{category.deskripsi || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{category.jumlah_obat}</span>
                          <span className="text-xs text-slate-400">Barang</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {category.created_at ? new Date(category.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleViewDetail(category)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Detail"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </button>
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            title="Ubah"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                      Tidak ada kategori ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-white">
                <span className="text-xs text-slate-500">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 p-0"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    &lt;
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Button
                      key={p}
                      variant={currentPage === p ? 'default' : 'outline'}
                      className={`h-7 w-7 text-xs font-semibold p-0 ${currentPage === p ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 p-0"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    &gt;
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 text-sm">
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500">Nama Kategori *</label>
                  <input
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Analgesik"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-500">Kode Kategori *</label>
                  <input
                    value={formData.kode}
                    onChange={e => setFormData({ ...formData, kode: e.target.value })}
                    placeholder="KTG-01"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Deskripsi</label>
                <input
                  value={formData.deskripsi}
                  onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Penjelasan singkat kategori"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 border-t border-slate-50 pt-4 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm text-white font-semibold hover:opacity-90 bg-emerald-600 hover:bg-emerald-700"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer (Right side flyout) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-slate-800 text-sm">{selectedCategory?.nama}</h2>
                <p className="text-xs text-slate-400">Detail dan daftar barang dalam kategori ini</p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)} 
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400 font-medium uppercase">Kode</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedCategory?.kode}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-400 font-medium uppercase">Jumlah Barang</p>
                  <p className="text-sm font-semibold text-slate-700">{selectedCategory?.jumlah_obat} Item</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400 font-medium uppercase">Deskripsi</p>
                <p className="text-sm text-slate-600">{selectedCategory?.deskripsi || '-'}</p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" /> Daftar Barang terkait
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {loadingDrugs ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                      <span className="ml-2 text-xs text-slate-500">Memuat barang...</span>
                    </div>
                  ) : categoryDrugs.length > 0 ? (
                    categoryDrugs.map(drug => (
                      <div key={drug.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-emerald-200 hover:bg-emerald-50 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{drug.nama}</p>
                          <p className="text-xs text-slate-500">{drug.kode} • {drug.satuan}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5 bg-white">Stok: {drug.stok}</Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <p className="text-sm">Belum ada barang dalam kategori ini</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex items-center justify-between bg-white rounded-xl">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
