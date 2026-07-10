import { Construction } from 'lucide-react';

const pageLabels: Record<string, string> = {
  'kategori': 'Kategori Obat',
  'supplier': 'Supplier',
  'obat-keluar': 'Obat Keluar',
  'laporan': 'Laporan',
  'manajemen-user': 'Manajemen User',
  'pengaturan': 'Pengaturan Sistem',
  'audit-log': 'Audit Log',
};

export function ComingSoon({ page }: { page: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100">
        <Construction size={28} className="text-gray-400" />
      </div>
      <div>
        <h2 className="font-semibold text-gray-700">Halaman Dalam Pengembangan</h2>
        <p className="text-sm text-gray-400 mt-1">
          Fitur <span className="font-medium text-gray-600">{pageLabels[page] ?? page}</span> akan segera hadir
        </p>
      </div>
    </div>
  );
}
