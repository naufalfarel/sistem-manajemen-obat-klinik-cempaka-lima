<?php

namespace App\Exports;

use App\Models\AuditLog;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class AuditLogExport implements FromCollection, WithHeadings, WithMapping
{
    /** @param  Collection<int, AuditLog>  $rows */
    public function __construct(private readonly Collection $rows) {}

    public function collection(): Collection
    {
        return $this->rows;
    }

    /** @return array<int, string> */
    public function headings(): array
    {
        return ['Waktu', 'Pengguna', 'Username', 'Aksi', 'Modul', 'Deskripsi', 'IP Address', 'User Agent'];
    }

    /** @param  AuditLog  $log */
    public function map($log): array
    {
        return [
            $log->created_at->toDateTimeString(),
            $log->user?->nama ?? '-',
            $log->user?->username ?? '-',
            $log->action,
            $log->module,
            $log->description,
            $log->ip_address,
            $log->user_agent,
        ];
    }
}
