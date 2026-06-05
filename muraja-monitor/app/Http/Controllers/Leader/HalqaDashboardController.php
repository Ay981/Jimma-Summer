<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
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
                'halqa'         => null,
                'pairs'         => [],
                'summary'       => ['on_track' => 0, 'slipping' => 0, 'at_risk' => 0, 'inactive' => 0],
                'absence_queue' => [],
            ]);
        }

        $today        = Carbon::today();
        $yesterday    = Carbon::yesterday();
        $programStart = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));

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

        return Inertia::render('Leader/Dashboard', [
            'halqa'         => ['id' => $halqa->id, 'name' => $halqa->name],
            'pairs'         => $pairs->values(),
            'summary'       => $summary,
            'absence_queue' => $absenceQueue,
        ]);
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
