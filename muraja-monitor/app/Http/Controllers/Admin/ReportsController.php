<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\GeneratePdfReport;
use App\Models\AuditLog;
use App\Models\ContactLog;
use App\Models\Halqa;
use App\Models\MeetingLog;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\PdfExport;
use App\Models\ProgramSetting;
use App\Models\User;
use App\Models\Watchlist;
use App\Services\ConsistencyService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Response;
use Inertia\Inertia;

class ReportsController extends Controller
{
    /** Principal surah that opens each juz, for the Juz Coverage chart labels (ASCII for SVG safety). */
    private const JUZ_SURAH = [
        1 => 'Al-Fatihah', 2 => 'Al-Baqarah', 3 => 'Al-Baqarah', 4 => 'Aal-Imran',
        5 => 'An-Nisa', 6 => 'An-Nisa', 7 => 'Al-Maidah', 8 => 'Al-Anam',
        9 => 'Al-Araf', 10 => 'Al-Anfal', 11 => 'At-Tawbah', 12 => 'Hud',
        13 => 'Yusuf', 14 => 'Al-Hijr', 15 => 'Al-Isra', 16 => 'Al-Kahf',
        17 => 'Al-Anbiya', 18 => 'Al-Muminun', 19 => 'Al-Furqan', 20 => 'An-Naml',
        21 => 'Al-Ankabut', 22 => 'Al-Ahzab', 23 => 'Ya-Sin', 24 => 'Az-Zumar',
        25 => 'Fussilat', 26 => 'Al-Ahqaf', 27 => 'Adh-Dhariyat', 28 => 'Al-Mujadilah',
        29 => 'Al-Mulk', 30 => 'An-Naba',
    ];

    public function __construct(private readonly ConsistencyService $consistency) {}

    public function toggleCertificatesPublished(): \Illuminate\Http\RedirectResponse
    {
        $current = (bool) ProgramSetting::get('certificates_published', false);
        ProgramSetting::set('certificates_published', $current ? '0' : '1');
        $msg = $current ? 'Certificates removed from dashboards.' : 'Certificates are now visible in student and leader dashboards.';
        return back()->with('success', $msg);
    }

    public function index(): \Inertia\Response
    {
        return Inertia::render('Admin/Reports', [
            'program_name'           => ProgramSetting::get('program_name', "Muraja'a Monitor"),
            'certificates_published' => (bool) ProgramSetting::get('certificates_published', false),
            'exports'                => PdfExport::where('requested_by', auth()->id())
                ->orderByDesc('created_at')
                ->take(5)
                ->get()
                ->map(fn ($e) => [
                    'id'            => $e->id,
                    'status'        => $e->status,
                    'error_message' => $e->error_message,
                    'created_at'    => $e->created_at->diffForHumans(),
                    'download_url'  => $e->status === 'ready'
                        ? "/admin/reports/exports/{$e->id}/download"
                        : null,
                ])
                ->toArray(),
        ]);
    }

    // ── CSV formula injection sanitizer ──────────────────────────────────────

