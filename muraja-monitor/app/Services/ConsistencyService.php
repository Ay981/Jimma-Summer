<?php

namespace App\Services;

use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;

class ConsistencyService
{
    private function programStart(): Carbon
    {
        return Carbon::parse(ProgramSetting::get('program_start_date', now()->toDateString()));
    }

    private function programNotStarted(): bool
    {
        return Carbon::today()->lt($this->programStart());
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
     * Current streak counting only the student's scheduled days.
     * Returns 0 if the program hasn't started.
     */
    public function getStreak(int $userId): int
    {
        if ($this->programNotStarted()) return 0;

        $user          = User::find($userId);
        $availableDays = $user?->available_days ?? [];
        $effStart      = $this->effectiveStart($user);

        $submittedSet = PairSubmission::where('subject_student_id', $userId)
            ->where('submission_date', '>=', $effStart->toDateString())
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->flip()
            ->toArray();

        if (empty($submittedSet)) return 0;

        $today   = Carbon::today();
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
                } else {
                    break;
                }
            }

            $current->subDay();
        }

        return $streak;
    }

    /**
     * Longest streak bounded by effective start date.
     */
    public function getLongestStreak(int $userId): int
    {
        if ($this->programNotStarted()) return 0;

        $user          = User::find($userId);
        $availableDays = $user?->available_days ?? [];
        $effStart      = $this->effectiveStart($user);

        $dates = PairSubmission::where('subject_student_id', $userId)
            ->where('submission_date', '>=', $effStart->toDateString())
            ->orderBy('submission_date')
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        if (empty($dates)) return 0;

        if (empty($availableDays)) {
            $max = $current = 1;
            for ($i = 1; $i < count($dates); $i++) {
                $diff = Carbon::parse($dates[$i])->diffInDays(Carbon::parse($dates[$i - 1]));
                if ($diff === 1) { $current++; $max = max($max, $current); }
                else { $current = 1; }
            }
            return $max;
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

        return $max;
    }

    /**
     * Consistency % — returns null if program hasn't started.
     * Denominator = eligible days from MAX(program_start, user.created_at) to today.
     */
    public function getConsistency(int $userId): ?float
    {
        if ($this->programNotStarted()) return null;

        $user          = User::find($userId);
        $availableDays = $user?->available_days ?? [];
        $effStart      = $this->effectiveStart($user);
        $today         = Carbon::today();

        if ($effStart->gt($today)) return null;

        $total = PairSubmission::where('subject_student_id', $userId)
            ->where('submission_date', '>=', $effStart->toDateString())
            ->count();

        if (empty($availableDays)) {
            $programDays = max(1, $effStart->diffInDays($today) + 1);
            return min(100, round(($total / $programDays) * 100, 1));
        }

        $expectedDays = 0;
        $cursor = $effStart->copy();
        while ($cursor->lte($today)) {
            if (in_array(strtolower($cursor->format('l')), $availableDays, true)) {
                $expectedDays++;
            }
            $cursor->addDay();
        }

        if ($expectedDays === 0) return null;
        return min(100, round(($total / $expectedDays) * 100, 1));
    }

    public function getMostPagesInWeek(int $userId): int
    {
        $result = PairSubmission::where('subject_student_id', $userId)
            ->selectRaw("DATE_TRUNC('week', submission_date::date) as week, SUM(page_to - page_from + 1) as pages")
            ->groupBy('week')
            ->orderByDesc('pages')
            ->first();

        return $result ? (int) $result->pages : 0;
    }

    public function getGroupConsistency(int $halqaId): float
    {
        if ($this->programNotStarted()) return 0;

        $members  = \App\Models\User::where('halqa_id', $halqaId)->where('role', 'student')->get();
        $today    = Carbon::today();
        $progStart = $this->programStart();

        if ($members->isEmpty()) return 0;

        $total = 0;
        $denom = 0;
        foreach ($members as $member) {
            $effStart = Carbon::parse($member->created_at)->startOfDay();
            $lower    = $progStart->gt($effStart) ? $progStart->copy() : $effStart->copy();
            if ($lower->gt($today)) continue;
            $days  = max(1, $lower->diffInDays($today) + 1);
            $subs  = PairSubmission::where('subject_student_id', $member->id)
                ->where('submission_date', '>=', $lower->toDateString())
                ->count();
            $total += $subs;
            $denom += $days;
        }

        if ($denom === 0) return 0;
        return min(100, round(($total / $denom) * 100, 1));
    }
}
