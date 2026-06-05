<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{ $programName }} — Full Report</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #1a1a1a; }

.page { page-break-after: always; padding: 30px 36px; min-height: 100vh; position: relative; }
.page:last-child { page-break-after: avoid; }

.geo-header { background: #1a3a2a; height: 12px; width: 100%; background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.08) 5px, rgba(255,255,255,0.08) 10px); margin-bottom: 0; }

.footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 7px 36px; border-top: 1px solid #dde5e0; display: flex; justify-content: space-between; font-size: 9px; color: #6b7280; background: #fff; }

/* Cover */
.cover-body { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding-top: 60px; }
.cover-title { font-size: 24px; font-weight: bold; margin-bottom: 4px; }
.cover-sub   { font-size: 12px; color: #4b5563; margin-bottom: 40px; }
.cover-meta  { background: #f0f5f2; border: 1px solid #c6d9cf; border-radius: 6px; padding: 18px 28px; min-width: 260px; }
.meta-row    { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e5ece9; font-size: 10px; }
.meta-row:last-child { border: none; }
.meta-label  { color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.04em; }
.meta-value  { font-weight: bold; }

/* Section headers */
.section-header { font-size: 15px; font-weight: bold; color: #1a3a2a; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 2px solid #1a3a2a; margin-top: 24px; }
.section-header:first-child { margin-top: 0; }

/* Summary grid */
.sum-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
.sum-card { background: #f0f5f2; border: 1px solid #c6d9cf; border-radius: 5px; padding: 12px 8px; text-align: center; }
.sum-val  { font-size: 24px; font-weight: bold; color: #1a3a2a; }
.sum-lbl  { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px; }

/* Tables */
table { width: 100%; border-collapse: collapse; margin-top: 4px; }
th { background: #1a3a2a; color: #e8f5ef; font-size: 9px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; padding: 6px 8px; text-align: left; }
td { padding: 7px 8px; font-size: 10px; border-bottom: 1px solid #e5ede9; vertical-align: middle; }
tr:nth-child(even) td { background: #f8faf9; }

/* Status dots */
.dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; }
.dot-good { background: #2d6a4f; }
.dot-warn { background: #d97706; }
.dot-bad  { background: #dc2626; }
.dot-grey { background: #9ca3af; }

/* At-risk box */
.at-risk-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 5px; padding: 14px; margin-top: 14px; }
.at-risk-title { font-size: 12px; font-weight: bold; color: #dc2626; margin-bottom: 8px; }

/* Awards */
.awards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
.award-card { background: #f0f5f2; border: 1px solid #c6d9cf; border-radius: 5px; padding: 12px; }
.award-label { font-size: 9px; font-weight: bold; color: #2d6a4f; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
.award-winner { font-size: 13px; font-weight: bold; color: #1a1a1a; }
</style>
</head>
<body>

<div class="footer">
    <span>Generated {{ $today->format('d F Y') }} · {{ $programName }}</span>
    <span>Jimma University Muslim Students Union</span>
</div>

{{-- ── COVER ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="cover-body" style="margin-top: 40px;">
        <p style="font-size: 11px; font-weight: bold; color: #2d6a4f; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px;">Jimma University Muslim Students Union</p>
        <h1 class="cover-title">{{ $programName }}</h1>
        <h1 class="cover-title">Full Program Report</h1>
        <p class="cover-sub">Muraja'a Monitor — Summer 1446H</p>
        <div class="cover-meta">
            <div class="meta-row"><span class="meta-label">Program Period</span><span class="meta-value">{{ $start->format('d M Y') }} — {{ $today->format('d M Y') }}</span></div>
            <div class="meta-row"><span class="meta-label">Days Elapsed</span><span class="meta-value">{{ $days }}</span></div>
            <div class="meta-row"><span class="meta-label">Generated</span><span class="meta-value">{{ $today->format('d F Y') }}</span></div>
        </div>
    </div>
</div>

{{-- ── HALQA BREAKDOWN ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div style="padding-top: 20px;">
        <h2 class="section-header">Halqa Breakdown</h2>
        <table>
            <thead><tr><th>Halqa</th><th>Leader</th><th>Pairs</th><th>Members</th><th>Consistency</th><th>Pages</th></tr></thead>
            <tbody>
                @foreach ($halqaStats as $h)
                <tr>
                    <td style="font-weight: bold;">{{ $h['name'] }}</td>
                    <td>{{ $h['leader'] }}</td>
                    <td>{{ $h['pairs'] }}</td>
                    <td>{{ $h['members'] }}</td>
                    <td><span class="dot {{ $h['consistency'] >= 70 ? 'dot-good' : ($h['consistency'] >= 40 ? 'dot-warn' : 'dot-bad') }}"></span>{{ $h['consistency'] }}%</td>
                    <td>{{ $h['pages'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        {{-- At-risk --}}
        @if (count($atRisk) > 0)
        <div class="at-risk-box">
            <p class="at-risk-title">⚠ At-Risk Students ({{ count($atRisk) }})</p>
            <table>
                <thead><tr><th>Name</th><th>Halqa</th></tr></thead>
                <tbody>
                    @foreach ($atRisk as $s)
                    <tr><td>{{ $s['name'] }}</td><td>{{ $s['halqa'] }}</td></tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif
    </div>
</div>

{{-- ── STUDENT LEADERBOARD ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div style="padding-top: 20px;">
        <h2 class="section-header">Top Students</h2>
        <table>
            <thead><tr><th>Rank</th><th>Name</th><th>Halqa</th><th>Consistency</th><th>Streak</th><th>Pages</th><th>Badges</th></tr></thead>
            <tbody>
                @foreach ($students as $s)
                <tr style="{{ $s['rank'] <= 3 ? 'background: #f9fafb;' : '' }}">
                    <td style="font-weight: bold; font-size: 13px;">{{ $s['rank'] <= 3 ? ['🥇','🥈','🥉'][$s['rank']-1] : $s['rank'] }}</td>
                    <td style="font-weight: bold;">{{ $s['name'] }}</td>
                    <td>{{ $s['halqa'] }}</td>
                    <td><span class="dot {{ $s['consistency'] >= 70 ? 'dot-good' : 'dot-warn' }}"></span>{{ $s['consistency'] }}%</td>
                    <td>{{ $s['streak'] }}d</td>
                    <td>{{ $s['pages'] }}</td>
                    <td>{{ $s['badges'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <h2 class="section-header" style="margin-top: 28px;">Top Pairs</h2>
        <table>
            <thead><tr><th>Rank</th><th>Student A</th><th>Student B</th><th>Consistency</th><th>Pages</th><th>Streak</th></tr></thead>
            <tbody>
                @foreach ($pairBoard as $p)
                <tr>
                    <td style="font-weight: bold; font-size: 13px;">{{ $p['rank'] <= 3 ? ['🥇','🥈','🥉'][$p['rank']-1] : $p['rank'] }}</td>
                    <td style="font-weight: bold;">{{ $p['student_a'] }}</td>
                    <td>{{ $p['student_b'] }}</td>
                    <td><span class="dot {{ $p['consistency'] >= 70 ? 'dot-good' : 'dot-warn' }}"></span>{{ $p['consistency'] }}%</td>
                    <td>{{ $p['pages'] }}</td>
                    <td>{{ $p['streak'] }}d</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>

{{-- ── AWARDS ── --}}
<div class="page">
    <div class="geo-header"></div>
    <div style="padding-top: 20px;">
        <h2 class="section-header">Award Winners</h2>
        <div class="awards-grid">
            @if ($awards['most_consistent_students'][0] ?? null)
            <div class="award-card">
                <p class="award-label">🥇 Most Consistent Student</p>
                <p class="award-winner">{{ $awards['most_consistent_students'][0]['name'] }}</p>
                <p style="font-size: 10px; color: #4b5563;">{{ $awards['most_consistent_students'][0]['consistency'] }}% consistency</p>
            </div>
            @endif
            @if ($awards['most_consistent_pair'] ?? null)
            <div class="award-card">
                <p class="award-label">🥇 Most Consistent Pair</p>
                <p class="award-winner">{{ $awards['most_consistent_pair']['student_a'] }} & {{ $awards['most_consistent_pair']['student_b'] }}</p>
                <p style="font-size: 10px; color: #4b5563;">{{ $awards['most_consistent_pair']['consistency'] }}%</p>
            </div>
            @endif
            @if ($awards['longest_streak'] ?? null)
            <div class="award-card">
                <p class="award-label">⚡ Longest Streak</p>
                <p class="award-winner">{{ $awards['longest_streak']['name'] }}</p>
                <p style="font-size: 10px; color: #4b5563;">{{ $awards['longest_streak']['streak'] }} days</p>
            </div>
            @endif
            @if ($awards['most_pages'] ?? null)
            <div class="award-card">
                <p class="award-label">📖 Most Pages</p>
                <p class="award-winner">{{ $awards['most_pages']['name'] }}</p>
                <p style="font-size: 10px; color: #4b5563;">{{ $awards['most_pages']['pages'] }} pages</p>
            </div>
            @endif
            @if ($awards['most_improved_student'] ?? null)
            <div class="award-card">
                <p class="award-label">📈 Most Improved</p>
                <p class="award-winner">{{ $awards['most_improved_student']['name'] }}</p>
            </div>
            @endif
        </div>
    </div>
</div>

</body>
</html>