    private function csvSafe(?string $value): string
    {
        $v = $value ?? '';
        // Neutralise formula injection: prefix dangerous leading chars with a tab
        if ($v !== '' && in_array($v[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            $v = "\t" . $v;
        }
        // Escape embedded double-quotes
        return str_replace('"', '""', $v);
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
                '"' . $this->csvSafe($r->subject?->name) . '"',
                $r->subject?->student_id ?? '',
                '"' . $this->csvSafe($r->pair?->halqa?->name) . '"',
                $r->juz,
                $r->page_from,
                $r->page_to,
                $r->page_to - $r->page_from + 1,
                $r->minutes_spent,
                Carbon::parse($r->submission_date)->toDateString(),
                Carbon::parse($r->submitted_at)->format('Y-m-d H:i'),
                '"' . $this->csvSafe($r->submitter?->name) . '"',
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
            $cons    = $this->consistency->getConsistency($s->id) ?? 0.0;
            $streak  = $this->consistency->getStreak($s->id);

            $csv .= implode(',', [
                '"' . $this->csvSafe($s->name) . '"',
                $s->student_id,
                '"' . $this->csvSafe($s->halqa?->name) . '"',
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
                '"' . $this->csvSafe($l->student?->name) . '"',
                $l->student?->student_id ?? '',
                '"' . $this->csvSafe($l->contactedBy?->name) . '"',
                $l->method,
                '"' . $this->csvSafe($l->note) . '"',
                Carbon::parse($l->contacted_at)->format('Y-m-d H:i'),
                $l->follow_up_required ? 'yes' : 'no',
            ]) . "\n";
        }

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="contact-log-' . today()->toDateString() . '.csv"',
        ]);
    }

    // ── Batch completion certificates ZIP (async) ────────────────────────────

    public function exportCertificatesZip(): \Illuminate\Http\RedirectResponse
    {
        $export = PdfExport::create([
            'requested_by' => auth()->id(),
            'report_type'  => 'certificates_zip',
            'status'       => 'queued',
        ]);

        GeneratePdfReport::dispatch($export->id, 'certificates_zip');

        return back()->with('success', "Preparing certificates — you'll get a notification with a download link when the ZIP is ready.");
    }

    // ── Download a completed async export ────────────────────────────────────

    public function downloadExport(PdfExport $export): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        abort_if($export->status !== 'ready', 404, 'Export is not ready yet.');
        abort_if(
            !$export->file_path || !\Illuminate\Support\Facades\Storage::exists($export->file_path),
            404,
            'Export file not found — it may have expired.'
        );

        $filename = match ($export->report_type) {
            'certificates_zip' => 'certificates-' . now()->toDateString() . '.zip',
            default            => basename($export->file_path),
        };

        return \Illuminate\Support\Facades\Storage::download($export->file_path, $filename);
    }

    // ── Full program PDF report — direct download ─────────────────────────────

    public function exportProgramReport(): Response
    {
        $today       = Carbon::today();
        $start       = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $endRaw      = ProgramSetting::get('program_end_date');
        $end         = $endRaw ? Carbon::parse($endRaw) : $today;
        $days        = max(1, $start->diffInDays($today) + 1);
        $programName = ProgramSetting::get('program_name', "Muraja'a Monitor");

        $studentIds    = User::where('role', 'student')->pluck('id');
        $activeIds     = User::where('role', 'student')->where('is_active', true)->pluck('id');
        $totalStudents = $studentIds->count();
        $activeCount   = $activeIds->count();
        $inactiveCount = $totalStudents - $activeCount;

        // ── Page 2: program-wide overview totals ──
        $totalSubmissions = PairSubmission::whereIn('subject_student_id', $studentIds)->count();
        $totalPages       = (int) (PairSubmission::whereIn('subject_student_id', $studentIds)
            ->selectRaw('COALESCE(SUM(page_to - page_from + 1),0) as p')->value('p') ?? 0);
        $totalMinutes     = (int) PairSubmission::whereIn('subject_student_id', $studentIds)->sum('minutes_spent');
        // Program-wide consistency = average of each active student's scheduled-day consistency.
        $progConsistency  = $activeCount > 0
            ? round($activeIds->map(fn ($id) => $this->consistency->getConsistency($id) ?? 0)->average(), 1)
            : 0;

        $overview = [
            'total_students'   => $totalStudents,
            'total_submissions'=> $totalSubmissions,
            'total_pages'      => $totalPages,
            'total_minutes'    => $totalMinutes,
            'consistency'      => $progConsistency,
            'active'           => $activeCount,
            'inactive'         => $inactiveCount,
        ];

        // ── Pages 3 & 6: weekly series (submissions / consistency / minutes / pages) ──
        $weeks  = [];
        $cursor = $start->copy();
        $wi     = 1;
        while ($cursor->lte($today) && $wi <= 30) {
            $weekEnd  = $cursor->copy()->addDays(6);
            $rangeEnd = $weekEnd->gt($today) ? $today : $weekEnd;
            $base = PairSubmission::whereIn('subject_student_id', $studentIds)
                ->whereBetween('submission_date', [$cursor->toDateString(), $rangeEnd->toDateString()]);
            $subs = (clone $base)->count();
            $mins = (int) (clone $base)->sum('minutes_spent');
            $pgs  = (int) ((clone $base)->selectRaw('COALESCE(SUM(page_to - page_from + 1),0) as p')->value('p') ?? 0);
            $daysInWeek = $cursor->diffInDays($rangeEnd) + 1;
            $cons = $activeCount > 0 ? round($subs / max(1, $activeCount * $daysInWeek) * 100, 1) : 0;
            $weeks[] = ['label' => 'W' . $wi, 'submissions' => $subs, 'consistency' => $cons, 'minutes' => $mins, 'pages' => $pgs];
            $cursor->addDays(7);
            $wi++;
        }

        // ── Page 5: juz coverage (distinct students who revised each juz) ──
        $juzRows = PairSubmission::whereIn('subject_student_id', $studentIds)
            ->selectRaw('juz, COUNT(DISTINCT subject_student_id) as cnt')
            ->groupBy('juz')->pluck('cnt', 'juz');
        $juzCoverage = [];
        foreach (range(1, 30) as $j) {
            $juzCoverage[] = ['juz' => $j, 'surah' => self::JUZ_SURAH[$j] ?? '', 'count' => (int) ($juzRows[$j] ?? 0)];
        }

        // ── Page 4: halqa performance (with meetings held) ──
        $cs = $this->consistency;
        $halqas = Halqa::with(['leader:id,name', 'members' => fn ($q) => $q->where('role', 'student'), 'pairs'])->get();
        $halqaStats = $halqas->map(function ($h) use ($cs) {
            $ids   = $h->members->pluck('id');
            $pages = $ids->isEmpty() ? 0 : (int) (PairSubmission::whereIn('subject_student_id', $ids)->selectRaw('COALESCE(SUM(page_to - page_from + 1),0) as p')->value('p') ?? 0);
            $cons  = $ids->isEmpty() ? 0 : $cs->getGroupConsistency($h->id);
            $meetings = MeetingLog::where('halqa_id', $h->id)->where('state', 'final')->count();
            return ['name' => $h->name, 'leader' => $h->leader?->name ?? '—', 'pairs' => $h->pairs->count(), 'members' => $ids->count(), 'consistency' => $cons, 'pages' => $pages, 'meetings' => $meetings];
        })->sortByDesc('consistency')->values()->toArray();

        // ── Pages 7/8/9: leaderboard-derived data ──
        $lb       = new LeaderboardController();
        $students = array_map(function ($s) {
            $last  = PairSubmission::where('subject_student_id', $s['id'])->max('submission_date');
            $stale = $last ? Carbon::parse($last)->diffInDays(Carbon::today()) >= 7 : true;
            if (!$last)                                       $s['status'] = 'inactive';
            elseif ($s['consistency'] >= 70 && !$stale)       $s['status'] = 'on_track';
            elseif ($s['consistency'] >= 40)                  $s['status'] = 'slipping';
            else                                              $s['status'] = 'at_risk';
            return $s;
        }, $lb->studentBoard());

        // Enrich leader rows with two report-only metrics the PDF expects:
        //  • recovered — students this leader flagged on the watchlist and later
        //    resolved (resolved_at set when removed from the watchlist).
        //  • logins    — leader sign-ins recorded since the program started.
        $leaders = array_map(function ($l) use ($start) {
            $l['recovered'] = Watchlist::where('added_by', $l['id'])
                ->whereNotNull('resolved_at')
                ->count();
            $l['logins'] = AuditLog::where('user_id', $l['id'])
                ->where('action', 'login')
                ->where('created_at', '>=', $start)
                ->count();
            return $l;
        }, $lb->leaderBoard());

        $awards  = $lb->awards();

        $pdf = Pdf::loadView('pdf.program-report', [
            'programName' => $programName,
            'today'       => $today,
            'start'       => $start,
            'end'         => $end,
            'days'        => $days,
            'overview'    => $overview,
            'weeks'       => $weeks,
            'juzCoverage' => $juzCoverage,
            'halqaStats'  => $halqaStats,
            'students'    => $students,
            'leaders'     => $leaders,
            'awards'      => $awards,
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
