<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 10px; color: #1a1a1a; background: #fff; }

h1  { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 3px; color: #1a3a2a; }
h2  { font-size: 12px; font-weight: bold; margin: 18px 0 6px; color: #1a3a2a; border-bottom: 1px solid #d1fae5; padding-bottom: 3px; }
.subtitle { text-align: center; color: #6b7280; font-size: 9px; margin-bottom: 16px; }

table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
thead tr { background: #1a3a2a; color: #fff; }
thead th { padding: 6px 8px; text-align: left; font-size: 8.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
tbody tr:nth-child(even) { background: #f3f4f6; }
tbody tr { border-bottom: 1px solid #e5e7eb; }
tbody td { padding: 5px 8px; font-size: 9.5px; vertical-align: middle; }

.medal { font-size: 13px; }
.badge { display: inline-block; background: #e5e7eb; padding: 1px 6px; border-radius: 3px; font-size: 8px; }
.highlight { background: #d1fae5 !important; }
.award-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 8px 12px; margin-bottom: 8px; }
.award-box strong { color: #065f46; }

.footer { margin-top: 20px; text-align: center; font-size: 8px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 8px; }
</style>
</head>
<body>

<h1>{{ $snapshot->program_name }}</h1>
<p class="subtitle">Final Program Report · Ended {{ \Carbon\Carbon::parse($snapshot->ended_at)->format('d F Y') }} · Generated {{ now()->format('d M Y') }}</p>

@php
    $data     = $snapshot->snapshot_data;
    $students = $data['students'] ?? [];
    $pairs    = $data['pairs']    ?? [];
    $awards   = $data['awards']   ?? [];
    $medals   = [1 => '🥇', 2 => '🥈', 3 => '🥉'];
@endphp

{{-- Awards --}}
<h2>Awards</h2>
@if(!empty($awards['most_consistent_students']))
<div class="award-box">
    <strong>Most Consistent Students:</strong>
    {{ collect($awards['most_consistent_students'])->pluck('name')->implode(', ') }}
</div>
@endif
@if(!empty($awards['longest_streak']))
<div class="award-box">
    <strong>Longest Streak:</strong> {{ $awards['longest_streak']['name'] }} — {{ $awards['longest_streak']['streak'] }} days
</div>
@endif
@if(!empty($awards['most_pages']))
<div class="award-box">
    <strong>Most Pages:</strong> {{ $awards['most_pages']['name'] }} — {{ number_format($awards['most_pages']['pages']) }} pages
</div>
@endif
@if(!empty($awards['most_consistent_pair']))
<div class="award-box">
    <strong>Best Pair:</strong> {{ $awards['most_consistent_pair']['student_a'] }} &amp; {{ $awards['most_consistent_pair']['student_b'] }}
    — {{ $awards['most_consistent_pair']['consistency'] }}% consistency
</div>
@endif

{{-- Student leaderboard --}}
<h2>Student Rankings ({{ count($students) }})</h2>
<table>
    <thead>
        <tr>
            <th>#</th><th>Name</th><th>Halqa</th>
            <th>Consistency</th><th>Streak</th><th>Pages</th><th>Minutes</th><th>Badges</th>
        </tr>
    </thead>
    <tbody>
        @foreach($students as $s)
        <tr class="{{ $s['rank'] <= 3 ? 'highlight' : '' }}">
            <td><span class="medal">{{ $medals[$s['rank']] ?? $s['rank'] }}</span></td>
            <td><strong>{{ $s['name'] }}</strong><br><span class="badge">{{ $s['student_id'] }}</span></td>
            <td>{{ $s['halqa'] }}</td>
            <td>{{ $s['consistency'] }}%</td>
            <td>{{ $s['streak'] }}d</td>
            <td>{{ number_format($s['pages']) }}</td>
            <td>{{ number_format($s['minutes']) }}</td>
            <td>{{ $s['badges'] }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

{{-- Pair leaderboard --}}
@if(!empty($pairs))
<h2>Pair Rankings ({{ count($pairs) }})</h2>
<table>
    <thead>
        <tr><th>#</th><th>Pair</th><th>Halqa</th><th>Consistency</th><th>Pages</th><th>Minutes</th></tr>
    </thead>
    <tbody>
        @foreach($pairs as $p)
        <tr class="{{ $p['rank'] <= 3 ? 'highlight' : '' }}">
            <td><span class="medal">{{ $medals[$p['rank']] ?? $p['rank'] }}</span></td>
            <td>{{ $p['student_a'] }} &amp; {{ $p['student_b'] }}</td>
            <td>{{ $p['halqa'] }}</td>
            <td>{{ $p['consistency'] }}%</td>
            <td>{{ number_format($p['pages']) }}</td>
            <td>{{ number_format($p['minutes']) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>
@endif

<p class="footer">Muraja'a Monitor · {{ $snapshot->program_name }} · Archived {{ \Carbon\Carbon::parse($snapshot->ended_at)->format('d M Y') }}</p>
</body>
</html>
