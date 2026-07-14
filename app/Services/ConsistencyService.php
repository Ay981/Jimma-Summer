<?php

namespace App\Services;

use App\Models\MissedSubmissionExcuse;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;

class ConsistencyService
{
    // ── Request-scoped caches ─────────────────────────────────────────────────
    // The service is bound as `scoped`, so these live for one request only (and
    // are reset per request under Octane). Within a request the underlying data
    // is immutable except where a write occurs, in which case callers invoke
    // forget() to drop stale entries (see CheckinController).
    private ?Carbon $programStartCache = null;
    private ?bool   $programNotStartedCache = null;
    /** @var array<int, ?User> */
    private array $userCache = [];
    /** @var array<int, int> */
    private array $streakCache = [];
    /** @var array<int, int> */
    private array $longestCache = [];
    /** @var array<int, ?float> */
    private array $consistencyCache = [];
    /** @var array<int, int> */
    private array $mostPagesCache = [];
    /** @var array<int, float> */
    private array $groupCache = [];

    /**
     * Drop cached results so subsequent reads recompute from fresh data.
     * Call after writing submissions/excuses within the same request.
     */
    public function forget(?int $userId = null): void
    {
        if ($userId === null) {
            $this->userCache = [];
            $this->streakCache = [];
            $this->longestCache = [];
            $this->consistencyCache = [];
            $this->mostPagesCache = [];
            $this->groupCache = [];
            return;
        }

        unset(
            $this->userCache[$userId],
            $this->streakCache[$userId],
            $this->longestCache[$userId],
            $this->consistencyCache[$userId],
            $this->mostPagesCache[$userId],
        );
        // A user's submission affects their halqa's group consistency too.
        $this->groupCache = [];
    }

    private function user(int $userId): ?User
    {
        if (! array_key_exists($userId, $this->userCache)) {
            $this->userCache[$userId] = User::find($userId);
        }
        return $this->userCache[$userId];
    }

    private function programStart(): Carbon
    {
        if ($this->programStartCache === null) {
            $this->programStartCache = Carbon::parse(
                ProgramSetting::get('program_start_date', now()->toDateString())
            );
        }
        return $this->programStartCache->copy();
    }

    private function programNotStarted(): bool
    {
        if ($this->programNotStartedCache === null) {
            $this->programNotStartedCache = Carbon::today()->lt($this->programStart());
        }
        return $this->programNotStartedCache;
    }

    /**
     * Effective start for a user: MAX(program_start_date, user.created_at).
     */
    private function effectiveStart(User $user): Carbon
    {
        $progStart  = $this->programStart();
        $userJoined = Carbon::parse($user->created_at)->startOfDay();
        return $progStart->gt($userJoined) ? $progStart->copy() : $userJoined->copy();
    }

    /**
     * Count days in [$start, $end] (inclusive) whose weekday is in $availableDays.
     * Arithmetic equivalent of walking the calendar day-by-day: each full week
     * contributes the number of matching weekdays, then the leftover (< 7 days,
     * whose weekday pattern is identical to the first days from $start) is counted.
     *
     * An empty $availableDays means "every day is scheduled".
     */
    public function countScheduledDays(Carbon $start, Carbon $end, array $availableDays): int
    {
        if ($start->gt($end)) return 0;

        if (empty($availableDays)) {
            return $start->diffInDays($end) + 1;
        }

        $set = array_flip(array_map('strtolower', $availableDays));

        $perWeek = 0;
        foreach (['sunday','monday','tuesday','wednesday','thursday','friday','saturday'] as $d) {
            if (isset($set[$d])) $perWeek++;
        }

        $totalDays = $start->diffInDays($end) + 1; // inclusive
        $fullWeeks = intdiv($totalDays, 7);
        $remainder = $totalDays % 7;

        $count = $fullWeeks * $perWeek;

        $cursor = $start->copy();
        for ($i = 0; $i < $remainder; $i++) {
            if (isset($set[strtolower($cursor->format('l'))])) $count++;
            $cursor->addDay();
        }

        return $count;
    }

