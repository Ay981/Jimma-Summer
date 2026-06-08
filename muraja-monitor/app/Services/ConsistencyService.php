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
     */
    private function countScheduledDays(Carbon $start, Carbon $end, array $availableDays): int
    {
        if ($start->gt($end)) return 0;

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

        // Excuses with a makeup still pending (makeup_date not yet passed, not yet fulfilled)
        // treat the missed day as "protected" — don't break the streak for it
        $today = Carbon::today();
        $protectedDates = MissedSubmissionExcuse::where('student_id', $userId)
            ->where('fulfilled', false)
            ->where('makeup_date', '>=', $today->toDateString()) // makeup still in the future / today
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
                    // Excuse filed, makeup still pending — protect this day
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
        $start        = $effStart->copy();
        $end          = Carbon::parse($dates[count($dates) - 1]);
        $cursor       = $start->copy();
        $max = $streak = 0;

        while ($cursor->lte($end)) {
            $dayName = strtolower($cursor->format('l'));
            if (in_array($dayName, $availableDays, true)) {
                if (isset($submittedSet[$cursor->toDateString()])) {
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
}
