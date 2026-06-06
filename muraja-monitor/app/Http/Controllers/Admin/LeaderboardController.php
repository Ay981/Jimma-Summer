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

        ProgramSnapshot::create([
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

        return back()->with('success', 'Leaderboard locked and archived.');
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
        $pages = PairSubmission::where('subject_student_id', $student->id)
            ->selectRaw('COALESCE(SUM(page_to - page_from + 1), 0) as pages')->value('pages') ?? 0;
        $consistency = app(\App\Services\ConsistencyService::class)->getConsistency($student->id);
        $programName = ProgramSetting::get('program_name', "Muraja'a Monitor");

        $pdf = Pdf::loadView('pdf.certificate', [
            'student'     => $student,
            'pages'       => $pages,
            'consistency' => $consistency,
            'program_name'=> $programName,
            'generated'   => now()->format('d F Y'),
        ]);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download("certificate-{$student->student_id}.pdf");
    }

    // ── Computations (public so ReportsController can reuse) ─────────────────

    public function studentBoard(): array
    {
        $today = Carbon::today();
        $start = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $programDays = max(1, $start->diffInDays($today) + 1);

        return User::where('role', 'student')
            ->where('is_active', true)
            ->get()
            ->map(function ($s) use ($programDays) {
                $subs    = PairSubmission::where('subject_student_id', $s->id)->get();
                $pages   = $subs->sum(fn ($r) => $r->page_to - $r->page_from + 1);
                $minutes = $subs->sum('minutes_spent');
                $total   = $subs->count();
                $cons    = round(($total / $programDays) * 100, 1);
                $badges  = Badge::where('user_id', $s->id)->count();
                $streak  = app(\App\Services\ConsistencyService::class)->getStreak($s->id);

                return ['id' => $s->id, 'name' => $s->name, 'student_id' => $s->student_id, 'halqa' => $s->halqa?->name ?? '—', 'consistency' => $cons, 'streak' => $streak, 'pages' => (int) $pages, 'minutes' => (int) $minutes, 'badges' => $badges];
            })
            ->sortByDesc('consistency')
            ->values()
            ->map(fn ($s, $i) => array_merge($s, ['rank' => $i + 1]))
            ->toArray();
    }

    public function pairBoard(): array
    {
        $today = Carbon::today();
        $start = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $programDays = max(1, $start->diffInDays($today) + 1);

        return Pair::with(['studentA', 'studentB', 'halqa'])->get()->map(function ($pair) use ($programDays) {
            $ids = array_filter([$pair->student_a_id, $pair->student_b_id]);
            $subs = PairSubmission::whereIn('subject_student_id', $ids)->get();
            $pages   = $subs->sum(fn ($r) => $r->page_to - $r->page_from + 1);
            $minutes = $subs->sum('minutes_spent');
            $total   = $subs->count();
            $cons    = round(($total / (count($ids) * $programDays)) * 100, 1);
            $streakA = app(\App\Services\ConsistencyService::class)->getStreak($pair->student_a_id);
            $streakB = $pair->student_b_id ? app(\App\Services\ConsistencyService::class)->getStreak($pair->student_b_id) : 0;

            return ['id' => $pair->id, 'student_a' => $pair->studentA?->name ?? '—', 'student_b' => $pair->studentB?->name ?? '—', 'halqa' => $pair->halqa?->name ?? '—', 'consistency' => $cons, 'pages' => (int) $pages, 'minutes' => (int) $minutes, 'streak' => max($streakA, $streakB)];
        })->sortByDesc('consistency')->values()->map(fn ($p, $i) => array_merge($p, ['rank' => $i + 1]))->toArray();
    }

    private function halqaBoard(): array
    {
        $today = Carbon::today();
        $start = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $programDays = max(1, $start->diffInDays($today) + 1);

        return Halqa::with(['pairs', 'members' => fn ($q) => $q->where('role', 'student')])->get()->map(function ($halqa) use ($programDays) {
            $ids = $halqa->members->pluck('id');
            if ($ids->isEmpty()) return null;
            $subs    = PairSubmission::whereIn('subject_student_id', $ids)->get();
            $pages   = $subs->sum(fn ($r) => $r->page_to - $r->page_from + 1);
            $total   = $subs->count();
            $cons    = round(($total / ($ids->count() * $programDays)) * 100, 1);
            $avgStreak = $ids->map(fn ($id) => app(\App\Services\ConsistencyService::class)->getStreak($id))->average();

            return ['id' => $halqa->id, 'name' => $halqa->name, 'pair_count' => $halqa->pairs->count(), 'member_count' => $ids->count(), 'consistency' => $cons, 'pages' => (int) $pages, 'avg_streak' => round($avgStreak, 1)];
        })->filter()->sortByDesc('consistency')->values()->map(fn ($h, $i) => array_merge($h, ['rank' => $i + 1]))->toArray();
    }

    /**
     * Part 6 — Best halqa leader leaderboard.
     * Scoring: meetings, attendance rate, contact notes, follow-ups resolved,
     * nudges, login frequency, members moved from at-risk to on-track.
     */
    private function leaderBoard(): array
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

        // Most Improved: biggest delta last 14 days vs first 14 days
        $today = Carbon::today();
        $start = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $firstEnd  = $start->copy()->addDays(13)->toDateString();
        $recentStart = $today->copy()->subDays(13)->toDateString();

        $improvedList = User::where('role', 'student')->where('is_active', true)->get()->map(function ($s) use ($start, $firstEnd, $recentStart, $today) {
            $firstSubs  = PairSubmission::where('subject_student_id', $s->id)->whereBetween('submission_date', [$start->toDateString(), $firstEnd])->count();
            $recentSubs = PairSubmission::where('subject_student_id', $s->id)->whereBetween('submission_date', [$recentStart, $today->toDateString()])->count();
            $delta = $recentSubs - $firstSubs;
            return ['id' => $s->id, 'name' => $s->name, 'delta' => $delta];
        })->sortByDesc('delta')->first();

        return [
            'most_consistent_students' => $mostConsistentStudents,
            'most_consistent_pair'     => $mostConsistentPair,
            'longest_streak'           => $longestStreak,
            'most_pages'               => $mostPages,
            'most_improved_student'    => $improvedList,
        ];
    }
}