    /**
     * True if $date's weekday is one the student submits on.
     * An empty $availableDays means the student is expected every day.
     */
    public function isScheduledDay(array $availableDays, Carbon $date): bool
    {
        if (empty($availableDays)) return true;
        return in_array(strtolower($date->format('l')), array_map('strtolower', $availableDays), true);
    }

    /**
     * Number of consecutive *scheduled* days, walking back from today (today
     * excluded — it hasn't ended), with no submission. Non-scheduled weekdays are
     * skipped entirely (they are neither a miss nor a break). Stops at $effStart.
     *
     * @param array<string,mixed> $submittedSet  map keyed by 'Y-m-d' of submitted days
     */
    public function consecutiveMissedScheduledDays(array $availableDays, array $submittedSet, Carbon $effStart, Carbon $today): int
    {
        $missed  = 0;
        $cursor  = $today->copy()->subDay(); // today excluded

        for ($i = 0; $i < 366 && $cursor->gte($effStart); $i++, $cursor->subDay()) {
            if (! $this->isScheduledDay($availableDays, $cursor)) {
                continue; // day off — neutral
            }
            if (isset($submittedSet[$cursor->toDateString()])) {
                break; // most recent scheduled day was submitted — streak of misses ends
            }
            $missed++;
        }

        return $missed;
    }

    /**
     * The single source of truth for a student's engagement status
     * (on_track / slipping / at_risk / inactive), measured against their
     * chosen available_days rather than the raw calendar.
     *
     * @param array<string,mixed> $submittedSet map keyed by 'Y-m-d' of days that count as submitted
     */
    public function deriveStatus(
        array $availableDays,
        array $submittedSet,
        Carbon $effStart,
        Carbon $today,
        ?string $lastSub,
        float $consistency,
    ): string {
        $daysElapsed = max(1, $effStart->diffInDays($today) + 1);

        // Never submitted: benefit of the doubt only while the program is brand new
        // (≤2 days). Once well underway, a student with nothing on record is at risk.
        if (! $lastSub) {
            return $daysElapsed <= 2 ? 'on_track' : 'at_risk';
        }

        $missed = $this->consecutiveMissedScheduledDays($availableDays, $submittedSet, $effStart, $today);
        $scheduledElapsed = $this->countScheduledDays($effStart, $today, $availableDays);

        // Inactive: a full week of scheduled days missed in a row.
        if ($missed >= 7) return 'inactive';

        // At risk: 4+ consecutive scheduled misses, or chronic low consistency
        // once there is at least a week of scheduled history.
        if ($missed >= 4 || ($scheduledElapsed >= 7 && $consistency < 40)) return 'at_risk';

        if ($missed >= 2) return 'slipping';
        if ($consistency >= 70) return 'on_track';
        return 'slipping';
    }


