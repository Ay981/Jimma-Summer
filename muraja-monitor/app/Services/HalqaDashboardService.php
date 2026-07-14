<?php

namespace App\Services;

use App\Models\ContactLog;
use App\Models\Halqa;
use App\Models\MeetingActionItem;
use App\Models\MissedSubmissionExcuse;
use App\Models\MurajaTest;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\PrivateNote;
use App\Models\ProgramSetting;
use App\Models\User;
use App\Models\Watchlist;
use Carbon\Carbon;

class HalqaDashboardService
{
    public function __construct(private ConsistencyService $cs) {}

    /**
     * Build the leader-dashboard Inertia props for a halqa.
     *
     * $viewerLeader scopes the snoozed-contacts follow-up query (contacted_by).
     * Pass the authenticated leader for the leader view, or the halqa's own
     * leader for the admin read-only view. Null → that query is skipped.
     */
    public function dashboardProps(Halqa $halqa, ?User $viewerLeader): array
    {
        $today        = Carbon::today();
        $yesterday    = Carbon::yesterday();
        $programStartRaw = ProgramSetting::get('program_start_date', '');
        $programStart    = $programStartRaw ? Carbon::parse($programStartRaw) : $today->copy();

        // Programme hasn't started (or no start date configured) — return neutral state
        if (!$programStartRaw || $today->toDateString() < $programStart->toDateString()) {
            return [
                'halqa'          => ['id' => $halqa->id, 'name' => $halqa->name],
                'pairs'          => $halqa->pairs->map(fn ($p) => [
                    'id'              => $p->id,
                    'student_a'       => ['id' => $p->student_a_id, 'name' => $p->studentA->name],
                    'student_b'       => ['id' => $p->student_b_id, 'name' => $p->studentB->name],
                    'consistency'     => null,
                    'last_submission' => null,
                    'status'          => null,
                    'sparkline'       => array_fill(0, 14, 0),
                    'today_submitted' => 'none',
                    'missed_yesterday'=> false,
                ])->values(),
                'summary'        => ['on_track' => 0, 'slipping' => 0, 'at_risk' => 0, 'inactive' => 0],
                'absence_queue'  => [],
                'follow_up_queue'=> [],
                'group_identity' => null,
                'students'       => [],
                'today_subs'     => 0,
            ];
        }

        // ── Bulk queries before the pairs map — eliminates N+1 ───────────────────
        $allStudentIds = $halqa->pairs
            ->flatMap(fn ($p) => array_filter([$p->student_a_id, $p->student_b_id]))
            ->unique()->values();

        $last14 = collect(range(13, 0))->map(fn ($i) => $today->copy()->subDays($i)->toDateString());
        $windowStart14 = $today->copy()->subDays(13);
        $effectiveStartGlobal = $programStart->gt($windowStart14) ? $programStart->copy() : $windowStart14->copy();

        // All 14-day submissions for every student in the halqa, grouped by student then date
        $allSubs14ByStudent = PairSubmission::whereIn('subject_student_id', $allStudentIds)
            ->whereBetween('submission_date', [$last14->first(), $last14->last()])
            ->get()
            ->groupBy('subject_student_id')
            ->map(fn ($rows) => $rows->groupBy(fn ($s) => Carbon::parse($s->submission_date)->toDateString()));

        // Last submission date per student
        $lastSubByStudent = PairSubmission::whereIn('subject_student_id', $allStudentIds)
            ->selectRaw('subject_student_id, MAX(submission_date::text) as last_sub')
            ->groupBy('subject_student_id')
            ->pluck('last_sub', 'subject_student_id');

        // Today's submissions per student (distinct count)
        $todaySubStudentIds = PairSubmission::whereIn('subject_student_id', $allStudentIds)
            ->where('submission_date', $today->toDateString())
            ->distinct()
            ->pluck('subject_student_id')
            ->flip(); // use as a set for O(1) lookup

        $pairs = $halqa->pairs->map(function (Pair $pair) use ($today, $yesterday, $programStart, $last14, $effectiveStartGlobal, $allSubs14ByStudent, $lastSubByStudent, $todaySubStudentIds) {
            $studentIds = [$pair->student_a_id, $pair->student_b_id];

            // Each student's scheduled day names (lowercase). Empty = every day.
            // NOTE: scheduling lives in available_days (weekday names); available_times
            // holds prayer-slot preferences used only for pairing — not days.
            $scheduleA = array_map('strtolower', $pair->studentA->available_days ?? []);
            $scheduleB = array_map('strtolower', $pair->studentB?->available_days ?? []);

            // Returns true if the given date is a scheduled day for the pair.
            // A day is scheduled when BOTH students are expected that day.
            // A student with no schedule set is expected every day.
            $isPairScheduled = function (string $date) use ($scheduleA, $scheduleB): bool {
                $dayName = strtolower(Carbon::parse($date)->format('l'));
                $aExpected = empty($scheduleA) || in_array($dayName, $scheduleA, true);
                $bExpected = empty($scheduleB) || in_array($dayName, $scheduleB, true);
                return $aExpected && $bExpected;
            };

            // Weekday names on which BOTH students are expected — the pair's schedule.
            $pairDays = array_values(array_filter(
                ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'],
                fn ($d) => (empty($scheduleA) || in_array($d, $scheduleA, true))
                    && (empty($scheduleB) || in_array($d, $scheduleB, true)),
            ));

            // Effective window: no earlier than program start
            $effectiveStart = $effectiveStartGlobal->copy();

            // Merge pre-loaded submissions for both students, keyed by date
            $subs14 = [];
            foreach (array_filter($studentIds) as $sid) {
                $byDate = $allSubs14ByStudent->get($sid, collect());
                foreach ($byDate as $date => $rows) {
                    $subs14[$date] = isset($subs14[$date]) ? $subs14[$date]->merge($rows) : collect($rows);
                }
            }

            // Sparkline: 1 if either student submitted that day
            $sparkline = $last14->map(fn ($date) => isset($subs14[$date]) ? 1 : 0)->values()->toArray();

            // Effective dates in the window
            $effectiveDates = collect(range(0, $effectiveStart->diffInDays($today)))
                ->map(fn ($i) => $effectiveStart->copy()->addDays($i)->toDateString());

            // Only count days the pair was scheduled (respects available_days)
            $scheduledDates = $effectiveDates->filter($isPairScheduled);
            $scheduledCount = max(1, $scheduledDates->count());

            // Consistency: scheduled days where BOTH students submitted
            $bothDays = $scheduledDates->filter(function ($date) use ($subs14, $pair) {
                if (!isset($subs14[$date])) return false;
                $submitters = $subs14[$date]->pluck('subject_student_id')->unique();
                return $submitters->contains($pair->student_a_id)
                    && $submitters->contains($pair->student_b_id);
            });
            $consistency = round(($bothDays->count() / $scheduledCount) * 100, 1);

            // Last submission ever — from pre-loaded map
            $lastSub = collect(array_filter($studentIds))
                ->map(fn ($id) => $lastSubByStudent->get($id))
                ->filter()
                ->max();

            // Today — only flag if today is a scheduled day
            $todayScheduled = $isPairScheduled($today->toDateString());
            $todayCount     = $todayScheduled
                ? collect(array_filter($studentIds))->filter(fn ($id) => isset($todaySubStudentIds[$id]))->count()
                : null;
            $todayStatus = match (true) {
                !$todayScheduled    => 'none',   // not a scheduled day — show neutral dot
                $todayCount >= 2    => 'both',
                $todayCount === 1   => 'one',
                default             => 'none',
            };

            // Absence: only flag if yesterday was a scheduled day AND at least one student missed
            $yesterdayStr    = $yesterday->toDateString();
            $submittedYday   = isset($subs14[$yesterdayStr])
                ? $subs14[$yesterdayStr]->pluck('subject_student_id')->unique()
                : collect();
            $aSubmittedYday  = $submittedYday->contains($pair->student_a_id);
            $bSubmittedYday  = $submittedYday->contains($pair->student_b_id);
            $missedYesterday = $isPairScheduled($yesterdayStr) && (!$aSubmittedYday || !$bSubmittedYday);

            $status = $this->cs->deriveStatus(
                $pairDays,
                $bothDays->flip()->toArray(),
                $effectiveStart,
                $today,
                $lastSub,
                (float) $consistency,
            );

            return [
                'id'               => $pair->id,
                'student_a'        => [
                    'id'                 => $pair->student_a_id,
                    'name'               => $pair->studentA->name,
                    'submitted_yesterday' => $aSubmittedYday,
                ],
                'student_b'        => [
                    'id'                 => $pair->student_b_id,
                    'name'               => $pair->studentB?->name,
                    'submitted_yesterday' => $bSubmittedYday,
                ],
                'consistency'      => $consistency,
                'last_submission'  => $lastSub ? Carbon::parse($lastSub)->toDateString() : null,
                'status'           => $status,
                'sparkline'        => $sparkline,
                'today_submitted'  => $todayStatus,
                'missed_yesterday' => $missedYesterday,
            ];
        });

        $summary = [
            'on_track' => $pairs->where('status', 'on_track')->count(),
            'slipping' => $pairs->where('status', 'slipping')->count(),
            'at_risk'  => $pairs->where('status', 'at_risk')->count(),
            'inactive' => $pairs->where('status', 'inactive')->count(),
        ];

        $absenceQueue = $pairs->filter(fn ($p) => $p['missed_yesterday'])->values();

        // ── Follow-up queue ────────────────────────────────────────────────────
        // Open action items past due
        $overdueActions = MeetingActionItem::whereHas('meeting', fn ($q) => $q->where('halqa_id', $halqa->id))
            ->where('status', 'open')
            ->where('due_date', '<=', $today->toDateString())
            ->with(['student:id,name'])
            ->get()
            ->map(fn ($a) => ['id' => $a->id, 'student' => $a->student->name, 'description' => $a->description, 'due_date' => $a->due_date?->toDateString()])
            ->toArray();

        // Contact notes snoozed to today or earlier — scoped to the viewing leader.
        // Null viewer (leaderless halqa in admin view) → no snoozed contacts.
        $snoozedContacts = $viewerLeader
            ? ContactLog::where('contacted_by', $viewerLeader->id)
                ->where('snooze_until', '<=', $today->toDateString())
                ->where('outcome', 'pending')
                ->with(['student:id,name'])
                ->get()
                ->map(fn ($c) => ['id' => $c->id, 'student' => $c->student->name, 'note' => $c->note, 'snooze_until' => $c->snooze_until?->toDateString()])
                ->toArray()
            : [];

        // ── Group identity panel ───────────────────────────────────────────────
        $groupCons = $this->cs->getGroupConsistency($halqa->id);

        // Halqa rank among all halqas
        $allHalqasCons = Halqa::all()->map(fn ($h) => $this->cs->getGroupConsistency($h->id))->sortDesc()->values()->toArray();
        $halqaRank     = (int) array_search($groupCons, $allHalqasCons) + 1;
        $totalHalqas   = count($allHalqasCons);

        // Most consistent student this week
        $weekStart = $today->copy()->startOfWeek(Carbon::SATURDAY)->toDateString();
        $memberIds = $halqa->pairs->flatMap(fn ($p) => array_filter([$p->student_a_id, $p->student_b_id]))->unique();
        $topStudent = null;
        if ($memberIds->isNotEmpty()) {
            $weekSubs = PairSubmission::whereIn('subject_student_id', $memberIds)
                ->where('submission_date', '>=', $weekStart)
                ->selectRaw('subject_student_id, COUNT(*) as cnt')
                ->groupBy('subject_student_id')
                ->orderByDesc('cnt')
                ->first();
            if ($weekSubs) {
                $su = User::find($weekSubs->subject_student_id);
                $topStudent = $su ? ['name' => $su->name, 'count' => $weekSubs->cnt] : null;
            }
        }

        $groupIdentity = [
            'consistency'  => $groupCons,
            'rank'         => $halqaRank,
            'total_halqas' => $totalHalqas,
            'top_student'  => $topStudent,
        ];

        return [
            'halqa'                  => ['id' => $halqa->id, 'name' => $halqa->name],
            'pairs'                  => $pairs->values(),
            'students'               => $this->buildStudentRows($halqa, $today, $programStart),
            'summary'                => $summary,
            'today_subs'             => $pairs->sum(fn ($p) => $p['today_submitted'] === 'both' ? 2 : ($p['today_submitted'] === 'one' ? 1 : 0)),
            'absence_queue'          => $absenceQueue,
            'follow_up_queue'        => array_merge($overdueActions, $snoozedContacts),
            'group_identity'         => $groupIdentity,
            'certificates_published' => (bool) ProgramSetting::get('certificates_published', false),
        ];
    }

