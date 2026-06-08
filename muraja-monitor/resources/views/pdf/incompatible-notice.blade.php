<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, Arial, sans-serif; background: #fff; font-size: 11px; color: #1a1a1a; }

h1  { font-size: 15px; font-weight: bold; text-align: center; margin-bottom: 3px; color: #1a1a1a; }
h2  { font-size: 12px; font-weight: bold; margin: 14px 0 6px; color: #1a1a1a; }
.subtitle { text-align: center; color: #6b7280; font-size: 9px; margin-bottom: 14px; }

.notice {
    background: #fef3c7; border: 1px solid #d97706;
    border-left: 4px solid #d97706;
    padding: 9px 12px; border-radius: 3px;
    margin-bottom: 16px; font-size: 10px; color: #78350f; line-height: 1.6;
}
.notice strong { color: #92400e; }

.instruction {
    background: #eff6ff; border: 1px solid #93c5fd;
    border-left: 4px solid #3b82f6;
    padding: 9px 12px; border-radius: 3px;
    margin-bottom: 16px; font-size: 10px; color: #1e3a5f; line-height: 1.7;
}
.instruction ol { margin: 6px 0 0 16px; }
.instruction li { margin-bottom: 3px; }

table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
thead tr { background: #1e3a5f; color: #fff; }
thead th { padding: 6px 8px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
tbody tr:nth-child(even) { background: #f8fafc; }
tbody tr { border-bottom: 1px solid #e5e7eb; }
tbody td { padding: 6px 8px; font-size: 10px; vertical-align: middle; }

.slot { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 1px 5px; border-radius: 3px; font-size: 8px; margin: 1px 1px 0 0; }
.badge { display: inline-block; background: #e5e7eb; padding: 1px 6px; border-radius: 3px; font-size: 9px; }
.level { display: inline-block; background: #d1fae5; color: #065f46; padding: 1px 6px; border-radius: 3px; font-size: 9px; }

.footer { margin-top: 18px; text-align: center; font-size: 8px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style>
</head>
<body>

<h1>Muraja'a Monitor — Incompatible Students Notice</h1>
<p class="subtitle">Jimma University MSU · Summer Revision Program · Generated {{ now()->format('d M Y, H:i') }}</p>

<div class="notice">
    ⚠ <strong>Action required — {{ count($students) }} student(s) could not be paired automatically.</strong><br>
    The pairing algorithm could not find a compatible partner for the students listed below because their
    available days, prayer-time slots, memorisation level, and/or current juz do not overlap with any
    other unassigned student. They have <strong>not</strong> been assigned a partner yet.
</div>

<div class="instruction">
    <strong>What to do:</strong>
    <ol>
        <li>Share this notice with the relevant halqa leaders or directly with the students listed.</li>
        <li>Ask students to <strong>discuss with classmates</strong> and agree on a compatible partner.</li>
        <li>Each student should log in to the system and update their <strong>available days</strong> and
            <strong>preferred prayer times</strong> so they overlap with at least one other student.</li>
        <li>Once settings are updated, re-run the pairing from the Admin → Pairing page.</li>
        <li>Alternatively, the admin can create a pair manually from Admin → Pairs → Create Pair.</li>
    </ol>
</div>

<h2>Students Without a Compatible Partner ({{ count($students) }})</h2>

<table>
    <thead>
        <tr>
            <th>#</th>
            <th>Full Name</th>
            <th>Student ID</th>
            <th>Memo Level</th>
            <th>Current Juz</th>
            <th>Available Days</th>
            <th>Preferred Times</th>
        </tr>
    </thead>
    <tbody>
        @php
            $dayLabels  = ['sunday'=>'Sun','monday'=>'Mon','tuesday'=>'Tue','wednesday'=>'Wed','thursday'=>'Thu','friday'=>'Fri','saturday'=>'Sat'];
            $timeLabels = ['after_subhi'=>'Fajr','after_zuhr'=>'Dhuhr','after_asr'=>'Asr','after_maghrib'=>'Maghrib','after_isha'=>'Isha'];
            $memoLabels = ['less_than_1'=>'< 1 Juz','1_5'=>'1–5 Juz','6_10'=>'6–10 Juz','11_20'=>'11–20 Juz','21_29'=>'21–29 Juz','full_hifz'=>'Full Hifz'];
        @endphp
        @foreach($students as $i => $s)
        <tr>
            <td>{{ $i + 1 }}</td>
            <td><strong>{{ $s['name'] ?? $s->name ?? '—' }}</strong></td>
            <td><span class="badge">{{ $s['student_id'] ?? $s->student_id ?? '—' }}</span></td>
            <td><span class="level">{{ $memoLabels[$s['memo_level'] ?? $s->memo_level ?? ''] ?? '—' }}</span></td>
            <td>Juz {{ $s['current_juz'] ?? $s->current_juz ?? '—' }}</td>
            <td>
                @foreach($s['available_days'] ?? $s->available_days ?? [] as $d)
                    <span class="slot">{{ $dayLabels[$d] ?? $d }}</span>
                @endforeach
                @if(empty($s['available_days'] ?? $s->available_days ?? []))—@endif
            </td>
            <td>
                @foreach($s['available_times'] ?? $s->available_times ?? [] as $t)
                    <span class="slot">{{ $timeLabels[$t] ?? $t }}</span>
                @endforeach
                @if(empty($s['available_times'] ?? $s->available_times ?? []))—@endif
            </td>
        </tr>
        @endforeach
    </tbody>
</table>

<p class="footer">
    Muraja'a Monitor · Jimma University MSU · Printed {{ now()->format('d M Y') }} ·
    Students should log in at the system URL and update their profile to resolve this.
</p>
</body>
</html>
