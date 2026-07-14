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
    .top-mark .logo-cell { width: 120px; text-align: left; }
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
    .brand-mark {
        width: 72px;
        height: 72px;
        border: 1px solid #b98c2a;
        border-radius: 50%;
        padding: 7px;
        background: rgba(255, 255, 255, 0.45);
    }
    .brand-mark img { width: 58px; height: auto; }
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
        font-size: 29px;
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
    .recipient-label {
        margin-top: 17px;
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
    .completion-copy {
        width: 68%;
        margin: 9px auto 0;
        font-size: 11px;
        line-height: 1.65;
        color: #283541;
    }
    .completion-copy strong { color: #111820; }
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
        width: 78%;
        margin: 13px auto 0;
        border-collapse: collapse;
        table-layout: fixed;
    }
    .statement-row td {
        width: 50%;
        vertical-align: top;
        padding: 0 20px;
        text-align: left;
        font-size: 9.7px;
        line-height: 1.65;
        color: #26323d;
    }
    .statement-row .amharic {
        font-family: "NotoEthiopic", DejaVu Sans, Arial, sans-serif;
        font-size: 10px;
        line-height: 1.75;
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
    .award {
        width: 58%;
        margin: 12px auto 0;
        padding: 7px 12px;
        border-top: 1.5px solid #9a6a16;
        border-bottom: 1.5px solid #9a6a16;
        font-size: 9px;
        color: #17212b;
        text-align: center;
    }
    .award-title {
        display: block;
        font-weight: bold;
        color: #8a6118;
        letter-spacing: 0.1em;
        text-transform: uppercase;
    }
    .award-note {
        display: block;
        margin-top: 3px;
        font-size: 7.6px;
        line-height: 1.45;
        color: #53606b;
    }
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
    .verify-line strong {
        color: #17212b;
    }
    .sign-row {
        position: absolute;
        left: 7%;
        right: auto;
        bottom: 112px;
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
    .cert-footer { display: none; }

    /* ── Page 2 — Performance Report ───────────────────────────────── */
    .page2 { page-break-before: always; font-family: "NotoLatin", DejaVu Sans, Arial, sans-serif; padding: 36px 48px; color: #1a1a1a; }
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
            <table class="top-mark">
                <tr>
                    <td class="logo-cell">
                        <div class="brand-mark">@include('pdf.partials.logo', ['w' => 58])</div>
                    </td>
                    <td class="arabic-cell">
                        <div class="bismillah">ﻢﻴﺣﺮﻟﺍ ﻦﻤﺣﺮﻟﺍ ﷲ ﻢﺴﺑ</div>
                        <div class="hadith">ﻪﻤﻠﻋﻭ ﻥﺁﺮﻘﻟﺍ ﻢﻠﻌﺗ ﻦﻣ ﻢﻛﺮﻴﺧ</div>
                    </td>
                    <td class="code-cell">
                        Certificate No.<br>
                        <strong>{{ $certificate_id ?? 'IMS-0000-0000' }}</strong>
                    </td>
                </tr>
            </table>

            <div class="divider"><span>◇ ✦ ◇</span></div>

            <div class="doc-type">Certificate of Completion</div>
            <div class="program-title">{{ $program_name }}</div>
            <div class="issuer">Certified by Jimma University Muslim Students Jema</div>

            <div class="recipient-label">Presented To</div>
            <div class="recipient-name">{{ $student->name }}</div>
            <p class="completion-copy">
                For completing the structured Qur'an revision program with recorded participation,
                consistency, and performance during the official program period.
            </p>

            <table class="meta-grid">
                <tr>
                    <td>
                        <span class="meta-label">Program Period</span>
                        <span class="meta-value">{{ $start }} - {{ $end }}</span>
                    </td>
                    <td>
                        <span class="meta-label">Issued</span>
                        <span class="meta-value">{{ $generated }}</span>
                    </td>
                    <td>
                        <span class="meta-label">Halqa</span>
                        <span class="meta-value">{{ $halqa ?? 'Unassigned' }}</span>
                    </td>
                    <td>
                        <span class="meta-label">Student ID</span>
                        <span class="meta-value">{{ $student->student_id }}</span>
                    </td>
                </tr>
            </table>

            <table class="statement-row">
                <tr>
                    <td class="amharic">
                        <span class="statement-title">የማረጋገጫ መግለጫ</span>
                        ይህ ምስክር ወረቀት ተማሪው/ተማሪዋ የተዘጋጀውን የቁርአን ሙራጃዓ
                        ፕሮግራም በተከታታይ ተሳትፎና በተመዘገበ አፈጻጸም መፈጸሙን ያረጋግጣል።
                    </td>
                    <td>
                        <span class="statement-title">Certification Statement</span>
                        This document certifies that the recipient completed the named Qur'an revision
                        program under recorded attendance, revision, and assessment criteria maintained
                        by the program administration.
                    </td>
                </tr>
            </table>

            @if (!empty($award))
            <div class="award">
                <span class="award-title">Distinction: {{ $award['title'] }} · {{ $award['place_label'] }}</span>
                @if (!empty($award_criteria))
                <span class="award-note">{{ $award_criteria }}</span>
                @endif
            </div>
            @endif

        </div>

        <table class="sign-row"><tr>
            <td class="sign-cell left">
                <span class="sign-line"><span class="sign-name">Certificate No.</span><br>{{ $certificate_id ?? 'IMS-0000-0000' }}</span>
            </td>
            <td class="sign-cell center">
                <span class="sign-line"><span class="sign-name">Issued</span><br>{{ $generated }}</span>
            </td>
            <td class="sign-cell right">
                <span class="sign-line"><span class="sign-name">Irshad Structure</span><br>Program Coordinator</span>
            </td>
        </tr></table>

        <div class="verify-line">
            Verify this certificate at <strong>{{ $verification_url ?? config('app.url') }}</strong>
        </div>

        <div class="cert-footer">Generated {{ $generated }} · Muraja'a Monitor · Jimma University Muslim Students Jema</div>
    </div>
</div>
<!-- ── Page 2: Performance Report ──────────────────────────────────────── -->
<div class="page2">
    <div class="p2-header">
        <div class="p2-title">IRSHAD SUMMER MURAJEAH 1448 — Performance Report</div>
        <div class="p2-sub">Jimma University Muslim Students Jema · {{ $program_name }} · {{ $start }} — {{ $end }} · {{ $certificate_id ?? '' }}</div>
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
        This report was automatically generated by Muraja'a Monitor on {{ $generated }} and reflects all recorded data for this student during the program period. Certificate No. {{ $certificate_id ?? '—' }}.
    </div>
</div>
</body>
</html>
