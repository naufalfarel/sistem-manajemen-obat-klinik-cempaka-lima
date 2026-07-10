# SMO Cempaka Lima — Backend API

Backend Laravel 11 + MySQL untuk **Sistem Manajemen Obat (SMO)** Klinik Utama
Cempaka Lima. Dibangun mengikuti kontrak yang didefinisikan di
`src/app/services/api.ts` pada frontend React + Vite + TypeScript.

---

## 1. Instalasi & Menjalankan

### Prasyarat
- PHP >= 8.2 dengan ekstensi `pdo_mysql`, `zip`, `mbstring`, `bcmath`
- Composer 2.x
- MySQL 8.x (atau MariaDB 10.6+)
- Node.js 18+ (untuk frontend)

### Langkah backend

```bash
cd smo-backend

# 1. Install dependency PHP
composer install

# 2. Siapkan file environment
cp .env.example .env
php artisan key:generate

# 3. Buat database MySQL kosong, lalu sesuaikan kredensial di .env:
#    DB_DATABASE=smo_cempaka_lima
#    DB_USERNAME=root
#    DB_PASSWORD=

# 4. Jalankan migration
php artisan migrate

# 5. Isi data awal (user, kategori, obat, supplier, contoh transaksi)
php artisan db:seed

# 6. (Opsional) buat symlink storage untuk file publik
php artisan storage:link

# 7. Jalankan server pengembangan
php artisan serve
# Backend siap di http://localhost:8000
```

> `composer install` akan mengunduh `laravel/framework`, `laravel/sanctum`,
> `maatwebsite/excel` (export CSV/XLSX), dan `barryvdh/laravel-dompdf`
> (export PDF) dari Packagist — pastikan mesin yang menjalankan langkah ini
> punya akses internet ke packagist.org (bukan sandbox tanpa akses seperti
> lingkungan tempat kode ini ditulis).

### Kredensial default hasil seeder

| Role | Email | Username | Password |
|---|---|---|---|
| Admin | admin@cempakalima.id | admin | `Cempaka@123` |
| Apoteker | apoteker@cempakalima.id | apoteker1 | `Cempaka@123` |
| Staf Gudang | gudang@cempakalima.id | gudang1 | `Cempaka@123` |
| Kasir | kasir@cempakalima.id | kasir1 | `Cempaka@123` |

**Ganti password ini sebelum deploy ke produksi.**

### Menjalankan bersama frontend (testing end-to-end)

Di project frontend (React + Vite), buat/sesuaikan file `.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Lalu jalankan seperti biasa:

```bash
npm install
npm run dev
# Frontend di http://localhost:5173
```

CORS sudah dikonfigurasi (`config/cors.php` + `.env` → `CORS_ALLOWED_ORIGINS`)
untuk menerima origin `http://localhost:5173` secara default. Jika port Vite
Anda berbeda, tambahkan ke `CORS_ALLOWED_ORIGINS` (pisahkan dengan koma).

**Login TIDAK akan langsung berfungsi dari UI** sampai `Login.tsx` diubah
untuk memanggil `authApi.login` sungguhan — lihat bagian 4 di bawah.

---

## 2. Keputusan Desain — 2 Celah Kontrak yang Diminta

### Celah #1 — `items` pada `ObatMasuk`

Tipe `ObatMasuk` di `api.ts` hanya menyimpan agregat (`total_item`,
`nilai_total`) tanpa rincian obat yang diterima. Solusi yang diimplementasikan:

- Tabel baru `obat_masuk_items` (`obat_masuk_id`, `obat_id`, `jumlah`,
  `harga_satuan`, `subtotal`) — mengikuti pola `obat_keluar_items` yang sudah
  ada di kontrak.
- **`POST /api/obat-masuk`** menerima `items: [{obat_id, jumlah, harga_satuan}]`
  sebagai field tambahan di luar tipe `ObatMasuk` yang di-Omit di api.ts.
  `total_item` (= jumlah baris/jenis obat, bukan total kuantitas) dan
  `nilai_total` (= Σ jumlah × harga_satuan) **dihitung server-side**, bukan
  dikirim klien.
- **`GET /api/obat-masuk/{id}`** (detail) mengembalikan `items` sebagai field
  tambahan di response (`ObatMasukDetailResource`). **`GET /api/obat-masuk`**
  (listing) TIDAK menyertakan `items` agar payload paginasi tetap ringan —
  sesuai bentuk `ObatMasuk` asli di api.ts.
