<?php

namespace Tests\Feature\AvailableDays;

use App\Http\Controllers\Admin\LeaderboardController;
use App\Models\Halqa;
use App\Models\MurajaTest;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\PostgresTestCase;

/**
 * Locks the "Most Consistent" awards to the consistency metric.
 *
 * Bug reproduced: awards() took array_slice($students, 0, 3) and $pairs[0],
 * but studentBoard() is sorted by the composite rank_score and pairBoard() by
 * pages — so a high-page / low-consistency student (or pair) won "Most
 * Consistent" purely on volume. These tests build exactly that shape: a top-
 * ranked-but-half-consistent student against a lower-ranked fully-consistent one.
 */
class LeaderboardAwardsTest extends PostgresTestCase
{
    use RefreshDatabase;

    private Carbon $today;

    protected function setUp(): void
    {
        parent::setUp();
        $this->today = Carbon::parse('2026-07-12'); // Sunday
        Carbon::setTestNow($this->today->copy()->setTime(9, 0));
        // Two-week window keeps the scheduled-day math small and predictable.
        ProgramSetting::set('program_start_date', $this->today->copy()->subDays(13)->toDateString());
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeStudent(array $days, string $sid): User
    {
        $student = User::create([
            'name'              => "Student {$sid}",
            'student_id'        => $sid,
            'password'          => 'password',
            'role'              => 'student',
            'available_days'    => $days,
            'available_times'   => ['after_asr'],
            'profile_completed' => true,
            'is_active'         => true,
        ]);
        $student->forceFill(['created_at' => $this->today->copy()->subDays(13)])->save();

        return $student->fresh();
    }

    /**
     * File $count submissions on the student's first $count scheduled days in the
     * window, each recording $pagesPer pages. If $pair is null a fresh solo pair
     * is created; pass an existing pair to attribute submissions to it.
     */
    private function submit(User $student, int $count, int $pagesPer = 1, ?Pair $pair = null): Pair
    {
        $pair ??= Pair::create(['student_a_id' => $student->id, 'status' => 'active']);
        $days = array_map('strtolower', $student->available_days ?? []);
        $cursor = $this->today->copy()->subDays(13);
        $filed = 0;
        while ($cursor->lte($this->today) && $filed < $count) {
            if (in_array(strtolower($cursor->format('l')), $days, true)) {
                PairSubmission::create([
                    'pair_id'            => $pair->id,
                    'submitted_by'       => $student->id,
                    'subject_student_id' => $student->id,
                    'juz'                => 1,
                    'page_from'          => 1,
                    'page_to'            => $pagesPer,
                    'minutes_spent'      => 20,
                    'submission_date'    => $cursor->toDateString(),
                ]);
                $filed++;
            }
            $cursor->addDay();
        }

        return $pair;
    }

    private function controller(): LeaderboardController
    {
        return app(LeaderboardController::class);
    }

    private function leader(): User
    {
        return User::firstOrCreate(
            ['student_id' => 'LDR-001'],
            ['name' => 'Leader', 'password' => 'password', 'role' => 'leader'],
        );
    }

    public function test_most_consistent_student_is_by_consistency_not_rank_score(): void
    {
        // Everyone available every day → denominator is the full 14-day window.
        $everyDay = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // Volume winner: submitted only 7 of 14 days (50%) but recited many pages
        // and aced tests → tops rank_score, exactly like Zabiba in the report.
        $volume = $this->makeStudent($everyDay, 'JUMU-2026-201');
        $this->submit($volume, 7, pagesPer: 20);
        MurajaTest::create([
            'student_id' => $volume->id, 'leader_id' => $this->leader()->id,
            'from_juz' => 1, 'to_juz' => 1,
            'from_page' => 1, 'to_page' => 20, 'score' => 10, 'tested_at' => $this->today,
        ]);

        // Consistency winner: submitted every one of the 14 days (100%) but few
        // pages and no tests → sits below the volume student on rank_score.
        $steady = $this->makeStudent($everyDay, 'JUMU-2026-202');
        $this->submit($steady, 14, pagesPer: 1);

        $controller = $this->controller();
        $students   = $controller->studentBoard();
        $awards     = $controller->awards($students, $controller->pairBoard());

        // Precondition: the volume student really is rank #1 overall.
        $this->assertSame('JUMU-2026-201', $students[0]['student_id'], 'volume student should top rank_score');

        $top = $awards['most_consistent_students'][0];
        $this->assertSame(
            'JUMU-2026-202',
            $top['student_id'],
            "Most Consistent must be the 100% student, not the 50% top-ranked one; got {$top['student_id']} at {$top['consistency']}%."
        );
        $this->assertEqualsWithDelta(100.0, $top['consistency'], 0.05);
    }

    public function test_most_consistent_pair_is_by_consistency_not_pages(): void
    {
        $everyDay = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

        // High-page pair: both partners only 50% consistent.
        $a1 = $this->makeStudent($everyDay, 'JUMU-2026-301');
        $a2 = $this->makeStudent($everyDay, 'JUMU-2026-302');
        $this->makePair($a1, $a2, 7, pagesPer: 30);

        // Low-page pair: both partners 100% consistent.
        $b1 = $this->makeStudent($everyDay, 'JUMU-2026-303');
        $b2 = $this->makeStudent($everyDay, 'JUMU-2026-304');
        $this->makePair($b1, $b2, 14, pagesPer: 1);

        $controller = $this->controller();
        $pairs      = $controller->pairBoard();
        $awards     = $controller->awards($controller->studentBoard(), $pairs);

        // Precondition: the high-page pair really is pairBoard rank #1.
        $this->assertSame(30 * 7 * 2, $pairs[0]['pages'], 'high-page pair should top pairBoard');

        $pair = $awards['most_consistent_pair'];
        $this->assertEqualsWithDelta(
            100.0,
            $pair['consistency'],
            0.05,
            "Most Consistent pair must be the 100% pair, got {$pair['consistency']}% ({$pair['student_a']} & {$pair['student_b']})."
        );
    }

    /** Create one real pair and file $count submissions for each partner onto it. */
    private function makePair(User $a, User $b, int $count, int $pagesPer): void
    {
        $pair = Pair::create(['student_a_id' => $a->id, 'student_b_id' => $b->id, 'status' => 'active']);
        $this->submit($a, $count, $pagesPer, $pair);
        $this->submit($b, $count, $pagesPer, $pair);
    }
}
