<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\PairSubmission;
use App\Models\User;

class BadgeService
{
    public const DEFINITIONS = [
        'streak_7'     => ['label' => '7-Day Streak',     'condition' => 'Submit for 7 days in a row'],
        'streak_14'    => ['label' => '14-Day Streak',    'condition' => 'Submit for 14 days in a row'],
        'streak_30'    => ['label' => '30-Day Streak',    'condition' => 'Submit for 30 days in a row'],
        'juz_1'        => ['label' => 'First Juz',        'condition' => 'Cover at least 1 juz'],
        'juz_5'        => ['label' => '5 Juz Covered',    'condition' => 'Cover at least 5 distinct juz'],
        'juz_10'       => ['label' => '10 Juz Covered',   'condition' => 'Cover at least 10 distinct juz'],
        'full_program' => ['label' => 'Program Complete',  'condition' => 'Finish program with 80%+ consistency'],
        'pages_100'    => ['label' => '100 Pages',         'condition' => 'Submit a total of 100 pages'],
        'pages_500'    => ['label' => '500 Pages',         'condition' => 'Submit a total of 500 pages'],
    ];

    public function checkAndAward(User $user): void
    {
        $this->checkStreakBadges($user);
        $this->checkPageBadges($user);
        $this->checkJuzBadges($user);
    }

    private function checkStreakBadges(User $user): void
    {
        $longest = app(ConsistencyService::class)->getLongestStreak($user->id);

        foreach (['streak_7' => 7, 'streak_14' => 14, 'streak_30' => 30] as $type => $days) {
            if ($longest >= $days && ! $this->has($user, $type)) {
                $this->award($user, $type);
            }
        }
    }

    private function checkPageBadges(User $user): void
    {
        $totalPages = PairSubmission::where('subject_student_id', $user->id)
            ->selectRaw('COALESCE(SUM(page_to - page_from + 1), 0) as total')
            ->value('total') ?? 0;

        if ($totalPages >= 100 && ! $this->has($user, 'pages_100')) {
            $this->award($user, 'pages_100');
        }
        if ($totalPages >= 500 && ! $this->has($user, 'pages_500')) {
            $this->award($user, 'pages_500');
        }
    }

    private function checkJuzBadges(User $user): void
    {
        $juzCount = PairSubmission::where('subject_student_id', $user->id)
            ->distinct()
            ->pluck('juz')
            ->count();

        if ($juzCount >= 1 && ! $this->has($user, 'juz_1')) {
            $this->award($user, 'juz_1');
        }
        if ($juzCount >= 5 && ! $this->has($user, 'juz_5')) {
            $this->award($user, 'juz_5');
        }
        if ($juzCount >= 10 && ! $this->has($user, 'juz_10')) {
            $this->award($user, 'juz_10');
        }
    }

    private function has(User $user, string $type): bool
    {
        return Badge::where('user_id', $user->id)->where('badge_type', $type)->exists();
    }

    private function award(User $user, string $type): void
    {
        Badge::create(['user_id' => $user->id, 'badge_type' => $type, 'earned_at' => now()]);
    }
}
