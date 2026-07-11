import React, { useState, useEffect, useRef } from 'react';
import {
  X, Camera, Shield, Eye, EyeOff, Save, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';
import { authApi, type AuthUser } from '../services/api';
import { toast } from 'sonner';

const PRIMARY = '#0F9D74';

interface ProfilPenggunaModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser | null;
  onProfileUpdated?: (newProfile: { nama: string; username: string; fotoUrl: string | null }) => void;
}

export function ProfilPenggunaModal({ isOpen, onClose, user, onProfileUpdated }: ProfilPenggunaModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Profile state
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  
  // Password state
  const [passwordLama, setPasswordLama] = useState('');
  const [passwordBaru, setPasswordBaru] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  // UI States
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [showPwLama, setShowPwLama] = useState(false);
  const [showPwBaru, setShowPwBaru] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize
  useEffect(() => {
    if (user) {
      setNama(user.nama || '');
      setEmail(user.email || '');
      setUsername(user.username || '');
      setFotoPreview(user.foto_url || null);
      setFotoFile(null);
    }
    setPasswordLama('');
    setPasswordBaru('');
    setPasswordConfirmation('');
    setActiveTab('profile');
  }, [user, isOpen]);

  // Escape key closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  // Handle Backdrop Click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim() || !email.trim() || !username.trim()) {
      toast.error('Semua data profil wajib diisi');
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append('nama', nama);
    formData.append('email', email);
    formData.append('username', username);
    if (fotoFile) {
      formData.append('foto', fotoFile);
    }

    try {
      const res = await authApi.updateProfile(formData);
      toast.success('Profil berhasil diperbarui');
      if (onProfileUpdated) {
        onProfileUpdated({
          nama: res.data.nama,
          username: res.data.username,
          fotoUrl: res.data.foto_url,
        });
      }
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordLama) {
      toast.error('Masukkan password saat ini');
      return;
    }
    if (!passwordBaru) {
      toast.error('Masukkan password baru');
      return;
    }
    if (passwordBaru !== passwordConfirmation) {
      toast.error('Konfirmasi password baru tidak sesuai');
      return;
    }

    setSaving(true);
    try {
      await authApi.updatePassword({
        password_lama: passwordLama,
        password: passwordBaru,
        password_confirmation: passwordConfirmation,
      });
      toast.success('Password berhasil diperbarui');
      setPasswordLama('');
      setPasswordBaru('');
      setPasswordConfirmation('');
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengubah password');
    } finally {
      setSaving(false);
    }
  };

  const initials = user.nama ? user.nama.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?';

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Pengaturan Akun</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-100 px-6 flex-shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Informasi Profil
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'password'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Keamanan (Password)
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSave} className="space-y-5">
              {/* Photo Area */}
              <div className="flex flex-col items-center justify-center space-y-3 pb-3 border-b border-gray-50">
                <div className="relative group w-24 h-24 rounded-full border-2 border-emerald-500/20 overflow-hidden flex items-center justify-center bg-gray-50">
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-emerald-700">{initials}</span>
                  )}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFotoFile(file);
                          setFotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {user.role}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">Klik ikon kamera untuk mengganti foto profil Anda</p>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-400 transition-colors bg-white text-gray-700"
                    placeholder="Masukkan nama lengkap"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-400 transition-colors bg-white text-gray-700 font-mono"
                      placeholder="username"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-emerald-400 transition-colors bg-white text-gray-700"
                      placeholder="nama@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">NIP / ID Karyawan</label>
                  <input
                    type="text"
                    value={user.nip || '-'}
                    disabled
                    className="w-full border border-gray-100 rounded-lg px-3 py-2 text-xs bg-gray-50 text-gray-400 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePasswordSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password Saat Ini</label>
                <div className="relative">
                  <input
                    type={showPwLama ? 'text' : 'password'}
                    value={passwordLama}
                    onChange={(e) => setPasswordLama(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-xs outline-none focus:border-emerald-400 transition-colors bg-white text-gray-700 font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwLama(!showPwLama)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwLama ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password Baru</label>
                <div className="relative">
                  <input
                    type={showPwBaru ? 'text' : 'password'}
                    value={passwordBaru}
                    onChange={(e) => setPasswordBaru(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-xs outline-none focus:border-emerald-400 transition-colors bg-white text-gray-700 font-mono"
                    placeholder="Minimal sesuai pengaturan keamanan"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwBaru(!showPwBaru)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwBaru ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input
                    type={showPwConfirm ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 pr-9 text-xs outline-none focus:border-emerald-400 transition-colors bg-white text-gray-700 font-mono"
                    placeholder="Konfirmasi password baru"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwConfirm(!showPwConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Ganti Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
