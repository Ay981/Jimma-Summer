<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\ContactLog;
use App\Models\Halqa;
use App\Models\MeetingActionItem;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Services\ConsistencyService;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class HalqaDashboardController extends Controller
{
    public function index(): Response
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa()->with(['pairs.studentA', 'pairs.studentB'])->first();

        if (!$halqa) {
            return Inertia::render('Leader/Dashboard', [
                'halqa'          => null,
                'pairs'          => [],
                'students'       => [],
                'summary'        => ['on_track' => 0, 'slipping' => 0, 'at_risk' => 0, 'inactive' => 0],
                'today_subs'     => 0,
                'absence_queue'  => [],
                'follow_up_queue'=> [],
                'group_identity' => null,
            ]);
        }

        $today        = Carbon::today();
        $yesterday    = Carbon::yesterday();
        $programStart = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));

        // Programme hasn't started — return neutral state
        if ($today->lt($programStart)) {
            return Inertia::render('Leader/Dashboard', [
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
            ]);
        }

        $pairs = $halqa->pairs->map(function (Pair $pair) use ($today, $yesterday, $programStart) {
            $studentIds = [$pair->student_a_id, $pair->student_b_id];

            // Build the 14-day window
            $windowStart14 = $today->copy()->subDays(13);

            // Effective window: no earlier than program start
            $effectiveStart = $programStart->gt($windowStart14) ? $programStart->copy() : $windowStart14->copy();
            $effectiveDays  = max(1, $effectiveStart->diffInDays($today) + 1);

            $last14 = collect(range(13, 0))
                ->map(fn ($i) => $today->copy()->subDays($i)->toDateString());

            // Submissions in the 14-day window
            $subs14 = PairSubmission::whereIn('subject_student_id', $studentIds)
                ->whereBetween('submission_date', [$last14->first(), $last14->last()])
                ->get()
                ->groupBy(fn ($s) => Carbon::parse($s->submission_date)->toDateString());

            // Sparkline: 1 if either student submitted that day
            $sparkline = $last14->map(fn ($date) => isset($subs14[$date]) ? 1 : 0)->values()->toArray();

            // Consistency: days where BOTH students submitted in the EFFECTIVE window
            $effectiveDates = collect(range(0, $effectiveDays - 1))
                ->map(fn ($i) => $effectiveStart->copy()->addDays($i)->toDateString());

            $bothDays = $effectiveDates->filter(function ($date) use ($subs14, $pair) {
                if (!isset($subs14[$date])) return false;
                $submitters = $subs14[$date]->pluck('subject_student_id')->unique();
                return $submitters->contains($pair->student_a_id)
                    && $submitters->contains($pair->student_b_id);
            });
            $consistency = round(($bothDays->count() / $effectiveDays) * 100, 1);

            // Last submission ever
            $lastSub = PairSubmission::whereIn('subject_student_id', $studentIds)
                ->orderByDesc('submission_date')
                ->value('submission_date');

            // Today status
            $todayCount = PairSubmission::whereIn('subject_student_id', $studentIds)
                ->where('submission_date', $today->toDateString())
                ->distinct('subject_student_id')
                ->count('subject_student_id');
            $todayStatus = match (true) {
                $todayCount >= 2 => 'both',
                $todayCount === 1 => 'one',
                default => 'none',
            };

            // Absence queue
            $yesterdayCount = PairSubmission::whereIn('subject_student_id', $studentIds)
                ->where('submission_date', $yesterday->toDateString())
                ->count();

            $status = $this->computeStatus($sparkline, $consistency, $lastSub, $effectiveDays);

            return [
                'id'               => $pair->id,
                'student_a'        => ['id' => $pair->student_a_id, 'name' => $pair->studentA->name],
                'student_b'        => ['id' => $pair->student_b_id, 'name' => $pair->studentB->name],
                'consistency'      => $consistency,
                'last_submission'  => $lastSub ? Carbon::parse($lastSub)->toDateString() : null,
                'status'           => $status,
                'sparkline'        => $sparkline,
                'today_submitted'  => $todayStatus,
                'missed_yesterday' => $yesterdayCount === 0,
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

        // Contact notes snoozed to today or earlier
        $snoozedContacts = ContactLog::where('contacted_by', $leader->id)
            ->where('snooze_until', '<=', $today->toDateString())
            ->where('outcome', 'pending')
            ->with(['student:id,name'])
            ->get()
            ->map(fn ($c) => ['id' => $c->id, 'student' => $c->student->name, 'note' => $c->note, 'snooze_until' => $c->snooze_until?->toDateString()])
            ->toArray();

        // ── Group identity panel ───────────────────────────────────────────────
        $cs = app(ConsistencyService::class);
        $groupCons = $cs->getGroupConsistency($halqa->id);

        // Halqa rank among all halqas
        $allHalqasCons = Halqa::all()->map(fn ($h) => $cs->getGroupConsistency($h->id))->sortDesc()->values()->toArray();
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
                $su = \App\Models\User::find($weekSubs->subject_student_id);
                $topStudent = $su ? ['name' => $su->name, 'count' => $weekSubs->cnt] : null;
            }
        }

        $groupIdentity = [
            'consistency'  => $groupCons,
            'rank'         => $halqaRank,
            'total_halqas' => $totalHalqas,
            'top_student'  => $topStudent,
        ];

        return Inertia::render('Leader/Dashboard', [
            'halqa'          => ['id' => $halqa->id, 'name' => $halqa->name],
            'pairs'          => $pairs->values(),
            'students'       => $this->buildStudentRows($halqa, $today, $programStart),
            'summary'        => $summary,
            'today_subs'     => $pairs->sum(fn ($p) => $p['today_submitted'] === 'both' ? 2 : ($p['today_submitted'] === 'one' ? 1 : 0)),
            'absence_queue'  => $absenceQueue,
            'follow_up_queue'=> array_merge($overdueActions, $snoozedContacts),
            'group_identity' => $groupIdentity,
        ]);
    }

    private function buildStudentRows(\App\Models\Halqa $halqa, Carbon $today, Carbon $programStart): array
    {
        // Include every student whose halqa_id points here, not just paired ones
        $memberIds = \App\Models\User::where('halqa_id', $halqa->id)
            ->where('role', 'student')
            ->where('is_active', true)
            ->pluck('id');
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

        return \App\Models\User::whereIn('id', $memberIds)->get()
            ->map(function ($student) use ($subs14, $lastSubs, $last14, $effectiveDays, $effectiveStart, $today, $pairMap) {
                $studentSubs = ($subs14[$student->id] ?? collect())->keyBy(
                    fn ($s) => Carbon::parse($s->submission_date)->toDateString()
                );
                $sparkline = $last14->map(fn ($d) => isset($studentSubs[$d]) ? 1 : 0)->values()->toArray();

                $effDates  = collect(range(0, $effectiveDays - 1))
                    ->map(fn ($i) => $effectiveStart->copy()->addDays($i)->toDateString());
                $submitted  = $effDates->filter(fn ($d) => isset($studentSubs[$d]))->count();
                $consistency = round(($submitted / $effectiveDays) * 100, 1);

                $lastSub   = $lastSubs[$student->id] ?? null;
                $status    = $this->computeStatus($sparkline, $consistency, $lastSub, $effectiveDays);
                $todaySub  = isset($studentSubs[$today->toDateString()]);

                return [
                    'id'           => $student->id,
                    'name'         => $student->name,
                    'student_id'   => $student->student_id,
                    'consistency'  => $consistency,
                    'sparkline'    => $sparkline,
                    'status'       => $status,
                    'last_submission' => $lastSub ? Carbon::parse($lastSub)->toDateString() : null,
                    'today_submitted' => $todaySub,
                    'pair_id'      => $pairMap[$student->id] ?? null,
                    'is_solo'      => $student->is_solo ?? false,
                ];
            })->values()->toArray();
    }

    private function computeStatus(array $sparkline14, float $consistency, ?string $lastSub, int $effectiveDays): string
    {
        // Programme hasn't started / student never submitted — give benefit of the doubt
        // if the program is brand new (≤2 days old)
        if (!$lastSub) {
            return $effectiveDays <= 2 ? 'on_track' : 'inactive';
        }

        $daysSinceLast = Carbon::parse($lastSub)->diffInDays(Carbon::today());

        // Inactive: no submission for 7+ days
        if ($daysSinceLast >= 7) {
            return 'inactive';
        }

        // Count consecutive missed days from the most recent end,
        // bounded to the effective program window (avoids penalising days before start)
        $lookback    = min(count($sparkline14), $effectiveDays);
        $consecutive = 0;
        for ($i = count($sparkline14) - 1; $i >= count($sparkline14) - $lookback; $i--) {
            if ($sparkline14[$i] === 0) {
                $consecutive++;
            } else {
                break;
            }
        }

        // At Risk: 4–6 consecutive missed days, or chronic low consistency
        // (only apply the consistency check once there is ≥7 days of history)
        if ($consecutive >= 4 || ($effectiveDays >= 7 && $consistency < 40)) {
            return 'at_risk';
        }

        // Slipping: 2–3 consecutive missed days
        if ($consecutive >= 2) {
            return 'slipping';
        }

        // On Track: ≥70 % over the effective period
        if ($consistency >= 70) {
            return 'on_track';
        }

        // Recent submission but consistency not yet at 70 % — still building
        return 'slipping';
    }
}