    /**
     * Current streak counting only the student's scheduled days.
     * Returns 0 if the program hasn't started.
     */
    public function getStreak(int $userId): int
    {
        if (isset($this->streakCache[$userId])) return $this->streakCache[$userId];
        if ($this->programNotStarted()) return $this->streakCache[$userId] = 0;

        $user          = $this->user($userId);
        $availableDays = $user?->available_days ?? [];
        $effStart      = $this->effectiveStart($user);

        $submittedSet = PairSubmission::where('subject_student_id', $userId)
            ->where('submission_date', '>=', $effStart->toDateString())
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->flip()
            ->toArray();

        if (empty($submittedSet)) return $this->streakCache[$userId] = 0;

        // A missed day is "protected" (does not break the streak) when an excuse
        // covers it — whether the makeup is still pending OR has been fulfilled.
        // A fulfilled makeup lands on the makeup date, not the original missed date,
        // so without this the completed catch-up would paradoxically break the streak.
        $today = Carbon::today();
        $protectedDates = MissedSubmissionExcuse::where('student_id', $userId)
            ->where(fn ($q) => $q
                ->where('fulfilled', true)
                ->orWhere('makeup_date', '>=', $today->toDateString()))
            ->pluck('missed_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->flip()
            ->toArray();

        $current = $today->copy();
        $streak  = 0;

        for ($i = 0; $i < 365; $i++) {
            if ($current->lt($effStart)) break;

            $dateStr = $current->toDateString();
            $dayName = strtolower($current->format('l'));

            $isScheduled = empty($availableDays) || in_array($dayName, $availableDays, true);

            if ($isScheduled) {
                if (isset($submittedSet[$dateStr])) {
                    $streak++;
                } elseif ($dateStr === $today->toDateString()) {
                    // Today hasn't ended yet — skip without breaking
                } elseif (isset($protectedDates[$dateStr])) {
                    // Excuse filed (makeup pending or already fulfilled) — protect this day
                    $streak++;
                } else {
                    break;
                }
            }

            $current->subDay();
        }

        return $this->streakCache[$userId] = $streak;
    }

    /**
     * Longest streak bounded by effective start date.
     */
    public function getLongestStreak(int $userId): int
    {
        if (isset($this->longestCache[$userId])) return $this->longestCache[$userId];
        if ($this->programNotStarted()) return $this->longestCache[$userId] = 0;

        $user          = $this->user($userId);
        $availableDays = $user?->available_days ?? [];
        $effStart      = $this->effectiveStart($user);

        $dates = PairSubmission::where('subject_student_id', $userId)
            ->where('submission_date', '>=', $effStart->toDateString())
            ->orderBy('submission_date')
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        if (empty($dates)) return $this->longestCache[$userId] = 0;

        if (empty($availableDays)) {
            $max = $current = 1;
            for ($i = 1; $i < count($dates); $i++) {
                $diff = Carbon::parse($dates[$i])->diffInDays(Carbon::parse($dates[$i - 1]));
                if ($diff === 1) { $current++; $max = max($max, $current); }
                else { $current = 1; }
            }
            return $this->longestCache[$userId] = $max;
        }

        $submittedSet = array_flip($dates);

        // Excused days (pending or fulfilled makeup) count as continuations, so a
        // caught-up absence does not break the longest streak.
        $protectedDates = MissedSubmissionExcuse::where('student_id', $userId)
            ->where(fn ($q) => $q
                ->where('fulfilled', true)
                ->orWhere('makeup_date', '>=', Carbon::today()->toDateString()))
            ->pluck('missed_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->flip()
            ->toArray();

        $start        = $effStart->copy();
        $end          = Carbon::parse($dates[count($dates) - 1]);
        $cursor       = $start->copy();
        $max = $streak = 0;

        while ($cursor->lte($end)) {
            $dayName = strtolower($cursor->format('l'));
            if (in_array($dayName, $availableDays, true)) {
                if (isset($submittedSet[$cursor->toDateString()]) || isset($protectedDates[$cursor->toDateString()])) {
                    $streak++;
                    $max = max($max, $streak);
                } else {
                    $streak = 0;
                }
            }
            $cursor->addDay();
        }

        return $this->longestCache[$userId] = $max;
    }

    /**
     * Consistency % — returns null if program hasn't started.
     * Denominator = eligible days from MAX(program_start, user.created_at) to today.
     */
    public function getConsistency(int $userId): ?float
    {
        if (array_key_exists($userId, $this->consistencyCache)) return $this->consistencyCache[$userId];
        if ($this->programNotStarted()) return $this->consistencyCache[$userId] = null;

        $user          = $this->user($userId);
        $availableDays = $user?->available_days ?? [];
        $effStart      = $this->effectiveStart($user);
        $today         = Carbon::today();

        if ($effStart->gt($today)) return $this->consistencyCache[$userId] = null;

        $total = PairSubmission::where('subject_student_id', $userId)
            ->where('submission_date', '>=', $effStart->toDateString())
            ->count();

        if (empty($availableDays)) {
            $programDays = max(1, $effStart->diffInDays($today) + 1);
            return $this->consistencyCache[$userId] = min(100, round(($total / $programDays) * 100, 1));
        }

        $expectedDays = $this->countScheduledDays($effStart, $today, $availableDays);

        if ($expectedDays === 0) return $this->consistencyCache[$userId] = null;
        return $this->consistencyCache[$userId] = min(100, round(($total / $expectedDays) * 100, 1));
    }

    public function getMostPagesInWeek(int $userId): int
    {
        if (isset($this->mostPagesCache[$userId])) return $this->mostPagesCache[$userId];

        $result = PairSubmission::where('subject_student_id', $userId)
            ->selectRaw("DATE_TRUNC('week', submission_date::date) as week, SUM(page_to - page_from + 1) as pages")
            ->groupBy('week')
            ->orderByDesc('pages')
            ->first();

        return $this->mostPagesCache[$userId] = $result ? (int) $result->pages : 0;
    }

    public function getGroupConsistency(int $halqaId): float
    {
        if (isset($this->groupCache[$halqaId])) return $this->groupCache[$halqaId];
        if ($this->programNotStarted()) return $this->groupCache[$halqaId] = 0;

        $members   = \App\Models\User::where('halqa_id', $halqaId)->where('role', 'student')->get();
        $today     = Carbon::today();
        $progStart = $this->programStart();

        if ($members->isEmpty()) return $this->groupCache[$halqaId] = 0;

        $total = 0;
        $denom = 0;
        foreach ($members as $member) {
            $effStart = Carbon::parse($member->created_at)->startOfDay();
            $lower    = $progStart->gt($effStart) ? $progStart->copy() : $effStart->copy();
            if ($lower->gt($today)) continue;

            $availableDays = $member->available_days ?? [];
            $subs = PairSubmission::where('subject_student_id', $member->id)
                ->where('submission_date', '>=', $lower->toDateString())
                ->count();
            $total += $subs;

            if (empty($availableDays)) {
                $denom += max(1, $lower->diffInDays($today) + 1);
            } else {
                $denom += $this->countScheduledDays($lower, $today, $availableDays);
            }
        }

        if ($denom === 0) return $this->groupCache[$halqaId] = 0;
        return $this->groupCache[$halqaId] = min(100, round(($total / $denom) * 100, 1));
    }

    /**
     * Build a standardized N-day heatmap array for a student, ensuring days before
     * the program start date or before the student joined are marked scheduled=false.
     *
     * @return array<int, array{date: string, submitted: bool, is_makeup: bool, scheduled: bool}>
     */
    public function buildHeatmap(User $student, int $days = 30): array
    {
        $today = Carbon::today();
        $programStartStr = ProgramSetting::get('program_start_date');
        $programStarted  = !empty($programStartStr);
        $programStart    = $programStarted ? Carbon::parse($programStartStr)->startOfDay() : $today->copy();
        $userJoined      = Carbon::parse($student->created_at)->startOfDay();
        $effStart        = $programStart->gt($userJoined) ? $programStart->copy() : $userJoined->copy();

        $dates = collect(range($days - 1, 0))->map(
            fn ($i) => $today->copy()->subDays($i)->toDateString()
        );

        $submittedSet = PairSubmission::where('subject_student_id', $student->id)
            ->whereBetween('submission_date', [$dates->first(), $dates->last()])
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->flip()
            ->toArray();

        $makeupSet = MissedSubmissionExcuse::where('student_id', $student->id)
            ->where('fulfilled', true)
            ->pluck('makeup_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->flip()
            ->toArray();

        $availableDays = $student->available_days ?? [];

        return $dates->map(function ($dateStr) use ($programStarted, $effStart, $submittedSet, $makeupSet, $availableDays) {
            $inProgram   = $programStarted && Carbon::parse($dateStr)->gte($effStart);
            $dayName     = strtolower(Carbon::parse($dateStr)->format('l'));
            $isScheduled = $inProgram && (
                empty($availableDays) ||
                in_array($dayName, array_map('strtolower', $availableDays), true)
            );

            return [
                'date'      => $dateStr,
                'submitted' => isset($submittedSet[$dateStr]),
                'is_makeup' => isset($makeupSet[$dateStr]),
                'scheduled' => $isScheduled,
            ];
        })->values()->toArray();
    }
}

