<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Pengaturan\UpdatePengaturanRequest;
use App\Models\Setting;
use App\Services\AuditLogger;
use App\Services\BackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;

class PengaturanController extends Controller
{
    /** GET /api/pengaturan */
    public function show(): JsonResponse
    {
        $this->authorize('view', Setting::class);

        return response()->json(['data' => $this->allSettings()]);
    }

    /** PUT /api/pengaturan */
    public function update(UpdatePengaturanRequest $request): JsonResponse
    {
        $this->authorize('update', Setting::class);

        $before = $this->allSettings();

        foreach ($request->validated() as $category => $values) {
            $existing = Setting::query()->firstOrCreate(
                ['category' => $category],
                ['data' => Setting::defaults()[$category] ?? []],
            );

            // Merge dangkal per key di dalam kategori, bukan overwrite total,
            // supaya PUT parsial (mengubah 1-2 key saja) tidak menghapus key
            // lain yang tidak disertakan di request - sesuai semantik
            // `Partial<PengaturanData>` pada api.ts.
            $existing->update(['data' => [...$existing->data, ...$values]]);
        }

        $after = $this->allSettings();

        AuditLogger::ubah(
            module: 'pengaturan',
            description: 'Memperbarui pengaturan sistem: '.implode(', ', array_keys($request->validated())),
            before: $before,
            after: $after,
        );

        return response()->json([
            'data' => $after,
            'message' => 'Pengaturan berhasil disimpan.',
        ]);
    }

    /** POST /api/pengaturan/backup */
    public function backup(BackupService $backupService): JsonResponse
    {
        $this->authorize('backup', Setting::class);

        $result = $backupService->buat();

        AuditLogger::ekspor('pengaturan', "Membuat backup database: {$result['file']}");

        return response()->json(['data' => $result]);
    }

    /** POST /api/pengaturan/test-smtp */
    public function testSmtp(): JsonResponse
    {
        $this->authorize('testSmtp', Setting::class);

        $integrasi = Setting::query()->where('category', 'integrasi')->value('data') ?? [];

        Config::set('mail.mailers.smtp.host', $integrasi['smtp_host'] ?? config('mail.mailers.smtp.host'));
        Config::set('mail.mailers.smtp.port', $integrasi['smtp_port'] ?? config('mail.mailers.smtp.port'));
        Config::set('mail.mailers.smtp.username', $integrasi['smtp_user'] ?? config('mail.mailers.smtp.username'));

        try {
            Mail::raw(
                'Ini adalah email uji coba konfigurasi SMTP dari Sistem Manajemen Obat Cempaka Lima.',
                function ($message) {
                    $message->to(auth()->user()->email)->subject('Uji Coba SMTP - SMO Cempaka Lima');
                },
            );

            return response()->json([
                'data' => [
                    'success' => true,
                    'message' => 'Email uji coba berhasil dikirim ke '.auth()->user()->email.'.',
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'data' => [
                    'success' => false,
                    'message' => 'Gagal mengirim email uji coba: '.$e->getMessage(),
                ],
            ]);
        }
    }

    /** GET /api/pengaturan/publik */
    public function publik(): JsonResponse
    {
        $umumSetting = Setting::query()->where('category', 'umum')->first();
        $stokSetting = Setting::query()->where('category', 'stok')->first();

        $umum = $umumSetting ? $umumSetting->data : Setting::defaults()['umum'];
        $stok = $stokSetting ? $stokSetting->data : Setting::defaults()['stok'];

        if (!empty($umum['logo_klinik'])) {
            $umum['logo_klinik_url'] = asset('storage/' . $umum['logo_klinik']);
        } else {
            $umum['logo_klinik_url'] = null;
        }

        return response()->json([
            'data' => [
                'umum' => $umum,
                'stok' => $stok,
            ],
        ]);
    }

    /** POST /api/pengaturan/logo */
    public function uploadLogo(Request $request): JsonResponse
    {
        $this->authorize('update', Setting::class);

        $request->validate([
            'logo' => ['required', 'image', 'max:2048'],
        ]);

        $umum = Setting::query()->firstOrCreate(
            ['category' => 'umum'],
            ['data' => Setting::defaults()['umum'] ?? []]
        );

        $oldData = $umum->data;
        if (!empty($oldData['logo_klinik']) && \Illuminate\Support\Facades\Storage::disk('public')->exists($oldData['logo_klinik'])) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($oldData['logo_klinik']);
        }

        $path = $request->file('logo')->store('identitas', 'public');
        $oldData['logo_klinik'] = $path;
        $umum->update(['data' => $oldData]);

        return response()->json([
            'data' => [
                'logo_klinik' => $path,
                'logo_klinik_url' => asset('storage/' . $path),
            ],
            'message' => 'Logo klinik berhasil diperbarui.',
        ]);
    }

    /** @return array<string, array<string, mixed>> */
    private function allSettings(): array
    {
        $rows = Setting::query()->pluck('data', 'category');
        $defaults = Setting::defaults();

        $result = [];
        foreach (Setting::CATEGORIES as $category) {
            $data = $rows->get($category, $defaults[$category] ?? []);
            if ($category === 'umum') {
                $data['logo_klinik_url'] = !empty($data['logo_klinik']) ? asset('storage/' . $data['logo_klinik']) : null;
            }
            $result[$category] = $data;
        }

        return $result;
    }
}
