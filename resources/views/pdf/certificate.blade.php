<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, Arial, sans-serif; }

    /* ── Full-perimeter decorative frame ───────────────────────────── */
    .cert {
        position: absolute; inset: 0;
        border: 7px solid #1a3a2a;
        /* geometric lattice band shows through the padding on all four sides */
        background-color: #1a3a2a;
        background-image:
            repeating-linear-gradient(45deg, rgba(201,162,39,0) 0 7px, rgba(201,162,39,0.40) 7px 8px),
            repeating-linear-gradient(-45deg, rgba(201,162,39,0) 0 7px, rgba(201,162,39,0.40) 7px 8px);
        padding: 15px;
    }
    .inner {
        position: relative;
        height: 100%; width: 100%;
        background: #fff;
        border: 2px solid #C9A227;
        outline: 4px solid #fff;        /* small white gutter between gold line and band */
    }
    /* gold corner ornaments */
    .corner { position: absolute; width: 26px; height: 26px; border: 3px solid #C9A227; }
    .corner.tl { top: 8px;  left: 8px;  border-right: none; border-bottom: none; }
    .corner.tr { top: 8px;  right: 8px; border-left: none;  border-bottom: none; }
    .corner.bl { bottom: 8px; left: 8px;  border-right: none; border-top: none; }
    .corner.br { bottom: 8px; right: 8px; border-left: none;  border-top: none; }

    .content { padding: 30px 54px 22px; text-align: center; }

    .org { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #2d6a4f; font-weight: bold; margin: 10px 0 2px; }
    .cert-title { font-size: 30px; font-weight: bold; color: #1a3a2a; letter-spacing: 0.05em; margin-bottom: 3px; }
    .cert-sub { font-size: 11px; color: #6b7280; margin-bottom: 14px; }

    /* award ribbon */
    .award { margin: 0 auto 14px; display: inline-block; background: #faf4dd; border: 1.5px solid #C9A227; border-radius: 22px; padding: 6px 18px 6px 10px; }
    .award table { border-collapse: collapse; }
    .award td { vertical-align: middle; }
    .award-text { padding-left: 8px; text-align: left; }
    .award-cat { font-size: 12px; font-weight: bold; color: #1a3a2a; }
    .award-place { font-size: 9px; color: #9a7b12; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold; }

    .presents { font-size: 10px; color: #6b7280; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
    .student-name { font-size: 36px; font-weight: bold; color: #1a1a1a; display: inline-block; border-bottom: 2px solid #C9A227; padding: 0 24px 6px; margin-bottom: 12px; }
    .for-line { font-size: 12px; color: #374151; margin-bottom: 20px; }
    .for-line strong { color: #1a3a2a; }

    /* four stat boxes */
    .stats { width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 18px; }
    .stat-box { width: 25%; background: #f0f5f2; border: 1px solid #c6d9cf; border-top: 3px solid #2d6a4f; border-radius: 6px; padding: 12px 6px; text-align: center; }
    .stat-val { font-size: 24px; font-weight: bold; color: #1a3a2a; }
    .stat-lbl { font-size: 8.5px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; margin-top: 3px; }

    /* detail line */
    .details { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    .details td { font-size: 10px; color: #374151; padding: 5px 6px; border-bottom: 1px solid #eef2f0; }
    .details .k { color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-size: 8px; font-weight: bold; }

    /* signature + seal */
    .sign-row { width: 100%; border-collapse: collapse; margin-top: 22px; }
    .sign-cell { width: 45%; vertical-align: bottom; text-align: center; }
    .seal-cell { width: 10%; }
    .sign-line { border-top: 1.5px solid #1a3a2a; margin: 0 10px; padding-top: 5px; font-size: 10px; color: #374151; }
    .sign-sub { font-size: 8px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; }

    .seal { width: 86px; height: 86px; margin: 0 auto; border: 2px solid #C9A227; border-radius: 50%; text-align: center; }
    .seal-inner { width: 72px; height: 72px; margin: 5px auto 0; border: 1px dashed #2d6a4f; border-radius: 50%; padding-top: 16px; }
    .seal-mark { font-size: 15px; font-weight: bold; color: #1a3a2a; letter-spacing: 0.05em; }
    .seal-year { font-size: 7px; color: #2d6a4f; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 2px; }

    .cert-footer { position: absolute; bottom: 14px; left: 0; right: 0; text-align: center; font-size: 8px; color: #9ca3af; }

    /* ── Page 2 — Performance Report ───────────────────────────────── */
    .page2 { page-break-before: always; font-family: DejaVu Sans, Arial, sans-serif; padding: 36px 48px; color: #1a1a1a; }
    .p2-header { border-bottom: 3px solid #1a3a2a; padding-bottom: 10px; margin-bottom: 20px; }
    .p2-title { font-size: 16px; font-weight: bold; color: #1a3a2a; letter-spacing: 0.06em; }
    .p2-sub { font-size: 10px; color: #6b7280; margin-top: 3px; }
    .p2-name { font-size: 20px; font-weight: bold; color: #1a1a1a; }

    .p2-stats { width: 100%; border-collapse: separate; border-spacing: 8px 0; margin-bottom: 24px; }
    .p2-stat { background: #f0f5f2; border: 1px solid #c6d9cf; border-top: 3px solid #2d6a4f; border-radius: 5px; padding: 10px 6px; text-align: center; }
    .p2-stat-val { font-size: 20px; font-weight: bold; color: #1a3a2a; }
    .p2-stat-lbl { font-size: 7.5px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

    .p2-section { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 6px; }
    .p2-table { width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 9.5px; }
    .p2-table th { background: #1a3a2a; color: #fff; padding: 6px 8px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.06em; }
    .p2-table td { padding: 6px 8px; border-bottom: 1px solid #eef2f0; color: #374151; }
    .p2-table tr:nth-child(even) td { background: #f8faf9; }
    .p2-score-pill { display: inline-block; font-weight: bold; font-size: 10px; padding: 1px 7px; border-radius: 10px; }
    .score-high { background: #d1fae5; color: #065f46; }
    .score-mid  { background: #fef3c7; color: #92400e; }
    .score-low  { background: #fee2e2; color: #991b1b; }

    .p2-formula { background: #f8faf9; border: 1px solid #c6d9cf; border-radius: 5px; padding: 10px 14px; font-size: 9px; color: #374151; margin-bottom: 18px; }
    .p2-formula strong { color: #1a3a2a; }
    .p2-footer { margin-top: 24px; text-align: center; font-size: 8px; color: #9ca3af; border-top: 1px solid #eef2f0; padding-top: 8px; }
</style>
</head>
<body>
<div class="cert">
    <div class="inner">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>

        <div class="content">
            <h1 class="cert-title" style="font-size:22px; letter-spacing:0.08em; margin-top:10px;">IRSHAD SUMMER MURAJEAH 1448</h1>
            <p class="org">Jimma University Muslim Students Jema</p>
            <h2 class="cert-title" style="font-size:26px; margin-top:4px;">Certificate of Achievement</h2>
            <p class="cert-sub">{{ $program_name }}</p>

            @if (!empty($award))
            <div class="award">
                <table><tr>
                    <td>@include('pdf.partials.medal', ['place' => $award['place'], 'size' => 34])</td>
                    <td class="award-text">
                        <div class="award-cat">{{ $award['title'] }}</div>
                        <div class="award-place">{{ $award['place_label'] }}</div>
                    </td>
                </tr></table>
            </div>
            @endif

            <p class="presents">This certificate is proudly presented to</p>
            <h2 class="student-name">{{ $student->name }}</h2>
            <p class="for-line">for outstanding dedication and successful participation in <strong>{{ $program_name }}</strong></p>

            <table class="stats"><tr>
                <td class="stat-box"><div class="stat-val">{{ $avg_test }}/10</div><div class="stat-lbl">Avg Test Score</div></td>
                <td class="stat-box"><div class="stat-val">{{ $pages }}</div><div class="stat-lbl">Pages Reviewed</div></td>
                <td class="stat-box"><div class="stat-val">{{ $consistency }}%</div><div class="stat-lbl">Consistency</div></td>
                <td class="stat-box"><div class="stat-val">{{ $streak }}</div><div class="stat-lbl">Longest Streak (days)</div></td>
            </tr></table>

            <table class="details"><tr>
                <td><div class="k">Halqa</div>{{ $halqa ?? '—' }}</td>
                <td><div class="k">Revision Partner</div>{{ $partner ?? '—' }}</td>
                <td><div class="k">Program Period</div>{{ $start }} — {{ $end }}</td>
                <td><div class="k">Badges Earned</div>{{ $badges }}</td>
            </tr></table>

            <table class="sign-row"><tr>
                <td class="sign-cell">
                    <div class="sign-line">Irshad Structure</div>
                    <div class="sign-sub">Program Coordinator</div>
                </td>
                <td class="seal-cell"></td>
                <td class="sign-cell">
                    <div class="seal">
                        <div class="seal-inner">
                            <div class="seal-mark">IRSHAD</div>
                            <div class="seal-year">Official · 1448H</div>
                        </div>
                    </div>
                </td>
            </tr></table>
        </div>

        <div class="cert-footer">Generated {{ $generated }} · Muraja'a Monitor · Jimma University Muslim Students Jema</div>
    </div>
</div>
<!-- ── Page 2: Performance Report ──────────────────────────────────────── -->
<div class="page2">
    <div class="p2-header">
        <div class="p2-title">IRSHAD SUMMER MURAJEAH 1448 — Performance Report</div>
        <div class="p2-sub">Jimma University Muslim Students Jema · {{ $program_name }} · {{ $start }} — {{ $end }}</div>
        <div class="p2-name" style="margin-top:6px;">{{ $student->name }} <span style="font-size:11px;font-weight:normal;color:#6b7280;">· {{ $student->student_id }}</span></div>
    </div>

    {{-- Key stats --}}
    <table class="p2-stats"><tr>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $rank }} / {{ $total_students }}</div>
            <div class="p2-stat-lbl">Overall Rank</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $rank_score }}</div>
            <div class="p2-stat-lbl">Rank Score / 100</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $avg_test }}/10</div>
            <div class="p2-stat-lbl">Avg Test Score</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $consistency }}%</div>
            <div class="p2-stat-lbl">Consistency</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $pages }}</div>
            <div class="p2-stat-lbl">Pages Reviewed</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ number_format($minutes / 60, 1) }}h</div>
            <div class="p2-stat-lbl">Total Time ({{ $minutes }} min)</div>
        </td>
    </tr></table>

    {{-- Ranking formula transparency --}}
    <div class="p2-section">How Your Rank Is Calculated</div>
    <div class="p2-formula" style="margin-bottom:20px;">
        <strong>Rank Score</strong> = (Avg Test Score ÷ 10 × 50) + (Pages ÷ Top Pages × 30) + (Consistency% ÷ 100 × 20)
        &nbsp;·&nbsp; Maximum possible score: <strong>100</strong>
        &nbsp;·&nbsp; Your score: <strong>{{ $rank_score }}</strong>
    </div>

    {{-- Test results --}}
    <div class="p2-section">Test Results ({{ count($tests) }} test{{ count($tests) !== 1 ? 's' : '' }})</div>
    @if (count($tests) === 0)
        <p style="font-size:9.5px;color:#6b7280;margin-bottom:22px;">No tests recorded for this program period.</p>
    @else
    <table class="p2-table" style="margin-bottom:22px;">
        <thead><tr>
            <th>#</th>
            <th>Date</th>
            <th>Range</th>
            <th>Score</th>
        </tr></thead>
        <tbody>
        @foreach ($tests as $i => $t)
            @php
                $range = [];
                if ($t['from_juz'] && $t['to_juz'])   $range[] = 'Juz ' . $t['from_juz'] . '–' . $t['to_juz'];
                if ($t['from_page'] && $t['to_page'])  $range[] = 'pp. ' . $t['from_page'] . '–' . $t['to_page'];
                $pillClass = $t['score'] >= 8 ? 'score-high' : ($t['score'] >= 5 ? 'score-mid' : 'score-low');
            @endphp
            <tr>
                <td style="color:#9ca3af;">{{ $i + 1 }}</td>
                <td>{{ $t['date'] }}</td>
                <td>{{ implode(' · ', $range) ?: '—' }}</td>
                <td><span class="p2-score-pill {{ $pillClass }}">{{ $t['score'] }}/10</span></td>
            </tr>
        @endforeach
        </tbody>
    </table>
    @endif

    {{-- Consistency detail --}}
    <div class="p2-section">Consistency Breakdown</div>
    <table class="p2-table">
        <thead><tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Notes</th>
        </tr></thead>
        <tbody>
            <tr><td>Consistency Rate</td><td><strong>{{ $consistency }}%</strong></td><td>Submissions on scheduled days ÷ total scheduled days</td></tr>
            <tr><td>Longest Streak</td><td><strong>{{ $streak }} days</strong></td><td>Consecutive days with a submission</td></tr>
            <tr><td>Total Pages</td><td><strong>{{ $pages }} pp.</strong></td><td>Sum of all reviewed pages across submissions</td></tr>
            <tr><td>Juz Covered</td><td><strong>{{ $juz_covered }}</strong></td><td>Distinct juz appearing in submissions</td></tr>
            <tr><td>Time Invested</td><td><strong>{{ $minutes }} min ({{ number_format($minutes / 60, 1) }}h)</strong></td><td>Total self-reported recitation time</td></tr>
            <tr><td>Badges Earned</td><td><strong>{{ $badges }}</strong></td><td>Achievement badges awarded during the program</td></tr>
        </tbody>
    </table>

    <div class="p2-footer">
        This report was automatically generated by Muraja'a Monitor on {{ $generated }} and reflects all recorded data for this student during the program period.
    </div>
</div>
</body>
</html>