- Karena TypeScript tidak memvalidasi field ekstra saat runtime, field
  `items` yang muncul di response detail ini aman/backward-compatible;
  frontend yang belum tahu field ini cukup mengabaikannya.
- Bentuk tiap item (`{id, obat_id, obat: {id,kode,nama,satuan}, jumlah,
  harga_satuan, subtotal}`) sengaja dibuat MENIRU bentuk `ObatKeluarItem`
  yang sudah ada di api.ts, supaya konsisten dan mudah dikenali saat nanti
  diintegrasikan ke frontend.

### Celah #2 — Role slug vs label di `Login.tsx`

Backend **selalu** mengembalikan `role` sebagai slug huruf kecil dengan dash
(`admin` | `apoteker` | `staf-gudang` | `kasir`) — persis sesuai union type
`AuthUser['role']` di api.ts. Ini SENGAJA tidak diubah untuk "mencocokkan"
label berkapital yang saat ini dipakai `Login.tsx`.

**Yang perlu diubah di frontend (`Login.tsx`):**
1. Hapus array data mock lokal (`MOCK_USERS` atau sejenisnya) beserta label
   role berkapital ("Administrator", "Staf Gudang", dst) yang saat ini
   ditempel di dalamnya.
2. Panggil `authApi.login(email, password)` sungguhan, simpan `token` lewat
   mekanisme yang sudah disiapkan `token.set()` di api.ts, lalu redirect
   berdasarkan `user.role` (slug) hasil response.
3. Buat **mapping presentasi** di layer frontend (bukan di API), misalnya:
   ```ts
   const ROLE_LABELS: Record<AuthUser['role'], string> = {
     admin: 'Administrator',
     apoteker: 'Apoteker',
     'staf-gudang': 'Staf Gudang',
     kasir: 'Kasir',
   };
   ```
   dan gunakan `ROLE_LABELS[user.role]` di mana pun label berkapital
   ditampilkan ke pengguna (header, sidebar, dsb).

**Temuan tambahan terkait Celah #2:** `Login.tsx` saat ini memvalidasi lewat
field **`username`**, sedangkan `authApi.login` di api.ts mengharapkan
**`email`**. Form login juga perlu diubah untuk mengirim email (atau backend
perlu endpoint tambahan untuk login-by-username — TIDAK diimplementasikan di
sini karena di luar kontrak api.ts yang diminta menjadi sumber kebenaran).

---

## 3. Temuan Tambahan (di luar 2 celah yang diminta, ditemukan saat membaca api.ts)

Ini bukan sesuatu yang saya ubah diam-diam — saya ikuti **api.ts sebagai
sumber kebenaran** di setiap kasus di bawah, dan mendokumentasikannya di sini
sesuai instruksi.

1. **`kode` pada `Obat` create request.** Tipe create Supplier dengan benar
   melakukan `Omit<Supplier, 'id' | 'kode' | ...>` (kode tidak diminta dari
   klien, konsisten dengan instruksi "auto-generate"). Tipe create **Obat**
   TIDAK melakukan hal yang sama — `Omit<Obat, 'id' | 'kategori' |
   'created_at' | 'updated_at'>` masih menyertakan `kode`. Ini kemungkinan
   tidak konsisten di sisi frontend. **Keputusan:** kode Obat tetap
   di-auto-generate server-side (`OBT-0001`, dst) sesuai instruksi bisnis
   eksplisit di dokumen kontrak; nilai `kode` apa pun yang dikirim klien
   diabaikan sepenuhnya oleh backend (tidak divalidasi, tidak dipakai).

2. **Path endpoint Laporan berbeda untuk format json vs csv/pdf.** Dokumen
   endpoint menuliskan satu path `GET /api/laporan/{jenis}?format=json|csv|pdf`.
   Namun kode nyata `laporanApi` di api.ts memanggil **path berbeda**:
   `format=json` → `GET /laporan/{jenis}`, sedangkan `format=csv|pdf` →
   `GET /laporan/{jenis}/export`. **Keputusan:** kedua path didaftarkan dan
   diarahkan ke controller method yang sama (lihat `routes/api.php`), supaya
   kompatibel dengan api.ts maupun pembacaan literal dokumen endpoint.

3. **Parameter filter `monitoring/expired`.** Dokumen endpoint menyebut nama
   filter `status_exp`, tapi `monitoringApi.expired()` di api.ts benar-benar
   mengirim query key **`status`**. Backend mengikuti api.ts (`?status=`).

