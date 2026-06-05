<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminNote;
use App\Models\AuditLog;
use App\Models\Badge;
use App\Models\ContactLog;
use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use App\Models\Watchlist;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    // ── List ─────────────────────────────────────────────────────────────────

    public function index(): Response
    {
        $today        = Carbon::today();
        $programStart = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $window14     = $today->copy()->subDays(13);
        $effStart     = $programStart->gt($window14) ? $programStart->copy() : $window14->copy();
        $effDays      = max(1, $effStart->diffInDays($today) + 1);

        $students = User::where('role', 'student')
            ->with(['halqa', 'watchlistEntries' => fn ($q) => $q->whereNull('resolved_at')])
            ->orderBy('name')
            ->get();

        $ids = $students->pluck('id');

        // Bulk: all submissions in last 14 days
        $subs14 = PairSubmission::whereIn('subject_student_id', $ids)
            ->whereBetween('submission_date', [$window14->toDateString(), $today->toDateString()])
            ->get(['subject_student_id', 'submission_date'])
            ->groupBy('subject_student_id');

        // Bulk: submissions in last 60 days (for streak)
        $subs60 = PairSubmission::whereIn('subject_student_id', $ids)
            ->where('submission_date', '>=', $today->copy()->subDays(59)->toDateString())
            ->orderByDesc('submission_date')
            ->get(['subject_student_id', 'submission_date'])
            ->groupBy('subject_student_id');

        // Bulk: last submission date
        $lastSubDates = PairSubmission::whereIn('subject_student_id', $ids)
            ->selectRaw('subject_student_id, MAX(submission_date::text) as last_sub')
            ->groupBy('subject_student_id')
            ->pluck('last_sub', 'subject_student_id');

        // Bulk: total pages
        $totalPages = PairSubmission::whereIn('subject_student_id', $ids)
            ->selectRaw('subject_student_id, COALESCE(SUM(page_to - page_from + 1), 0) as pages')
            ->groupBy('subject_student_id')
            ->pluck('pages', 'subject_student_id');

        // Bulk: partner map
        $allPairs = Pair::whereIn('student_a_id', $ids)->orWhereIn('student_b_id', $ids)
            ->with(['studentA:id,name', 'studentB:id,name'])->get();
        $partnerMap = [];
        foreach ($allPairs as $pair) {
            $partnerMap[$pair->student_a_id] = $pair->studentB?->name;
            if ($pair->student_b_id) $partnerMap[$pair->student_b_id] = $pair->studentA->name;
        }

        $last14Dates = collect(range(13, 0))->map(fn ($i) => $today->copy()->subDays($i)->toDateString());
        $effDates    = collect(range(0, $effDays - 1))->map(fn ($i) => $effStart->copy()->addDays($i)->toDateString());

        $rows = $students->map(function ($student) use (
            $subs14, $subs60, $lastSubDates, $totalPages, $partnerMap,
            $last14Dates, $effDates, $effDays, $today
        ) {
            $s14     = ($subs14[$student->id] ?? collect())->keyBy(fn ($s) => Carbon::parse($s->submission_date)->toDateString());
            $s60     = ($subs60[$student->id] ?? collect())->keyBy(fn ($s) => Carbon::parse($s->submission_date)->toDateString());
            $lastSub = $lastSubDates[$student->id] ?? null;

            $sparkline = $last14Dates->map(fn ($d) => isset($s14[$d]) ? 1 : 0)->values()->toArray();

            $submitted = $effDates->filter(fn ($d) => isset($s14[$d]))->count();
            $cons      = round(($submitted / $effDays) * 100, 1);

            // Streak (simple daily, respects available_times if set)
            $streak  = 0;
            $cursor  = $today->copy();
            for ($i = 0; $i < 60; $i++) {
                $ds = $cursor->toDateString();
                if (isset($s60[$ds])) { $streak++; }
                elseif ($ds < $today->toDateString()) { break; }
                $cursor->subDay();
            }

            $status = $this->status($sparkline, $cons, $lastSub, $effDays);

            return [
                'id'           => $student->id,
                'name'         => $student->name,
                'student_id'   => $student->student_id,
                'halqa'        => $student->halqa?->name ?? '—',
                'partner'      => $partnerMap[$student->id] ?? null,
                'consistency'  => $cons,
                'sparkline'    => $sparkline,
                'streak'       => $streak,
                'pages_total'  => (int) ($totalPages[$student->id] ?? 0),
                'status'       => $status,
                'last_sub'     => $lastSub ? Carbon::parse($lastSub)->toDateString() : null,
                'on_watchlist' => $student->watchlistEntries->count() > 0,
                'is_active'    => $student->is_active,
                'is_monitored' => $student->is_monitored,
            ];
        });

        return Inertia::render('Admin/Students', [
            'students' => $rows->values(),
            'halqas'   => Halqa::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    public function show(User $student): Response
    {
        abort_if($student->role !== 'student', 404);

        $today = Carbon::today();

        // 30-day heatmap
        $last30       = collect(range(29, 0))->map(fn ($i) => $today->copy()->subDays($i)->toDateString());
        $avail        = $student->available_times ?? [];
        $submittedSet = PairSubmission::where('subject_student_id', $student->id)
            ->whereBetween('submission_date', [$last30->first(), $last30->last()])
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        $heatmap = $last30->map(fn ($d) => [
            'date'      => $d,
            'submitted' => in_array($d, $submittedSet),
            'scheduled' => empty($avail) || in_array(strtolower(Carbon::parse($d)->format('l')), $avail, true),
        ])->values()->toArray();

        // Submission history
        $submissions = PairSubmission::where('subject_student_id', $student->id)
            ->with('submitter:id,name')
            ->orderByDesc('submission_date')
            ->get()
            ->map(fn ($s) => [
                'id'              => $s->id,
                'juz'             => $s->juz,
                'page_from'       => $s->page_from,
                'page_to'         => $s->page_to,
                'pages'           => $s->page_to - $s->page_from + 1,
                'minutes_spent'   => $s->minutes_spent,
                'is_edited'       => $s->is_edited,
                'is_flagged'      => $s->is_flagged,
                'flag_verdict'    => $s->flag_verdict,
                'filed_by'        => $s->submitter?->name ?? '—',
                'submission_date' => Carbon::parse($s->submission_date)->toDateString(),
                'submitted_at'    => Carbon::parse($s->submitted_at)->format('H:i'),
            ])->toArray();

        // Full timeline (all events from day 1)
        $timeline = $this->buildTimeline($student);

        // Stats
        $totalPages = PairSubmission::where('subject_student_id', $student->id)
            ->selectRaw('COALESCE(SUM(page_to - page_from + 1), 0) as pages')->value('pages') ?? 0;

        // Admin note
        $adminNote = AdminNote::where('student_id', $student->id)
            ->where('admin_id', auth()->id())
            ->value('note') ?? '';

        // Partner / pair
        $pair    = Pair::where(fn ($q) => $q->where('student_a_id', $student->id)->orWhere('student_b_id', $student->id))->first();
        $partner = null;
        if ($pair) {
            $partner = $pair->student_a_id === $student->id ? $pair->studentB : $pair->studentA;
        }

        $onWatchlist = Watchlist::where('student_id', $student->id)->whereNull('resolved_at')->exists();
        $badges      = Badge::where('user_id', $student->id)->get()->map(fn ($b) => ['type' => $b->badge_type, 'earned_at' => $b->earned_at->toDateString()]);

        return Inertia::render('Admin/StudentDetail', [
            'student' => [
                'id'           => $student->id,
                'name'         => $student->name,
                'student_id'   => $student->student_id,
                'phone'        => $student->phone,
                'role'         => $student->role,
                'is_active'    => $student->is_active,
                'is_monitored' => $student->is_monitored,
                'halqa'        => $student->halqa?->name ?? '—',
                'halqa_id'     => $student->halqa_id,
                'current_juz'  => $student->current_juz,
                'available_times' => $student->available_times ?? [],
                'partner'      => $partner ? ['id' => $partner->id, 'name' => $partner->name] : null,
                'on_watchlist' => $onWatchlist,
                'pages_total'  => (int) $totalPages,
                'badges'       => $badges,
                'admin_note'   => $adminNote,
            ],
            'heatmap'     => $heatmap,
            'submissions' => $submissions,
            'timeline'    => $timeline,
            'halqas'      => Halqa::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    // ── Create individual ─────────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'student_id'      => ['required', 'string', 'max:50', 'unique:users,student_id', 'regex:/^JUMU-\d{4}-\d{3}$/'],
            'phone'           => ['nullable', 'string', 'max:20'],
            'current_juz'     => ['required', 'integer', 'min:1', 'max:30'],
            'available_times' => ['required', 'array', 'min:1'],
            'available_times.*'=> ['in:after_subhi,after_zuhr,after_asr,after_maghrib,after_isha'],
            'halqa_id'        => ['nullable', 'exists:halqas,id'],
        ]);

        User::create([
            'name'                 => $request->name,
            'student_id'           => $request->student_id,
            'phone'                => $request->phone,
            'password'             => Hash::make('Muraja@1446'),
            'role'                 => 'student',
            'halqa_id'             => $request->halqa_id,
            'current_juz'          => $request->current_juz,
            'available_times'      => $request->available_times,
            'is_active'            => true,
            'must_change_password' => true,
        ]);

        return redirect()->route('admin.students')->with('success', 'Student created.');
    }

    // ── Bulk CSV import ───────────────────────────────────────────────────────

    public function import(Request $request): RedirectResponse
    {
        $request->validate(['csv' => ['required', 'file', 'mimes:csv,txt', 'max:2048']]);

        $handle   = fopen($request->file('csv')->getPathname(), 'r');
        $rawHeader = fgetcsv($handle);
        $header   = array_map('trim', $rawHeader ?? []);

        $SLOTS = ['subhi' => 'after_subhi', 'zuhr' => 'after_zuhr', 'asr' => 'after_asr',
                  'maghrib' => 'after_maghrib', 'isha' => 'after_isha'];

        $created = 0;
        $failed  = [];
        $line    = 1;

        while (($row = fgetcsv($handle)) !== false) {
            $line++;
            if (count($row) < count($header)) { $failed[] = ['line' => $line, 'reason' => 'Incomplete row', 'data' => implode(',', $row)]; continue; }

            $data = array_combine($header, array_map('trim', $row));

            // Validate required fields
            foreach (['name', 'student_id', 'phone', 'current_juz'] as $field) {
                if (empty($data[$field] ?? '')) {
                    $failed[] = ['line' => $line, 'reason' => "Missing: {$field}", 'data' => $data['student_id'] ?? ''];
                    continue 2;
                }
            }

            // Parse available_times
            $rawSlots = array_filter(array_map('trim', explode(',', $data['available_times'] ?? '')));
            $slots    = array_values(array_filter(array_map(fn ($s) => $SLOTS[strtolower($s)] ?? null, $rawSlots)));
            if (empty($slots)) {
                $failed[] = ['line' => $line, 'reason' => 'No valid available_times', 'data' => $data['student_id']];
                continue;
            }

            // Student ID format
            if (!preg_match('/^JUMU-\d{4}-\d{3}$/', $data['student_id'])) {
                $failed[] = ['line' => $line, 'reason' => 'Invalid student_id format (expected JUMU-YYYY-NNN)', 'data' => $data['student_id']];
                continue;
            }

            // Duplicate check
            if (User::where('student_id', $data['student_id'])->exists()) {
                $failed[] = ['line' => $line, 'reason' => 'student_id already exists', 'data' => $data['student_id']];
                continue;
            }

            // Create student
            $student = User::create([
                'name'                 => $data['name'],
                'student_id'           => $data['student_id'],
                'phone'                => $data['phone'],
                'password'             => Hash::make('Muraja@1446'),
                'role'                 => 'student',
                'current_juz'          => (int) $data['current_juz'],
                'available_times'      => $slots,
                'is_active'            => true,
                'must_change_password' => true,
            ]);
            $created++;

            // Pairing request
            $hasPair = strtolower(trim($data['has_pair_request'] ?? '')) === 'yes';
            if ($hasPair && !empty($data['requested_partner_name'])) {
                \App\Models\PairingRequest::create([
                    'student_id'              => $student->id,
                    'requested_partner_name'  => $data['requested_partner_name'],
                    'requested_partner_phone' => $data['requested_partner_phone'] ?? '',
                ]);
            }
        }

        fclose($handle);

        session()->flash('import_result', ['created' => $created, 'failed' => $failed]);
        return redirect()->route('admin.students')->with('success', "Import done: {$created} created, " . count($failed) . ' skipped.');
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, User $student): RedirectResponse
    {
        abort_if($student->role !== 'student', 404);

        $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'phone'           => ['nullable', 'string', 'max:20'],
            'current_juz'     => ['required', 'integer', 'min:1', 'max:30'],
            'available_times' => ['required', 'array', 'min:1'],
            'available_times.*' => ['in:after_subhi,after_zuhr,after_asr,after_maghrib,after_isha'],
            'halqa_id'        => ['nullable', 'exists:halqas,id'],
        ]);

        $student->update($request->only('name', 'phone', 'current_juz', 'available_times', 'halqa_id'));
        return back()->with('success', 'Student updated.');
    }

    // ── Toggle active ─────────────────────────────────────────────────────────

    public function toggleActive(User $student): RedirectResponse
    {
        abort_if($student->role !== 'student', 404);

        $newState = !$student->is_active;
        $student->update(['is_active' => $newState]);

        // If deactivating — set their pair to solo
        if (!$newState) {
            $pair = Pair::where(fn ($q) => $q->where('student_a_id', $student->id)->orWhere('student_b_id', $student->id))->first();
            $pair?->update(['status' => 'solo']);
        }

        return back()->with('success', $newState ? 'Account reactivated.' : 'Account deactivated. Pair set to solo.');
    }

    // ── Reset password ────────────────────────────────────────────────────────

    public function resetPassword(User $student): RedirectResponse
    {
        abort_if($student->role !== 'student', 404);
        $student->update(['password' => Hash::make('Muraja@1446'), 'must_change_password' => true]);

        AuditLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'admin_password_reset',
            'target_type' => 'user',
            'target_id'   => $student->id,
        ]);

        return back()->with('success', 'Password reset to default.');
    }

    // ── Admin note ────────────────────────────────────────────────────────────

    public function saveNote(Request $request, User $student): RedirectResponse
    {
        abort_if($student->role !== 'student', 404);
        $request->validate(['note' => ['nullable', 'string', 'max:5000']]);

        AdminNote::updateOrCreate(
            ['student_id' => $student->id, 'admin_id' => auth()->id()],
            ['note' => $request->note ?? '']
        );

        return back()->with('success', 'Note saved.');
    }

    // ── Monitoring flag ───────────────────────────────────────────────────────

    public function toggleMonitor(User $student): RedirectResponse
    {
        abort_if($student->role !== 'student', 404);
        $student->update(['is_monitored' => !$student->is_monitored]);
        return back()->with('success', $student->is_monitored ? 'Monitoring flag set.' : 'Monitoring flag removed.');
    }

    // ── Toggle watchlist ──────────────────────────────────────────────────────

    public function toggleWatchlist(User $student): RedirectResponse
    {
        abort_if($student->role !== 'student', 404);

        $entry = Watchlist::where('student_id', $student->id)->whereNull('resolved_at')->first();
        if ($entry) {
            $entry->update(['resolved_at' => now()]);
            return back()->with('success', 'Removed from watchlist.');
        }
        Watchlist::create(['student_id' => $student->id, 'added_by' => auth()->id(), 'added_at' => now()]);
        return back()->with('success', 'Added to watchlist.');
    }

    // ── Compare page ──────────────────────────────────────────────────────────

    public function compare(Request $request): Response
    {
        $ids = array_filter([$request->query('a'), $request->query('b')]);
        $students = User::whereIn('id', $ids)->where('role', 'student')->get();

        return Inertia::render('Admin/StudentCompare', [
            'students' => $students->map(fn ($s) => $this->studentDetailData($s)),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function buildTimeline(User $student): array
    {
        $events = collect();

        // Submissions
        PairSubmission::where('subject_student_id', $student->id)
            ->with('submitter:id,name')
            ->get()
            ->each(fn ($s) => $events->push([
                'type'  => 'submission',
                'date'  => Carbon::parse($s->submitted_at)->toISOString(),
                'label' => "Submitted Juz {$s->juz} · pp. {$s->page_from}–{$s->page_to}",
                'meta'  => ['pages' => $s->page_to - $s->page_from + 1, 'minutes' => $s->minutes_spent,
                            'filed_by' => $s->submitter?->name, 'edited' => $s->is_edited, 'flagged' => $s->is_flagged],
            ]));

        // Audit logs
        AuditLog::where('user_id', $student->id)
            ->orWhere(fn ($q) => $q->where('target_type', 'user')->where('target_id', $student->id))
            ->get()
            ->each(fn ($a) => $events->push([
                'type'  => 'audit',
                'date'  => Carbon::parse($a->created_at)->toISOString(),
                'label' => ucwords(str_replace('_', ' ', $a->action)),
                'meta'  => $a->meta ?? [],
            ]));

        // Contact logs
        ContactLog::where('student_id', $student->id)
            ->with('contactedBy:id,name')
            ->get()
            ->each(fn ($c) => $events->push([
                'type'  => 'contact',
                'date'  => Carbon::parse($c->contacted_at)->toISOString(),
                'label' => "Contacted via {$c->method}" . ($c->note ? ": {$c->note}" : ''),
                'meta'  => ['by' => $c->contactedBy?->name, 'follow_up' => $c->follow_up_required],
            ]));

        // Badges
        Badge::where('user_id', $student->id)
            ->get()
            ->each(fn ($b) => $events->push([
                'type'  => 'badge',
                'date'  => Carbon::parse($b->earned_at)->toISOString(),
                'label' => "Badge earned: " . ucwords(str_replace('_', ' ', $b->badge_type)),
                'meta'  => [],
            ]));

        return $events->sortByDesc('date')->values()->toArray();
    }

    private function studentDetailData(User $student): array
    {
        $today   = Carbon::today();
        $last30  = collect(range(29, 0))->map(fn ($i) => $today->copy()->subDays($i)->toDateString());
        $avail   = $student->available_times ?? [];
        $subDates = PairSubmission::where('subject_student_id', $student->id)
            ->whereBetween('submission_date', [$last30->first(), $last30->last()])
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())->toArray();

        return [
            'id'     => $student->id,
            'name'   => $student->name,
            'halqa'  => $student->halqa?->name ?? '—',
            'heatmap'=> $last30->map(fn ($d) => ['date' => $d, 'submitted' => in_array($d, $subDates),
                'scheduled' => empty($avail) || in_array(strtolower(Carbon::parse($d)->format('l')), $avail, true)])->values()->toArray(),
        ];
    }

    private function status(array $sparkline, float $cons, ?string $lastSub, int $effDays): string
    {
        if (!$lastSub) return $effDays <= 2 ? 'on_track' : 'inactive';
        if (Carbon::parse($lastSub)->diffInDays(Carbon::today()) >= 7) return 'inactive';

        $lookback    = min(count($sparkline), $effDays);
        $consecutive = 0;
        for ($i = count($sparkline) - 1; $i >= count($sparkline) - $lookback; $i--) {
            if ($sparkline[$i] === 0) $consecutive++;
            else break;
        }
        if ($consecutive >= 4 || ($effDays >= 7 && $cons < 40)) return 'at_risk';
        if ($consecutive >= 2) return 'slipping';
        if ($cons >= 70) return 'on_track';
        return 'slipping';
    }
}
