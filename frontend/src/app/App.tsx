import { useState, useEffect } from 'react';
import { ShieldOff } from 'lucide-react';
import { Layout } from './components/Layout';
import { Login, type LoginUser } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { MasterObat } from './components/MasterObat';
import { MonitoringExpired } from './components/MonitoringExpired';
import { ObatMasuk } from './components/ObatMasuk';
import { ComingSoon } from './components/ComingSoon';
import { KategoriObat } from './components/KategoriObat';
import { ObatKeluar } from './components/ObatKeluar';
import { Laporan } from './components/Laporan';
import { Supplier } from './components/Supplier';
import { ManajemenUser } from './components/ManajemenUser';
import { PengaturanSistem } from './components/PengaturanSistem';
import { AuditLog } from './components/AuditLog';
import { ProfilPengguna } from './components/ProfilPengguna';
import type { Page } from './components/data';
import { authApi, token, pengaturanApi } from './services/api';

export default function App() {
  const [user, setUser]             = useState<LoginUser | null>(null);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [authChecking, setAuthChecking] = useState(true); // Cek token localStorage dulu sebelum render
  const [appConfig, setAppConfig] = useState<{ namaKlinik: string; logoUrl: string | null }>({
    namaKlinik: 'Klinik Cempaka Lima',
    logoUrl: null
  });

  const loadAppConfig = async () => {
    try {
      const res = await pengaturanApi.publik();
      setAppConfig({
        namaKlinik: res.data.umum?.nama_klinik || 'Klinik Cempaka Lima',
        logoUrl: res.data.umum?.logo_klinik_url || null
      });
    } catch (err) {
      console.error('Gagal memuat konfigurasi publik app:', err);
    }
  };

  // Restore sesi dari token localStorage saat pertama kali dimuat
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = token.get();
      if (!savedToken) {
        setAuthChecking(false);
        return;
      }
      try {
        const res = await authApi.me();
        const u = res.data;
        setUser({
          id:       u.id,
          username: u.username,
          nama:     u.nama,
          role:     u.role,
          fotoUrl:  u.foto_url ?? null,
          initials: u.nama
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((w: string) => w[0].toUpperCase())
            .join(''),
        });
      } catch {
        // Token tidak valid/expired — hapus dan tampilkan login
        token.clear();
      } finally {
        setAuthChecking(false);
      }
    };
    restoreSession();
    loadAppConfig();
  }, []);

  useEffect(() => {
    if (user) loadAppConfig();
  }, [activePage]);

  function handleLogin(u: LoginUser) {
    setUser(u);
    setActivePage('dashboard');
  }

  function handleLogout() {
    /* Panggil logout API (fire-and-forget) lalu bersihkan token lokal */
    authApi.logout().catch(() => {/* token mungkin sudah invalid, abaikan */});
    token.clear();
    setUser(null);
    setActivePage('dashboard');
  }

  // Tampilkan layar loading sementara sesi dipulihkan dari token localStorage
  if (authChecking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F4F2' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTopColor: '#0F9D74', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 13, color: '#7C8B93' }}>Memuat sesi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} appConfig={appConfig} />;
  }

  const ADMIN_PAGES = ['manajemen-user', 'pengaturan', 'audit-log'];
  /* role dari backend adalah slug ('admin'), bukan label kapital ('Administrator') */
  const isAdmin = user.role === 'admin';

  function AccessDenied() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 360, gap: 12, padding: 40 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FDF2F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldOff size={26} style={{ color: '#B8483A' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: "'Space Grotesk', system-ui", fontSize: 15, fontWeight: 700, color: '#1B2A45', margin: '0 0 6px' }}>
            Akses Ditolak
          </p>
          <p style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 13, color: '#7C8B93', margin: 0, lineHeight: 1.55, maxWidth: 340 }}>
            Halaman ini hanya dapat diakses oleh <strong>Administrator</strong>. Hubungi admin sistem jika Anda memerlukan akses.
          </p>
        </div>
        <button
          onClick={() => setActivePage('dashboard')}
          style={{ marginTop: 8, padding: '8px 20px', borderRadius: 5, border: 'none', backgroundColor: '#4F7A6B', color: '#fff', fontFamily: "'IBM Plex Sans', system-ui", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  function renderPage() {
    // Route guard — admin-only pages
    if (ADMIN_PAGES.includes(activePage) && !isAdmin) {
      return <AccessDenied />;
    }

    switch (activePage) {
      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'master-obat':
        return <MasterObat />;
      case 'kategori':
        return <KategoriObat />;
      case 'monitoring-expired':
        return <MonitoringExpired setActivePage={setActivePage} />;
      case 'obat-masuk':
        return <ObatMasuk />;
      case 'obat-keluar':
        return <ObatKeluar />;
      case 'laporan':
        return <Laporan />;
      case 'supplier':
        return <Supplier />;
      case 'manajemen-user':
        return <ManajemenUser />;
      case 'pengaturan':
        return <PengaturanSistem setActivePage={setActivePage} />;
      case 'audit-log':
        return <AuditLog />;
      case 'profil':
        return <ProfilPengguna user={user} />;
      default:
        return <ComingSoon page={activePage} />;
    }
  }

  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      user={user}
      onLogout={handleLogout}
      appConfig={appConfig}
    >
      {renderPage()}
    </Layout>
  );
}
