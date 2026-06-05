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

        $pairs = $halqa->pairs->map(function (Pair $pair) use ($today, $weekStart, $programStart) {
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

            $effectiveDates = collect(range(0, $effectiveDays - 1))
                ->map(fn ($i) => $effectiveStart->copy()->addDays($i)->toDateString());
            $bothDays = $effectiveDates->filter(function ($date) use ($subs14, $pair) {
                if (!isset($subs14[$date])) return false;
                $submitters = $subs14[$date]->pluck('subject_student_id')->unique();
                return $submitters->contains($pair->student_a_id) && $submitters->contains($pair->student_b_id);
            });
            $consistency14 = round(($bothDays->count() / $effectiveDays) * 100, 1);

            // Last submission
            $lastSub = PairSubmission::whereIn('subject_student_id', $studentIds)
                ->orderByDesc('submission_date')
                ->value('submission_date');

            // Pages this week
            $pagesThisWeek = PairSubmission::whereIn('subject_student_id', $studentIds)
                ->where('submission_date', '>=', $weekStart->toDateString())
                ->get()
                ->sum(fn ($s) => $s->page_to - $s->page_from + 1);

            // Consecutive missed days
            $sparkline = $last14->map(fn ($date) => isset($subs14[$date]) ? 1 : 0)->values()->toArray();
            $consecutive = 0;
            for ($i = count($sparkline) - 1; $i >= 0; $i--) {
                if ($sparkline[$i] === 0) $consecutive++;
                else break;
            }

            $status = $this->deriveStatus($sparkline, $consistency14, $lastSub, $effectiveDays);

            return [
                'student_a'       => $pair->studentA->name,
                'student_b'       => $pair->studentB->name,
                'consistency'     => $consistency14,
                'last_submission' => $lastSub ? Carbon::parse($lastSub)->format('d M Y') : '—',
                'status'          => $status,
                'pages_this_week' => $pagesThisWeek,
            ];
        })->values();

        // Group consistency (all pairs combined)
        $allStudentIds = $halqa->pairs->flatMap(fn ($p) => [$p->student_a_id, $p->student_b_id])->unique();
        $programDays   = max(1, $programStart->diffInDays($today) + 1);
        $totalSubs     = PairSubmission::whereIn('subject_student_id', $allStudentIds)->count();
        $groupConsistency = $allStudentIds->count() > 0
            ? round(($totalSubs / ($programDays * $allStudentIds->count())) * 100, 1)
            : 0;

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

    private function deriveStatus(array $sparkline14, float $consistency14, ?string $lastSub, int $effectiveDays = 14): string
    {
        if (!$lastSub) {
            return $effectiveDays <= 2 ? 'on_track' : 'inactive';
        }
        if (Carbon::parse($lastSub)->diffInDays(Carbon::today()) >= 7) {
            return 'inactive';
        }
        $lookback    = min(count($sparkline14), $effectiveDays);
        $consecutive = 0;
        for ($i = count($sparkline14) - 1; $i >= count($sparkline14) - $lookback; $i--) {
            if ($sparkline14[$i] === 0) $consecutive++;
            else break;
        }
        if ($consecutive >= 4 || ($effectiveDays >= 7 && $consistency14 < 40)) return 'at_risk';
        if ($consecutive >= 2) return 'slipping';
        if ($consistency14 >= 70) return 'on_track';
        return 'slipping';
    }
}
