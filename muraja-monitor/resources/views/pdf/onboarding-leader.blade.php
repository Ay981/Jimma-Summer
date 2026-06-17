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
                ['Dashboard — halqa overview, stat cards, and pair/student tabs'],
                ['Pair Detail — heatmap, submission history, tests, and contact log'],
                ['Absence Queue — follow up on pairs who missed yesterday'],
                ['Meetings — log meetings, attendance, and action items'],
                ['Weekly Report — submission stats and pair activity summary'],
                ['Announcements — post to your halqa and read admin messages'],
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
            'desc'  => 'Your dashboard shows today\'s submission count, four stat cards (On Track / Slipping / At Risk / Inactive), and a summary info panel. Switch between Overview, Pairs, and Students tabs using the URL — add ?view=pairs or ?view=students. The Overview tab gives a quick pulse; use Pairs and Students tabs to search, filter by status, and sort by consistency or last seen. Use the "Export PDF" and "Log Meeting" shortcuts in the header for quick access.',
            'callouts' => [
                'Stat cards — on-track, slipping, at-risk, and inactive pair counts',
                'Summary panel — submitted today, attention pairs, yesterday\'s absences, overdue follow-ups',
                'Broadcast button — post an announcement to all students in one tap',
                'Export PDF / Log Meeting — quick-access shortcuts in the header',
            ],
        ],
        [
            'num'   => 2,
            'file'  => 'leader-pair-detail',
            'title' => 'Pair Detail',
            'desc'  => 'Tap any pair from the dashboard to open their detail view. Each student has a 30-day activity heatmap and six tabs: History (submission log with flag/verify controls), Tests (record and review muraja\'a tests scored 0–10), Contact Log (calls, messages, in-person notes with snooze and escalate), Excuses (pending and fulfilled absences), Notes (private leader note), and Info (last login + notification delivery log). Use the Watchlist button to flag a student for extra attention, and Reset pwd to generate a new temporary password.',
            'callouts' => [
                'Heatmap — 30-day submission activity at a glance',
                'History tab — flag suspicious submissions; verify or reject flagged ones',
                'Tests tab — record a test with juz range, page range, and score out of 10',
                'Contact tab — log follow-ups; escalate to admin if the issue needs action',
                'Watchlist / Reset pwd — extra monitoring and credential reset',
                'Request Pair Change — submit a change request to admin from the Contact tab',
            ],
        ],
        [
            'num'   => 3,
            'file'  => 'leader-outreach',
            'title' => 'Absence Follow-up',
            'desc'  => 'The absence queue appears automatically on the Pairs or Students tab (add ?view=pairs to the dashboard URL) when pairs missed yesterday\'s session. Each entry shows which student(s) are still missing and lets you add a note or mark it as done after you follow up. "Notify all absent pairs" broadcasts a reminder to every pair in the queue at once. A follow-up queue below it surfaces any overdue items from previous contact logs.',
            'callouts' => [
                'Absence queue — pairs who missed yesterday, ordered by priority',
                'Note button — record a quick follow-up note before marking done',
                'Done button — mark the pair as followed up; entry disappears from the queue',
                'Notify all button — send a broadcast reminder to every absent pair',
            ],
        ],
        [
            'num'   => 4,
            'file'  => 'leader-meetings',
            'title' => 'Meeting Log',
            'desc'  => 'Keep a structured record of your halqa meetings. Click "+ Log Meeting" to open the form: pick a date and optional time, build an agenda (suggested items auto-populate for at-risk students), record attendance (Present / Absent / Excused per student), assign action items with due dates, and add general notes, highlights, and concerns. Save as a Draft to come back later, or Finalise to lock it. Open action items from past meetings surface at the top of the page so nothing slips through.',
            'callouts' => [
                'Open Action Items — overdue tasks from previous meetings shown at the top',
                'Log Meeting button — opens the new meeting form',
                'Agenda builder — type items manually or add suggested at-risk students',
                'Attendance register — mark each student Present, Absent, or Excused',
                'Action items — assign tasks with due dates; resolve them from the list',
                'Draft vs Finalise — drafts are editable; finalised meetings are locked',
            ],
        ],
        [
            'num'   => 5,
            'file'  => 'leader-weekly-report',
            'title' => 'Weekly Report',
            'desc'  => 'The weekly report summarises your halqa\'s activity for the current Sunday–Saturday week. Three summary pills show total members, how many submitted this week, and how many missed without an excuse. The "Students to Contact" list highlights anyone with zero submissions and no pending excuse. The full student table shows this-week vs last-week submission counts, the delta, total pages revised, and current streak. The Pair Activity table shows how many days each pair submitted jointly. Download a formatted PDF with the button in the header.',
            'callouts' => [
                'Summary pills — total members, submitted this week, and missed without excuse',
                'Students to Contact — zero-submission students who need a nudge this week',
                'Student table — this week vs last week, delta, pages, and streak per student',
                'Pair Activity table — joint submission days and individual counts per pair',
                'Download PDF — export the report as a formatted PDF for your records',
            ],
        ],
        [
            'num'   => 6,
            'file'  => 'leader-announcements',
            'title' => 'Announcements',
            'desc'  => 'The Announcements page is your halqa noticeboard. Use "Post to my halqa" to write a title and body — all students in your halqa receive an in-app notification when you post. Admin announcements broadcast to all leaders appear here too, marked with a different accent colour. Dismiss announcements you have read to keep the list tidy; use "Clear all dismissed" to restore hidden items. Delete your own posts if they are no longer relevant.',
            'callouts' => [
                'Post to my halqa — expand the form to write a title and body',
                'Post & Notify Students — sends an in-app notification to every student in your halqa',
                'Admin announcements — messages from admin appear here with a blue accent',
                'Dismiss — hides an announcement locally; does not delete it',
                'Delete — permanently removes your own posts',
            ],
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
