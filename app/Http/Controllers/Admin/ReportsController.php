<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactLog;
use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\ProgramSnapshot;
use App\Models\User;
use App\Services\ConsistencyService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Response;
use Inertia\Inertia;
use ZipArchive;

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

    public function exportCertificatesZip(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $threshold   = (int) ProgramSetting::get('certificate_threshold', 80);
        $programName = ProgramSetting::get('program_name', "Muraja'a Monitor");
        $today       = Carbon::today();
        $start       = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $days        = max(1, $start->diffInDays($today) + 1);

        $students = User::where('role', 'student')->where('is_active', true)->with('halqa')->get()->filter(function ($s) use ($days, $threshold) {
            $total = PairSubmission::where('subject_student_id', $s->id)->count();
            return round(($total / $days) * 100) >= $threshold;
        });

        $zipPath = storage_path('app/tmp-certificates-' . uniqid() . '.zip');
        $zip     = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        foreach ($students as $s) {
            $pages = PairSubmission::where('subject_student_id', $s->id)->selectRaw('COALESCE(SUM(page_to - page_from + 1), 0) as p')->value('p') ?? 0;
            $total = PairSubmission::where('subject_student_id', $s->id)->count();
            $cons  = round(($total / $days) * 100, 1);

            $pdf = Pdf::loadView('pdf.certificate', [
                'student'      => $s,
                'pages'        => (int) $pages,
                'consistency'  => $cons,
                'program_name' => $programName,
                'generated'    => $today->format('d F Y'),
            ]);
            $pdf->setPaper('A4', 'landscape');
            $zip->addFromString("certificate-{$s->student_id}.pdf", $pdf->output());
        }

        $zip->close();
        return response()->download($zipPath, 'certificates-' . today()->toDateString() . '.zip')->deleteFileAfterSend();
    }

    // ── Full program PDF report ───────────────────────────────────────────────

    public function exportProgramReport(): Response
    {
        $today        = Carbon::today();
        $start        = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $days         = max(1, $start->diffInDays($today) + 1);
        $programName  = ProgramSetting::get('program_name', "Muraja'a Monitor");

        $halqas  = Halqa::with(['leader:id,name', 'members' => fn ($q) => $q->where('role', 'student'), 'pairs'])->get();
        $leaders = User::where('role', 'leader')->with('ledHalqa')->get();

        // Build halqa stats
        $halqaStats = $halqas->map(function ($h) use ($days) {
            $ids   = $h->members->pluck('id');
            $total = $ids->isEmpty() ? 0 : PairSubmission::whereIn('subject_student_id', $ids)->count();
            $pages = $ids->isEmpty() ? 0 : PairSubmission::whereIn('subject_student_id', $ids)->selectRaw('COALESCE(SUM(page_to - page_from + 1),0) as p')->value('p');
            $cons  = $ids->isEmpty() ? 0 : round(($total / ($ids->count() * $days)) * 100, 1);
            return ['name' => $h->name, 'leader' => $h->leader?->name ?? '—', 'pairs' => $h->pairs->count(), 'members' => $ids->count(), 'consistency' => $cons, 'pages' => (int) $pages];
        })->toArray();

        // At-risk students
        $atRisk = User::where('role', 'student')->where('is_active', true)->get()->filter(function ($s) use ($days) {
            $total = PairSubmission::where('subject_student_id', $s->id)->count();
            $cons  = round(($total / $days) * 100, 1);
            $last  = PairSubmission::where('subject_student_id', $s->id)->orderByDesc('submission_date')->value('submission_date');
            $daysSince = $last ? Carbon::parse($last)->diffInDays(Carbon::today()) : 999;
            return $cons < 40 || $daysSince >= 7;
        })->map(fn ($s) => ['name' => $s->name, 'halqa' => $s->halqa?->name ?? '—'])->values()->toArray();

        // Leaderboard controller data
        $lb = new LeaderboardController();
        $students  = array_slice(invokable_method($lb, 'studentBoard'), 0, 10);
        $pairBoard = array_slice(invokable_method($lb, 'pairBoard'), 0, 10);
        $awards    = invokable_method($lb, 'awards');

        $pdf = Pdf::loadView('pdf.program-report', compact(
            'halqaStats', 'atRisk', 'students', 'pairBoard', 'awards',
            'programName', 'today', 'start', 'days', 'leaders'
        ));
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download("program-report-{$today->toDateString()}.pdf");
    }
}

// Helper for calling private methods on controller
function invokable_method(object $obj, string $method, array $args = []): mixed
{
    $ref = new \ReflectionMethod($obj, $method);
    $ref->setAccessible(true);
    return $ref->invoke($obj, ...$args);
}