4. **Autentikasi endpoint export/download lewat query string.**
   `obatApi.export()`, `laporanApi.*(format: 'csv'|'pdf')`, dan
   `auditLogApi.export()` di api.ts membangun **URL mentah** berisi
   `?token=...` untuk dibuka langsung oleh browser (`window.open`/`<a
   href>`), bukan lewat `fetch()` dengan header `Authorization` — navigasi
   browser biasa tidak bisa menyertakan header custom. Middleware baru
   `TokenFromQueryString` menyalin `?token=` ke header `Authorization`
   sebelum `auth:sanctum` berjalan, khusus ketika header tersebut belum
   diisi (tidak mengganggu request normal yang sudah memakai Bearer token).

5. **`petugas_id` pada create `ObatMasuk` dan `kasir_id` pada create
   `ObatKeluar`** memang bagian dari tipe request di api.ts (tidak
   di-`Omit`), bukan diturunkan otomatis dari token seperti pada sistem lain.
   Backend menghormati field ini, tapi mengisi default ke user yang sedang
   login jika tidak dikirim — sehingga tetap kompatibel dengan frontend yang
   (saat ini) belum mengirimkannya sama sekali.

6. **Status pada create `ObatMasuk`/`ObatKeluar`.** Kedua tipe request
   menyertakan field `status` (tidak di-`Omit`), tapi transisi status yang
   "aman" secara bisnis hanya `draft` (untuk obat masuk) dan `selesai` (untuk
   obat keluar) — transisi lain (`diterima`, `retur`, `void`, dst) wajib
   lewat endpoint PATCH khusus supaya efek samping (stok, alasan) konsisten.
   Backend memvalidasi `status` pada create ke nilai tunggal tersebut.

---

## 4. Keputusan Desain Lain (diminta didokumentasikan di kode/README)

- **Struktur tabel Pengaturan:** satu baris per kategori (`settings.category`
  UNIQUE + `settings.data` JSON), bukan tabel key-value generik
  (`category, key, value, value_type`). Alasan: bentuk `PengaturanData` di
  api.ts sudah berupa objek bersarang per kategori yang **utuh** diambil/diubah
  sekaligus (`GET/PUT /pengaturan`), bukan per-key. Tabel JSON-per-kategori
  menghindari query aggregation/pivot saat membaca, dan `PUT` cukup melakukan
  merge dangkal per kategori — lebih mudah dirawat untuk pola akses ini.
- **Backup (`POST /pengaturan/backup`)** mendump seluruh tabel inti ke JSON
  lalu dikompres jadi satu `.zip` (`ZipArchive`), BUKAN memanggil binary
  `mysqldump` — supaya tidak bergantung pada ketersediaan binary tersebut di
  server. Untuk disaster-recovery produksi yang lebih lengkap, tetap
  disarankan menjadwalkan `mysqldump`/snapshot managed di level infrastruktur.
- **`status_stok`/`status_exp`** SELALU dihitung on-the-fly (`StokStatusService`),
  tidak pernah disimpan sebagai kolom, sesuai instruksi kontrak. Ambang stok:
  `habis` (stok=0) → `kritis` (stok ≤ stok_minimum) → `rendah`
  (stok ≤ 1.5× stok_minimum) → `aman`. Ambang expired (`near_30`/`near_90`)
  diambil dari `Pengaturan > Stok` (default 30/90 hari).
- **`chart-penjualan`** merepresentasikan **nilai rupiah** harian
  (Σ `nilai_total` obat masuk, Σ `total` obat keluar berstatus "selesai"),
  bukan jumlah transaksi — dipilih karena namanya "chart penjualan" (nilai),
  digroup harian sepanjang bulan yang diminta.
- **`dashboard/summary.transaksi_hari_ini`** = jumlah transaksi obat masuk +
  obat keluar pada hari berjalan (gabungan kedua arah, karena tipe
  `DashboardSummary` di api.ts tidak memisahkan definisi lebih detail).
- **Audit log** ditulis otomatis lewat Model Observer (`app/Observers/*`)
  untuk tambah/ubah/hapus pada `Obat`, `KategoriObat`, `Supplier`,
  `ObatMasuk`, `ObatKeluar`, `User`; dan secara eksplisit lewat helper
  `AuditLogger` di controller untuk `login`/`logout`/`ekspor` (aksi ini
  bukan Eloquent lifecycle event, jadi tidak bisa dipicu Observer). Snapshot
  `before`/`after` pada `ubah` hanya berisi kolom yang benar-benar berubah.
