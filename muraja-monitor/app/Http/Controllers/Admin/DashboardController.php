<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairingRequest;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use App\Models\Watchlist;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $today        = Carbon::today();
        $programStart = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $window14     = $today->copy()->subDays(13);
        $effStart     = $programStart->gt($window14) ? $programStart->copy() : $window14->copy();
        $effDays      = max(1, $effStart->diffInDays($today) + 1);
        $effDates     = collect(range(0, $effDays - 1))->map(fn ($i) => $effStart->copy()->addDays($i)->toDateString());

        // ── Core counts ────────────────────────────────────────────────────────
        $totalStudents  = User::where('role', 'student')->count();
        $activeStudents = User::where('role', 'student')->where('is_active', true)->count();
        $totalPairs     = Pair::count();
        $pendingRequests= PairingRequest::count();

        $todaySubs = PairSubmission::where('submission_date', $today->toDateString())
            ->distinct('subject_student_id')->count('subject_student_id');

        // ── Bulk status for all active students ────────────────────────────────
        $students = User::where('role', 'student')->where('is_active', true)->get(['id']);
        $ids      = $students->pluck('id');

        $subs14 = PairSubmission::whereIn('subject_student_id', $ids)
            ->whereBetween('submission_date', [$window14->toDateString(), $today->toDateString()])
            ->get(['subject_student_id', 'submission_date'])
            ->groupBy('subject_student_id');

        $lastSubDates = PairSubmission::whereIn('subject_student_id', $ids)
            ->selectRaw('subject_student_id, MAX(submission_date::text) as last_sub')
            ->groupBy('subject_student_id')
            ->pluck('last_sub', 'subject_student_id');

        $last14Dates = collect(range(13, 0))->map(fn ($i) => $today->copy()->subDays($i)->toDateString());
        $statusCounts = ['on_track' => 0, 'slipping' => 0, 'at_risk' => 0, 'inactive' => 0];

        $studentStatuses = [];
        foreach ($ids as $id) {
            $s14     = ($subs14[$id] ?? collect())->keyBy(fn ($s) => Carbon::parse($s->submission_date)->toDateString());
            $lastSub = $lastSubDates[$id] ?? null;
            $sparkline = $last14Dates->map(fn ($d) => isset($s14[$d]) ? 1 : 0)->values()->toArray();
            $submitted = $effDates->filter(fn ($d) => isset($s14[$d]))->count();
            $cons = round(($submitted / $effDays) * 100, 1);
            $status = $this->quickStatus($sparkline, $cons, $lastSub, $effDays);
            $statusCounts[$status]++;
            $studentStatuses[$id] = ['status' => $status, 'cons' => $cons, 'last_sub' => $lastSub, 'sparkline' => $sparkline];
        }

        // ── Pulse score (0–100) ────────────────────────────────────────────────
        $pulse = $activeStudents > 0 ? (int) round(
            ($todaySubs / $activeStudents) * 60 +
            ($statusCounts['on_track'] / $activeStudents) * 30 +
            (1 - min(1, $statusCounts['at_risk'] / max(1, $activeStudents))) * 10
        ) : 0;

        // ── Drop-off: daily submission counts last 30 days ─────────────────────
        $dailySubs = PairSubmission::whereIn('subject_student_id', $ids)
            ->where('submission_date', '>=', $today->copy()->subDays(29)->toDateString())
            ->selectRaw('submission_date::text as date, COUNT(DISTINCT subject_student_id) as cnt')
            ->groupBy('submission_date')
            ->pluck('cnt', 'date');

        $dropOff = collect(range(29, 0))->map(function ($i) use ($today, $dailySubs) {
            $d = $today->copy()->subDays($i)->toDateString();
            return ['label' => Carbon::parse($d)->format('d M'), 'value' => (int) ($dailySubs[$d] ?? 0)];
        })->values()->toArray();

        // ── Weekly consistency trend (last 8 weeks) ────────────────────────────
        $weeklyTrend = $this->weeklyConsistencyTrend($ids, $programStart, $today);

        // ── Peak submission hours ──────────────────────────────────────────────
        $peakHours = PairSubmission::whereIn('subject_student_id', $ids)
            ->selectRaw("EXTRACT(HOUR FROM submitted_at)::int as hr, COUNT(*) as cnt")
            ->groupByRaw("EXTRACT(HOUR FROM submitted_at)::int")
            ->orderBy('hr')
            ->get()
            ->pluck('cnt', 'hr');

        $hourBars = collect(range(0, 23))->map(fn ($h) => [
            'label' => $h . 'h',
            'value' => (int) ($peakHours[$h] ?? 0),
        ])->toArray();

        // ── Never submitted ───────────────────────────────────────────────────
        $neverIds = $ids->diff($lastSubDates->keys());
        $neverList = User::whereIn('id', $neverIds)->get(['id', 'name', 'student_id'])->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'student_id' => $u->student_id])->toArray();

        // ── Retention curve (weekly) ───────────────────────────────────────────
        $retentionCurve = $this->retentionCurve($ids, $programStart, $today);

        // ── Early warning (on_track → at_risk in ~5 days) ─────────────────────
        $earlyWarning = $this->earlyWarning($studentStatuses, $ids);

        // ── Halqa engagement ──────────────────────────────────────────────────
        $halqaEngagement = $this->halqaEngagement($today);

        // ── Sankey data ────────────────────────────────────────────────────────
        $sankeyData = $this->sankeyData($studentStatuses);

        // ── Program calendar (last 60 days) ───────────────────────────────────
        $calendarSubs = PairSubmission::whereIn('subject_student_id', $ids)
            ->where('submission_date', '>=', $programStart->toDateString())
            ->selectRaw('submission_date::text as date, COUNT(DISTINCT subject_student_id) as cnt')
            ->groupBy('submission_date')
            ->pluck('cnt', 'date');

        $programDaysElapsed = max(1, $programStart->diffInDays($today) + 1);
        $calendar = collect(range(0, min(89, $programDaysElapsed - 1)))->map(function ($i) use ($programStart, $calendarSubs, $activeStudents) {
            $d   = $programStart->copy()->addDays($i)->toDateString();
            $cnt = (int) ($calendarSubs[$d] ?? 0);
            return ['date' => $d, 'count' => $cnt, 'pct' => $activeStudents > 0 ? round($cnt / $activeStudents * 100) : 0];
        })->toArray();

        // ── Suggested actions ─────────────────────────────────────────────────
        $actions = $this->suggestedActions($statusCounts, $pulse, $todaySubs, $activeStudents, count($neverList), $pendingRequests);

        // ── Recent subs ────────────────────────────────────────────────────────
        $recentSubs = PairSubmission::with('subject:id,name')
            ->orderByDesc('submitted_at')->take(8)->get()
            ->map(fn ($s) => ['name' => $s->subject?->name ?? '—', 'juz' => $s->juz, 'pages' => $s->page_to - $s->page_from + 1, 'time' => Carbon::parse($s->submitted_at)->diffForHumans()])->toArray();

        return Inertia::render('Admin/Dashboard', compact(
            'pulse', 'todaySubs', 'activeStudents', 'totalStudents',
            'statusCounts', 'dropOff', 'weeklyTrend', 'hourBars',
            'neverList', 'retentionCurve', 'earlyWarning', 'halqaEngagement',
            'sankeyData', 'calendar', 'actions', 'recentSubs',
        ) + ['program_start' => $programStart->toDateString()]);
    }

    // ── Analytics helpers ─────────────────────────────────────────────────────

    private function weeklyConsistencyTrend($ids, Carbon $start, Carbon $today): array
    {
        $weeks = [];
        for ($w = 7; $w >= 0; $w--) {
            $wEnd   = $today->copy()->subWeeks($w)->endOfDay();
            $wStart = $wEnd->copy()->subDays(6)->startOfDay();
            if ($wStart->lt($start)) $wStart = $start->copy();

            $days = max(1, $wStart->diffInDays($wEnd) + 1);
            $subs = PairSubmission::whereIn('subject_student_id', $ids)
                ->whereBetween('submission_date', [$wStart->toDateString(), $wEnd->toDateString()])
                ->distinct('subject_student_id')
                ->count('subject_student_id');

            $weeks[] = ['label' => 'Wk ' . $wEnd->format('d/m'), 'value' => round(($subs / max(1, $ids->count() * $days)) * 100 * $days, 1)];
        }
        return $weeks;
    }

    private function retentionCurve($ids, Carbon $start, Carbon $today): array
    {
        $curves = [];
        $programWeeks = max(1, (int) ceil($start->diffInDays($today) / 7));
        $first = PairSubmission::whereIn('subject_student_id', $ids)
            ->selectRaw('subject_student_id, MIN(submission_date) as first_sub')
            ->groupBy('subject_student_id')
            ->pluck('first_sub', 'subject_student_id');

        for ($w = 1; $w <= min(8, $programWeeks); $w++) {
            $wEnd   = $start->copy()->addWeeks($w)->subDay()->toDateString();
            $wStart = $start->copy()->addWeeks($w - 1)->toDateString();
            $active = PairSubmission::whereIn('subject_student_id', $ids)
                ->whereBetween('submission_date', [$wStart, $wEnd])
                ->distinct('subject_student_id')
                ->count('subject_student_id');
            $curves[] = ['label' => "Wk {$w}", 'value' => $ids->count() > 0 ? round($active / $ids->count() * 100, 1) : 0];
        }
        return $curves;
    }

    private function earlyWarning(array $studentStatuses, $ids): array
    {
        $warnings = [];
        $students = User::whereIn('id', array_keys($studentStatuses))->get(['id', 'name'])->keyBy('id');
        foreach ($studentStatuses as $id => $s) {
            $spark = $s['sparkline'];
            // Count trailing misses in last 5 days
            $recent5 = array_slice($spark, -5);
            $misses  = count(array_filter($recent5, fn ($v) => $v === 0));
            // Warn if 3-4 misses in last 5 days but status not yet at_risk
            if ($misses >= 3 && $s['status'] !== 'at_risk' && $s['status'] !== 'inactive') {
                $warnings[] = ['id' => $id, 'name' => $students[$id]?->name ?? '—', 'missed_of_5' => $misses, 'consistency' => $s['cons']];
            }
        }
        return array_slice($warnings, 0, 10);
    }

    private function halqaEngagement(Carbon $today): array
    {
        return Halqa::with(['pairs.studentA:id,name', 'pairs.studentB:id,name'])->get()->map(function ($halqa) use ($today) {
            $memberIds = $halqa->pairs->flatMap(fn ($p) => array_filter([$p->student_a_id, $p->student_b_id]))->unique();
            if ($memberIds->isEmpty()) return null;
            $weekStart = $today->copy()->startOfWeek(Carbon::SATURDAY)->toDateString();
            $submitted  = PairSubmission::whereIn('subject_student_id', $memberIds)
                ->where('submission_date', '>=', $weekStart)->distinct('subject_student_id')->count('subject_student_id');
            $score = round($submitted / $memberIds->count() * 100);
            return ['name' => $halqa->name, 'score' => $score, 'members' => $memberIds->count()];
        })->filter()->values()->toArray();
    }

    private function sankeyData(array $statuses): array
    {
        $halqas  = Halqa::with(['members' => fn ($q) => $q->where('role', 'student')])->get();
        $nodes   = [];
        $links   = [];

        foreach ($halqas as $halqa) {
            $nodes[] = ['id' => 'h' . $halqa->id, 'label' => $halqa->name, 'type' => 'halqa'];
            foreach ($halqa->members as $student) {
                $cons = $statuses[$student->id]['cons'] ?? 0;
                $nodes[] = ['id' => 's' . $student->id, 'label' => $student->name, 'type' => 'student'];
                $links[]  = ['source' => 'h' . $halqa->id, 'target' => 's' . $student->id, 'value' => max(1, $cons)];
            }
        }
        return ['nodes' => $nodes, 'links' => $links];
    }

    private function suggestedActions(array $sc, int $pulse, int $todaySubs, int $active, int $never, int $pending): array
    {
        $actions = [];
        if ($pulse < 40) $actions[] = ['icon' => '🔴', 'text' => "Low pulse ({$pulse}/100) today — " . ($active - $todaySubs) . " students haven't submitted.", 'href' => '/admin/outreach', 'label' => 'Open Outreach'];
        if ($sc['at_risk'] > 0)  $actions[] = ['icon' => '⚠', 'text' => "{$sc['at_risk']} student(s) at risk of dropping out.", 'href' => '/admin/students', 'label' => 'Review Students'];
        if ($sc['inactive'] > 0) $actions[] = ['icon' => '🔕', 'text' => "{$sc['inactive']} student(s) inactive 7+ days.", 'href' => '/admin/outreach', 'label' => 'Send Reminder'];
        if ($never > 0)          $actions[] = ['icon' => '📭', 'text' => "{$never} student(s) have never submitted.", 'href' => '/admin/students', 'label' => 'View List'];
        if ($pending > 0)        $actions[] = ['icon' => '🤝', 'text' => "{$pending} pair request(s) waiting for review.", 'href' => '/admin/pairs', 'label' => 'Review Requests'];
        if (empty($actions))     $actions[] = ['icon' => '✅', 'text' => "Everything looks good. Pulse: {$pulse}/100.", 'href' => null, 'label' => null];
        return $actions;
    }

    private function quickStatus(array $sp, float $cons, ?string $lastSub, int $effDays): string
    {
        if (!$lastSub) return $effDays <= 2 ? 'on_track' : 'inactive';
        if (Carbon::parse($lastSub)->diffInDays(Carbon::today()) >= 7) return 'inactive';
        $lookback = min(count($sp), $effDays); $consecutive = 0;
        for ($i = count($sp) - 1; $i >= count($sp) - $lookback; $i--) { if ($sp[$i] === 0) $consecutive++; else break; }
        if ($consecutive >= 4 || ($effDays >= 7 && $cons < 40)) return 'at_risk';
        if ($consecutive >= 2) return 'slipping';
        if ($cons >= 70) return 'on_track';
        return 'slipping';
    }
}
