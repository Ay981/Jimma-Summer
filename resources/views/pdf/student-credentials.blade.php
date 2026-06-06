<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: DejaVu Sans, Arial, sans-serif; background: #fff; font-size: 11px; color: #1a1a1a; }

h1 { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 4px; color: #1a3a2a; }
.subtitle { text-align: center; color: #6b7280; font-size: 9px; margin-bottom: 18px; }

table { width: 100%; border-collapse: collapse; }
thead tr { background: #1a3a2a; color: #fff; }
thead th { padding: 7px 8px; text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
tbody tr:nth-child(even) { background: #f3f4f6; }
tbody tr { border-bottom: 1px solid #e5e7eb; }
tbody td { padding: 6px 8px; font-size: 10px; vertical-align: middle; }

.halqa-header { background: #d1fae5; border-left: 3px solid #1a3a2a; padding: 5px 8px; font-weight: 700; font-size: 10px; color: #1a3a2a; }
.badge { display: inline-block; background: #e5e7eb; padding: 1px 6px; border-radius: 3px; font-size: 9px; }

.footer { margin-top: 16px; text-align: center; font-size: 8px; color: #9ca3af; }
.notice { background: #fef3c7; border: 1px solid #d97706; padding: 8px 12px; border-radius: 4px; margin-bottom: 16px; font-size: 9.5px; color: #92400e; }
</style>
</head>
<body>
<h1>Muraja'a Monitor — Student Credentials</h1>
<p class="subtitle">Jimma University MSU · Summer Revision Program · Generated {{ now()->format('d M Y') }}</p>

<div class="notice">
    ⚠ Distribute these slips <strong>privately</strong>. Each student must log in and change their password immediately.
    Default password applies only to students who have not yet logged in.
</div>

<table>
    <thead>
        <tr>
            <th>#</th>
            <th>Full Name</th>
            <th>Login ID</th>
            <th>Default Password</th>
            <th>Halqa</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        @php $prev = null; $n = 0; @endphp
        @foreach($students as $s)
            @if($s->halqa?->name !== $prev)
                <tr>
                    <td colspan="6" class="halqa-header">{{ $s->halqa?->name ?? '— No Halqa —' }}</td>
                </tr>
                @php $prev = $s->halqa?->name; @endphp
            @endif
            @php $n++; @endphp
            <tr>
                <td>{{ $n }}</td>
                <td><strong>{{ $s->name }}</strong></td>
                <td><span class="badge">{{ $s->student_id }}</span></td>
                <td>{{ $s->must_change_password ? 'Muraja@1446' : '(changed)' }}</td>
                <td>{{ $s->halqa?->name ?? '—' }}</td>
                <td>{{ $s->must_change_password ? 'First login' : 'Active' }}</td>
            </tr>
        @endforeach
    </tbody>
</table>

<p class="footer">Total: {{ $students->count() }} students · Login at http://localhost:8000/login</p>
</body>
</html>
