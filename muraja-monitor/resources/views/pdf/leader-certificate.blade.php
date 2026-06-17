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

    .content { padding: 24px 54px 18px; text-align: center; }

    .org { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #2d6a4f; font-weight: bold; margin: 8px 0 2px; }
    .cert-title { font-size: 30px; font-weight: bold; color: #1a3a2a; letter-spacing: 0.05em; margin-bottom: 3px; }
    .cert-sub { font-size: 11px; color: #6b7280; margin-bottom: 10px; }

    .best-badge {
        display: inline-block; background: #C9A227; color: #fff;
        font-size: 11px; font-weight: bold; letter-spacing: 0.14em;
        padding: 4px 20px; border-radius: 20px; margin-bottom: 8px;
        text-transform: uppercase;
    }

    .presents { font-size: 10px; color: #6b7280; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }
    .leader-name { font-size: 34px; font-weight: bold; color: #1a1a1a; display: inline-block; border-bottom: 2px solid #C9A227; padding: 0 24px 5px; margin-bottom: 6px; }
    .for-line { font-size: 12px; color: #374151; margin-bottom: 6px; }
    .rank-line { font-size: 13px; font-weight: bold; color: #1a3a2a; margin-bottom: 14px; }

    .stats { width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 14px; }
    .stat-box { width: 25%; background: #f0f5f2; border: 1px solid #c6d9cf; border-top: 3px solid #2d6a4f; border-radius: 6px; padding: 10px 6px; text-align: center; }
    .stat-val { font-size: 22px; font-weight: bold; color: #1a3a2a; }
    .stat-lbl { font-size: 8.5px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; margin-top: 3px; }

    .sign-row { width: 100%; border-collapse: collapse; margin-top: 16px; }
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
    .p2-formula { background: #f8faf9; border: 1px solid #c6d9cf; border-radius: 5px; padding: 10px 14px; font-size: 9px; color: #374151; margin-bottom: 18px; }
    .p2-formula strong { color: #1a3a2a; }
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
            <h1 class="cert-title" style="font-size:22px; letter-spacing:0.08em; margin-top:8px;">IRSHAD SUMMER MURAJEAH 1448</h1>
            <p class="org">Jimma University Muslim Students Jema</p>
            <h2 class="cert-title" style="font-size:24px; margin-top:4px;">Certificate of Leadership Excellence</h2>
            <p class="cert-sub">{{ $program_name }}</p>

            @if ($is_best)
            <div class="best-badge">Best Leader Award</div><br>
            @endif

            <p class="presents">This certificate is proudly presented to</p>
            <h2 class="leader-name">{{ $leader->name }}</h2>
            <p class="for-line">for exemplary leadership of <strong>{{ $halqa }}</strong> Halqa</p>
            <p class="rank-line">Rank #{{ $rank }} of {{ $all_leaders_count }} Leaders &nbsp;·&nbsp; Score: {{ $score }} / 100</p>

            <table class="stats"><tr>
                <td class="stat-box">
                    <div class="stat-val">{{ $avg_consistency }}%</div>
                    <div class="stat-lbl">Group Consistency</div>
                </td>
                <td class="stat-box">
                    <div class="stat-val">{{ $avg_test_score }}/10</div>
                    <div class="stat-lbl">Avg Test Score</div>
                </td>
                <td class="stat-box">
                    <div class="stat-val">{{ $meetings }}</div>
                    <div class="stat-lbl">Meetings Held</div>
                </td>
                <td class="stat-box">
                    <div class="stat-val">{{ $tests_count }}</div>
                    <div class="stat-lbl">Tests Conducted</div>
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

<!-- Page 2: Performance Breakdown -->
<div class="page2">
    <div class="p2-header">
        <div class="p2-title">IRSHAD SUMMER MURAJEAH 1448 — Leader Performance Breakdown</div>
        <div class="p2-sub">Jimma University Muslim Students Jema · {{ $program_name }}</div>
        <div class="p2-name">{{ $leader->name }} <span style="font-size:11px;font-weight:normal;color:#6b7280;">· {{ $halqa }} Halqa · Rank #{{ $rank }}</span></div>
    </div>

    <table class="p2-stats"><tr>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $rank }} / {{ $all_leaders_count }}</div>
            <div class="p2-stat-lbl">Leader Rank</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $score }}</div>
            <div class="p2-stat-lbl">Total Score / 100</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $group_output }}</div>
            <div class="p2-stat-lbl">Group Output / 60</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $activity_score }}</div>
            <div class="p2-stat-lbl">Activity Score / 40</div>
        </td>
        <td class="p2-stat">
            <div class="p2-stat-val">{{ $students_count }}</div>
            <div class="p2-stat-lbl">Students Managed</div>
        </td>
    </tr></table>

    <div class="p2-formula">
        <strong>Scoring Formula:</strong><br>
        Group Output (60 pts) = Halqa Consistency avg (30) + Avg Test Score (20) + Consistency Improvement Delta (10)<br>
        Leader Activity (40 pts) = Tests Conducted per student (15) + Meetings Finalised (10) + Contact Notes (10) + Flags Reviewed (5)
    </div>

    <div class="p2-section">Detailed Breakdown</div>
    <table class="p2-table">
        <thead><tr>
            <th>Metric</th>
            <th>Raw Value</th>
            <th>Max Points</th>
            <th>Points Earned</th>
        </tr></thead>
        <tbody>
            <tr><td>Halqa Avg Consistency</td><td>{{ $avg_consistency }}%</td><td>30</td><td>{{ round($avg_consistency / 100 * 30, 1) }}</td></tr>
            <tr><td>Halqa Avg Test Score</td><td>{{ $avg_test_score }} / 10</td><td>20</td><td>{{ round($avg_test_score / 10 * 20, 1) }}</td></tr>
            <tr><td>Consistency Improvement (delta)</td><td>+{{ $consistency_delta }}%</td><td>10</td><td>{{ round(min($consistency_delta, 100) / 100 * 10, 1) }}</td></tr>
            <tr><td>Tests Conducted</td><td>{{ $tests_count }} tests, {{ $students_count }} students</td><td>15</td><td>{{ round(min(1, $tests_count / max(1, $students_count * 2)) * 15, 1) }}</td></tr>
            <tr><td>Meetings Finalised</td><td>{{ $meetings }}</td><td>10</td><td>{{ round($activity_score - min(1, $contact_notes / max(1, $students_count)) * 10 - min(5, $flags_reviewed), 1) }}</td></tr>
            <tr><td>Contact Notes Logged</td><td>{{ $contact_notes }}</td><td>10</td><td>{{ round(min(1, $contact_notes / max(1, $students_count)) * 10, 1) }}</td></tr>
            <tr><td>Flags Reviewed</td><td>{{ $flags_reviewed }}</td><td>5</td><td>{{ min(5, $flags_reviewed) }}</td></tr>
        </tbody>
    </table>

    <div class="p2-footer">Generated {{ $generated }} · Muraja'a Monitor · Jimma University Muslim Students Jema</div>
</div>
</body>
</html>
