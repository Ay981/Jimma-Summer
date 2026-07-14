<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Services\ConsistencyService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Response;

class PdfExportController extends Controller
{
    public function __construct(private readonly ConsistencyService $consistency) {}

    public function export(): Response
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa()->with(['pairs.studentA', 'pairs.studentB'])->first();

        abort_if(!$halqa, 403);

        $today      = Carbon::today();
        $weekStart  = $today->copy()->startOfWeek(Carbon::SATURDAY);
        $programStart = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));

        $cs = $this->consistency;

        $pairs = $halqa->pairs->map(function (Pair $pair) use ($today, $weekStart, $programStart, $cs) {
            $studentIds = [$pair->student_a_id, $pair->student_b_id];

            // Consistency — use effective program window, not a hardcoded 14
            $last14         = collect(range(13, 0))->map(fn ($i) => $today->copy()->subDays($i)->toDateString());
            $windowStart14  = $today->copy()->subDays(13);
            $effectiveStart = $programStart->gt($windowStart14) ? $programStart->copy() : $windowStart14->copy();
            $effectiveDays  = max(1, $effectiveStart->diffInDays($today) + 1);
            $subs14         = PairSubmission::whereIn('subject_student_id', $studentIds)
                ->whereBetween('submission_date', [$last14->first(), $last14->last()])
                ->get()
                ->groupBy(fn ($s) => Carbon::parse($s->submission_date)->toDateString());

            // Weekday names on which BOTH students are expected (available_days, not times).
            $scheduleA = array_map('strtolower', $pair->studentA->available_days ?? []);
            $scheduleB = array_map('strtolower', $pair->studentB?->available_days ?? []);
            $pairDays  = array_values(array_filter(
                ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'],
                fn ($d) => (empty($scheduleA) || in_array($d, $scheduleA, true))
                    && (empty($scheduleB) || in_array($d, $scheduleB, true)),
            ));

            $effectiveDates = collect(range(0, $effectiveDays - 1))
                ->map(fn ($i) => $effectiveStart->copy()->addDays($i)->toDateString());
            $scheduledDates = $effectiveDates->filter(fn ($d) => $cs->isScheduledDay($pairDays, Carbon::parse($d)));
            $scheduledCount = max(1, $scheduledDates->count());

            $bothDays = $scheduledDates->filter(function ($date) use ($subs14, $pair) {
                if (!isset($subs14[$date])) return false;
                $submitters = $subs14[$date]->pluck('subject_student_id')->unique();
                return $submitters->contains($pair->student_a_id) && $submitters->contains($pair->student_b_id);
            });
            $consistency14 = round(($bothDays->count() / $scheduledCount) * 100, 1);

            // Last submission
            $lastSub = PairSubmission::whereIn('subject_student_id', $studentIds)
                ->orderByDesc('submission_date')
                ->value('submission_date');

            // Pages this week
            $pagesThisWeek = PairSubmission::whereIn('subject_student_id', $studentIds)
                ->where('submission_date', '>=', $weekStart->toDateString())
                ->get()
                ->sum(fn ($s) => $s->page_to - $s->page_from + 1);

            $status = $cs->deriveStatus(
                $pairDays,
                $bothDays->flip()->toArray(),
                $effectiveStart,
                $today,
                $lastSub,
                (float) $consistency14,
            );

            return [
                'student_a'       => $pair->studentA->name,
                'student_b'       => $pair->studentB->name,
                'consistency'     => $consistency14,
                'last_submission' => $lastSub ? Carbon::parse($lastSub)->format('d M Y') : '—',
                'status'          => $status,
                'pages_this_week' => $pagesThisWeek,
            ];
        })->values();

        // Group consistency (all pairs combined) — measured against scheduled days.
        $allStudentIds = $halqa->pairs->flatMap(fn ($p) => [$p->student_a_id, $p->student_b_id])->unique();
        $groupConsistency = $cs->getGroupConsistency($halqa->id);

        // Submissions this week
        $weekSubs = PairSubmission::whereIn('subject_student_id', $allStudentIds)
            ->where('submission_date', '>=', $weekStart->toDateString())
            ->count();

        // Average streak
        $avgStreak = 0;
        if ($allStudentIds->count() > 0) {
            $streaks = $allStudentIds->map(fn ($id) => $this->consistency->getStreak($id));
            $avgStreak = round($streaks->average(), 1);
        }

        $summary = [
            'total_pairs'       => $halqa->pairs->count(),
            'group_consistency' => $groupConsistency,
            'on_track'          => $pairs->where('status', 'on_track')->count(),
            'slipping'          => $pairs->where('status', 'slipping')->count(),
            'at_risk'           => $pairs->where('status', 'at_risk')->count(),
            'inactive'          => $pairs->where('status', 'inactive')->count(),
            'avg_streak'        => $avgStreak,
            'total_subs_week'   => $weekSubs,
        ];

        $atRiskPairs = $pairs->whereIn('status', ['at_risk', 'inactive'])->values();

        $pdf = Pdf::loadView('pdf.halqa-report', [
            'halqa'        => $halqa,
            'leader'       => $leader,
            'pairs'        => $pairs,
            'summary'      => $summary,
            'atRiskPairs'  => $atRiskPairs,
            'generatedAt'  => $today->format('d F Y'),
        ]);

        $pdf->setPaper('A4', 'portrait');

        $filename = 'halqa-report-' . $today->format('Y-m-d') . '.pdf';

        return $pdf->download($filename);
    }
}
