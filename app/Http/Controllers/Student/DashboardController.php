<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AyatRotation;
use App\Models\Badge;
use App\Models\Halqa;
use App\Models\MissedSubmissionExcuse;
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
        // Has the logged-in user already filed a submission for their partner (or self if solo)?
        $todaySubmission = $partner
            ? PairSubmission::where('submitted_by', $user->id)
                ->where('subject_student_id', $partner->id)
                ->where('submission_date', $today)
                ->first()
            : PairSubmission::where('submitted_by', $user->id)
                ->where('subject_student_id', $user->id)
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

        // ── Missed days eligible for excuse (scheduled, no submission, within 48h, no excuse yet) ──
        $availableDays   = $user->available_days ?? [];
        $programStart    = Carbon::parse(ProgramSetting::get('program_start_date', now()->toDateString()));
        $excusableMissed = [];
        if (!empty($availableDays)) {
            $existingExcuses = MissedSubmissionExcuse::where('student_id', $user->id)
                ->pluck('missed_date')
                ->map(fn ($d) => Carbon::parse($d)->toDateString())
                ->flip()->toArray();

            $submittedDays = PairSubmission::where('subject_student_id', $user->id)
                ->where('submission_date', '>=', Carbon::today()->subDays(2)->toDateString())
                ->pluck('submission_date')
                ->map(fn ($d) => Carbon::parse($d)->toDateString())
                ->flip()->toArray();

            // Check up to last 2 days (48-hour window)
            for ($dAgo = 1; $dAgo <= 2; $dAgo++) {
                $d = Carbon::today()->subDays($dAgo);
                if ($d->lt($programStart)) continue;
                $dayName = strtolower($d->format('l'));
                if (!in_array($dayName, $availableDays, true)) continue;
                $ds = $d->toDateString();
                if (isset($submittedDays[$ds])) continue;
                if (isset($existingExcuses[$ds])) continue;
                $weekEnd = $d->copy()->endOfWeek(Carbon::SATURDAY);
                if ($weekEnd->lt(Carbon::today())) continue; // same-week makeup no longer possible
                $excusableMissed[] = [
                    'date'         => $ds,
                    'label'        => $d->format('l, M d'),
                    'deadline'     => $d->copy()->addHours(48)->toIso8601String(),
                    'week_end'     => $weekEnd->toDateString(),
                ];
            }
        }

        // ── Pending excuses (filed, makeup not yet fulfilled) ────────────────
        $pendingExcuses = MissedSubmissionExcuse::where('student_id', $user->id)
            ->where('fulfilled', false)
            ->where('makeup_date', '>=', $today)
            ->get()
            ->map(fn ($e) => [
                'missed_date' => $e->missed_date->toDateString(),
                'makeup_date' => $e->makeup_date->toDateString(),
                'reason'      => $e->reason,
            ])->values()->toArray();

        // ── 30-day heatmap (bounded by program start + user created_at) ─────────
        $userJoined     = Carbon::parse($user->created_at)->startOfDay();
        $heatmapLower   = $programStart->gt($userJoined) ? $programStart->copy() : $userJoined->copy();
        $heatmapStart   = now()->subDays(29)->startOfDay();
        // The actual start of visible cells: whichever is later
        $visibleStart   = $heatmapLower->gt($heatmapStart) ? $heatmapLower->copy() : $heatmapStart->copy();

        $submittedDates = PairSubmission::where('subject_student_id', $user->id)
            ->where('submission_date', '>=', $visibleStart->toDateString())
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->flip()
            ->toArray();

        // Dates of missed days that were fulfilled via makeup — colour the MISSED day amber
        $makeupDates = MissedSubmissionExcuse::where('student_id', $user->id)
            ->where('fulfilled', true)
            ->pluck('missed_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->flip()
            ->toArray();

        $checkins30Days = collect(range(29, 0))->map(function ($daysAgo) use ($visibleStart, $submittedDates, $makeupDates) {
            $date = now()->subDays($daysAgo)->toDateString();
            $inProgram = Carbon::parse($date)->gte($visibleStart);
            return [
                'date'       => $date,
                'submitted'  => isset($submittedDates[$date]) || isset($makeupDates[$date]),
                'is_makeup'  => isset($makeupDates[$date]),
                'scheduled'  => $inProgram,
            ];
        })->values()->toArray();

        // ── Ayat (rotates daily) ─────────────────────────────────────────────
        $ayatCount = AyatRotation::count();
        $ayat = $ayatCount > 0
            ? AyatRotation::skip((now()->dayOfYear - 1) % $ayatCount)->first()
            : null;

        // ── Weekly summary (Fridays) — only when program has started ───────────
        $weeklySummary = null;
        if (now()->dayOfWeek === Carbon::FRIDAY && !Carbon::today()->lt($programStart)) {
            $weekSubs = PairSubmission::where('subject_student_id', $user->id)
                ->whereBetween('submission_date', [$weekStart, $weekEnd])
                ->count();
            $weekDaysSinceStart = max(1, min(7, Carbon::parse($weekStart)->diffInDays(Carbon::today()) + 1));
            $weeklySummary = [
                'submitted'   => $weekSubs,
                'consistency' => round(($weekSubs / $weekDaysSinceStart) * 100),
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
            'server_date'       => now()->format('l, d M Y'),
            'program_started'   => ! Carbon::today()->lt($programStart),
            'program_ended'     => ($endDate = ProgramSetting::get('program_end_date'))
                                    ? Carbon::today()->gt(Carbon::parse($endDate))
                                    : false,
            'partner'           => $partner ? [
                'name'            => $partner->name,
                'phone'           => $partner->phone,
                // Has my partner confirmed my session today?
                'today_submitted'  => PairSubmission::where('submitted_by', $partner->id)
                    ->where('subject_student_id', $user->id)
                    ->where('submission_date', $today)->exists(),
                'scheduled_today'  => $this->isScheduledOn($partner, $today)
                                       || $this->hasMakeupToday($partner->id, $today),
                'makeup_today'     => $this->hasMakeupToday($partner->id, $today),
                'next_available'   => $this->nextAvailableDay($partner),
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
            'excusable_missed'  => $excusableMissed,
            'pending_excuses'   => $pendingExcuses,
            'scheduled_days'    => array_map('ucfirst', array_map('strtolower', $user->available_days ?? [])),
        ]);
    }

    public function updateWeeklyTarget(Request $request): RedirectResponse
    {
        $request->validate(['weekly_target' => ['required', 'integer', 'min:1', 'max:604']]);
        $request->user()->update(['weekly_target' => $request->weekly_target]);
        return back()->with('success', 'Weekly target updated.');
    }

    private function isScheduledOn(\App\Models\User $user, string $date): bool
    {
        $days = array_map('strtolower', $user->available_days ?? []);
        if (empty($days)) return true;
        return in_array(strtolower(Carbon::parse($date)->format('l')), $days, true);
    }

    private function hasMakeupToday(int $userId, string $today): bool
    {
        return MissedSubmissionExcuse::where('student_id', $userId)
            ->where('makeup_date', $today)
            ->where('fulfilled', false)
            ->exists();
    }

    private function nextAvailableDay(\App\Models\User $user): ?string
    {
        $days = array_map('strtolower', $user->available_days ?? []);
        if (empty($days)) return null;
        $week = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        $today = Carbon::today()->dayOfWeek;
        for ($i = 1; $i <= 7; $i++) {
            $day = $week[($today + $i) % 7];
            if (in_array($day, $days, true)) return ucfirst($day);
        }
        return null;
    }
}
