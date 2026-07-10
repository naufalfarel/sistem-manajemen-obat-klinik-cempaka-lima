<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 11px; color: #1f2937; }
        h1 { font-size: 16px; margin-bottom: 2px; }
        p.subtitle { margin: 0 0 14px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #d1d5db; padding: 5px 7px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        tfoot td { font-weight: bold; background-color: #f9fafb; }
        .text-right { text-align: right; }
        .footer-note { margin-top: 16px; font-size: 9px; color: #9ca3af; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <p class="subtitle">{{ $subtitle }} &middot; Dicetak {{ $dicetak }}</p>

    <table>
        <thead>
            <tr>
                @foreach ($headings as $heading)
                    <th>{{ $heading }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $row)
                <tr>
                    @foreach ($row as $cell)
                        <td>{{ $cell }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td colspan="{{ count($headings) }}">Tidak ada data untuk periode/filter ini.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <p class="footer-note">Sistem Manajemen Obat &middot; Klinik Utama Cempaka Lima</p>
</body>
</html>
