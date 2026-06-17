<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, Arial, sans-serif; }

    .cert {
        position: absolute; inset: 0;
        border: 7px solid #1a3a2a;
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
        outline: 4px solid #fff;
    }
    .corner { position: absolute; width: 26px; height: 26px; border: 3px solid #C9A227; }
    .corner.tl { top: 8px;  left: 8px;  border-right: none; border-bottom: none; }
    .corner.tr { top: 8px;  right: 8px; border-left: none;  border-bottom: none; }
    .corner.bl { bottom: 8px; left: 8px;  border-right: none; border-top: none; }
    .corner.br { bottom: 8px; right: 8px; border-left: none;  border-top: none; }

    .content { padding: 22px 54px 18px; text-align: center; }

    .org { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #2d6a4f; font-weight: bold; margin: 8px 0 2px; }
    .cert-title { font-size: 30px; font-weight: bold; color: #1a3a2a; letter-spacing: 0.05em; }
    .cert-sub { font-size: 11px; color: #6b7280; margin-bottom: 8px; }

    .best-badge {
        display: inline-block; background: #C9A227; color: #fff;
        font-size: 11px; font-weight: bold; letter-spacing: 0.14em;
        padding: 4px 20px; border-radius: 20px; margin-bottom: 8px;
        text-transform: uppercase;
    }

    .presents { font-size: 10px; color: #6b7280; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }
    .halqa-name { font-size: 36px; font-weight: bold; color: #1a1a1a; display: inline-block; border-bottom: 2px solid #C9A227; padding: 0 24px 5px; margin-bottom: 4px; }
    .for-line { font-size: 12px; color: #374151; margin-bottom: 4px; }
    .rank-line { font-size: 13px; font-weight: bold; color: #1a3a2a; margin-bottom: 14px; }

    .stats { width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 14px; }
    .stat-box { width: 25%; background: #f0f5f2; border: 1px solid #c6d9cf; border-top: 3px solid #2d6a4f; border-radius: 6px; padding: 10px 6px; text-align: center; }
    .stat-val { font-size: 22px; font-weight: bold; color: #1a3a2a; }
    .stat-lbl { font-size: 8.5px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; margin-top: 3px; }

    .sign-row { width: 100%; border-collapse: collapse; margin-top: 14px; }
    .sign-cell { width: 45%; vertical-align: bottom; text-align: center; }
    .seal-cell { width: 10%; }
    .sign-line { border-top: 1.5px solid #1a3a2a; margin: 0 10px; padding-top: 5px; font-size: 10px; color: #374151; }
    .sign-sub { font-size: 8px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; }

    .seal { width: 86px; height: 86px; margin: 0 auto; border: 2px solid #C9A227; border-radius: 50%; text-align: center; }
    .seal-inner { width: 72px; height: 72px; margin: 5px auto 0; border: 1px dashed #2d6a4f; border-radius: 50%; padding-top: 16px; }
    .seal-mark { font-size: 15px; font-weight: bold; color: #1a3a2a; letter-spacing: 0.05em; }
    .seal-year { font-size: 7px; color: #2d6a4f; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 2px; }

    .cert-footer { position: absolute; bottom: 14px; left: 0; right: 0; text-align: center; font-size: 8px; color: #9ca3af; }

    /* Page 2 */
    .page2 { page-break-before: always; font-family: DejaVu Sans, Arial, sans-serif; padding: 36px 48px; color: #1a1a1a; }
    .p2-header { border-bottom: 3px solid #1a3a2a; padding-bottom: 10px; margin-bottom: 20px; }
    .p2-title { font-size: 16px; font-weight: bold; color: #1a3a2a; letter-spacing: 0.06em; }
    .p2-sub { font-size: 10px; color: #6b7280; margin-top: 3px; }
    .p2-name { font-size: 20px; font-weight: bold; color: #1a1a1a; margin-top: 6px; }

    .p2-stats { width: 100%; border-collapse: separate; border-spacing: 8px 0; margin-bottom: 20px; }
    .p2-stat { background: #f0f5f2; border: 1px solid #c6d9cf; border-top: 3px solid #2d6a4f; border-radius: 5px; padding: 10px 6px; text-align: center; }
    .p2-stat-val { font-size: 20px; font-weight: bold; color: #1a3a2a; }
    .p2-stat-lbl { font-size: 7.5px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 2px; }

    .p2-section { font-size: 8px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 6px; }
    .p2-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 9.5px; }
    .p2-table th { background: #1a3a2a; color: #fff; padding: 6px 8px; text-align: left; font-size: 8px; text-transform: uppercase; letter-spacing: 0.06em; }
    .p2-table td { padding: 6px 8px; border-bottom: 1px solid #eef2f0; color: #374151; }
    .p2-table tr:nth-child(even) td { background: #f8faf9; }
    .score-pill { display: inline-block; font-weight: bold; font-size: 9px; padding: 1px 7px; border-radius: 10px; }
    .score-high { background: #d1fae5; color: #065f46; }
    .score-mid  { background: #fef3c7; color: #92400e; }
    .score-low  { background: #fee2e2; color: #991b1b; }
    .p2-footer { margin-top: 24px; text-align: center; font-size: 8px; color: #9ca3af; border-top: 1px solid #eef2f0; padding-top: 8px; }
</style>
</head>
<body>
<!-- Page 1: Certificate -->
<div class="cert">
    <div class="inner">
        <span class="corner tl"></span><span class="corner tr"></span>
        <span class="corner bl"></span><span class="corner br"></span>

        <div class="content">
            <h1 class="cert-title" style="font-size:22px; letter-spacing:0.08em; margin-top:6px;">IRSHAD SUMMER MURAJEAH 1448</h1>
            <p class="org">Jimma University Muslim Students Jema</p>
            <h2 class="cert-title" style="font-size:24px; margin-top:4px;">Certificate of Halqa Excellence</h2>
            <p class="cert-sub">{{ $program_name }}</p>

            @if ($is_best)
            <div class="best-badge">Best Halqa Award</div><br>
            @endif

            <p class="presents">This certificate is proudly presented to the students of</p>
            <h2 class="halqa-name">{{ $name }} Halqa</h2>
            <p class="for-line">under the leadership of <strong>{{ $leader_name }}</strong></p>
            <p class="rank-line">Halqa Rank #{{ $rank }} &nbsp;·&nbsp; Collective Score: {{ $score }} / 100</p>

            <table class="stats"><tr>
                <td class="stat-box">
                    <div class="stat-val">{{ $consistency }}%</div>
                    <div class="stat-lbl">Group Consistency</div>
                </td>
                <td class="stat-box">
                    <div class="stat-val">{{ $avg_test_score }}/10</div>
                    <div class="stat-lbl">Avg Test Score</div>
                </td>
                <td class="stat-box">
                    <div class="stat-val">{{ number_format($pages) }}</div>
                    <div class="stat-lbl">Total Pages</div>
                </td>
                <td class="stat-box">
                    <div class="stat-val">{{ $avg_streak }}d</div>
                    <div class="stat-lbl">Avg Streak</div>
                </td>
            </tr></table>

            <table class="sign-row"><tr>
                <td class="sign-cell">
                    <div class="sign-line">Sitra Kemeru</div>
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

<!-- Page 2: Student Roster -->
<div class="page2">
    <div class="p2-header">
        <div class="p2-title">IRSHAD SUMMER MURAJEAH 1448 — Halqa Student Roster</div>
        <div class="p2-sub">Jimma University Muslim Students Jema · {{ $program_name }}</div>
        <div class="p2-name">{{ $name }} Halqa <span style="font-size:11px;font-weight:normal;color:#6b7280;">· Leader: {{ $leader_name }} · Rank #{{ $rank }}</span></div>
    </div>

    <table class="p2-stats"><tr>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $consistency }}%</div>
            <div class="p2-stat-lbl">Group Consistency</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $avg_test_score }}/10</div>
            <div class="p2-stat-lbl">Avg Test Score</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ number_format($pages) }}</div>
            <div class="p2-stat-lbl">Total Pages</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ count($students) }}</div>
            <div class="p2-stat-lbl">Students</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $score }}</div>
            <div class="p2-stat-lbl">Halqa Score / 100</div>
        </td>
    </tr></table>

    <div class="p2-section">Student Performance</div>
    <table class="p2-table">
        <thead><tr>
            <th>#</th>
            <th>Student Name</th>
            <th>Student ID</th>
            <th>Consistency %</th>
            <th>Avg Test</th>
            <th>Pages</th>
            <th>Rank Score</th>
        </tr></thead>
        <tbody>
            @foreach ($students as $i => $s)
            @php
                $sc = $s['rank_score'];
                $pill = $sc >= 60 ? 'score-high' : ($sc >= 30 ? 'score-mid' : 'score-low');
            @endphp
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $s['name'] }}</td>
                <td>{{ $s['student_id'] }}</td>
                <td>{{ $s['consistency'] }}%</td>
                <td>{{ $s['avg_test'] }}/10</td>
                <td>{{ number_format($s['pages']) }}</td>
                <td><span class="score-pill {{ $pill }}">{{ $s['rank_score'] }}</span></td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="p2-footer">Generated {{ $generated }} · Muraja'a Monitor · Jimma University Muslim Students Jema</div>
</div>
</body>
</html>
