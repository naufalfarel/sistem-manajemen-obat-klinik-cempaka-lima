<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MonitoringItemResource;
use App\Models\Obat;
use App\Services\StokStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class MonitoringController extends Controller
{
    /**
     * GET /api/monitoring/kritis
     *
     * Menampilkan obat dengan status_stok "kritis" ATAU "habis"
     * (stok <= stok_minimum) - keduanya butuh perhatian segera.
     */
    public function kritis(Request $request): JsonResponse
    {
        $query = Obat::query()
            ->where('status', 'aktif')
            ->whereColumn('stok', '<=', 'stok_minimum')
            ->orderBy('stok');

        $perPage = min((int) $request->integer('per_page', 15), 100) ?: 15;

        return MonitoringItemResource::collection($query->paginate($perPage))->response();
    }

    /**
     * GET /api/monitoring/expired
     *
     * Parameter filter bernama `status` (bukan `status_exp`) mengikuti
     * query key yang benar-benar dikirim monitoringApi.expired() di api.ts.
     * Filter diterapkan di level SQL (bukan setelah paginasi di memori) agar
     * hasil paginasi tetap akurat.
     */
    public function expired(Request $request): JsonResponse
    {
        $query = Obat::query()->where('status', 'aktif')->whereNotNull('expired_date');

        $filter = $request->string('status')->value() ?: null;

        if ($filter !== null) {
            $thresholds = StokStatusService::ambangExpired();
            $today = Carbon::today();
            $batas30 = $today->copy()->addDays($thresholds['near_30']);
            $batas90 = $today->copy()->addDays($thresholds['near_90']);

            match ($filter) {
                'expired' => $query->whereDate('expired_date', '<', $today),
                'near-30' => $query->whereDate('expired_date', '>=', $today)->whereDate('expired_date', '<=', $batas30),
                'near-90' => $query->whereDate('expired_date', '>', $batas30)->whereDate('expired_date', '<=', $batas90),
                'aman' => $query->whereDate('expired_date', '>', $batas90),
                default => null,
            };
        }

        $query->orderBy('expired_date');

        $perPage = min((int) $request->integer('per_page', 15), 100) ?: 15;

        return MonitoringItemResource::collection($query->paginate($perPage))->response();
    }

    /** GET /api/monitoring/summary */
    public function summary(): JsonResponse
    {
        return response()->json(['data' => StokStatusService::summary()]);
    }
}
