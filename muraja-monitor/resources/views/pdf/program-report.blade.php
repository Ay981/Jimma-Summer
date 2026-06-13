<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{ $programName }} — Full Program Report</title>
<style>
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #1a1a1a; }

    .page { page-break-after: always; padding: 26px 30px 46px; position: relative; }
    .page:last-child { page-break-after: avoid; }

    .geo-header {
        height: 14px; background-color: #1a3a2a;
        background-image:
            repeating-linear-gradient(45deg, rgba(201,162,39,0) 0 6px, rgba(201,162,39,0.45) 6px 7px),
            repeating-linear-gradient(-45deg, rgba(201,162,39,0) 0 6px, rgba(201,162,39,0.45) 6px 7px);
    }

    .ph { padding-top: 16px; }
    .section-title { font-size: 16px; font-weight: bold; color: #1a3a2a; padding-bottom: 6px; border-bottom: 2px solid #1a3a2a; margin-bottom: 4px; }
    .section-sub { font-size: 9.5px; color: #6b7280; margin-bottom: 16px; }

    /* Cover */
    .cover { text-align: center; padding-top: 120px; }
    .cover .org { font-size: 11px; font-weight: bold; color: #2d6a4f; letter-spacing: 0.14em; text-transform: uppercase; margin: 18px 0 10px; }
    .cover h1 { font-size: 27px; color: #1a3a2a; letter-spacing: 0.03em; }
    .cover .tag { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .cover-meta { margin: 40px auto 0; width: 320px; background: #f0f5f2; border: 1px solid #c6d9cf; border-radius: 6px; padding: 6px 22px; }
    .cover-meta table { width: 100%; }
    .cover-meta td { padding: 7px 0; font-size: 10px; border-bottom: 1px solid #e0eae5; }
    .cover-meta tr:last-child td { border-bottom: none; }
    .cover-meta .k { color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-size: 8.5px; font-weight: bold; }
    .cover-meta .v { text-align: right; font-weight: bold; color: #1a3a2a; }

    /* Stat cards */
    .cards { width: 100%; border-collapse: separate; border-spacing: 9px; }
    .card { background: #f0f5f2; border: 1px solid #c6d9cf; border-top: 3px solid #2d6a4f; border-radius: 6px; padding: 14px 8px; text-align: center; }
    .card .v { font-size: 30px; font-weight: bold; color: #1a3a2a; line-height: 1; }
    .card .k { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 6px; }
    .card.alt { background: #fbf6e7; border-color: #e7d8a6; border-top-color: #C9A227; }
    .card.alt .v { color: #9a7b12; }

    /* Chart frame */
    .chart-box { border: 1px solid #e0eae5; border-radius: 6px; padding: 12px 10px 6px; margin-bottom: 14px; }
    .chart-h { font-size: 11px; font-weight: bold; color: #1a3a2a; margin-bottom: 2px; }
    .legend { font-size: 8.5px; color: #6b7280; margin-bottom: 6px; }
    .legend .sw { display: inline-block; width: 9px; height: 9px; border-radius: 2px; vertical-align: middle; margin: 0 3px 0 10px; }

    /* Tables */
    table.data { width: 100%; border-collapse: collapse; }
    table.data th { background: #1a3a2a; color: #e8f5ef; font-size: 8.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; padding: 7px 7px; text-align: left; }
    table.data td { padding: 6px 7px; font-size: 9.5px; border-bottom: 1px solid #e9efec; }
    .num { text-align: right; }
    .center { text-align: center; }

    /* row tints */
    .r-good { background: #eefaf2; } .r-warn { background: #fff7e6; }
    .r-bad  { background: #fdeced; } .r-grey { background: #f2f4f5; }

    .tag { display: inline-block; font-size: 8px; font-weight: bold; padding: 2px 7px; border-radius: 9px; text-transform: uppercase; letter-spacing: 0.04em; }
    .t-good { background: #cdeed9; color: #1a7f4b; } .t-warn { background: #fbe6bf; color: #92600a; }
    .t-bad  { background: #f7c9cc; color: #b3201f; } .t-grey { background: #e2e6e8; color: #5b6166; }

    /* Awards */
    .awards { width: 100%; border-collapse: separate; border-spacing: 10px; }
    .award-card { background: #fbfdfc; border: 1px solid #d3e2da; border-left: 4px solid #C9A227; border-radius: 6px; padding: 10px 12px; width: 50%; }
    .award-card table { width: 100%; }
    .award-card .medal-cell { width: 46px; vertical-align: middle; }
    .award-card .cat { font-size: 9px; font-weight: bold; color: #2d6a4f; text-transform: uppercase; letter-spacing: 0.05em; }
    .award-card .who { font-size: 14px; font-weight: bold; color: #1a1a1a; }
    .award-card .stat { font-size: 10px; color: #9a7b12; font-weight: bold; }
    .award-card .where { font-size: 9px; color: #6b7280; }
</style>
</head>
<body>

@php
    $statusMap = [
        'on_track' => ['row' => 'r-good', 'tag' => 't-good', 'label' => 'On Track'],
        'slipping' => ['row' => 'r-warn', 'tag' => 't-warn', 'label' => 'Slipping'],
        'at_risk'  => ['row' => 'r-bad',  'tag' => 't-bad',  'label' => 'At Risk'],
        'inactive' => ['row' => 'r-grey', 'tag' => 't-grey', 'label' => 'Inactive'],
    ];

    // ── CSS horizontal-bar chart (dompdf-safe, no SVG) ─────────────────────────
    // Used for the weekly trend (submissions + consistency) on page 3
    $chartTrend = function ($weeks) {
        if (empty($weeks)) return '<p style="font-size:10px;color:#9ca3af;">No data yet.</p>';
        $maxSub = max(1, max(array_column($weeks, 'submissions')));
        $out = '<table style="width:100%;border-collapse:collapse;font-size:8.5px;">';
        $out .= '<tr style="border-bottom:1px solid #e0eae5;">
            <th style="text-align:left;padding:3px 4px;color:#6b7280;font-size:7.5px;width:40px;">Week</th>
            <th style="text-align:left;padding:3px 4px;color:#6b7280;font-size:7.5px;">Submissions</th>
            <th style="text-align:right;padding:3px 8px;color:#6b7280;font-size:7.5px;width:36px;">Sub.</th>
            <th style="text-align:right;padding:3px 8px;color:#C9A227;font-size:7.5px;width:46px;">Consist.</th>
        </tr>';
        foreach ($weeks as $w) {
            $pct = round($w['submissions'] / $maxSub * 100);
            $con = $w['consistency'];
            $conClr = $con >= 70 ? '#1a7f4b' : ($con >= 40 ? '#92600a' : '#b3201f');
            $out .= '<tr style="border-bottom:1px solid #f0f5f2;">';
            $out .= '<td style="padding:4px 4px;color:#6b7280;font-size:7.5px;white-space:nowrap;">' . htmlspecialchars($w['label']) . '</td>';
            $out .= '<td style="padding:4px 4px;">
                <div style="background:#eef5f1;border-radius:3px;height:10px;width:100%;">
                    <div style="background:#2d6a4f;border-radius:3px;height:10px;width:' . $pct . '%;"></div>
                </div></td>';
            $out .= '<td style="text-align:right;padding:4px 8px;font-weight:bold;color:#1a3a2a;">' . $w['submissions'] . '</td>';
            $out .= '<td style="text-align:right;padding:4px 8px;font-weight:bold;color:' . $conClr . ';">' . $con . '%</td>';
            $out .= '</tr>';
        }
        return $out . '</table>';
    };

    // ── Simple bar chart for minutes or pages per week ──────────────────────────
    $chartBars = function ($items, $key, $color) {
        if (empty($items)) return '<p style="font-size:10px;color:#9ca3af;">No data yet.</p>';
        $max = max(1, max(array_column($items, $key)));
        $out = '<table style="width:100%;border-collapse:collapse;font-size:8.5px;">';
        foreach ($items as $it) {
            $pct = round($it[$key] / $max * 100);
            $out .= '<tr style="border-bottom:1px solid #f0f5f2;">';
            $out .= '<td style="padding:3px 6px 3px 0;color:#6b7280;font-size:7.5px;white-space:nowrap;width:40px;">' . htmlspecialchars($it['label']) . '</td>';
            $out .= '<td style="padding:3px 0;">
                <div style="background:#eef5f1;border-radius:3px;height:10px;width:100%;">
                    <div style="background:' . $color . ';border-radius:3px;height:10px;width:' . $pct . '%;"></div>
                </div></td>';
            $out .= '<td style="text-align:right;padding:3px 0 3px 8px;font-weight:bold;color:#1a3a2a;width:60px;">' . number_format($it[$key]) . '</td>';
            $out .= '</tr>';
        }
        return $out . '</table>';
    };

    // ── Juz coverage: two-column horizontal bar table (30 juzs) ────────────────
    $chartJuz = function ($juz) {
        if (empty($juz)) return '<p style="font-size:10px;color:#9ca3af;">No data yet.</p>';
        $max = max(1, max(array_column($juz, 'count')));
        $half = (int) ceil(count($juz) / 2);
        $col1 = array_slice($juz, 0, $half);
        $col2 = array_slice($juz, $half);

        $renderCol = function ($items) use ($max) {
            $out = '<table style="width:100%;border-collapse:collapse;font-size:8px;">';
            foreach ($items as $jz) {
                $pct = $max > 0 ? round($jz['count'] / $max * 100) : 0;
                $out .= '<tr style="border-bottom:1px solid #f0f5f2;">';
                $out .= '<td style="width:28px;padding:3px 4px 3px 0;color:#1a3a2a;font-weight:bold;text-align:right;">J' . $jz['juz'] . '</td>';
                $out .= '<td style="padding:3px 0;">
                    <div style="background:#eef5f1;border-radius:2px;height:9px;width:100%;">
                        <div style="background:#2d6a4f;border-radius:2px;height:9px;width:' . $pct . '%;min-width:' . ($jz['count'] > 0 ? '4' : '0') . 'px;"></div>
                    </div></td>';
                $out .= '<td style="width:22px;text-align:right;padding:3px 0 3px 4px;color:#374151;font-weight:bold;">' . $jz['count'] . '</td>';
                $out .= '</tr>';
            }
            return $out . '</table>';
        };

        return '<table style="width:100%;border-collapse:collapse;"><tr>
            <td style="width:49%;vertical-align:top;padding-right:8px;">' . $renderCol($col1) . '</td>
            <td style="width:2%;"></td>
            <td style="width:49%;vertical-align:top;padding-left:8px;">' . $renderCol($col2) . '</td>
        </tr></table>';
    };
@endphp

{{-- ── PAGE 1 · COVER ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="cover">
        @include('pdf.partials.logo', ['w' => 120])
        <p class="org">Jimma University Muslim Students Union</p>
        <h1>{{ $programName }}</h1>
        <h1>Full Program Report</h1>
        <p class="tag">Summer Muraja'ah 1446H</p>
        <div class="cover-meta">
            <table>
                <tr><td class="k">Program Period</td><td class="v">{{ $start->format('d M Y') }} — {{ $end->format('d M Y') }}</td></tr>
                <tr><td class="k">Days Elapsed</td><td class="v">{{ $days }}</td></tr>
                <tr><td class="k">Students Enrolled</td><td class="v">{{ $overview['total_students'] }}</td></tr>
                <tr><td class="k">Generated</td><td class="v">{{ $today->format('d F Y') }}</td></tr>
            </table>
        </div>
    </div>
</div>

{{-- ── PAGE 2 · PROGRAM OVERVIEW ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="ph">
        <div class="section-title">Program Overview</div>
        <div class="section-sub">Headline figures across the whole program to date.</div>

        <table class="cards">
            <tr>
                <td class="card"><div class="v">{{ $overview['total_students'] }}</div><div class="k">Total Students</div></td>
                <td class="card"><div class="v">{{ number_format($overview['total_submissions']) }}</div><div class="k">Total Submissions</div></td>
                <td class="card"><div class="v">{{ number_format($overview['total_pages']) }}</div><div class="k">Pages Reviewed</div></td>
            </tr>
            <tr>
                <td class="card"><div class="v">{{ number_format($overview['total_minutes']) }}</div><div class="k">Minutes Spent</div></td>
                <td class="card alt"><div class="v">{{ $overview['consistency'] }}%</div><div class="k">Program Consistency</div></td>
                <td class="card"><div class="v">{{ round($overview['total_minutes'] / 60) }}</div><div class="k">Total Hours</div></td>
            </tr>
            <tr>
                <td class="card"><div class="v" style="color:#1a7f4b;">{{ $overview['active'] }}</div><div class="k">Active Students</div></td>
                <td class="card"><div class="v" style="color:#b3201f;">{{ $overview['inactive'] }}</div><div class="k">Inactive Students</div></td>
                <td class="card"><div class="v">{{ count($weeks) }}</div><div class="k">Weeks Tracked</div></td>
            </tr>
        </table>
    </div>
</div>

{{-- ── PAGE 3 · CONSISTENCY TREND ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="ph">
        <div class="section-title">Consistency Trend</div>
        <div class="section-sub">Weekly submission volume with the program-wide consistency rate overlaid.</div>
        <div class="chart-box">
            <div class="chart-h">Submissions per week &amp; consistency %</div>
            <div class="legend">
                <span class="sw" style="background:#2d6a4f;"></span> Submissions
                <span class="sw" style="background:#C9A227;"></span> Consistency %
            </div>
            {!! $chartTrend($weeks) !!}
        </div>
    </div>
</div>

{{-- ── PAGE 4 · HALQA PERFORMANCE ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="ph">
        <div class="section-title">Halqa Performance</div>
        <div class="section-sub">All halqas, ranked by consistency. Rows colour-coded by performance.</div>
        <table class="data">
            <thead><tr><th>Halqa</th><th>Leader</th><th class="center">Members</th><th class="center">Pairs</th><th class="center">Consistency</th><th class="num">Pages</th><th class="center">Meetings</th></tr></thead>
            <tbody>
                @foreach ($halqaStats as $h)
                @php $rc = $h['consistency'] >= 70 ? 'r-good' : ($h['consistency'] >= 40 ? 'r-warn' : 'r-bad'); @endphp
                <tr class="{{ $rc }}">
                    <td style="font-weight:bold;">{{ $h['name'] }}</td>
                    <td>{{ $h['leader'] }}</td>
                    <td class="center">{{ $h['members'] }}</td>
                    <td class="center">{{ $h['pairs'] }}</td>
                    <td class="center">{{ $h['consistency'] }}%</td>
                    <td class="num">{{ number_format($h['pages']) }}</td>
                    <td class="center">{{ $h['meetings'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>

{{-- ── PAGE 5 · JUZ COVERAGE ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="ph">
        <div class="section-title">Juz Coverage</div>
        <div class="section-sub">Number of students who revised each juz — which parts of the Qur'an received the most attention.</div>
        <div class="chart-box">
            <div class="chart-h">Students per Juz (1–30)</div>
            <div class="legend"><span class="sw" style="background:#2d6a4f;"></span> Distinct students who revised the juz</div>
            {!! $chartJuz($juzCoverage) !!}
        </div>
    </div>
</div>

{{-- ── PAGE 6 · MINUTES & PAGES ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="ph">
        <div class="section-title">Minutes &amp; Pages Analysis</div>
        <div class="section-sub">Program intensity over time — total time invested and pages reviewed each week.</div>
        <div class="chart-box">
            <div class="chart-h">Total minutes spent per week</div>
            {!! $chartBars($weeks, 'minutes', '#2d6a4f') !!}
        </div>
        <div class="chart-box">
            <div class="chart-h">Total pages reviewed per week</div>
            {!! $chartBars($weeks, 'pages', '#C9A227') !!}
        </div>
    </div>
</div>

{{-- ── PAGE 7 · STUDENT BREAKDOWN ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="ph">
        <div class="section-title">Student Breakdown</div>
        <div class="section-sub">
            All students ranked by consistency.
            <span class="tag t-good">On Track</span>
            <span class="tag t-warn">Slipping</span>
            <span class="tag t-bad">At Risk</span>
            <span class="tag t-grey">Inactive</span>
        </div>
        <table class="data">
            <thead><tr><th class="center">#</th><th>Name</th><th>Halqa</th><th class="center">Consist.</th><th class="num">Pages</th><th class="num">Minutes</th><th class="center">Streak</th><th class="center">Status</th></tr></thead>
            <tbody>
                @foreach ($students as $s)
                @php $st = $statusMap[$s['status']] ?? $statusMap['inactive']; @endphp
                <tr class="{{ $st['row'] }}">
                    <td class="center" style="font-weight:bold;">{{ $s['rank'] }}</td>
                    <td style="font-weight:bold;">{{ $s['name'] }}</td>
                    <td>{{ $s['halqa'] }}</td>
                    <td class="center">{{ $s['consistency'] }}%</td>
                    <td class="num">{{ number_format($s['pages']) }}</td>
                    <td class="num">{{ number_format($s['minutes']) }}</td>
                    <td class="center">{{ $s['streak'] }}d</td>
                    <td class="center"><span class="tag {{ $st['tag'] }}">{{ $st['label'] }}</span></td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>

{{-- ── PAGE 8 · AWARD WINNERS ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="ph">
        <div class="section-title">Award Winners</div>
        <div class="section-sub">Recognising the standout students and pairs of the program.</div>

        <table class="awards">
            @php $mcs = $awards['most_consistent_students'] ?? []; @endphp
            <tr>
                @for ($i = 0; $i < 2; $i++)
                    @if (!empty($mcs[$i]))
                    <td class="award-card">
                        <table><tr>
                            <td class="medal-cell">@include('pdf.partials.medal', ['place' => $i + 1, 'size' => 42])</td>
                            <td>
                                <div class="cat">Most Consistent Student · {{ ['1st','2nd','3rd'][$i] }} Place</div>
                                <div class="who">{{ $mcs[$i]['name'] }}</div>
                                <div class="stat">{{ $mcs[$i]['consistency'] }}% consistency</div>
                                <div class="where">{{ $mcs[$i]['halqa'] ?? '' }}</div>
                            </td>
                        </tr></table>
                    </td>
                    @endif
                @endfor
            </tr>
            <tr>
                @if (!empty($mcs[2]))
                <td class="award-card">
                    <table><tr>
                        <td class="medal-cell">@include('pdf.partials.medal', ['place' => 3, 'size' => 42])</td>
                        <td>
                            <div class="cat">Most Consistent Student · 3rd Place</div>
                            <div class="who">{{ $mcs[2]['name'] }}</div>
                            <div class="stat">{{ $mcs[2]['consistency'] }}% consistency</div>
                            <div class="where">{{ $mcs[2]['halqa'] ?? '' }}</div>
                        </td>
                    </tr></table>
                </td>
                @endif
                @if (!empty($awards['most_consistent_pair']))
                @php $p = $awards['most_consistent_pair']; @endphp
                <td class="award-card">
                    <table><tr>
                        <td class="medal-cell">@include('pdf.partials.medal', ['place' => 1, 'size' => 42])</td>
                        <td>
                            <div class="cat">Most Consistent Pair</div>
                            <div class="who">{{ $p['student_a'] }} &amp; {{ $p['student_b'] }}</div>
                            <div class="stat">{{ $p['consistency'] }}% consistency</div>
                            <div class="where">{{ $p['halqa'] ?? '' }}</div>
                        </td>
                    </tr></table>
                </td>
                @endif
            </tr>
            <tr>
                @if (!empty($awards['longest_streak']))
                @php $ls = $awards['longest_streak']; @endphp
                <td class="award-card">
                    <table><tr>
                        <td class="medal-cell">@include('pdf.partials.medal', ['place' => 1, 'size' => 42])</td>
                        <td>
                            <div class="cat">Longest Streak</div>
                            <div class="who">{{ $ls['name'] }}</div>
                            <div class="stat">{{ $ls['streak'] }} consecutive days</div>
                            <div class="where">{{ $ls['halqa'] ?? '' }}</div>
                        </td>
                    </tr></table>
                </td>
                @endif
                @if (!empty($awards['most_pages']))
                @php $mp = $awards['most_pages']; @endphp
                <td class="award-card">
                    <table><tr>
                        <td class="medal-cell">@include('pdf.partials.medal', ['place' => 1, 'size' => 42])</td>
                        <td>
                            <div class="cat">Most Pages Reviewed</div>
                            <div class="who">{{ $mp['name'] }}</div>
                            <div class="stat">{{ number_format($mp['pages']) }} pages</div>
                            <div class="where">{{ $mp['halqa'] ?? '' }}</div>
                        </td>
                    </tr></table>
                </td>
                @endif
            </tr>
            <tr>
                @if (!empty($awards['most_improved_student']))
                @php $mi = $awards['most_improved_student']; @endphp
                <td class="award-card" colspan="2">
                    <table><tr>
                        <td class="medal-cell">@include('pdf.partials.medal', ['place' => 1, 'size' => 42])</td>
                        <td>
                            <div class="cat">Most Improved</div>
                            <div class="who">{{ $mi['name'] }}</div>
                            <div class="stat">improved from {{ $mi['from'] }}% to {{ $mi['to'] }}% (+{{ $mi['improvement'] }} pts)</div>
                        </td>
                    </tr></table>
                </td>
                @endif
            </tr>
        </table>
    </div>
</div>

{{-- ── PAGE 9 · LEADER ACTIVITY ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="ph">
        <div class="section-title">Leader Activity Summary</div>
        <div class="section-sub">Halqa leader engagement across the program.</div>
        <table class="data">
            <thead><tr><th class="center">#</th><th>Leader</th><th>Halqa</th><th class="center">Meetings</th><th class="center">Contact Notes</th><th class="center">Recovered</th><th class="center">Logins</th></tr></thead>
            <tbody>
                @forelse ($leaders as $l)
                <tr>
                    <td class="center" style="font-weight:bold;">{{ $l['rank'] }}</td>
                    <td style="font-weight:bold;">{{ $l['name'] }}</td>
                    <td>{{ $l['halqa'] }}</td>
                    <td class="center">{{ $l['meetings'] }}</td>
                    <td class="center">{{ $l['contact_notes'] }}</td>
                    <td class="center">{{ $l['recovered'] }}</td>
                    <td class="center">{{ $l['logins'] }}</td>
                </tr>
                @empty
                <tr><td colspan="7" class="center" style="color:#9ca3af;padding:18px;">No leader activity recorded.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

</body>
</html>
