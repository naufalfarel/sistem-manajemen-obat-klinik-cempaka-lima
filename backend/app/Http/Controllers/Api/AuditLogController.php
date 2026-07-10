<?php

namespace App\Http\Controllers\Api;

use App\Exports\AuditLogExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Services\AuditLogger;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    /** GET /api/audit-log */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AuditLog::class);

        $query = $this->filtered($request)->with('user');
        $perPage = min((int) $request->integer('per_page', 15), 100) ?: 15;

        return AuditLogResource::collection($query->paginate($perPage))->response();
    }

    /** GET /api/audit-log/{audit_log} */
    public function show(AuditLog $auditLog): JsonResponse
    {
        $this->authorize('view', AuditLog::class);

        $auditLog->load('user');

        return response()->json(['data' => new AuditLogResource($auditLog)]);
    }

    /** GET /api/audit-log/export?format=csv|pdf */
    public function export(Request $request): StreamedResponse
    {
        $this->authorize('export', AuditLog::class);

        $format = $request->string('format')->value() === 'pdf' ? 'pdf' : 'csv';
        $rows = $this->filtered($request)->with('user')->orderByDesc('created_at')->get();

        AuditLogger::ekspor('audit-log', "Mengekspor audit log (format: {$format}, total baris: {$rows->count()})");

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('laporan.tabel', [
                'title' => 'Audit Log',
                'subtitle' => 'Riwayat aktivitas sistem',
                'headings' => ['Waktu', 'Pengguna', 'Aksi', 'Modul', 'Deskripsi', 'IP Address'],
                'rows' => $rows->map(fn (AuditLog $log) => [
                    $log->created_at->toDateTimeString(),
                    $log->user?->nama ?? '-',
                    $log->action,
                    $log->module,
                    $log->description,
                    $log->ip_address,
                ]),
                'dicetak' => Carbon::now()->translatedFormat('d F Y H:i'),
            ]);

            return response()->streamDownload(function () use ($pdf) {
                echo $pdf->output();
            }, 'audit-log.pdf', ['Content-Type' => 'application/pdf']);
        }

        return Excel::download(new AuditLogExport($rows), 'audit-log.csv', \Maatwebsite\Excel\Excel::CSV);
    }

    private function filtered(Request $request): Builder
    {
        $query = AuditLog::query();

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('module', 'like', "%{$search}%");
            });
        }

        $query->when($request->filled('user_id'), fn ($q) => $q->where('user_id', $request->integer('user_id')));
        $query->when($request->filled('action'), fn ($q) => $q->where('action', $request->string('action')));
        $query->when($request->filled('module'), fn ($q) => $q->where('module', $request->string('module')));
        $query->when($request->filled('dari'), fn ($q) => $q->whereDate('created_at', '>=', $request->string('dari')));
        $query->when($request->filled('sampai'), fn ($q) => $q->whereDate('created_at', '<=', $request->string('sampai')));

        return $query->orderByDesc('created_at');
    }
}
