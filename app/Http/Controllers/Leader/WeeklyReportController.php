<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\MissedSubmissionExcuse;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use App\Services\ConsistencyService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;

class WeeklyReportController extends Controller
{
    public function __construct(private readonly ConsistencyService $consistency) {}

    public function index(Request $request): \Inertia\Response
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;

        abort_if(!$halqa, 403, 'No halqa assigned.');

        $today     = Carbon::today();
        $weekStart = $today->copy()->startOfWeek(Carbon::SUNDAY);
        $weekEnd   = $today->copy()->endOfWeek(Carbon::SATURDAY);
        $prevStart = $weekStart->copy()->subWeek();
        $prevEnd   = $weekEnd->copy()->subWeek();

        $memberIds = User::where('halqa_id', $halqa->id)->where('role', 'student')->where('is_active', true)->pluck('id');

        $thisWeekSubs = PairSubmission::whereIn('subject_student_id', $memberIds)
            ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->selectRaw('subject_student_id, COUNT(*) as cnt, SUM(page_to - page_from + 1) as pages')
            ->groupBy('subject_student_id')->get()->keyBy('subject_student_id');

        $prevWeekSubs = PairSubmission::whereIn('subject_student_id', $memberIds)
            ->whereBetween('submission_date', [$prevStart->toDateString(), $prevEnd->toDateString()])
            ->selectRaw('subject_student_id, COUNT(*) as cnt')
            ->groupBy('subject_student_id')->get()->keyBy('subject_student_id');

        // Per-student rows
        $students = User::whereIn('id', $memberIds)->orderBy('name')->get();
        $studentRows = $students->map(function ($s) use ($thisWeekSubs, $prevWeekSubs, $weekStart, $weekEnd) {
            $thisCnt  = (int) ($thisWeekSubs[$s->id]->cnt   ?? 0);
            $prevCnt  = (int) ($prevWeekSubs[$s->id]->cnt   ?? 0);
            $pages    = (int) ($thisWeekSubs[$s->id]->pages  ?? 0);
            $streak   = $this->consistency->getStreak($s->id);

            // Pending excuses this week
            $excuse = MissedSubmissionExcuse::where('student_id', $s->id)
                ->where('fulfilled', false)
                ->whereBetween('makeup_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                ->first();

            return [
                'id'           => $s->id,
                'name'         => $s->name,
                'student_id'   => $s->student_id,
                'this_week'    => $thisCnt,
                'last_week'    => $prevCnt,
                'delta'        => $thisCnt - $prevCnt,
                'pages'        => $pages,
                'streak'       => $streak,
                'has_excuse'   => (bool) $excuse,
                'makeup_date'  => $excuse?->makeup_date->toDateString(),
                'excuse_reason'=> $excuse?->reason,
            ];
        });

        // Nudge list: zero submissions, no pending excuse
        $nudgeList = $studentRows->filter(fn ($s) => $s['this_week'] === 0 && !$s['has_excuse'])->values();

        // Pair consistency this week
        $pairs = Pair::where('halqa_id', $halqa->id)->with(['studentA:id,name', 'studentB:id,name'])->get();
        $pairRows = $pairs->map(function ($pair) use ($weekStart, $weekEnd) {
            $ids = array_filter([$pair->student_a_id, $pair->student_b_id]);
            $aCnt = (int) PairSubmission::where('subject_student_id', $pair->student_a_id)
                ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])->count();
            $bCnt = $pair->student_b_id ? (int) PairSubmission::where('subject_student_id', $pair->student_b_id)
                ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])->count() : null;
            $joint = (int) PairSubmission::whereIn('subject_student_id', $ids)
                ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                ->distinct('submission_date')->count();
            return [
                'student_a'   => $pair->studentA?->name ?? '—',
                'student_b'   => $pair->studentB?->name ?? '—',
                'a_submitted' => $aCnt,
                'b_submitted' => $bCnt,
                'joint_days'  => $joint,
                'zero_joint'  => $joint === 0,
            ];
        })->values();

        return Inertia::render('Leader/WeeklyReport', [
            'halqa_name'      => $halqa->name,
            'week_start'      => $weekStart->toDateString(),
            'week_end'        => $weekEnd->toDateString(),
            'total_members'   => $memberIds->count(),
            'submitted_count' => $thisWeekSubs->count(),
            'student_rows'    => $studentRows->values(),
            'nudge_list'      => $nudgeList,
            'pair_rows'       => $pairRows,
            'pdf_url'         => '/leader/weekly-report/pdf',
        ]);
    }

    public function pdf(): Response
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa, 403);

        $today     = Carbon::today();
        $weekStart = $today->copy()->startOfWeek(Carbon::SUNDAY);
        $weekEnd   = $today->copy()->endOfWeek(Carbon::SATURDAY);
        $prevStart = $weekStart->copy()->subWeek();

        $memberIds = User::where('halqa_id', $halqa->id)->where('role', 'student')->where('is_active', true)->pluck('id');

        $thisWeekSubs = PairSubmission::whereIn('subject_student_id', $memberIds)
            ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->selectRaw('subject_student_id, COUNT(*) as cnt, SUM(page_to - page_from + 1) as pages')
            ->groupBy('subject_student_id')->get()->keyBy('subject_student_id');

        $prevWeekSubs = PairSubmission::whereIn('subject_student_id', $memberIds)
            ->whereBetween('submission_date', [$prevStart->toDateString(), $weekEnd->copy()->subWeek()->toDateString()])
            ->selectRaw('subject_student_id, COUNT(*) as cnt')
            ->groupBy('subject_student_id')->get()->keyBy('subject_student_id');

        $students = User::whereIn('id', $memberIds)->orderBy('name')->get()
            ->map(fn ($s) => [
                'name'      => $s->name,
                'this_week' => (int) ($thisWeekSubs[$s->id]->cnt   ?? 0),
                'last_week' => (int) ($prevWeekSubs[$s->id]->cnt   ?? 0),
                'pages'     => (int) ($thisWeekSubs[$s->id]->pages ?? 0),
                'streak'    => $this->consistency->getStreak($s->id),
            ]);

        $pairs = Pair::where('halqa_id', $halqa->id)->with(['studentA:id,name', 'studentB:id,name'])->get()
            ->map(function ($pair) use ($weekStart, $weekEnd) {
                $ids  = array_filter([$pair->student_a_id, $pair->student_b_id]);
                $aCnt = (int) PairSubmission::where('subject_student_id', $pair->student_a_id)->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])->count();
                $bCnt = $pair->student_b_id ? (int) PairSubmission::where('subject_student_id', $pair->student_b_id)->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])->count() : null;
                return ['student_a' => $pair->studentA?->name ?? '—', 'student_b' => $pair->studentB?->name ?? '—', 'a_submitted' => $aCnt, 'b_submitted' => $bCnt];
            })->values();

        $pdf = Pdf::loadView('pdf.weekly-report-leader', [
            'halqa_name' => $halqa->name,
            'leader_name'=> $leader->name,
            'week_start' => $weekStart->format('d M Y'),
            'week_end'   => $weekEnd->format('d M Y'),
            'students'   => $students,
            'pairs'      => $pairs,
            'program_name' => ProgramSetting::get('program_name', "Muraja'a Monitor"),
        ]);
        $pdf->setPaper('A4', 'portrait');
        return $pdf->download('weekly-report-' . $halqa->name . '-' . $weekStart->toDateString() . '.pdf');
    }
}
