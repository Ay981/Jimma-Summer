<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\ContactLog;
use App\Models\Halqa;
use App\Models\MeetingActionItem;
use App\Models\MeetingLog;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\ProgramSnapshot;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    public function index(): Response
    {
        $today      = Carbon::today();
        $programEnd = ProgramSetting::get('program_end_date');
        $isEnded    = $programEnd && $today->gt(Carbon::parse($programEnd));
        $isLocked   = ProgramSnapshot::orderByDesc('created_at')->exists();

        return Inertia::render('Admin/Leaderboard', [
            'students'   => $this->studentBoard(),
            'pairs'      => $this->pairBoard(),
            'halqas'     => $this->halqaBoard(),
            'leaders'    => $this->leaderBoard(),
            'awards'     => $this->awards(),
            'is_ended'   => $isEnded && !$isLocked,
            'is_locked'  => $isLocked,
            'snapshots'  => ProgramSnapshot::orderByDesc('created_at')->get()->map(fn ($s) => [
                'id'         => $s->id,
                'name'       => $s->program_name,
                'ended_at'   => Carbon::parse($s->ended_at)->toDateString(),
                'created_at' => Carbon::parse($s->created_at)->toDateString(),
            ])->toArray(),
        ]);
    }

    public function lock(Request $request): RedirectResponse
    {
        $request->validate(['program_name' => ['required', 'string', 'max:255']]);

        $snapshot = ProgramSnapshot::create([
            'program_name'  => $request->program_name,
            'ended_at'      => now(),
            'snapshot_data' => [
                'students' => $this->studentBoard(),
                'pairs'    => $this->pairBoard(),
                'halqas'   => $this->halqaBoard(),
                'leaders'  => $this->leaderBoard(),
                'awards'   => $this->awards(),
            ],
        ]);

        $this->generateAndStorePdf($snapshot);

        return back()->with('success', 'Leaderboard locked, archived, and PDF saved.');
    }

    public function snapshotPdf(ProgramSnapshot $snapshot)
    {
        // Serve stored file if it exists, otherwise generate on the fly
        if ($snapshot->report_pdf_path && \Storage::exists($snapshot->report_pdf_path)) {
            return \Storage::download($snapshot->report_pdf_path, \Str::slug($snapshot->program_name) . '-report.pdf');
        }

        $pdf = Pdf::loadView('pdf.program-snapshot', ['snapshot' => $snapshot]);
        $pdf->setPaper('A4', 'portrait');
        return $pdf->download(\Str::slug($snapshot->program_name) . '-report.pdf');
    }

    public function compare(Request $request): Response
    {
        $snapshots = ProgramSnapshot::orderByDesc('ended_at')->get();

        $aId = $request->query('a');
        $bId = $request->query('b');

        $snapA = $aId ? $snapshots->firstWhere('id', $aId) : $snapshots->get(0);
        $snapB = $bId ? $snapshots->firstWhere('id', $bId) : $snapshots->get(1);

        $comparison = null;
        if ($snapA && $snapB) {
            $comparison = $this->buildComparison($snapA, $snapB);
        }

        return Inertia::render('Admin/SnapshotCompare', [
            'snapshots'  => $snapshots->map(fn ($s) => ['id' => $s->id, 'name' => $s->program_name, 'ended_at' => $s->ended_at->toDateString()])->values(),
            'snap_a'     => $snapA ? ['id' => $snapA->id, 'name' => $snapA->program_name] : null,
            'snap_b'     => $snapB ? ['id' => $snapB->id, 'name' => $snapB->program_name] : null,
            'comparison' => $comparison,
        ]);
    }

    private function buildComparison(ProgramSnapshot $a, ProgramSnapshot $b): array
    {
        $studA = collect($a->snapshot_data['students'] ?? [])->keyBy('student_id');
        $studB = collect($b->snapshot_data['students'] ?? [])->keyBy('student_id');

        // Students who appear in both
        $both = $studA->intersectByKeys($studB)->map(function ($sa, $sid) use ($studB) {
            $sb = $studB[$sid];
            return [
                'name'             => $sa['name'],
                'student_id'       => $sid,
                'consistency_a'    => $sa['consistency'],
                'consistency_b'    => $sb['consistency'],
                'consistency_delta'=> round($sb['consistency'] - $sa['consistency'], 1),
                'pages_a'          => $sa['pages'],
                'pages_b'          => $sb['pages'],
                'pages_delta'      => $sb['pages'] - $sa['pages'],
                'streak_a'         => $sa['streak'],
                'streak_b'         => $sb['streak'],
            ];
        })->values()->sortByDesc('consistency_delta')->values()->toArray();

        return [
            'total_students_a'   => $studA->count(),
            'total_students_b'   => $studB->count(),
            'avg_consistency_a'  => $studA->count() ? round($studA->avg('consistency'), 1) : 0,
            'avg_consistency_b'  => $studB->count() ? round($studB->avg('consistency'), 1) : 0,
            'avg_pages_a'        => $studA->count() ? round($studA->avg('pages')) : 0,
            'avg_pages_b'        => $studB->count() ? round($studB->avg('pages')) : 0,
            'returning_students' => count($both),
            'students'           => $both,
        ];
    }

    public function generateAndStorePdf(ProgramSnapshot $snapshot): void
    {
        $pdf  = Pdf::loadView('pdf.program-snapshot', ['snapshot' => $snapshot]);
        $pdf->setPaper('A4', 'portrait');
        $path = 'snapshots/' . $snapshot->id . '-' . \Str::slug($snapshot->program_name) . '.pdf';
        \Storage::put($path, $pdf->output());
        $snapshot->update(['report_pdf_path' => $path]);
    }

    public function unlock(Request $request): RedirectResponse
    {
        // Admins can delete the most recent snapshot to unlock
        $latest = ProgramSnapshot::orderByDesc('created_at')->first();
        if ($latest) {
            $latest->delete();
            return back()->with('success', 'Leaderboard unlocked. Last snapshot removed.');
        }
        return back()->with('error', 'No snapshot to unlock.');
    }

    public function certificate(User $student)
    {
        $pdf = Pdf::loadView('pdf.certificate', $this->certificateData($student));
        $pdf->setPaper('A4', 'portrait');

        return $pdf->download("certificate-{$student->student_id}.pdf");
    }

    /**
     * Build the full data payload for a completion certificate.
     * Shared by the single-download (here) and the batch ZIP (ReportsController).
     * Pass a pre-computed $awardMap to avoid recomputing awards() per student.
     */
    public function certificateData(User $student, ?array $awardMap = null): array
    {
        $today   = Carbon::today();
        $start   = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $endRaw  = ProgramSetting::get('program_end_date');
        $end     = $endRaw ? Carbon::parse($endRaw) : $today;

        $pages = (int) (PairSubmission::where('subject_student_id', $student->id)
            ->selectRaw('COALESCE(SUM(page_to - page_from + 1), 0) as p')->value('p') ?? 0);
        $juzCovered  = (int) PairSubmission::where('subject_student_id', $student->id)->distinct('juz')->count('juz');
        $consistency = app(\App\Services\ConsistencyService::class)->getConsistency($student->id);
        $streak      = app(\App\Services\ConsistencyService::class)->getStreak($student->id);
        $badges      = Badge::where('user_id', $student->id)->count();

        // Revision partner — the other member of the student's pair
        $pair      = Pair::where('student_a_id', $student->id)->orWhere('student_b_id', $student->id)->first();
        $partnerId = $pair ? ($pair->student_a_id == $student->id ? $pair->student_b_id : $pair->student_a_id) : null;
        $partner   = $partnerId ? User::find($partnerId)?->name : null;

        $awardMap = $awardMap ?? $this->studentAwardMap();

        return [
            'student'      => $student,
            'consistency'  => $consistency,
            'pages'        => $pages,
            'streak'       => $streak,
            'juz_covered'  => $juzCovered,
            'badges'       => $badges,
            'halqa'        => $student->halqa?->name,
            'partner'      => $partner,
            'start'        => $start->format('d M Y'),
            'end'          => $end->format('d M Y'),
            'program_name' => ProgramSetting::get('program_name', "Muraja'a Monitor"),
            'generated'    => $today->format('d F Y'),
            'award'        => $awardMap[$student->id] ?? null,
        ];
    }

    /**
     * Map of student_id => award {title, place, place_label} for certificate banners.
     * A student keeps the first (most prestigious) award matched.
     */
    public function studentAwardMap(): array
    {
        $a   = $this->awards();
        $map = [];
        $placeLabels = [1 => '1st Place', 2 => '2nd Place', 3 => '3rd Place'];
        $set = function ($id, $title, $place) use (&$map, $placeLabels) {
            if ($id && !isset($map[$id])) {
                $map[$id] = ['title' => $title, 'place' => $place, 'place_label' => $placeLabels[$place] ?? ''];
            }
        };

        foreach ($a['most_consistent_students'] ?? [] as $i => $s) {
            $set($s['id'] ?? null, 'Most Consistent Student', $i + 1);
        }
        $set($a['longest_streak']['id'] ?? null, 'Longest Streak', 1);
        $set($a['most_pages']['id'] ?? null, 'Most Pages Reviewed', 1);
        $set($a['most_improved_student']['id'] ?? null, 'Most Improved', 1);

        return $map;
    }

    // ── Computations (public so ReportsController can reuse) ─────────────────

    public function studentBoard(): array
    {
        $consistency = app(\App\Services\ConsistencyService::class);

        return User::where('role', 'student')
            ->where('is_active', true)
            ->get()
            ->map(function ($s) use ($consistency) {
                $subs    = PairSubmission::where('subject_student_id', $s->id)->get();
                $pages   = $subs->sum(fn ($r) => $r->page_to - $r->page_from + 1);
                $minutes = $subs->sum('minutes_spent');
                $badges  = Badge::where('user_id', $s->id)->count();
                $cons    = $consistency->getConsistency($s->id) ?? 0;
                $streak  = $consistency->getStreak($s->id);

                return ['id' => $s->id, 'name' => $s->name, 'student_id' => $s->student_id, 'halqa' => $s->halqa?->name ?? '—', 'consistency' => $cons, 'streak' => $streak, 'pages' => (int) $pages, 'minutes' => (int) $minutes, 'badges' => $badges];
            })
            ->sort(fn ($a, $b) => $b['pages'] <=> $a['pages'] ?: $b['consistency'] <=> $a['consistency'])
            ->values()
            ->map(fn ($s, $i) => array_merge($s, ['rank' => $i + 1]))
            ->toArray();
    }

    public function pairBoard(): array
    {
        $consistency = app(\App\Services\ConsistencyService::class);

        return Pair::with(['studentA', 'studentB', 'halqa'])->get()->map(function ($pair) use ($consistency) {
            $ids     = array_filter([$pair->student_a_id, $pair->student_b_id]);
            $subs    = PairSubmission::whereIn('subject_student_id', $ids)->get();
            $pages   = $subs->sum(fn ($r) => $r->page_to - $r->page_from + 1);
            $minutes = $subs->sum('minutes_spent');
            $consA   = $consistency->getConsistency($pair->student_a_id) ?? 0;
            $consB   = $pair->student_b_id ? ($consistency->getConsistency($pair->student_b_id) ?? 0) : 0;
            $cons    = count($ids) > 1 ? round(($consA + $consB) / 2, 1) : $consA;
            $streakA = $consistency->getStreak($pair->student_a_id);
            $streakB = $pair->student_b_id ? $consistency->getStreak($pair->student_b_id) : 0;

            return ['id' => $pair->id, 'student_a' => $pair->studentA?->name ?? '—', 'student_b' => $pair->studentB?->name ?? '—', 'halqa' => $pair->halqa?->name ?? '—', 'consistency' => $cons, 'pages' => (int) $pages, 'minutes' => (int) $minutes, 'streak' => max($streakA, $streakB)];
        })->sort(fn ($a, $b) => $b['pages'] <=> $a['pages'] ?: $b['consistency'] <=> $a['consistency'])->values()->map(fn ($p, $i) => array_merge($p, ['rank' => $i + 1]))->toArray();
    }

    private function halqaBoard(): array
    {
        $consistency = app(\App\Services\ConsistencyService::class);

        return Halqa::with(['pairs', 'members' => fn ($q) => $q->where('role', 'student')])->get()->map(function ($halqa) use ($consistency) {
            $ids = $halqa->members->pluck('id');
            if ($ids->isEmpty()) return null;
            $subs      = PairSubmission::whereIn('subject_student_id', $ids)->get();
            $pages     = $subs->sum(fn ($r) => $r->page_to - $r->page_from + 1);
            $cons      = round($ids->map(fn ($id) => $consistency->getConsistency($id) ?? 0)->average(), 1);
            $avgStreak = round($ids->map(fn ($id) => $consistency->getStreak($id))->average(), 1);

            return ['id' => $halqa->id, 'name' => $halqa->name, 'pair_count' => $halqa->pairs->count(), 'member_count' => $ids->count(), 'consistency' => $cons, 'pages' => (int) $pages, 'avg_streak' => $avgStreak];
        })->filter()->sort(fn ($a, $b) => $b['pages'] <=> $a['pages'] ?: $b['consistency'] <=> $a['consistency'])->values()->map(fn ($h, $i) => array_merge($h, ['rank' => $i + 1]))->toArray();
    }

    /**
     * Part 6 — Best halqa leader leaderboard.
     * Scoring: meetings, attendance rate, contact notes, follow-ups resolved,
     * nudges, login frequency, members moved from at-risk to on-track.
     */
    public function leaderBoard(): array
    {
        $today = Carbon::today();
        $start = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));

        $leaders = User::where('role', 'leader')->where('is_active', true)->with('ledHalqa')->get();

        return $leaders->map(function ($leader) use ($today, $start) {
            $halqa = $leader->ledHalqa;
            if (!$halqa) return null;

            // Meetings held (finalised only — state = 'final')
            $meetings = MeetingLog::where('halqa_id', $halqa->id)->where('state', 'final')->get();
            $meetingCount = $meetings->count();

            // Average attendance rate across meetings
            $studentCount = \App\Models\User::where('halqa_id', $halqa->id)->where('role', 'student')->count();
            $avgAttendance = $meetingCount > 0 && $studentCount > 0
                ? round($meetings->avg('attendance_count') / max(1, $studentCount) * 100, 1)
                : 0;

            // Contact notes written
            $contactNotes = ContactLog::where('contacted_by', $leader->id)->count();

            // Follow-ups: action items resolved vs created
            $totalActions   = MeetingActionItem::whereHas('meeting', fn ($q) => $q->where('halqa_id', $halqa->id))->count();
            $resolvedActions= MeetingActionItem::whereHas('meeting', fn ($q) => $q->where('halqa_id', $halqa->id))->where('status', 'resolved')->count();

            // Nudges sent
            $nudges = ContactLog::where('contacted_by', $leader->id)
                ->where('note', 'like', '[Nudge]%')
                ->count();

            // Login frequency during program
            $loginCount = \App\Models\AuditLog::where('user_id', $leader->id)
                ->where('action', 'login')
                ->where('created_at', '>=', $start->toDateString())
                ->count();

            // Members recovered: students who had at-risk contact and later improved
            $contactedAtRiskIds = ContactLog::where('contacted_by', $leader->id)
                ->pluck('student_id')
                ->unique();
            $recoveredCount = 0;
            foreach ($contactedAtRiskIds as $sid) {
                $student = \App\Models\User::find($sid);
                if (!$student) continue;
                $preCons  = $this->consistencyInWindow($sid, $start->copy(), $start->copy()->addDays(6));
                $postCons = $this->consistencyInWindow($sid, $today->copy()->subDays(6), $today->copy());
                if ($preCons < 40 && $postCons >= 70) $recoveredCount++;
            }

            // Weighted score
            $score = ($meetingCount * 10)
                   + ($avgAttendance * 0.5)
                   + ($contactNotes * 2)
                   + ($resolvedActions * 5)
                   + ($nudges * 1)
                   + ($loginCount * 0.5)
                   + ($recoveredCount * 15);

            return [
                'id'               => $leader->id,
                'name'             => $leader->name,
                'halqa'            => $halqa->name,
                'meetings'         => $meetingCount,
                'avg_attendance'   => $avgAttendance,
                'contact_notes'    => $contactNotes,
                'resolved_actions' => $resolvedActions,
                'total_actions'    => $totalActions,
                'nudges'           => $nudges,
                'logins'           => $loginCount,
                'recovered'        => $recoveredCount,
                'score'            => round($score, 1),
            ];
        })->filter()->sortByDesc('score')->values()->map(fn ($l, $i) => array_merge($l, ['rank' => $i + 1]))->toArray();
    }

    private function consistencyInWindow(int $userId, Carbon $from, Carbon $to): float
    {
        $days = max(1, $from->diffInDays($to) + 1);
        $subs = PairSubmission::where('subject_student_id', $userId)
            ->whereBetween('submission_date', [$from->toDateString(), $to->toDateString()])
            ->count();
        return round(($subs / $days) * 100, 1);
    }

    public function awards(): array
    {
        $students = $this->studentBoard();
        $pairs    = $this->pairBoard();

        $mostConsistentStudents = array_slice($students, 0, 3);
        $mostConsistentPair     = $pairs[0] ?? null;
        $longestStreak = collect($students)->sortByDesc('streak')->first();
        $mostPages     = collect($students)->sortByDesc('pages')->first();

        // Most Improved: biggest consistency-% gain, last 14 days vs first 14 days
        $today = Carbon::today();
        $start = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $firstFrom = $start->copy();
        $firstTo   = $start->copy()->addDays(13);
        $lastFrom  = $today->copy()->subDays(13);

        $improvedList = User::where('role', 'student')->where('is_active', true)->get()->map(function ($s) use ($firstFrom, $firstTo, $lastFrom, $today) {
            $from = $this->consistencyInWindow($s->id, $firstFrom, $firstTo);
            $to   = $this->consistencyInWindow($s->id, $lastFrom, $today);
            return [
                'id'          => $s->id,
                'name'        => $s->name,
                'from'        => $from,
                'to'          => $to,
                'improvement' => round($to - $from, 1),
                'delta'       => round($to - $from, 1),
            ];
        })->sortByDesc('improvement')->first();

        return [
            'most_consistent_students' => $mostConsistentStudents,
            'most_consistent_pair'     => $mostConsistentPair,
            'longest_streak'           => $longestStreak,
            'most_pages'               => $mostPages,
            'most_improved_student'    => $improvedList,
        ];
    }
}
