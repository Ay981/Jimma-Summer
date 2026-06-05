<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AyatRotation;
use App\Models\Badge;
use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Services\BadgeService;
use App\Services\ConsistencyService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ConsistencyService $consistency,
        private readonly BadgeService $badges,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user()->load('halqa.leader');
        $today = now()->toDateString();

        // ── Pair & Partner ───────────────────────────────────────────────────
        $pair = Pair::where(function ($q) use ($user) {
            $q->where('student_a_id', $user->id)->orWhere('student_b_id', $user->id);
        })->with(['studentA', 'studentB'])->first();

        $partner = null;
        if ($pair) {
            $partner = $pair->student_a_id === $user->id ? $pair->studentB : $pair->studentA;
        }

        // ── Today ────────────────────────────────────────────────────────────
        $todaySubmission = PairSubmission::where('subject_student_id', $user->id)
            ->where('submission_date', $today)
            ->first();

        // ── Stats ────────────────────────────────────────────────────────────
        $stats = PairSubmission::where('subject_student_id', $user->id)
            ->selectRaw('COALESCE(SUM(page_to - page_from + 1), 0) as pages_total, COALESCE(SUM(minutes_spent), 0) as minutes_total')
            ->first();

        // ── Weekly progress ──────────────────────────────────────────────────
        $weekStart   = Carbon::now()->startOfWeek(Carbon::SUNDAY)->toDateString();
        $weekEnd     = Carbon::now()->endOfWeek(Carbon::SATURDAY)->toDateString();
        $weekPages   = PairSubmission::where('subject_student_id', $user->id)
            ->whereBetween('submission_date', [$weekStart, $weekEnd])
            ->selectRaw('COALESCE(SUM(page_to - page_from + 1), 0) as total')
            ->value('total') ?? 0;

        // ── 30-day heatmap ───────────────────────────────────────────────────
        $submittedDates = PairSubmission::where('subject_student_id', $user->id)
            ->where('submission_date', '>=', now()->subDays(29)->toDateString())
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->flip()
            ->toArray();

        $checkins30Days = collect(range(29, 0))->map(fn ($daysAgo) => [
            'date'      => now()->subDays($daysAgo)->toDateString(),
            'submitted' => isset($submittedDates[now()->subDays($daysAgo)->toDateString()]),
        ])->values()->toArray();

        // ── Ayat (rotates daily) ─────────────────────────────────────────────
        $ayatCount = AyatRotation::count();
        $ayat = $ayatCount > 0
            ? AyatRotation::skip((now()->dayOfYear - 1) % $ayatCount)->first()
            : null;

        // ── Weekly summary (Fridays) ─────────────────────────────────────────
        $weeklySummary = null;
        if (now()->dayOfWeek === Carbon::FRIDAY) {
            $weekSubs = PairSubmission::where('subject_student_id', $user->id)
                ->whereBetween('submission_date', [$weekStart, $weekEnd])
                ->count();
            $weeklySummary = [
                'submitted'   => $weekSubs,
                'consistency' => round(($weekSubs / 7) * 100),
            ];
        }

        // ── Badges ───────────────────────────────────────────────────────────
        $earnedBadges  = Badge::where('user_id', $user->id)->get()
            ->map(fn ($b) => ['type' => $b->badge_type, 'earned_at' => $b->earned_at->format('M d, Y')]);
        $earnedTypes   = $earnedBadges->pluck('type')->toArray();
        $lockedBadges  = collect(array_keys(BadgeService::DEFINITIONS))
            ->reject(fn ($t) => in_array($t, $earnedTypes, true))
            ->values();

        // ── Halqa rank ───────────────────────────────────────────────────────
        $halqaRank = $totalHalqas = null;
        if ($user->halqa_id) {
            $totalHalqas = Halqa::count();
            // Simplified rank — full calculation on halqa page
            $halqaRank = 1;
        }

        return Inertia::render('Student/Dashboard', [
            'name'              => $user->name,
            'streak'            => $this->consistency->getStreak($user->id),
            'consistency'       => $this->consistency->getConsistency($user->id),
            'pages_total'       => (int) ($stats->pages_total ?? 0),
            'minutes_total'     => (int) ($stats->minutes_total ?? 0),
            'weekly_target'     => $user->weekly_target,
            'week_pages'        => (int) $weekPages,
            'today_submitted'   => $todaySubmission !== null,
            'today_submission'  => $todaySubmission ? [
                'id'           => $todaySubmission->id,
                'juz'          => $todaySubmission->juz,
                'page_from'    => $todaySubmission->page_from,
                'page_to'      => $todaySubmission->page_to,
                'minutes_spent'=> $todaySubmission->minutes_spent,
            ] : null,
            'pair_id'           => $pair?->id,
            'partner'           => $partner ? [
                'name'            => $partner->name,
                'phone'           => $partner->phone,
                'today_submitted' => PairSubmission::where('subject_student_id', $partner->id)
                    ->where('submission_date', $today)->exists(),
            ] : null,
            'halqa'             => $user->halqa ? [
                'name'              => $user->halqa->name,
                'leader_name'       => $user->halqa->leader?->name ?? '—',
                'group_consistency' => $this->consistency->getGroupConsistency($user->halqa_id),
                'rank'              => $halqaRank,
                'total_halqas'      => $totalHalqas,
            ] : null,
            'ayat'              => $ayat ? ['text' => $ayat->text, 'reference' => $ayat->reference] : null,
            'checkins_30_days'  => $checkins30Days,
            'earned_badges'     => $earnedBadges,
            'locked_badges'     => $lockedBadges,
            'weekly_summary'    => $weeklySummary,
            'personal_best'     => [
                'longest_streak'  => $this->consistency->getLongestStreak($user->id),
                'most_pages_week' => $this->consistency->getMostPagesInWeek($user->id),
            ],
        ]);
    }

    public function updateWeeklyTarget(Request $request): RedirectResponse
    {
        $request->validate(['weekly_target' => ['required', 'integer', 'min:1', 'max:604']]);
        $request->user()->update(['weekly_target' => $request->weekly_target]);
        return back()->with('success', 'Weekly target updated.');
    }
}
