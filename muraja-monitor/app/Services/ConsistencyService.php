<?php

namespace App\Services;

use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;

class ConsistencyService
{
    /**
     * Current streak counting only the student's scheduled days.
     * If available_times is empty, falls back to counting every day.
     */
    public function getStreak(int $userId): int
    {
        $user          = User::find($userId);
        $availableDays = $user?->available_times ?? []; // e.g. ['saturday', 'sunday', 'monday']

        $submittedSet = PairSubmission::where('subject_student_id', $userId)
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->flip()
            ->toArray();

        if (empty($submittedSet)) return 0;

        $today   = Carbon::today();
        $current = $today->copy();
        $streak  = 0;

        for ($i = 0; $i < 365; $i++) {
            $dateStr = $current->toDateString();
            $dayName = strtolower($current->format('l')); // 'monday', 'saturday', …

            $isScheduled = empty($availableDays) || in_array($dayName, $availableDays, true);

            if ($isScheduled) {
                if (isset($submittedSet[$dateStr])) {
                    $streak++;
                } elseif ($dateStr === $today->toDateString()) {
                    // Today hasn't ended yet — skip without breaking
                } else {
                    break; // missed a past scheduled day
                }
            }

            $current->subDay();
        }

        return $streak;
    }

    /**
     * Longest streak the student ever achieved on their scheduled days.
     */
    public function getLongestStreak(int $userId): int
    {
        $user          = User::find($userId);
        $availableDays = $user?->available_times ?? [];

        $dates = PairSubmission::where('subject_student_id', $userId)
            ->orderBy('submission_date')
            ->pluck('submission_date')
            ->map(fn ($d) => Carbon::parse($d)->toDateString())
            ->toArray();

        if (empty($dates)) return 0;

        if (empty($availableDays)) {
            // Original all-days logic
            $max = $current = 1;
            for ($i = 1; $i < count($dates); $i++) {
                $diff = Carbon::parse($dates[$i])->diffInDays(Carbon::parse($dates[$i - 1]));
                if ($diff === 1) {
                    $current++;
                    $max = max($max, $current);
                } else {
                    $current = 1;
                }
            }
            return $max;
        }

        $submittedSet = array_flip($dates);
        $start        = Carbon::parse($dates[0]);
        $end          = Carbon::parse($dates[count($dates) - 1]);
        $current      = $start->copy();
        $max = $streak = 0;

        while ($current->lte($end)) {
            $dayName = strtolower($current->format('l'));
            if (in_array($dayName, $availableDays, true)) {
                if (isset($submittedSet[$current->toDateString()])) {
                    $streak++;
                    $max = max($max, $streak);
                } else {
                    $streak = 0;
                }
            }
            $current->addDay();
        }

        return $max;
    }

    /**
     * Consistency % = submitted days / expected days since program start.
     * Expected days = days whose weekday is in available_times (or all days if unset).
     */
    public function getConsistency(int $userId): float
    {
        $user          = User::find($userId);
        $availableDays = $user?->available_times ?? [];
        $start         = Carbon::parse(ProgramSetting::get('program_start_date', now()->toDateString()));
        $today         = Carbon::today();
        $total         = PairSubmission::where('subject_student_id', $userId)->count();

        if (empty($availableDays)) {
            $programDays = max(1, $start->diffInDays($today) + 1);
            return min(100, round(($total / $programDays) * 100, 1));
        }

        // Count scheduled days since program start up to today
        $expectedDays = 0;
        $cursor       = $start->copy();
        while ($cursor->lte($today)) {
            if (in_array(strtolower($cursor->format('l')), $availableDays, true)) {
                $expectedDays++;
            }
            $cursor->addDay();
        }

        $expectedDays = max(1, $expectedDays);
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
        $members     = \App\Models\User::where('halqa_id', $halqaId)->get();
        $start       = Carbon::parse(ProgramSetting::get('program_start_date', now()->toDateString()));
        $today       = Carbon::today();
        $programDays = max(1, $start->diffInDays($today) + 1);

        if ($members->isEmpty()) return 0;

        $total = PairSubmission::whereIn('subject_student_id', $members->pluck('id'))->count();

        return min(100, round(($total / ($programDays * $members->count())) * 100, 1));
    }
}
