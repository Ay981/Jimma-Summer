<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: DejaVu Sans, Arial, sans-serif; font-size:10px; color:#1a1a1a; background:#fff; }
h1  { font-size:15px; font-weight:bold; text-align:center; color:#1a3a2a; margin-bottom:2px; }
h2  { font-size:11px; font-weight:bold; margin:14px 0 5px; color:#1a3a2a; border-bottom:1px solid #d1fae5; padding-bottom:2px; }
.subtitle { text-align:center; color:#6b7280; font-size:8.5px; margin-bottom:14px; }
table { width:100%; border-collapse:collapse; margin-bottom:10px; }
thead tr { background:#1a3a2a; color:#fff; }
thead th { padding:5px 7px; text-align:left; font-size:8px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; }
tbody tr:nth-child(even) { background:#f3f4f6; }
tbody tr { border-bottom:1px solid #e5e7eb; }
tbody td { padding:5px 7px; font-size:9.5px; vertical-align:middle; }
.pos { color:#059669; font-weight:700; }
.neg { color:#dc2626; font-weight:700; }
.zero{ color:#6b7280; }
.nudge { background:#fef3c7; color:#92400e; padding:1px 6px; border-radius:3px; font-size:8px; font-weight:600; }
.excuse { background:#dbeafe; color:#1e40af; padding:1px 6px; border-radius:3px; font-size:8px; font-weight:600; }
.footer { margin-top:16px; text-align:center; font-size:8px; color:#9ca3af; border-top:1px solid #e5e7eb; padding-top:7px; }
</style>
</head>
<body>

<h1>{{ $program_name }} — {{ $halqa_name }} Weekly Report</h1>
<p class="subtitle">Leader: {{ $leader_name }} · Week of {{ $week_start }} – {{ $week_end }} · Generated {{ now()->format('d M Y, H:i') }}</p>

<h2>Student Submissions</h2>
<table>
    <thead><tr><th>Name</th><th>This Week</th><th>Last Week</th><th>Δ</th><th>Pages</th><th>Streak</th></tr></thead>
    <tbody>
        @foreach($students as $s)
        @php $delta = $s['this_week'] - $s['last_week']; @endphp
        <tr>
            <td><strong>{{ $s['name'] }}</strong></td>
            <td>{{ $s['this_week'] }}</td>
            <td>{{ $s['last_week'] }}</td>
            <td class="{{ $delta > 0 ? 'pos' : ($delta < 0 ? 'neg' : 'zero') }}">{{ $delta > 0 ? '+' : '' }}{{ $delta }}</td>
            <td>{{ number_format($s['pages']) }}</td>
            <td>{{ $s['streak'] }}d</td>
        </tr>
        @endforeach
    </tbody>
</table>

<h2>Pair Activity</h2>
<table>
    <thead><tr><th>Student A</th><th>Student B</th><th>A Submitted</th><th>B Submitted</th></tr></thead>
    <tbody>
        @foreach($pairs as $p)
        <tr>
            <td>{{ $p['student_a'] }}</td>
            <td>{{ $p['student_b'] }}</td>
            <td>{{ $p['a_submitted'] }}</td>
            <td>{{ $p['b_submitted'] ?? '—' }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<p class="footer">{{ $program_name }} · {{ $halqa_name }} · Week {{ $week_start }} – {{ $week_end }}</p>
</body>
</html>