- **Otorisasi ganda (defense-in-depth):** route group `/pengguna`,
  `/pengaturan`, `/audit-log` dijaga middleware `role:admin` DAN Policy
  (`PenggunaPolicy`, `PengaturanPolicy`, `AuditLogPolicy`) di level
  controller. Policy juga mencegah admin menghapus/menonaktifkan akunnya
  sendiri.
- **Sanctum memakai Bearer token biasa** (personal access token), bukan mode
  "stateful SPA" berbasis cookie — karena `api.ts` mengautentikasi lewat
  header `Authorization: Bearer <token>` yang disimpan sendiri oleh frontend,
  bukan cookie same-origin.
- **Factories (`database/factories`) tidak dibuat** — seluruh data seed
  ditulis eksplisit di `database/seeders/*` agar data uji (nama obat,
  supplier, kondisi stok kritis/expired) realistis dan sesuai konteks
  farmasi, bukan data acak dari Faker.

---

## 5. Endpoint yang Diimplementasikan

Semua endpoint di bawah **sudah diimplementasikan penuh** (auth, kontrak
request/response, validasi, audit log jika relevan).

| Modul | Endpoint |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/refresh` |
| Obat | `GET/POST /obat`, `GET/PUT/DELETE /obat/{id}`, `GET /obat/export` |
| Kategori | `GET/POST /kategori`, `GET/PUT/DELETE /kategori/{id}` |
| Supplier | `GET/POST /supplier`, `GET/PUT /supplier/{id}`, `PATCH /supplier/{id}/blacklist`, `PATCH /supplier/{id}/restore` |
| Obat Masuk | `GET/POST /obat-masuk`, `GET/DELETE /obat-masuk/{id}`, `PATCH /obat-masuk/{id}/terima` |
| Obat Keluar | `GET/POST /obat-keluar`, `GET /obat-keluar/{id}`, `PATCH /obat-keluar/{id}/retur`, `PATCH /obat-keluar/{id}/void` |
| Monitoring | `GET /monitoring/kritis`, `GET /monitoring/expired`, `GET /monitoring/summary` |
| Laporan | `GET /laporan/penjualan(/export)`, `GET /laporan/stok(/export)`, `GET /laporan/kadaluarsa(/export)` |
| Pengguna *(admin)* | `GET/POST /pengguna`, `GET/PUT/DELETE /pengguna/{id}`, `PATCH /pengguna/{id}/reset-password`, `PATCH /pengguna/{id}/toggle-status` |
| Pengaturan *(admin)* | `GET/PUT /pengaturan`, `POST /pengaturan/backup`, `POST /pengaturan/test-smtp` |
| Audit Log *(admin, read-only)* | `GET /audit-log`, `GET /audit-log/{id}`, `GET /audit-log/export` |
| Dashboard | `GET /dashboard/summary`, `GET /dashboard/chart-penjualan`, `GET /dashboard/stok-per-kategori` |

Bentuk response konsisten dengan api.ts: resource tunggal → `{data, message?}`,
list berpaginasi → paginator default Laravel (`data`, `links`, `meta`), error
422 → `{message, errors}`. Semua error (termasuk 404/500 di luar `/api/*`
yang seharusnya tidak pernah terjadi) dipaksa berformat JSON lewat
`bootstrap/app.php` + `ForceJsonResponse` middleware.

---

## 6. Struktur Proyek

```
app/
  Exports/            → kelas export CSV/PDF (Laravel Excel + dompdf)
  Http/
    Controllers/Api/   → satu controller per modul
    Requests/          → Form Request per aksi (validasi)
    Resources/          → API Resource, bentuk response persis kontrak
    Middleware/         → EnsureRole, ForceJsonResponse, TokenFromQueryString
  Models/
  Observers/           → audit log otomatis (tambah/ubah/hapus)
  Policies/            → otorisasi pengguna/pengaturan/audit-log
  Services/            → AuditLogger, StokStatusService, NomorGenerator, BackupService
database/
  migrations/
  seeders/
routes/api.php
```

---

## 7. Uji Coba Cepat (tanpa frontend)

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cempakalima.id","password":"Cempaka@123"}'

# Pakai token dari response di atas
curl http://localhost:8000/api/obat \
  -H "Authorization: Bearer <TOKEN>"
```
