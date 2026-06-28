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
use Illuminate\Support\Facades\Cache;
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

        [$students, $pairs, $halqas, $leaders, $awards] = Cache::remember('leaderboard_data', 300, function () {
            $students = $this->studentBoard();
            $pairs    = $this->pairBoard();
            $halqas   = $this->halqaBoard();
            $leaders  = $this->leaderBoard();
            $awards   = $this->awards($students, $pairs);
            return [$students, $pairs, $halqas, $leaders, $awards];
        });

        return Inertia::render('Admin/Leaderboard', [
            'students'   => $students,
            'pairs'      => $pairs,
            'halqas'     => $halqas,
            'leaders'    => $leaders,
            'awards'     => $awards,
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

        Cache::forget('leaderboard_data');

        $students = $this->studentBoard();
        $pairs    = $this->pairBoard();

        $snapshot = ProgramSnapshot::create([
            'program_name'  => $request->program_name,
            'ended_at'      => now(),
            'snapshot_data' => [
                'students' => $students,
                'pairs'    => $pairs,
                'halqas'   => $this->halqaBoard(),
                'leaders'  => $this->leaderBoard(),
                'awards'   => $this->awards($students, $pairs),
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
     * Bulk version of certificateData() — loads all student data in a fixed number
     * of queries regardless of cohort size, then maps per student.
     * Returns array keyed by student ID.
     *
     * @param \Illuminate\Support\Collection<int, User> $students Must have 'halqa' relation loaded.
     */
    public function batchCertificateData(\Illuminate\Support\Collection $students, array $awardMap): array
    {
        if ($students->isEmpty()) return [];

        $studentIds  = $students->pluck('id');
        $today       = Carbon::today();
        $start       = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $endRaw      = ProgramSetting::get('program_end_date');
        $end         = $endRaw ? Carbon::parse($endRaw) : $today;
        $programName = ProgramSetting::get('program_name', "Muraja'a Monitor");

        // ── Bulk queries (constant count regardless of N) ─────────────────────

        $pages = PairSubmission::whereIn('subject_student_id', $studentIds)
            ->selectRaw('subject_student_id, COALESCE(SUM(page_to - page_from + 1), 0) as p')
            ->groupBy('subject_student_id')
            ->pluck('p', 'subject_student_id');

        $juzCovered = PairSubmission::whereIn('subject_student_id', $studentIds)
            ->select('subject_student_id', 'juz')
            ->distinct()
            ->get()
            ->groupBy('subject_student_id')
            ->map->count();

        $badgeCounts = Badge::whereIn('user_id', $studentIds)
            ->selectRaw('user_id, COUNT(*) as cnt')
            ->groupBy('user_id')
            ->pluck('cnt', 'user_id');

        $minutes = PairSubmission::whereIn('subject_student_id', $studentIds)
            ->selectRaw('subject_student_id, COALESCE(SUM(minutes_spent), 0) as m')
            ->groupBy('subject_student_id')
            ->pluck('m', 'subject_student_id');

        $avgTests = \App\Models\MurajaTest::whereIn('student_id', $studentIds)
            ->selectRaw('student_id, ROUND(AVG(score)::numeric, 1) as avg_score')
            ->groupBy('student_id')
            ->pluck('avg_score', 'student_id');

        $allTests = \App\Models\MurajaTest::whereIn('student_id', $studentIds)
            ->orderBy('tested_at')
            ->get()
            ->groupBy('student_id')
            ->map(fn ($rows) => $rows->map(fn ($t) => [
                'date'      => Carbon::parse($t->tested_at)->format('d M Y'),
                'from_juz'  => $t->from_juz,
                'to_juz'    => $t->to_juz,
                'from_page' => $t->from_page,
                'to_page'   => $t->to_page,
                'score'     => $t->score,
            ])->toArray());

        // Pairs: one query, then fan-out to partner name lookup
        $pairs = Pair::where(
            fn ($q) => $q->whereIn('student_a_id', $studentIds)->orWhereIn('student_b_id', $studentIds)
        )->get();

        $partnerIdMap = []; // student_id → partner_user_id
        foreach ($pairs as $pair) {
            if ($studentIds->contains($pair->student_a_id)) {
                $partnerIdMap[$pair->student_a_id] = $pair->student_b_id;
            }
            if ($studentIds->contains($pair->student_b_id)) {
                $partnerIdMap[$pair->student_b_id] = $pair->student_a_id;
            }
        }
        $partnerUserIds = collect($partnerIdMap)->values()->filter()->unique();
        $partnerNames   = $partnerUserIds->isNotEmpty()
            ? User::whereIn('id', $partnerUserIds)->pluck('name', 'id')
            : collect();

        // Leaderboard board — cached, shared across all students
        $board         = Cache::remember('leaderboard_data', 300, function () {
            $s = $this->studentBoard();
            $p = $this->pairBoard();
            return [$s, $p, $this->halqaBoard(), $this->leaderBoard(), $this->awards($s, $p)];
        });
        $allRanked     = collect($board[0]);
        $totalStudents = $allRanked->count();

        // ConsistencyService is scoped + in-memory cached — one call per student is fine
        $cs = app(\App\Services\ConsistencyService::class);

        $results = [];
        foreach ($students as $student) {
            $entry = $allRanked->firstWhere('id', $student->id);

            $results[$student->id] = [
                'student'        => $student,
                'consistency'    => $cs->getConsistency($student->id) ?? 0,
                'pages'          => (int) ($pages->get($student->id, 0)),
                'streak'         => $cs->getStreak($student->id),
                'juz_covered'    => (int) ($juzCovered->get($student->id, 0)),
                'badges'         => (int) ($badgeCounts->get($student->id, 0)),
                'halqa'          => $student->halqa?->name,
                'partner'        => $partnerNames->get($partnerIdMap[$student->id] ?? 0),
                'start'          => $start->format('d M Y'),
                'end'            => $end->format('d M Y'),
                'program_name'   => $programName,
                'generated'      => $today->format('d F Y'),
                'award'          => $awardMap[$student->id] ?? null,
                'avg_test'       => (float) $avgTests->get($student->id, 0),
                'minutes'        => (int) $minutes->get($student->id, 0),
                'rank'           => $entry['rank'] ?? $totalStudents,
                'total_students' => $totalStudents,
                'rank_score'     => $entry['rank_score'] ?? 0,
                'tests'          => $allTests->get($student->id, []),
            ];
        }

        return $results;
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
        $minutes     = (int) (PairSubmission::where('subject_student_id', $student->id)->sum('minutes_spent') ?? 0);
        $avgTest     = round(\App\Models\MurajaTest::where('student_id', $student->id)->avg('score') ?? 0, 1);
        $tests       = \App\Models\MurajaTest::where('student_id', $student->id)
            ->orderBy('tested_at')
            ->get()
            ->map(fn ($t) => [
                'date'      => Carbon::parse($t->tested_at)->format('d M Y'),
                'from_juz'  => $t->from_juz,
                'to_juz'    => $t->to_juz,
                'from_page' => $t->from_page,
                'to_page'   => $t->to_page,
                'score'     => $t->score,
            ])->toArray();

        // Re-use cached board for rank computation
        $board         = Cache::remember('leaderboard_data', 300, function () {
            $s = $this->studentBoard();
            $p = $this->pairBoard();
            return [$s, $p, $this->halqaBoard(), $this->leaderBoard(), $this->awards($s, $p)];
        });
        $allRanked     = collect($board[0]);
        $entry         = $allRanked->firstWhere('id', $student->id);
        $rank          = $entry['rank'] ?? $allRanked->count();
        $totalStudents = $allRanked->count();
        $maxPages      = $allRanked->max('pages') ?: 1;
        $rankScore     = $entry['rank_score'] ?? 0;

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
            'award'          => $awardMap[$student->id] ?? null,
            'avg_test'       => $avgTest,
            'minutes'        => $minutes,
            'rank'           => $rank,
            'total_students' => $totalStudents,
            'rank_score'     => $rankScore,
            'tests'          => $tests,
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

        $students = User::where('role', 'student')
            ->where('is_active', true)
            ->with('halqa')
            ->get();

        $studentIds = $students->pluck('id');

        // 3 bulk queries instead of N×3
        $allSubs = PairSubmission::whereIn('subject_student_id', $studentIds)
            ->get()
            ->groupBy('subject_student_id');

        $badgeCounts = Badge::whereIn('user_id', $studentIds)
            ->selectRaw('user_id, COUNT(*) as cnt')
            ->groupBy('user_id')
            ->pluck('cnt', 'user_id');

        $testAvgs = \App\Models\MurajaTest::whereIn('student_id', $studentIds)
            ->selectRaw('student_id, ROUND(AVG(score)::numeric, 2) as avg_score')
            ->groupBy('student_id')
            ->pluck('avg_score', 'student_id');

        $mapped = $students->map(function ($s) use ($consistency, $allSubs, $badgeCounts, $testAvgs) {
            $subs    = $allSubs->get($s->id, collect());
            $pages   = (int) $subs->sum(fn ($r) => $r->page_to - $r->page_from + 1);
            $minutes = (int) $subs->sum('minutes_spent');
            $badges  = (int) ($badgeCounts->get($s->id, 0));
            $cons    = $consistency->getConsistency($s->id) ?? 0;
            $streak  = $consistency->getStreak($s->id);
            $avgTest = round((float) ($testAvgs->get($s->id, 0)), 2);

            return ['id' => $s->id, 'name' => $s->name, 'student_id' => $s->student_id, 'halqa' => $s->halqa?->name ?? '—', 'consistency' => $cons, 'streak' => $streak, 'pages' => $pages, 'minutes' => $minutes, 'badges' => $badges, 'avg_test_score' => $avgTest];
        });

        $maxPages = $mapped->max('pages') ?: 1;

        return $mapped
            ->map(function ($s) use ($maxPages) {
                $testScore  = ($s['avg_test_score'] / 10) * 50;
                $pagesScore = ($s['pages'] / $maxPages) * 30;
                $consScore  = ($s['consistency'] / 100) * 20;
                $s['rank_score'] = round($testScore + $pagesScore + $consScore, 2);
                return $s;
            })
            ->sortByDesc('rank_score')
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

    public function halqaBoard(): array
    {
        $consistency = app(\App\Services\ConsistencyService::class);

        $halqas = Halqa::with(['pairs', 'members'])->get()->map(function ($halqa) use ($consistency) {
            $ids = $halqa->members->pluck('id');
            if ($ids->isEmpty()) return null;

            $subs      = PairSubmission::whereIn('subject_student_id', $ids)->get();
            $pages     = (int) $subs->sum(fn ($r) => $r->page_to - $r->page_from + 1);
            $cons      = round($ids->map(fn ($id) => $consistency->getConsistency($id) ?? 0)->average(), 1);
            $avgStreak = round($ids->map(fn ($id) => $consistency->getStreak($id))->average(), 1);
            $avgTest   = round(\App\Models\MurajaTest::whereIn('student_id', $ids)->avg('score') ?? 0, 2);
            $leaderName = $halqa->leader?->name ?? '—';

            return [
                'id'           => $halqa->id,
                'name'         => $halqa->name,
                'leader_name'  => $leaderName,
                'pair_count'   => $halqa->pairs->count(),
                'member_count' => $ids->count(),
                'consistency'  => $cons,
                'avg_test_score' => $avgTest,
                'pages'        => $pages,
                'avg_streak'   => $avgStreak,
            ];
        })->filter()->values();

        $maxPages = $halqas->max('pages') ?: 1;

        return $halqas->map(function ($h) use ($maxPages) {
            $score = round(
                ($h['consistency'] / 100 * 40) +
                ($h['avg_test_score'] / 10 * 30) +
                ($h['pages'] / $maxPages * 20) +
                (min($h['avg_streak'], 30) / 30 * 10),
                2
            );
            return array_merge($h, ['score' => $score]);
        })->sortByDesc('score')->values()->map(fn ($h, $i) => array_merge($h, ['rank' => $i + 1]))->toArray();
    }

    public function leaderBoard(): array
    {
        $today = Carbon::today();
        $start = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $daysSinceStart = max(1, $start->diffInDays($today));
        $programWeeks   = max(1, $daysSinceStart / 7);

        $cs = app(\App\Services\ConsistencyService::class);

        $leaders = User::where('role', 'leader')->where('is_active', true)->with('ledHalqa')->get();

        return $leaders->map(function ($leader) use ($today, $start, $programWeeks, $cs) {
            $halqa = $leader->ledHalqa;
            if (!$halqa) return null;

            $studentIds   = User::where('halqa_id', $halqa->id)->where('role', 'student')->pluck('id');
            $studentsCount = $studentIds->count();

            // ── Group Output (0–60 pts) ───────────────────────────────────────

            // avg_consistency / 100 × 30
            $avgConsistency = $studentsCount > 0
                ? round($studentIds->map(fn ($id) => $cs->getConsistency($id) ?? 0)->average(), 2)
                : 0;
            $groupConsScore = $avgConsistency / 100 * 30;

            // avg_test_score / 10 × 20
            $avgTestScore = $studentsCount > 0
                ? round(\App\Models\MurajaTest::whereIn('student_id', $studentIds)->avg('score') ?? 0, 2)
                : 0;
            $groupTestScore = $avgTestScore / 10 * 20;

            // consistency delta: early (first 14 days) vs late (last 14 days)
            $earlyFrom = $start->copy();
            $earlyTo   = $start->copy()->addDays(13);
            $lateFrom  = $today->copy()->subDays(13);
            $lateTo    = $today->copy();

            $earlyConsistencies = $studentIds->map(fn ($id) => $this->consistencyInWindow($id, $earlyFrom, $earlyTo));
            $lateConsistencies  = $studentIds->map(fn ($id) => $this->consistencyInWindow($id, $lateFrom, $lateTo));

            $earlyAvg = $studentsCount > 0 ? $earlyConsistencies->average() : 0;
            $lateAvg  = $studentsCount > 0 ? $lateConsistencies->average()  : 0;
            $deltaPct = max(0, $lateAvg - $earlyAvg);
            $deltaScore = $deltaPct / 100 * 10;

            $groupOutput = round($groupConsScore + $groupTestScore + $deltaScore, 2);

            // ── Leader Activity (0–40 pts) ────────────────────────────────────

            // Tests per student (0–15)
            $testsCount   = \App\Models\MurajaTest::where('leader_id', $leader->id)->count();
            $testsScore   = min(1, $testsCount / max(1, $studentsCount * 2)) * 15;

            // Meetings finalised (0–10)
            $finalMeetings   = MeetingLog::where('halqa_id', $halqa->id)->where('state', 'final')->count();
            $meetingsScore   = min(1, $finalMeetings / max(1, $programWeeks)) * 10;

            // Contact notes (0–10)
            $contactNotes    = ContactLog::where('contacted_by', $leader->id)->count();
            $contactScore    = min(1, $contactNotes / max(1, $studentsCount)) * 10;

            // Flags reviewed (0–5)
            $flagsReviewed   = PairSubmission::where('flag_reviewed_by', $leader->id)
                ->whereNotNull('flag_verdict')
                ->count();
            $flagsScore      = min(5, $flagsReviewed);

            $activityScore = round($testsScore + $meetingsScore + $contactScore + $flagsScore, 2);

            $score = round($groupOutput + $activityScore, 2);

            return [
                'id'                 => $leader->id,
                'name'               => $leader->name,
                'halqa'              => $halqa->name,
                'score'              => $score,
                'group_output'       => $groupOutput,
                'activity_score'     => $activityScore,
                'avg_consistency'    => round($avgConsistency, 1),
                'avg_test_score'     => round($avgTestScore, 1),
                'consistency_delta'  => round($deltaPct, 1),
                'tests_count'        => $testsCount,
                'meetings'           => $finalMeetings,
                'contact_notes'      => $contactNotes,
                'flags_reviewed'     => $flagsReviewed,
                'students_count'     => $studentsCount,
            ];
        })->filter()->sortByDesc('score')->values()->map(fn ($l, $i) => array_merge($l, ['rank' => $i + 1]))->toArray();
    }

    public function leaderCertificate(User $leader)
    {
        $data = $this->buildLeaderCertificateData($leader);
        $pdf  = Pdf::loadView('pdf.leader-certificate', $data)->setPaper('a4', 'landscape');
        return $pdf->download("leader-certificate-{$leader->id}.pdf");
    }

    public function buildLeaderCertificateData(User $leader): array
    {
        $today       = Carbon::today();
        $board       = $this->leaderBoard();
        $allLeaders  = count($board);
        $entry       = collect($board)->firstWhere('id', $leader->id);

        if (!$entry) {
            // Leader has no halqa — return minimal data
            return [
                'leader'            => $leader,
                'rank'              => 0,
                'score'             => 0,
                'group_output'      => 0,
                'activity_score'    => 0,
                'avg_consistency'   => 0,
                'avg_test_score'    => 0,
                'consistency_delta' => 0,
                'tests_count'       => 0,
                'meetings'          => 0,
                'contact_notes'     => 0,
                'flags_reviewed'    => 0,
                'students_count'    => 0,
                'halqa'             => '—',
                'is_best'           => false,
                'program_name'      => ProgramSetting::get('program_name', "IRSHAD Summer Muraja'a 1448"),
                'all_leaders_count' => $allLeaders,
                'generated'         => $today->format('d F Y'),
            ];
        }

        return [
            'leader'            => $leader,
            'rank'              => $entry['rank'],
            'score'             => $entry['score'],
            'group_output'      => $entry['group_output'],
            'activity_score'    => $entry['activity_score'],
            'avg_consistency'   => $entry['avg_consistency'],
            'avg_test_score'    => $entry['avg_test_score'],
            'consistency_delta' => $entry['consistency_delta'],
            'tests_count'       => $entry['tests_count'],
            'meetings'          => $entry['meetings'],
            'contact_notes'     => $entry['contact_notes'],
            'flags_reviewed'    => $entry['flags_reviewed'],
            'students_count'    => $entry['students_count'],
            'halqa'             => $entry['halqa'],
            'is_best'           => $entry['rank'] === 1,
            'program_name'      => ProgramSetting::get('program_name', "IRSHAD Summer Muraja'a 1448"),
            'all_leaders_count' => $allLeaders,
            'generated'         => $today->format('d F Y'),
        ];
    }

    public function halqaCertificate(Halqa $halqa)
    {
        $today = Carbon::today();
        $board = $this->halqaBoard();
        $entry = collect($board)->firstWhere('id', $halqa->id);

        $cs = app(\App\Services\ConsistencyService::class);
        $allStudents = User::where('role', 'student')->where('is_active', true)->get();
        $maxPages    = $allStudents->map(function ($s) {
            return (int) (PairSubmission::where('subject_student_id', $s->id)
                ->selectRaw('COALESCE(SUM(page_to - page_from + 1), 0) as p')->value('p') ?? 0);
        })->max() ?: 1;

        $students = $halqa->members->map(function ($s) use ($cs, $maxPages) {
            $pages   = (int) (PairSubmission::where('subject_student_id', $s->id)
                ->selectRaw('COALESCE(SUM(page_to - page_from + 1), 0) as p')->value('p') ?? 0);
            $cons    = $cs->getConsistency($s->id) ?? 0;
            $avgTest = round(\App\Models\MurajaTest::where('student_id', $s->id)->avg('score') ?? 0, 1);
            $rankScore = round(($avgTest / 10 * 50) + ($pages / $maxPages * 30) + ($cons / 100 * 20), 2);

            return [
                'id'         => $s->id,
                'name'       => $s->name,
                'student_id' => $s->student_id,
                'consistency'=> round($cons, 1),
                'avg_test'   => $avgTest,
                'pages'      => $pages,
                'rank_score' => $rankScore,
            ];
        })->sortByDesc('rank_score')->values()->toArray();

        $data = [
            'halqa'        => $halqa,
            'name'         => $halqa->name,
            'leader_name'  => $entry['leader_name'] ?? ($halqa->leader?->name ?? '—'),
            'rank'         => $entry['rank'] ?? 0,
            'score'        => $entry['score'] ?? 0,
            'consistency'  => $entry['consistency'] ?? 0,
            'avg_test_score' => $entry['avg_test_score'] ?? 0,
            'pages'        => $entry['pages'] ?? 0,
            'avg_streak'   => $entry['avg_streak'] ?? 0,
            'is_best'      => ($entry['rank'] ?? 0) === 1,
            'students'     => $students,
            'program_name' => ProgramSetting::get('program_name', "IRSHAD Summer Muraja'a 1448"),
            'generated'    => $today->format('d F Y'),
        ];

        $pdf = Pdf::loadView('pdf.halqa-certificate', $data)->setPaper('a4', 'landscape');
        return $pdf->download("halqa-certificate-{$halqa->id}.pdf");
    }

    private function consistencyInWindow(int $userId, Carbon $from, Carbon $to): float
    {
        $days = max(1, $from->diffInDays($to) + 1);
        $subs = PairSubmission::where('subject_student_id', $userId)
            ->whereBetween('submission_date', [$from->toDateString(), $to->toDateString()])
            ->count();
        return round(($subs / $days) * 100, 1);
    }

    public function awards(?array $students = null, ?array $pairs = null): array
    {
        $students = $students ?? $this->studentBoard();
        $pairs    = $pairs    ?? $this->pairBoard();

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

        $activeStudents = User::where('role', 'student')->where('is_active', true)->get();
        $studentIds     = $activeStudents->pluck('id');

        // Bulk-load submissions for both windows — avoids N×2 queries
        $earlyDays = max(1, $firstFrom->diffInDays($firstTo) + 1);
        $lateDays  = max(1, $lastFrom->diffInDays($today) + 1);

        $earlySubs = PairSubmission::whereIn('subject_student_id', $studentIds)
            ->whereBetween('submission_date', [$firstFrom->toDateString(), $firstTo->toDateString()])
            ->selectRaw('subject_student_id, COUNT(*) as cnt')
            ->groupBy('subject_student_id')
            ->pluck('cnt', 'subject_student_id');

        $lateSubs = PairSubmission::whereIn('subject_student_id', $studentIds)
            ->whereBetween('submission_date', [$lastFrom->toDateString(), $today->toDateString()])
            ->selectRaw('subject_student_id, COUNT(*) as cnt')
            ->groupBy('subject_student_id')
            ->pluck('cnt', 'subject_student_id');

        $improvedList = $activeStudents->map(function ($s) use ($earlySubs, $lateSubs, $earlyDays, $lateDays) {
            $from = round(((int) $earlySubs->get($s->id, 0) / $earlyDays) * 100, 1);
            $to   = round(((int) $lateSubs->get($s->id, 0)  / $lateDays)  * 100, 1);
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
