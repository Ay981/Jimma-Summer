<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactLog;
use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use App\Services\ConsistencyService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Response;
use Inertia\Inertia;

class ReportsController extends Controller
{
    public function __construct(private readonly ConsistencyService $consistency) {}

    public function index(): \Inertia\Response
    {
        return Inertia::render('Admin/Reports', [
            'program_name' => ProgramSetting::get('program_name', "Muraja'a Monitor"),
        ]);
    }

    // ── Submissions CSV ───────────────────────────────────────────────────────

    public function exportSubmissions(): Response
    {
        $rows = PairSubmission::with(['subject:id,name,student_id', 'submitter:id,name', 'pair.halqa:id,name'])
            ->orderByDesc('submission_date')
            ->get();

        $csv = "student_name,student_id,halqa,juz,page_from,page_to,pages,minutes_spent,submission_date,submitted_at,filed_by,is_edited,is_flagged,flag_verdict\n";
        foreach ($rows as $r) {
            $csv .= implode(',', [
                '"' . ($r->subject?->name ?? '') . '"',
                $r->subject?->student_id ?? '',
                '"' . ($r->pair?->halqa?->name ?? '') . '"',
                $r->juz,
                $r->page_from,
                $r->page_to,
                $r->page_to - $r->page_from + 1,
                $r->minutes_spent,
                Carbon::parse($r->submission_date)->toDateString(),
                Carbon::parse($r->submitted_at)->format('Y-m-d H:i'),
                '"' . ($r->submitter?->name ?? '') . '"',
                $r->is_edited ? 'yes' : 'no',
                $r->is_flagged ? 'yes' : 'no',
                $r->flag_verdict ?? '',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="submissions-' . today()->toDateString() . '.csv"',
        ]);
    }

    // ── Per-student summary CSV ───────────────────────────────────────────────

    public function exportStudentSummary(): Response
    {
        $today = Carbon::today();
        $start = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $days  = max(1, $start->diffInDays($today) + 1);

        $students = User::where('role', 'student')->with('halqa')->orderBy('name')->get();

        $csv = "name,student_id,halqa,total_submissions,total_pages,total_minutes,consistency_pct,streak,is_active\n";
        foreach ($students as $s) {
            $subs    = PairSubmission::where('subject_student_id', $s->id)->get();
            $pages   = $subs->sum(fn ($r) => $r->page_to - $r->page_from + 1);
            $mins    = $subs->sum('minutes_spent');
            $cons    = round(($subs->count() / $days) * 100, 1);
            $streak  = $this->consistency->getStreak($s->id);

            $csv .= implode(',', [
                '"' . $s->name . '"',
                $s->student_id,
                '"' . ($s->halqa?->name ?? '') . '"',
                $subs->count(),
                (int) $pages,
                (int) $mins,
                $cons,
                $streak,
                $s->is_active ? 'yes' : 'no',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="student-summary-' . today()->toDateString() . '.csv"',
        ]);
    }

    // ── Contact log CSV ───────────────────────────────────────────────────────

    public function exportContactLog(): Response
    {
        $logs = ContactLog::with(['student:id,name,student_id', 'contactedBy:id,name'])
            ->orderByDesc('contacted_at')
            ->get();

        $csv = "student_name,student_id,contacted_by,method,note,contacted_at,follow_up_required\n";
        foreach ($logs as $l) {
            $csv .= implode(',', [
                '"' . ($l->student?->name ?? '') . '"',
                $l->student?->student_id ?? '',
                '"' . ($l->contactedBy?->name ?? '') . '"',
                $l->method,
                '"' . str_replace('"', '""', $l->note) . '"',
                Carbon::parse($l->contacted_at)->format('Y-m-d H:i'),
                $l->follow_up_required ? 'yes' : 'no',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="contact-log-' . today()->toDateString() . '.csv"',
        ]);
    }

    // ── Batch completion certificates ZIP ────────────────────────────────────

    public function exportCertificatesZip(): Response|\Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $threshold   = (int) ProgramSetting::get('certificate_threshold', 80);
        $programName = ProgramSetting::get('program_name', "Muraja'a Monitor");
        $today       = Carbon::today();
        $start       = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $days        = max(1, $start->diffInDays($today) + 1);

        $students = User::where('role', 'student')
            ->where('is_active', true)
            ->with('halqa')
            ->get()
            ->filter(function ($s) use ($days, $threshold) {
                $total = PairSubmission::where('subject_student_id', $s->id)->count();
                return round(($total / $days) * 100) >= $threshold;
            });

        if ($students->isEmpty()) {
            return response('No students have met the certificate threshold yet.', 404, [
                'Content-Type' => 'text/plain',
            ]);
        }

        // Use system temp dir — always writable, no storage config needed
        $zipPath = sys_get_temp_dir() . '/certificates-' . uniqid() . '.zip';
        $zip = new \ZipArchive();

        $opened = $zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE);
        if ($opened !== true) {
            abort(500, "Could not create ZIP archive (ZipArchive error {$opened}).");
        }

        foreach ($students as $s) {
            $pages = (int) (PairSubmission::where('subject_student_id', $s->id)
                ->selectRaw('COALESCE(SUM(page_to - page_from + 1), 0) as p')
                ->value('p') ?? 0);
            $total = PairSubmission::where('subject_student_id', $s->id)->count();
            $cons  = round(($total / $days) * 100, 1);

            $pdf = Pdf::loadView('pdf.certificate', [
                'student'      => $s,
                'pages'        => $pages,
                'consistency'  => $cons,
                'program_name' => $programName,
                'generated'    => $today->format('d F Y'),
            ]);
            $pdf->setPaper('A4', 'landscape');
            $zip->addFromString("certificate-{$s->student_id}.pdf", $pdf->output());
        }

        $zip->close();

        return response()->download($zipPath, 'certificates-' . $today->toDateString() . '.zip')
            ->deleteFileAfterSend();
    }

    // ── Full program PDF report — direct download ─────────────────────────────

    public function exportProgramReport(): Response
    {
        $today       = Carbon::today();
        $start       = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $days        = max(1, $start->diffInDays($today) + 1);
        $programName = ProgramSetting::get('program_name', "Muraja'a Monitor");

        // Halqa stats
        $halqas = Halqa::with(['leader:id,name', 'members' => fn ($q) => $q->where('role', 'student'), 'pairs'])->get();
        $halqaStats = $halqas->map(function ($h) use ($days) {
            $ids   = $h->members->pluck('id');
            $total = $ids->isEmpty() ? 0 : PairSubmission::whereIn('subject_student_id', $ids)->count();
            $pages = $ids->isEmpty() ? 0 : (int) (PairSubmission::whereIn('subject_student_id', $ids)->selectRaw('COALESCE(SUM(page_to - page_from + 1),0) as p')->value('p') ?? 0);
            $cons  = $ids->isEmpty() ? 0 : round(($total / max(1, $ids->count() * $days)) * 100, 1);
            return ['name' => $h->name, 'leader' => $h->leader?->name ?? '—', 'pairs' => $h->pairs->count(), 'members' => $ids->count(), 'consistency' => $cons, 'pages' => $pages];
        })->values()->toArray();

        // At-risk students
        $atRisk = User::where('role', 'student')->where('is_active', true)->get()
            ->filter(function ($s) use ($days) {
                $total = PairSubmission::where('subject_student_id', $s->id)->count();
                $cons  = round(($total / $days) * 100, 1);
                $last  = PairSubmission::where('subject_student_id', $s->id)->orderByDesc('submission_date')->value('submission_date');
                return $cons < 40 || ($last && Carbon::parse($last)->diffInDays(Carbon::today()) >= 7) || !$last;
            })
            ->map(fn ($s) => ['name' => $s->name, 'halqa' => $s->halqa?->name ?? '—'])
            ->values()->toArray();

        // Leaderboard data via controller methods
        $lb = new LeaderboardController();
        $students  = array_slice($lb->studentBoard(), 0, 15);
        $pairBoard = array_slice($lb->pairBoard(), 0, 10);
        $awards    = $lb->awards();

        $pdf = Pdf::loadView('pdf.program-report', [
            'halqaStats'  => $halqaStats,
            'atRisk'      => $atRisk,
            'students'    => $students,
            'pairBoard'   => $pairBoard,
            'awards'      => $awards,
            'programName' => $programName,
            'today'       => $today,
            'start'       => $start,
            'days'        => $days,
        ]);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download('program-report-' . $today->toDateString() . '.pdf');
    }

    // ── Weekly report ─────────────────────────────────��───────────────────────

    public function weeklyReport(): \Inertia\Response
    {
        $today      = Carbon::today();
        $weekStart  = $today->copy()->startOfWeek(Carbon::SUNDAY);
        $weekEnd    = $today->copy()->endOfWeek(Carbon::SATURDAY);
        $prevStart  = $weekStart->copy()->subWeek();
        $prevEnd    = $weekEnd->copy()->subWeek();

        $ids = User::where('role', 'student')->where('is_active', true)->pluck('id');

        // This week vs last week submission totals
        $thisWeekTotal = PairSubmission::whereIn('subject_student_id', $ids)
            ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->count();
        $lastWeekTotal = PairSubmission::whereIn('subject_student_id', $ids)
            ->whereBetween('submission_date', [$prevStart->toDateString(), $prevEnd->toDateString()])
            ->count();

        // Per-student this week
        $studentSubs = PairSubmission::whereIn('subject_student_id', $ids)
            ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->selectRaw('subject_student_id, COUNT(*) as cnt, SUM(page_to - page_from + 1) as pages')
            ->groupBy('subject_student_id')
            ->get()->keyBy('subject_student_id');

        $prevStudentSubs = PairSubmission::whereIn('subject_student_id', $ids)
            ->whereBetween('submission_date', [$prevStart->toDateString(), $prevEnd->toDateString()])
            ->selectRaw('subject_student_id, COUNT(*) as cnt')
            ->groupBy('subject_student_id')
            ->get()->keyBy('subject_student_id');

        $students = User::whereIn('id', $ids)->with('halqa:id,name')->get();

        $studentRows = $students->map(function ($s) use ($studentSubs, $prevStudentSubs) {
            $thisCnt  = (int) ($studentSubs[$s->id]->cnt   ?? 0);
            $prevCnt  = (int) ($prevStudentSubs[$s->id]->cnt ?? 0);
            $pages    = (int) ($studentSubs[$s->id]->pages  ?? 0);
            $streak   = $this->consistency->getStreak($s->id);
            return [
                'id'         => $s->id,
                'name'       => $s->name,
                'student_id' => $s->student_id,
                'halqa'      => $s->halqa?->name ?? '—',
                'this_week'  => $thisCnt,
                'last_week'  => $prevCnt,
                'delta'      => $thisCnt - $prevCnt,
                'pages'      => $pages,
                'streak'     => $streak,
            ];
        });

        // Zero submissions this week
        $zeroThisWeek = $studentRows->where('this_week', 0)->values();

        // Most improved (biggest positive delta)
        $improved = $studentRows->where('delta', '>', 0)->sortByDesc('delta')->take(5)->values();

        // Per-halqa summary
        $halqas = Halqa::with(['members' => fn ($q) => $q->where('role', 'student')->where('is_active', true)])->get();
        $halqaRows = $halqas->map(function ($h) use ($weekStart, $weekEnd, $prevStart, $prevEnd) {
            $memberIds = $h->members->pluck('id');
            if ($memberIds->isEmpty()) return null;
            $thisCount = PairSubmission::whereIn('subject_student_id', $memberIds)
                ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                ->distinct('subject_student_id')->count('subject_student_id');
            $prevCount = PairSubmission::whereIn('subject_student_id', $memberIds)
                ->whereBetween('submission_date', [$prevStart->toDateString(), $prevEnd->toDateString()])
                ->distinct('subject_student_id')->count('subject_student_id');
            $cons = round($thisCount / $memberIds->count() * 100, 1);
            return [
                'name'       => $h->name,
                'members'    => $memberIds->count(),
                'submitted'  => $thisCount,
                'consistency'=> $cons,
                'delta'      => $thisCount - $prevCount,
            ];
        })->filter()->sortByDesc('consistency')->values();

        // Pairs with zero joint submissions this week
        $pairs = \App\Models\Pair::with(['studentA:id,name', 'studentB:id,name', 'halqa:id,name'])->get();
        $zeroPairs = $pairs->filter(function ($pair) use ($weekStart, $weekEnd) {
            $ids = array_filter([$pair->student_a_id, $pair->student_b_id]);
            $cnt = PairSubmission::whereIn('subject_student_id', $ids)
                ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                ->count();
            return $cnt === 0;
        })->map(fn ($p) => [
            'student_a' => $p->studentA?->name ?? '—',
            'student_b' => $p->studentB?->name ?? '—',
            'halqa'     => $p->halqa?->name ?? '—',
        ])->values();

        return Inertia::render('Admin/WeeklyReport', [
            'week_start'      => $weekStart->toDateString(),
            'week_end'        => $weekEnd->toDateString(),
            'this_week_total' => $thisWeekTotal,
            'last_week_total' => $lastWeekTotal,
            'delta'           => $thisWeekTotal - $lastWeekTotal,
            'total_students'  => $ids->count(),
            'zero_this_week'  => $zeroThisWeek,
            'improved'        => $improved,
            'halqa_rows'      => $halqaRows,
            'zero_pairs'      => $zeroPairs,
            'student_rows'    => $studentRows->sortBy('name')->values(),
            'pdf_url'         => '/admin/reports/weekly/pdf',
        ]);
    }

    public function weeklyReportPdf(): Response
    {
        $today      = Carbon::today();
        $weekStart  = $today->copy()->startOfWeek(Carbon::SUNDAY);
        $weekEnd    = $today->copy()->endOfWeek(Carbon::SATURDAY);
        $prevStart  = $weekStart->copy()->subWeek();
        $prevEnd    = $weekEnd->copy()->subWeek();

        $ids = User::where('role', 'student')->where('is_active', true)->pluck('id');

        $studentSubs = PairSubmission::whereIn('subject_student_id', $ids)
            ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->selectRaw('subject_student_id, COUNT(*) as cnt, SUM(page_to - page_from + 1) as pages')
            ->groupBy('subject_student_id')->get()->keyBy('subject_student_id');

        $prevStudentSubs = PairSubmission::whereIn('subject_student_id', $ids)
            ->whereBetween('submission_date', [$prevStart->toDateString(), $prevEnd->toDateString()])
            ->selectRaw('subject_student_id, COUNT(*) as cnt')
            ->groupBy('subject_student_id')->get()->keyBy('subject_student_id');

        $students = User::whereIn('id', $ids)->with('halqa:id,name')->orderBy('name')->get()
            ->map(fn ($s) => [
                'name'       => $s->name,
                'student_id' => $s->student_id,
                'halqa'      => $s->halqa?->name ?? '—',
                'this_week'  => (int) ($studentSubs[$s->id]->cnt  ?? 0),
                'last_week'  => (int) ($prevStudentSubs[$s->id]->cnt ?? 0),
                'pages'      => (int) ($studentSubs[$s->id]->pages ?? 0),
                'streak'     => $this->consistency->getStreak($s->id),
            ]);

        $halqas = Halqa::with(['members' => fn ($q) => $q->where('role','student')->where('is_active',true)])->get()
            ->map(function ($h) use ($weekStart, $weekEnd) {
                $memberIds = $h->members->pluck('id');
                if ($memberIds->isEmpty()) return null;
                $cnt  = PairSubmission::whereIn('subject_student_id', $memberIds)
                    ->whereBetween('submission_date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                    ->distinct('subject_student_id')->count('subject_student_id');
                return ['name' => $h->name, 'members' => $memberIds->count(), 'submitted' => $cnt, 'consistency' => round($cnt / $memberIds->count() * 100, 1)];
            })->filter()->sortByDesc('consistency')->values();

        $pdf = Pdf::loadView('pdf.weekly-report-admin', [
            'week_start' => $weekStart->format('d M Y'),
            'week_end'   => $weekEnd->format('d M Y'),
            'students'   => $students,
            'halqas'     => $halqas,
            'program_name' => ProgramSetting::get('program_name', "Muraja'a Monitor"),
        ]);
        $pdf->setPaper('A4', 'portrait');
        return $pdf->download('weekly-report-' . $weekStart->toDateString() . '.pdf');
    }
}