    private function buildStudentRows(Halqa $halqa, Carbon $today, Carbon $programStart): array
    {
        // Pull student IDs from pairs directly — avoids missing students whose
        // halqa_id column wasn't set (e.g. inactive or manually imported students)
        $memberIds = $halqa->pairs
            ->flatMap(fn ($p) => array_filter([$p->student_a_id, $p->student_b_id]))
            ->unique()
            ->values();

        if ($memberIds->isEmpty()) return [];

        $window14      = $today->copy()->subDays(13);
        $effectiveStart = $programStart->gt($window14) ? $programStart->copy() : $window14->copy();
        $effectiveDays  = max(1, $effectiveStart->diffInDays($today) + 1);
        $last14         = collect(range(13, 0))->map(fn ($i) => $today->copy()->subDays($i)->toDateString());

        $subs14 = PairSubmission::whereIn('subject_student_id', $memberIds)
            ->whereBetween('submission_date', [$last14->first(), $last14->last()])
            ->get()->groupBy('subject_student_id');

        $lastSubs = PairSubmission::whereIn('subject_student_id', $memberIds)
            ->selectRaw('subject_student_id, MAX(submission_date::text) as last_sub')
            ->groupBy('subject_student_id')
            ->pluck('last_sub', 'subject_student_id');

        // Pair map: student_id → pair_id
        $pairMap = [];
        foreach ($halqa->pairs as $p) {
            $pairMap[$p->student_a_id] = $p->id;
            if ($p->student_b_id) $pairMap[$p->student_b_id] = $p->id;
        }

        return User::whereIn('id', $memberIds)->get()
            ->map(function ($student) use ($subs14, $lastSubs, $last14, $effectiveStart, $today, $pairMap) {
                // Scheduling is available_days (weekday names), not available_times (prayer slots).
                $schedule    = array_map('strtolower', $student->available_days ?? []);
                $isScheduled = fn (string $date): bool =>
                    empty($schedule) || in_array(strtolower(Carbon::parse($date)->format('l')), $schedule, true);

                $studentSubs = ($subs14[$student->id] ?? collect())->keyBy(
                    fn ($s) => Carbon::parse($s->submission_date)->toDateString()
                );
                $sparkline = $last14->map(fn ($d) => isset($studentSubs[$d]) ? 1 : 0)->values()->toArray();

                $effDates      = collect(range(0, $effectiveStart->diffInDays($today)))
                    ->map(fn ($i) => $effectiveStart->copy()->addDays($i)->toDateString());
                $scheduledDates = $effDates->filter($isScheduled);
                $scheduledCount = max(1, $scheduledDates->count());
                $submitted      = $scheduledDates->filter(fn ($d) => isset($studentSubs[$d]))->count();
                $consistency    = round(($submitted / $scheduledCount) * 100, 1);

                $lastSub  = $lastSubs[$student->id] ?? null;
                $status   = $this->cs->deriveStatus(
                    $schedule,
                    $studentSubs->toArray(),
                    $effectiveStart,
                    $today,
                    $lastSub,
                    (float) $consistency,
                );
                $todaySub = $isScheduled($today->toDateString()) && isset($studentSubs[$today->toDateString()]);

                return [
                    'id'              => $student->id,
                    'name'            => $student->name,
                    'student_id'      => $student->student_id,
                    'consistency'     => $consistency,
                    'sparkline'       => $sparkline,
                    'status'          => $status,
                    'last_submission' => $lastSub ? Carbon::parse($lastSub)->toDateString() : null,
                    'today_submitted' => $todaySub,
                    'pair_id'         => $pairMap[$student->id] ?? null,
                    'is_solo'         => $student->is_solo ?? false,
                ];
            })->values()->toArray();
    }

