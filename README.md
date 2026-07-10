# Sistem Manajemen Obat (SMO) — Klinik Utama Cempaka Lima

Repo ini berisi dua project terpisah yang saling terhubung lewat REST API:

```
sistem-manajemen-obat-cempaka-lima/
├── frontend/   → React + Vite + TypeScript (UI, sudah ada sebelumnya)
└── backend/    → Laravel 11 + MySQL (REST API, lihat backend/README.md)
```

## Menjalankan keduanya

**1. Backend** (lihat instruksi lengkap di `backend/README.md`):

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# sesuaikan DB_* di .env, lalu:
php artisan migrate --seed
php artisan serve
# → http://localhost:8000
```

**2. Frontend:**

```bash
cd frontend
echo "VITE_API_URL=http://localhost:8000/api" > .env
npm install
npm run dev
# → http://localhost:5173
```

## Penting — baca sebelum login dari UI

Frontend di folder ini **belum diubah** oleh saya — `Login.tsx` masih memakai
data mock lokal dan belum memanggil `authApi.login` yang sesungguhnya. Ini
sengaja tidak saya ubah tanpa persetujuan Anda (lihat penjelasan lengkap di
`backend/README.md` bagian "Keputusan Desain #2" dan "Temuan Tambahan").
Login lewat UI baru akan berfungsi setelah `Login.tsx` disesuaikan.

Kredensial API (via curl/Postman, sudah bisa dipakai sekarang) ada di
`backend/README.md` bagian "Kredensial default hasil seeder".
