<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
    @font-face {
        font-family: "NotoLatin";
        src: url("{{ base_path('resources/fonts/pdf/NotoSans-Regular.ttf') }}") format("truetype");
        font-weight: 400;
    }
    @font-face {
        font-family: "NotoLatin";
        src: url("{{ base_path('resources/fonts/pdf/NotoSans-Bold.ttf') }}") format("truetype");
        font-weight: 700;
    }
    @font-face {
        font-family: "NotoEthiopic";
        src: url("{{ base_path('resources/fonts/pdf/NotoSansEthiopic-Regular.ttf') }}") format("truetype");
        font-weight: 400;
    }
    @font-face {
        font-family: "NotoEthiopic";
        src: url("{{ base_path('resources/fonts/pdf/NotoSansEthiopic-Bold.ttf') }}") format("truetype");
        font-weight: 700;
    }
    @font-face {
        font-family: "NotoNaskhArabic";
        src: url("{{ base_path('resources/fonts/pdf/NotoNaskhArabic-Regular.ttf') }}") format("truetype");
        font-weight: 400;
    }
    @font-face {
        font-family: "NotoNaskhArabic";
        src: url("{{ base_path('resources/fonts/pdf/NotoNaskhArabic-Bold.ttf') }}") format("truetype");
        font-weight: 700;
    }
    @page { margin: 0; size: A4 landscape; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "NotoLatin", DejaVu Sans, Arial, sans-serif; color: #16202a; }

    /* ── Page 1 — Certificate (gold theme) ─────────────────────────── */
    .cert {
        position: absolute;
        inset: 0;
        background: #f7f4ec;
        padding: 14px;
    }
    .inner {
        position: relative;
        height: 100%;
        width: 100%;
        background: #fbfaf5;
        border: 4px solid #9a6a16;
        outline: 1px solid #1c2933;
        outline-offset: -10px;
    }
    .inner:before {
        content: "";
        position: absolute;
        inset: 19px;
        border: 1px solid #b98c2a;
    }
    .inner:after {
        content: "";
        position: absolute;
        inset: 27px;
        border: 1px solid #e0d4b8;
    }
    .corner { position: absolute; width: 58px; height: 58px; z-index: 1; border-color: #9a6a16; }
    .corner:after {
        content: "";
        position: absolute;
        width: 8px;
        height: 8px;
        background: #9a6a16;
        border: 1px solid #1c2933;
        transform: rotate(45deg);
    }
    .corner.tl { top: 28px; left: 28px; border-top: 1.5px solid; border-left: 1.5px solid; }
    .corner.tr { top: 28px; right: 28px; border-top: 1.5px solid; border-right: 1.5px solid; }
    .corner.bl { bottom: 28px; left: 28px; border-bottom: 1.5px solid; border-left: 1.5px solid; }
    .corner.br { bottom: 28px; right: 28px; border-bottom: 1.5px solid; border-right: 1.5px solid; }
    .corner.tl:after { top: 17px; left: 17px; }
    .corner.tr:after { top: 17px; right: 17px; }
    .corner.bl:after { bottom: 17px; left: 17px; }
    .corner.br:after { bottom: 17px; right: 17px; }

    .content {
        position: relative;
        z-index: 2;
        padding: 34px 74px 86px;
        text-align: center;
    }
    .top-mark { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    .top-mark td { vertical-align: middle; }
    .top-mark .side-cell { width: 210px; }
    .top-mark .arabic-cell { text-align: center; }
    .top-mark .code-cell {
        width: 210px;
        text-align: right;
        font-size: 8px;
        line-height: 1.7;
        color: #4f5d68;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
    .bismillah {
        font-family: "NotoNaskhArabic", DejaVu Sans, Arial, sans-serif;
        font-size: 24px;
        line-height: 1.3;
        color: #141414;
    }
    .hadith {
        font-family: "NotoNaskhArabic", DejaVu Sans, Arial, sans-serif;
        font-size: 9.5px;
        line-height: 1.7;
        color: #2f2a22;
        margin-top: 5px;
    }
    .divider {
        width: 64%;
        margin: 14px auto 13px;
        border-top: 1.5px solid #9a6a16;
        color: #9a6a16;
        font-size: 13px;
        line-height: 0;
    }
    .divider span {
        display: inline-block;
        background: #fbfaf5;
        padding: 0 10px;
        position: relative;
        top: -1px;
    }
    .doc-type {
        font-size: 10px;
        font-weight: bold;
        color: #8a6118;
        letter-spacing: 0.22em;
        text-transform: uppercase;
    }
    .program-title {
        font-size: 27px;
        line-height: 1.1;
        font-weight: bold;
        color: #17212b;
        margin-top: 5px;
    }
    .issuer {
        font-size: 10px;
        color: #53606b;
        margin-top: 5px;
    }
    .best-badge {
        display: inline-block;
        margin-top: 9px;
        padding: 4px 20px;
        border: 1px solid #9a6a16;
        border-radius: 20px;
        background: rgba(154, 106, 22, 0.08);
        font-size: 9px;
        font-weight: bold;
        color: #8a6118;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }
    .recipient-label {
        margin-top: 15px;
        font-size: 8.5px;
        font-weight: bold;
        color: #8a6118;
        letter-spacing: 0.16em;
        text-transform: uppercase;
    }
    .recipient-name {
        display: inline-block;
        min-width: 470px;
        max-width: 650px;
        border-bottom: 1.5px solid #444c54;
        padding: 2px 24px 5px;
        font-size: 32px;
        line-height: 1.15;
        font-weight: bold;
        color: #111820;
    }
    .meta-grid {
        width: 82%;
        margin: 14px auto 0;
        border-collapse: collapse;
        border-top: 1px solid #9a6a16;
        border-bottom: 1px solid #9a6a16;
    }
    .meta-grid td {
        width: 25%;
        padding: 7px 8px;
        text-align: center;
        border-left: 1px solid #d6c195;
    }
    .meta-grid td:first-child { border-left: none; }
    .meta-label {
        display: block;
        font-size: 7px;
        color: #6a7480;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 2px;
    }
    .meta-value {
        display: block;
        font-size: 9.5px;
        font-weight: bold;
        color: #17212b;
    }
    .statement-row {
        width: 82%;
        margin: 13px auto 0;
        border-collapse: collapse;
        table-layout: fixed;
    }
    .statement-row td {
        width: 50%;
        vertical-align: top;
        padding: 0 20px;
        text-align: left;
        font-size: 9.3px;
        line-height: 1.6;
        color: #26323d;
    }
    .statement-row .amharic {
        font-family: "NotoEthiopic", DejaVu Sans, Arial, sans-serif;
        font-size: 9.5px;
        line-height: 1.7;
    }
    .statement-row .statement-title {
        display: block;
        margin-bottom: 4px;
        font-size: 8px;
        font-weight: bold;
        color: #8a6118;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    .sign-row {
        position: absolute;
        left: 7%;
        right: auto;
        bottom: 88px;
        z-index: 3;
        width: 86%;
        border-collapse: collapse;
        table-layout: fixed;
    }
    .sign-cell {
        width: 33.33%;
        vertical-align: bottom;
        font-size: 8.5px;
        line-height: 1.35;
        color: #202020;
    }
    .sign-cell.left { text-align: left; }
    .sign-cell.center { text-align: center; }
    .sign-cell.right { text-align: right; }
    .sign-line {
        display: inline-block;
        min-width: 150px;
        border-top: 1px solid #444c54;
        padding-top: 4px;
    }
    .sign-name { font-weight: bold; color: #17212b; }
    .seal {
        display: inline-block;
        width: 66px; height: 66px;
        border: 1.5px solid #9a6a16;
        border-radius: 50%;
        text-align: center;
    }
    .seal-inner {
        width: 52px; height: 52px;
        margin: 6px auto 0;
        border: 1px dashed #b98c2a;
        border-radius: 50%;
        padding-top: 11px;
    }
    .seal-mark { font-size: 12px; font-weight: bold; color: #8a6118; letter-spacing: 0.05em; }
    .seal-year { font-size: 6.5px; color: #6a7480; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 2px; }
    .verify-line {
        position: absolute;
        left: 7%;
        right: 7%;
        bottom: 34px;
        z-index: 3;
        border-top: 1px solid #b98c2a;
        padding-top: 5px;
        text-align: center;
        font-size: 7.1px;
        line-height: 1.35;
        color: #4f5d68;
    }

    /* ── Page 2 — Performance Breakdown ────────────────────────────── */
    .page2 { page-break-before: always; font-family: "NotoLatin", DejaVu Sans, Arial, sans-serif; padding: 36px 48px; color: #1a1a1a; }
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
            <table class="top-mark">
                <tr>
                    <td class="side-cell"></td>
                    <td class="arabic-cell">
                        <div class="bismillah">ﻢﻴﺣﺮﻟﺍ ﻦﻤﺣﺮﻟﺍ ﷲ ﻢﺴﺑ</div>
                        <div class="hadith">ﻪﻤﻠﻋﻭ ﻥﺁﺮﻘﻟﺍ ﻢﻠﻌﺗ ﻦﻣ ﻢﻛﺮﻴﺧ</div>
                    </td>
                    <td class="code-cell">
                        Rank<br>
                        <strong>#{{ $rank }} of {{ $all_leaders_count }}</strong>
                    </td>
                </tr>
            </table>

            <div class="divider"><span>◇ ✦ ◇</span></div>

            <div class="doc-type">Certificate of Leadership Excellence</div>
            <div class="program-title">{{ $program_name }}</div>
            <div class="issuer">Summer Murajeah Program</div>

            @if ($is_best)
            <div class="best-badge">Best Leader Award</div>
            @endif

            <div class="recipient-label">Presented To</div>
            <div class="recipient-name">@ar($leader->name)</div>

            <table class="meta-grid">
                <tr>
                    <td>
                        <span class="meta-label">Halqa</span>
                        <span class="meta-value">@ar($halqa)</span>
                    </td>
                    <td>
                        <span class="meta-label">Leader Rank</span>
                        <span class="meta-value">#{{ $rank }} of {{ $all_leaders_count }}</span>
                    </td>
                    <td>
                        <span class="meta-label">Score</span>
                        <span class="meta-value">{{ $score }} / 100</span>
                    </td>
                    <td>
                        <span class="meta-label">Issued</span>
                        <span class="meta-value">{{ $generated }}</span>
                    </td>
                </tr>
            </table>

            <table class="statement-row">
                <tr>
                    <td>
                        <span class="statement-title">Message of Appreciation</span>
                        Honoured leader <strong>@ar($leader->name)</strong>, thank you from the heart for the exemplary
                        leadership you showed — encouraging your group members, following up, and standing
                        by their side so our Qur'an Muraja'ah program could succeed. For every sincere
                        effort you gave, we present this certificate with great joy and pray Allah rewards
                        you. We are always proud of your beautiful character and service!
                    </td>
                    <td class="amharic">
                        <span class="statement-title">የምስጋና መልእክት</span>
                        የተከበርሽ መሪያችን <strong>@ar($leader->name)</strong>፣ ፕሮግራማችን በተሳካ ሁኔታ እንዲጠናቀቅ የቡድን አባላትሽን
                        በማበረታታት፣ በመከታተል እና ከጎናቸው በመቆም ላሳየሽው አርአያነት ያለው አመራር ከልብ እናመሰግናለን። በቅንነት
                        ላሳለፍሽው እያንዳንዱ ድካም አላህ መልካም ምንዳውን እንዲከፍልሽ እየተመኘን፣ ይህንን የምስክር ወረቀት በታላቅ ደስታ
                        ሰጥተንሻል። በውብ ስነ-ምግባርሽ እና በአገልግሎትሽ ሁሌም እንኮራብሻለን!
                    </td>
                </tr>
            </table>
        </div>

        <table class="sign-row"><tr>
            <td class="sign-cell left">
                <span class="sign-line"><span class="sign-name">Issued</span><br>{{ $generated }}</span>
            </td>
            <td class="sign-cell center">
                <span class="seal">
                    <span class="seal-inner">
                        <span class="seal-mark">MURAJEAH</span>
                        <span class="seal-year">Official</span>
                    </span>
                </span>
            </td>
            <td class="sign-cell right">
                <span class="sign-line"><span class="sign-name">Program Coordinator</span><br>Summer Murajeah Program</span>
            </td>
        </tr></table>

        <div class="verify-line">
            Summer Murajeah Program &nbsp;·&nbsp; Leadership Excellence
        </div>
    </div>
</div>

<!-- Page 2: Performance Breakdown -->
<div class="page2">
    <div class="p2-header">
        <div class="p2-title">SUMMER MURAJEAH PROGRAM — Leader Performance Breakdown</div>
        <div class="p2-sub">{{ $program_name }}</div>
        <div class="p2-name">@ar($leader->name) <span style="font-size:11px;font-weight:normal;color:#6b7280;">· @ar($halqa) Halqa · Rank #{{ $rank }}</span></div>
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

    <div class="p2-footer">Generated {{ $generated }} · Summer Murajeah Program</div>
</div>
</body>
</html>
