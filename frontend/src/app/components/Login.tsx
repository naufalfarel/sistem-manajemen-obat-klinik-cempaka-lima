import { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import logoImg from '../../imports/logo_cemmpaka_lima.jpg';
import { authApi, token, type AuthUser, ApiError } from '../services/api';

/* ── Role label mapping (presentasi, BUKAN dari API) ───────────────────── */
export const ROLE_LABELS: Record<AuthUser['role'], string> = {
  admin: 'Administrator',
  apoteker: 'Apoteker',
  'staf-gudang': 'Staf Gudang',
  kasir: 'Kasir',
};

export interface LoginUser {
  id: number;
  username: string;
  nama: string;
  role: AuthUser['role'];
  /** Initials dihitung di frontend dari nama */
  initials: string;
  /** URL foto profil dari server, null jika belum diupload */
  fotoUrl: string | null;
}

function getInitials(nama: string): string {
  return nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

interface LoginProps {
  onLogin: (user: LoginUser) => void;
  appConfig?: {
    namaKlinik: string;
    logoUrl: string | null;
  };
}

/* ── Clock ─────────────────────────────────────────────────────────────── */
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);
  return (
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
      {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      {' · '}
      {now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
    </span>
  );
}

export function Login({ onLogin, appConfig }: LoginProps) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [fieldErr, setFieldErr] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim())  errs.email    = 'Email tidak boleh kosong';
    if (!password)      errs.password = 'Password tidak boleh kosong';
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);

      /* Simpan token ke localStorage via token helper dari api.ts */
      token.set(res.token);

      const u = res.user;
      onLogin({
        id:       u.id,
        username: u.username,
        nama:     u.nama,
        role:     u.role,
        fotoUrl:  u.foto_url ?? null,
        email:    u.email,
        initials: getInitials(u.nama),
      });
    } catch (err) {
      const isApiError = err && typeof err === 'object' && ((err as any).name === 'ApiError' || 'status' in (err as any));
      if (isApiError) {
        const apiErr = err as any;
        if (apiErr.errors) {
          /* Error validasi 422 — tampilkan pesan per field */
          const emailErr = apiErr.errors['email']?.[0];
          if (emailErr) setError(emailErr);
          else setError(apiErr.message);
        } else {
          setError(apiErr.message);
        }
      } else {
        setError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: 5, outline: 'none',
    fontFamily: "'IBM Plex Sans', system-ui",
    fontSize: 13.5, color: '#1E293B',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F0F4F2',
    }}>

      {/* ── Top strip ─────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#0B3B2E',
        padding: '7px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>
          SISTEM MANAJEMEN OBAT & BMHP — KLINIK UTAMA CEMPAKA LIMA
        </span>
        <Clock />
      </div>

      {/* ── Main area ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#fff',
          border: '1px solid #D1D9E0',
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(11,59,46,0.10)',
        }}>

          {/* Card header — dark green */}
          <div style={{
            backgroundColor: '#0B3B2E',
            padding: '28px 32px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}>
            {/* Logo */}
            <div style={{
              width: 64, height: 64, borderRadius: 10,
              backgroundColor: '#fff', padding: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.30)',
            }}>
              <img
                src={appConfig?.logoUrl || logoImg}
                alt={appConfig?.namaKlinik || "Klinik Utama Cempaka Lima"}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            {/* Clinic name */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: "'Space Grotesk', system-ui",
                fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.2,
              }}>
                {appConfig?.namaKlinik || "Klinik Utama Cempaka Lima"}
              </div>
              <div style={{
                fontFamily: "'IBM Plex Sans', system-ui",
                fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 4,
                letterSpacing: '0.06em',
              }}>
                SISTEM MANAJEMEN OBAT & BMHP
              </div>
            </div>
          </div>

          {/* Form area */}
          <div style={{ padding: '28px 32px 32px' }}>
            <p style={{
              fontFamily: "'Space Grotesk', system-ui",
              fontSize: 14.5, fontWeight: 700, color: '#1E293B',
              margin: '0 0 4px',
            }}>
              Masuk ke Sistem
            </p>
            <p style={{
              fontFamily: "'IBM Plex Sans', system-ui",
              fontSize: 12, color: '#64748B',
              margin: '0 0 22px',
            }}>
              Gunakan email dan password yang diberikan oleh administrator.
            </p>

            {/* Error banner */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '10px 12px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderLeft: '3px solid #DC2626',
                borderRadius: '0 4px 4px 0',
                marginBottom: 18,
              }}>
                <AlertCircle size={14} style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 12.5, color: '#991B1B' }}>
                  {error}
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  display: 'block', marginBottom: 5,
                  fontFamily: "'IBM Plex Sans', system-ui",
                  fontSize: 12.5, fontWeight: 600, color: '#374151',
                }}>
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErr(p => ({ ...p, email: undefined })); setError(''); }}
                  placeholder="Masukkan email"
                  style={{
                    ...inp,
                    borderColor: fieldErr.email ? '#EF4444' : '#D1D5DB',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                  onFocus={e => { if (!fieldErr.email) e.target.style.borderColor = '#0F9D74'; }}
                  onBlur={e => { if (!fieldErr.email) e.target.style.borderColor = '#D1D5DB'; }}
                />
                {fieldErr.email && (
                  <p style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 11.5, color: '#EF4444', margin: '4px 0 0' }}>
                    {fieldErr.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 22 }}>
                <label style={{
                  display: 'block', marginBottom: 5,
                  fontFamily: "'IBM Plex Sans', system-ui",
                  fontSize: 12.5, fontWeight: 600, color: '#374151',
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErr(p => ({ ...p, password: undefined })); setError(''); }}
                    placeholder="Masukkan password"
                    style={{
                      ...inp,
                      borderColor: fieldErr.password ? '#EF4444' : '#D1D5DB',
                      paddingRight: 40,
                      fontFamily: showPass ? "'IBM Plex Mono', monospace" : 'inherit',
                    }}
                    onFocus={e => { if (!fieldErr.password) e.target.style.borderColor = '#0F9D74'; }}
                    onBlur={e => { if (!fieldErr.password) e.target.style.borderColor = '#D1D5DB'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9CA3AF', padding: 2, display: 'flex',
                    }}
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {fieldErr.password && (
                  <p style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 11.5, color: '#EF4444', margin: '4px 0 0' }}>
                    {fieldErr.password}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '10px 0',
                  borderRadius: 5, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  backgroundColor: loading ? '#6EAF98' : '#0B3B2E',
                  color: '#fff',
                  fontFamily: "'Space Grotesk', system-ui",
                  fontSize: 13.5, fontWeight: 700, letterSpacing: '0.03em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#0F9D74'; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = '#0B3B2E'; }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                    Memeriksa…
                  </>
                ) : (
                  'Masuk'
                )}
              </button>

              {/* Spin keyframe */}
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </form>

            {/* Hint */}
            <div style={{
              marginTop: 20, padding: '10px 12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 4,
            }}>
              <p style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 11.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Lupa password? Hubungi administrator sistem untuk reset akun Anda.
              </p>
              <p style={{ fontFamily: "'IBM Plex Mono', system-ui", fontSize: 10.5, color: '#94A3B8', margin: '5px 0 0' }}>
                ext. 101 · it@cempakallima.id
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 24px',
        borderTop: '1px solid #D1D9E0',
        backgroundColor: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 11, color: '#94A3B8' }}>
          Sistem Manajemen Obat & BMHP v2.1.0
        </span>
        <span style={{ color: '#E2E8F0' }}>·</span>
        <span style={{ fontFamily: "'IBM Plex Sans', system-ui", fontSize: 11, color: '#94A3B8' }}>
          Klinik Utama Cempaka Lima © 2026
        </span>
        <span style={{ color: '#E2E8F0' }}>·</span>
        <span style={{ fontFamily: "'IBM Plex Mono', system-ui", fontSize: 10.5, color: '#CBD5E1' }}>
          Laravel 11 + React 18
        </span>
      </div>
    </div>
  );
}
