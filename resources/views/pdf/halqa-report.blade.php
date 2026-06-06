<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Muraja'a Monitor — Halqa Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 11px;
            color: #1a1a1a;
            background: #ffffff;
        }

        /* ── Page breaks ─────────────────────────────────────── */
        .page {
            page-break-after: always;
            padding: 32px 36px;
            min-height: 100vh;
            position: relative;
        }
        .page:last-child { page-break-after: avoid; }

        /* ── Islamic geometric header ────────────────────────── */
        .geo-header {
            background: #1a3a2a;
            height: 14px;
            width: 100%;
            background-image: repeating-linear-gradient(
                45deg,
                transparent,
                transparent 6px,
                rgba(255,255,255,0.08) 6px,
                rgba(255,255,255,0.08) 12px
            );
            margin-bottom: 0;
        }

        /* ── Footer ──────────────────────────────────────────── */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 8px 36px;
            border-top: 1px solid #dde5e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9px;
            color: #6b7280;
            background: #ffffff;
        }

        /* ── Cover page ──────────────────────────────────────── */
        .cover-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding-top: 80px;
        }
        .cover-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            margin-bottom: 28px;
        }
        .cover-org {
            font-size: 13px;
            font-weight: bold;
            color: #1a3a2a;
            letter-spacing: 0.04em;
            margin-bottom: 4px;
        }
        .cover-title {
            font-size: 22px;
            font-weight: bold;
            color: #1a1a1a;
            margin-bottom: 6px;
        }
        .cover-subtitle {
            font-size: 12px;
            color: #4b5563;
            margin-bottom: 48px;
        }
        .cover-meta {
            background: #f0f5f2;
            border: 1px solid #c6d9cf;
            border-radius: 6px;
            padding: 20px 32px;
            width: 300px;
        }
        .cover-meta-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #e5ece9;
        }
        .cover-meta-row:last-child { border-bottom: none; }
        .cover-meta-label {
            font-size: 10px;
            color: #6b7280;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }
        .cover-meta-value {
            font-size: 10px;
            font-weight: 600;
            color: #1a1a1a;
        }

        /* ── Section headers ─────────────────────────────────── */
        .section-header {
            font-size: 14px;
            font-weight: bold;
            color: #1a3a2a;
            margin-bottom: 16px;
            padding-bottom: 6px;
            border-bottom: 2px solid #1a3a2a;
        }

        /* ── Summary grid ────────────────────────────────────── */
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        .summary-card {
            background: #f0f5f2;
            border: 1px solid #c6d9cf;
            border-radius: 6px;
            padding: 14px 10px;
            text-align: center;
        }
        .summary-card-value {
            font-size: 26px;
            font-weight: bold;
            color: #1a3a2a;
            line-height: 1;
        }
        .summary-card-label {
            font-size: 9px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 4px;
        }

        /* ── Segmented bar ───────────────────────────────────── */
        .seg-bar-wrap { margin-bottom: 16px; }
        .seg-bar-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 10px;
            color: #4b5563;
        }
        .seg-bar {
            display: flex;
            gap: 2px;
            height: 10px;
        }
        .seg-bar-seg {
            flex: 1;
            border-radius: 2px;
        }
        .seg-bar-seg.filled-good  { background: #2d6a4f; }
        .seg-bar-seg.filled-warn  { background: #d97706; }
        .seg-bar-seg.filled-bad   { background: #dc2626; }
        .seg-bar-seg.empty        { background: #e5ede9; border: 1px solid #c6d9cf; }

        /* ── Pair table ──────────────────────────────────────── */
        .pair-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }
        .pair-table th {
            background: #1a3a2a;
            color: #e8f5ef;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 7px 10px;
            text-align: left;
        }
        .pair-table td {
            padding: 9px 10px;
            font-size: 10.5px;
            vertical-align: middle;
            border-bottom: 1px solid #e5ede9;
        }
        .pair-table tr:nth-child(even) td { background: #f8faf9; }
        .pair-table tr:last-child td { border-bottom: none; }

        /* ── Status dot ──────────────────────────────────────── */
        .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 5px;
            vertical-align: middle;
        }
        .dot-on_track { background: #2d6a4f; }
        .dot-slipping { background: #d97706; }
        .dot-at_risk  { background: #dc2626; }
        .dot-inactive { background: #9ca3af; }

        /* ── At-risk highlight box ───────────────────────────── */
        .at-risk-box {
            background: #fef2f2;
            border: 1px solid #fca5a5;
            border-radius: 6px;
            padding: 16px;
            margin-top: 20px;
        }
        .at-risk-box-title {
            font-size: 12px;
            font-weight: bold;
            color: #dc2626;
            margin-bottom: 10px;
        }
        .at-risk-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #fecaca;
            font-size: 10.5px;
        }
        .at-risk-row:last-child { border-bottom: none; }
    </style>
</head>
<body>

{{-- ── FOOTER (fixed, every page) ──────────────────────────────────────── --}}
<div class="footer">
    <span>Generated {{ $generatedAt }} · Muraja'a Monitor</span>
    <span>Jimma University Muslim Students Union</span>
</div>

{{-- ── PAGE 1: COVER ────────────────────────────────────────────────────── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="cover-content" style="margin-top: 40px;">
        <p style="font-size:24px;font-weight:bold;color:#1a3a2a;letter-spacing:0.05em;margin-bottom:4px;">Muraja'a Monitor</p>
        <p class="cover-org">Jimma University Muslim Students Union</p>
        <h1 class="cover-title">Muraja'a Monitor</h1>
        <p class="cover-subtitle">Summer Program 1446H — Halqa Progress Report</p>

        <div class="cover-meta">
            <div class="cover-meta-row">
                <span class="cover-meta-label">Halqa</span>
                <span class="cover-meta-value">{{ $halqa->name }}</span>
            </div>
            <div class="cover-meta-row">
                <span class="cover-meta-label">Leader</span>
                <span class="cover-meta-value">{{ $leader->name }}</span>
            </div>
            <div class="cover-meta-row">
                <span class="cover-meta-label">Generated</span>
                <span class="cover-meta-value">{{ $generatedAt }}</span>
            </div>
            <div class="cover-meta-row">
                <span class="cover-meta-label">Total Pairs</span>
                <span class="cover-meta-value">{{ $summary['total_pairs'] }}</span>
            </div>
        </div>
    </div>
</div>

{{-- ── PAGE 2: HALQA SUMMARY ────────────────────────────────────────────── --}}
<div class="page">
    <div class="geo-header"></div>
    <div style="padding-top: 24px;">
        <h2 class="section-header">Halqa Summary — {{ $halqa->name }}</h2>

        {{-- Stats grid --}}
        <div class="summary-grid">
            <div class="summary-card">
                <div class="summary-card-value">{{ $summary['total_pairs'] }}</div>
                <div class="summary-card-label">Total Pairs</div>
            </div>
            <div class="summary-card">
                <div class="summary-card-value" style="color: #2d6a4f;">{{ $summary['group_consistency'] }}%</div>
                <div class="summary-card-label">Group Consistency</div>
            </div>
            <div class="summary-card">
                <div class="summary-card-value" style="color: #1a3a2a;">{{ $summary['avg_streak'] }}</div>
                <div class="summary-card-label">Avg Streak (days)</div>
            </div>
            <div class="summary-card">
                <div class="summary-card-value">{{ $summary['total_subs_week'] }}</div>
                <div class="summary-card-label">Submissions This Week</div>
            </div>
        </div>

        {{-- Status breakdown bars --}}
        <h3 style="font-size: 12px; font-weight: 700; margin: 20px 0 12px; color: #1a3a2a;">Status Breakdown</h3>

        @php
            $total = $summary['total_pairs'] > 0 ? $summary['total_pairs'] : 1;
            $statusItems = [
                ['label' => 'On Track',  'count' => $summary['on_track'], 'class' => 'filled-good'],
                ['label' => 'Slipping',  'count' => $summary['slipping'], 'class' => 'filled-warn'],
                ['label' => 'At Risk',   'count' => $summary['at_risk'],  'class' => 'filled-bad'],
                ['label' => 'Inactive',  'count' => $summary['inactive'], 'class' => 'filled-bad'],
            ];
            $segments = 20;
        @endphp

        @foreach ($statusItems as $item)
        @php
            $pct = round(($item['count'] / $total) * 100);
            $filled = round(($pct / 100) * $segments);
        @endphp
        <div class="seg-bar-wrap">
            <div class="seg-bar-label">
                <span>{{ $item['label'] }}</span>
                <span>{{ $item['count'] }} pairs · {{ $pct }}%</span>
            </div>
            <div class="seg-bar">
                @for ($i = 0; $i < $segments; $i++)
                    <div class="seg-bar-seg {{ $i < $filled ? $item['class'] : 'empty' }}"></div>
                @endfor
            </div>
        </div>
        @endforeach

        {{-- Group consistency bar --}}
        <div style="margin-top: 20px;">
            <h3 style="font-size: 12px; font-weight: 700; margin-bottom: 12px; color: #1a3a2a;">Overall Group Consistency</h3>
            @php
                $gcFilled = round(($summary['group_consistency'] / 100) * $segments);
                $gcClass  = $summary['group_consistency'] >= 70 ? 'filled-good' : ($summary['group_consistency'] >= 40 ? 'filled-warn' : 'filled-bad');
            @endphp
            <div class="seg-bar-wrap">
                <div class="seg-bar-label">
                    <span>{{ $summary['group_consistency'] >= 70 ? 'On Track' : ($summary['group_consistency'] >= 40 ? 'Needs Attention' : 'Critical') }}</span>
                    <span>{{ $summary['group_consistency'] }}%</span>
                </div>
                <div class="seg-bar">
                    @for ($i = 0; $i < $segments; $i++)
                        <div class="seg-bar-seg {{ $i < $gcFilled ? $gcClass : 'empty' }}"></div>
                    @endfor
                </div>
            </div>
        </div>
    </div>
</div>

{{-- ── PAGE 3+: PAIR TABLE ──────────────────────────────────────────────── --}}
<div class="page">
    <div class="geo-header"></div>
    <div style="padding-top: 24px;">
        <h2 class="section-header">Pair Progress</h2>

        <table class="pair-table">
            <thead>
                <tr>
                    <th>Student A</th>
                    <th>Student B</th>
                    <th>Consistency</th>
                    <th>Last Submission</th>
                    <th>Status</th>
                    <th>Pages This Week</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($pairs as $pair)
                <tr>
                    <td style="font-weight: 600;">{{ $pair['student_a'] }}</td>
                    <td style="font-weight: 600;">{{ $pair['student_b'] }}</td>
                    <td>
                        @php
                            $c = $pair['consistency'];
                            $cFilled = round(($c / 100) * 10);
                            $cClass  = $c >= 70 ? 'filled-good' : ($c >= 40 ? 'filled-warn' : 'filled-bad');
                        @endphp
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <div class="seg-bar" style="width: 60px; height: 8px;">
                                @for ($i = 0; $i < 10; $i++)
                                    <div class="seg-bar-seg {{ $i < $cFilled ? $cClass : 'empty' }}"></div>
                                @endfor
                            </div>
                            <span style="font-variant-numeric: tabular-nums; font-weight: 600;">{{ $c }}%</span>
                        </div>
                    </td>
                    <td>{{ $pair['last_submission'] }}</td>
                    <td>
                        <span class="status-dot dot-{{ $pair['status'] }}"></span>
                        {{ ucfirst(str_replace('_', ' ', $pair['status'])) }}
                    </td>
                    <td style="font-variant-numeric: tabular-nums;">{{ $pair['pages_this_week'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        {{-- At-risk section --}}
        @if ($atRiskPairs->count() > 0)
        <div class="at-risk-box">
            <div class="at-risk-box-title">⚠ At-Risk / Inactive Pairs</div>
            @foreach ($atRiskPairs as $pair)
            <div class="at-risk-row">
                <span style="font-weight: 600;">{{ $pair['student_a'] }} &amp; {{ $pair['student_b'] }}</span>
                <span>Last sub: {{ $pair['last_submission'] }}</span>
                <span>
                    <span class="status-dot dot-{{ $pair['status'] }}"></span>
                    {{ ucfirst(str_replace('_', ' ', $pair['status'])) }}
                </span>
            </div>
            @endforeach
        </div>
        @endif
    </div>
</div>

</body>
</html>
