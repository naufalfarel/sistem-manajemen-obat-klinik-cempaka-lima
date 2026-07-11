# =============================================================================
# start-ngrok.ps1
# Jalankan ngrok untuk frontend (Vite proxy /api → backend lokal)
# =============================================================================

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  SMO Cempaka Lima - ngrok Launcher" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# --- Cek apakah ngrok API sudah bisa dijangkau (sudah berjalan) ---
$alreadyRunning = $false
try {
    $existing = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2 -ErrorAction Stop
    if ($existing.tunnels.Count -gt 0) {
        $alreadyRunning = $true
        Write-Host "[INFO] ngrok sudah berjalan!" -ForegroundColor Green
    }
} catch { }

if (-not $alreadyRunning) {
    Write-Host "[INFO] Pastikan sudah berjalan di terminal lain:" -ForegroundColor Yellow
    Write-Host "       1. php artisan serve  (di folder backend)" -ForegroundColor Gray
    Write-Host "       2. npm run dev        (di folder frontend)" -ForegroundColor Gray
    Write-Host ""

    # --- Start ngrok ---
    Write-Host "[1/2] Memulai ngrok tunnel untuk port 5173..." -ForegroundColor Green
    Start-Process -FilePath "ngrok" -ArgumentList "http", "5173" -WindowStyle Normal

    Write-Host "[INFO] Menunggu ngrok ready..." -ForegroundColor Yellow
    $ready = $false
    for ($i = 1; $i -le 20; $i++) {
        Start-Sleep -Seconds 1
        try {
            $r = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels" -TimeoutSec 2 -ErrorAction Stop
            if ($r.tunnels.Count -gt 0) { $ready = $true; break }
        } catch { }
        Write-Host "      Menunggu... ($($i)s)" -ForegroundColor DarkGray
    }

    if (-not $ready) {
        Write-Host ""
        Write-Host "[ERROR] ngrok gagal start dalam 20 detik." -ForegroundColor Red
        Write-Host ""
        Write-Host "  Coba jalankan manual di terminal baru:" -ForegroundColor Yellow
        Write-Host "  ngrok http 5173" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  Lalu akses: http://127.0.0.1:4040 untuk lihat URL-nya." -ForegroundColor Gray
        exit 1
    }
}

# --- Ambil URL ---
Write-Host ""
Write-Host "[2/2] Membaca URL ngrok..." -ForegroundColor Green
$tunnels = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"

$frontendUrl = ($tunnels.tunnels | Where-Object { $_.public_url -like "https://*" } | Select-Object -First 1).public_url
if (-not $frontendUrl) {
    $frontendUrl = ($tunnels.tunnels | Select-Object -First 1).public_url
}

# --- Tampilkan ringkasan ---
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "  SIAP DIPAKAI!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  URL Publik : $frontendUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Dashboard ngrok : http://127.0.0.1:4040" -ForegroundColor Gray
Write-Host "  Backend lokal   : http://localhost:8000" -ForegroundColor Gray
Write-Host "  Frontend lokal  : http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "[INFO] Request /api otomatis diproxy ke backend lokal (port 8000)." -ForegroundColor Green
Write-Host ""

# Salin URL ke clipboard
$frontendUrl | Set-Clipboard
Write-Host "  URL sudah disalin ke clipboard!" -ForegroundColor Cyan
Write-Host ""

# Buka ngrok dashboard
Start-Process "http://127.0.0.1:4040"