    /**
     * Build the pair-detail Inertia props (heatmaps, history, tests, logs, notes).
     *
     * $viewerLeader scopes contact_logs (contacted_by) and private_note (leader_id).
     * Null → those come back empty. Does NOT include `all_students` (leader-only,
     * powers the pair-change write flow).
     */
    public function pairDetailProps(Pair $pair, Halqa $halqa, ?User $viewerLeader): array
    {
        $leaderId = $viewerLeader?->id;

        $students = collect([$pair->studentA, $pair->studentB])->map(function ($student) use ($leaderId) {
            $heatmap = $this->cs->buildHeatmap($student, 30);

            $history = PairSubmission::where('subject_student_id', $student->id)
                ->orderByDesc('submission_date')
                ->take(60)
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
                    'submission_date' => Carbon::parse($s->submission_date)->toDateString(),
                    'submitted_at'    => Carbon::parse($s->submitted_at)->format('H:i'),
                ])->toArray();

            // Contact logs / private note are scoped to the viewing leader.
            // Null viewer (leaderless halqa in admin view) → empty.
            $contactLogs = $leaderId
                ? ContactLog::where('student_id', $student->id)
                    ->where('contacted_by', $leaderId)
                    ->orderByDesc('contacted_at')
                    ->get()
                    ->map(fn ($c) => [
                        'id'                 => $c->id,
                        'method'             => $c->method,
                        'note'               => $c->note,
                        'contacted_at'       => Carbon::parse($c->contacted_at)->format('Y-m-d H:i'),
                        'follow_up_required' => $c->follow_up_required,
                    ])->toArray()
                : [];

            $privateNote = $leaderId
                ? PrivateNote::where('student_id', $student->id)
                    ->where('leader_id', $leaderId)
                    ->value('note')
                : null;

            $onWatchlist = Watchlist::where('student_id', $student->id)
                ->whereNull('resolved_at')
                ->exists();

            // Last login
            $lastLogin = \App\Models\AuditLog::where('user_id', $student->id)
                ->where('action', 'login')
                ->orderByDesc('created_at')
                ->value('created_at');

            // Recent notifications sent to this student
            $notifLog = $student->notifications()
                ->orderByDesc('created_at')
                ->take(10)
                ->get()
                ->map(function ($n) {
                    // $n->data is already cast to array by DatabaseNotification
                    $data = is_array($n->data) ? $n->data : (json_decode($n->data, true) ?? []);
                    return [
                        'id'      => $n->id,
                        'type'    => class_basename($n->type),
                        'message' => $data['message'] ?? '',
                        'sent_at' => Carbon::parse($n->created_at)->format('Y-m-d H:i'),
                        'seen_at' => $n->seen_at ? Carbon::parse($n->seen_at)->format('Y-m-d H:i') : null,
                        'read_at' => $n->read_at  ? Carbon::parse($n->read_at)->format('Y-m-d H:i')  : null,
                    ];
                })->toArray();

            return [
                'id'           => $student->id,
                'name'         => $student->name,
                'student_id'   => $student->student_id,
                'heatmap'      => $heatmap,
                'history'      => $history,
                'contact_logs' => $contactLogs,
                'private_note' => $privateNote ?? '',
                'on_watchlist' => $onWatchlist,
                'last_login'   => $lastLogin ? Carbon::parse($lastLogin)->diffForHumans() : 'Never',
                'notif_log'    => $notifLog,
                'excuses'      => MissedSubmissionExcuse::where('student_id', $student->id)
                    ->orderByDesc('missed_date')
                    ->take(10)
                    ->get()
                    ->map(fn ($e) => [
                        'missed_date' => $e->missed_date->toDateString(),
                        'makeup_date' => $e->makeup_date->toDateString(),
                        'reason'      => $e->reason,
                        'fulfilled'   => $e->fulfilled,
                    ])->toArray(),
                'tests' => MurajaTest::where('student_id', $student->id)
                    ->orderByDesc('tested_at')
                    ->get()
                    ->map(fn ($t) => [
                        'id'        => $t->id,
                        'from_page' => $t->from_page,
                        'to_page'   => $t->to_page,
                        'from_juz'  => $t->from_juz,
                        'to_juz'    => $t->to_juz,
                        'score'     => $t->score,
                        'tested_at' => Carbon::parse($t->tested_at)->toDateString(),
                    ])->toArray(),
            ];
        })->values()->toArray();

        return [
            'pair'  => ['id' => $pair->id, 'students' => $students],
            'halqa' => ['id' => $halqa->id, 'name' => $halqa->name],
        ];
    }
}
