<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Leader Onboarding Guide — Muraja Monitor</title>
<style>
    @page { margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 11px; color: #1a1a1a; }

    .page { page-break-after: always; padding: 0 0 40px; position: relative; min-height: 100vh; }
    .page:last-child { page-break-after: avoid; }

    .geo-header {
        height: 14px; background-color: #1a3a2a;
        background-image:
            repeating-linear-gradient(45deg, rgba(201,162,39,0) 0 6px, rgba(201,162,39,0.45) 6px 7px),
            repeating-linear-gradient(-45deg, rgba(201,162,39,0) 0 6px, rgba(201,162,39,0.45) 6px 7px);
    }

    .content { padding: 22px 30px; }

    .footer {
        position: fixed; bottom: 0; left: 0; right: 0;
        padding: 8px 30px; font-size: 8.5px; color: #9b9b9b;
        border-top: 1px solid #e0eae5; background: #fff;
        display: flex; justify-content: space-between;
    }

    /* Cover */
    .cover { text-align: center; padding-top: 80px; }
    .cover .org { font-size: 11px; font-weight: bold; color: #2d6a4f; letter-spacing: 0.14em; text-transform: uppercase; margin: 18px 0 10px; }
    .cover h1 { font-size: 26px; color: #1a3a2a; letter-spacing: 0.02em; margin-bottom: 6px; }
    .cover .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 40px; }

    .toc { margin: 0 auto; max-width: 380px; background: #f0f5f2; border: 1px solid #c6d9cf; border-radius: 6px; padding: 18px 24px; text-align: left; }
    .toc h3 { font-size: 10px; font-weight: bold; color: #2d6a4f; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
    .toc-item { display: flex; align-items: center; gap: 10px; padding: 5px 0; border-bottom: 1px dotted #c6d9cf; font-size: 10px; color: #1a3a2a; }
    .toc-item:last-child { border-bottom: none; }
    .step-badge { display: inline-block; background: #1a3a2a; color: #fff; font-size: 9px; font-weight: bold; border-radius: 50%; width: 18px; height: 18px; text-align: center; line-height: 18px; flex-shrink: 0; }

    /* Screenshot page */
    .step-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
    .step-num { background: #1a3a2a; color: #fff; font-size: 11px; font-weight: bold; border-radius: 50%; width: 24px; height: 24px; text-align: center; line-height: 24px; flex-shrink: 0; }
    .step-title { font-size: 15px; font-weight: bold; color: #1a3a2a; }
    .step-desc { font-size: 10px; color: #4b5563; margin-bottom: 14px; line-height: 1.5; }

    .screenshot { width: 100%; border: 1px solid #dde5e0; border-radius: 4px; }
    .placeholder { width: 100%; background: #f0f5f2; border: 2px dashed #c6d9cf; border-radius: 4px; padding: 30px; text-align: center; color: #6b7280; font-size: 10px; }

    .callouts { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px 14px; }
    .callout { display: flex; align-items: center; gap: 5px; font-size: 9px; color: #1a1a1a; }
    .callout-num { display: inline-block; background: #e84c3d; color: #fff; font-size: 8px; font-weight: bold; border-radius: 50%; width: 15px; height: 15px; text-align: center; line-height: 15px; flex-shrink: 0; }
</style>
</head>
<body>

{{-- ── Cover ──────────────────────────────────────────────────────────── --}}
<div class="page">
    <div class="geo-header"></div>
    <div class="content cover">
        @include('pdf.partials.logo', ['w' => 80])
        <div class="org">Muraja'ah Summer Program</div>
        <h1>Leader Onboarding Guide</h1>
        <div class="subtitle">A step-by-step visual guide for halqa leaders</div>

        <div class="toc">
            <h3>Contents</h3>
            @foreach ([
                ['Dashboard — halqa pulse, pair list, and summary stats'],
                ['Pair detail — student heatmap, contact log, and flagging'],
                ['Absence queue — follow up on missed sessions'],
                ['Meetings — log meetings and track action items'],
            ] as $i => $item)
            <div class="toc-item">
                <span class="step-badge">{{ $i + 1 }}</span>
                <span>{{ $item[0] }}</span>
            </div>
            @endforeach
        </div>
    </div>
    <div class="footer">
        <span>Muraja Monitor · Leader Onboarding Guide</span>
        <span>Confidential — for leaders only</span>
    </div>
</div>

{{-- ── Screenshot pages ────────────────────────────────────────────────── --}}
@php
    $screens = [
        [
            'num'   => 1,
            'file'  => 'leader-dashboard',
            'title' => 'Dashboard Overview',
            'desc'  => 'Your dashboard shows the halqa pulse score (today\'s submission rate), a breakdown of pair statuses, and a list of all pairs with their consistency sparklines.',
            'callouts' => ['Pulse meter — real-time halqa health score', 'Summary pills — on-track, slipping, at-risk, and inactive counts', 'Pair list — click any pair to open the detail view'],
        ],
        [
            'num'   => 2,
            'file'  => 'leader-pair-detail',
            'title' => 'Pair Detail',
            'desc'  => 'Tap any pair from the dashboard to open their detail panel. You can review their 30-day heatmap, log contact notes, and flag suspicious submissions for review.',
            'callouts' => ['Student heatmap — 30-day submission activity', 'Contact log — record calls, messages, or in-person follow-ups', 'Flag button — mark a submission for admin review'],
        ],
        [
            'num'   => 3,
            'file'  => 'leader-outreach',
            'title' => 'Absence Follow-up',
            'desc'  => 'The absence queue appears when pairs missed yesterday\'s session. Use the Done button after reaching out, or tap "Notify all" to broadcast a reminder in one click.',
            'callouts' => ['Absence queue — pairs who missed yesterday, ordered by priority'],
        ],
        [
            'num'   => 4,
            'file'  => 'leader-meetings',
            'title' => 'Meeting Log',
            'desc'  => 'Keep a structured record of your halqa meetings. Log meeting notes, assign action items, and track which items are still open. Open action items from past meetings surface at the top.',
            'callouts' => ['Log Meeting button — open the new meeting form', 'Action items list — open tasks from previous meetings'],
        ],
    ];
@endphp

@foreach ($screens as $screen)
<div class="page">
    <div class="geo-header"></div>
    <div class="content">
        <div class="step-header">
            <div class="step-num">{{ $screen['num'] }}</div>
            <div class="step-title">{{ $screen['title'] }}</div>
        </div>
        <div class="step-desc">{{ $screen['desc'] }}</div>

        @php
            $imgPath = storage_path('app/private/onboarding/' . $screen['file'] . '.jpg');
            $hasImg  = file_exists($imgPath);
        @endphp

        @if ($hasImg)
            @php $b64 = base64_encode(file_get_contents($imgPath)); @endphp
            <img class="screenshot" src="data:image/jpeg;base64,{{ $b64 }}" alt="{{ $screen['title'] }}">
        @else
            <div class="placeholder">
                Screenshot not available yet.<br>
                Run: <strong>php artisan onboarding:capture</strong>
            </div>
        @endif

        <div class="callouts">
            @foreach ($screen['callouts'] as $ci => $text)
            <div class="callout">
                <span class="callout-num">{{ $ci + 1 }}</span>
                <span>{{ $text }}</span>
            </div>
            @endforeach
        </div>
    </div>
    <div class="footer">
        <span>Muraja Monitor · Leader Onboarding Guide</span>
        <span>Step {{ $screen['num'] }} of {{ count($screens) }}</span>
    </div>
</div>
@endforeach

</body>
</html>
