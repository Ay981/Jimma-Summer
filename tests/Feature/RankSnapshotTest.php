<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\LeaderboardController;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\RankSnapshot;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use ReflectionMethod;
use Tests\PostgresTestCase;

/**
 * Covers the daily rank-snapshot command and the movement deltas the admin
 * leaderboard attaches from those snapshots.
 */
class RankSnapshotTest extends PostgresTestCase
{
    use RefreshDatabase;

    private Carbon $today;

    protected function setUp(): void
    {
        parent::setUp();
        $this->today = Carbon::parse('2026-07-12'); // Sunday
        Carbon::setTestNow($this->today->copy()->setTime(9, 0));
        ProgramSetting::set('program_start_date', $this->today->copy()->subDays(13)->toDateString());
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeStudent(string $sid): User
    {
        $everyDay = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        $student = User::create([
            'name'              => "Student {$sid}",
            'student_id'        => $sid,
            'password'          => 'password',
            'role'              => 'student',
            'available_days'    => $everyDay,
            'available_times'   => ['after_asr'],
            'profile_completed' => true,
            'is_active'         => true,
        ]);
        $student->forceFill(['created_at' => $this->today->copy()->subDays(13)])->save();

        return $student->fresh();
    }

    /** File $count submissions across the window so the student earns a rank_score. */
    private function submit(User $student, int $count, int $pagesPer = 1): void
    {
        $pair = Pair::create(['student_a_id' => $student->id, 'status' => 'active']);
        $cursor = $this->today->copy()->subDays(13);
        $filed = 0;
        while ($cursor->lte($this->today) && $filed < $count) {
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
            $cursor->addDay();
        }
    }

    public function test_command_writes_one_row_per_active_student(): void
    {
        $this->makeStudent('JUMU-2026-201');
        $this->submit(User::where('student_id', 'JUMU-2026-201')->first(), 10, 20);
        $this->makeStudent('JUMU-2026-202');
        $this->submit(User::where('student_id', 'JUMU-2026-202')->first(), 5, 5);

        $this->artisan('muraja:snapshot-ranks')->assertSuccessful();

        $rows = RankSnapshot::where('subject_type', 'student')
            ->where('captured_on', $this->today->toDateString())
            ->get();

        $this->assertCount(2, $rows);
        // Ranks are contiguous 1..N.
        $this->assertSame([1, 2], $rows->pluck('rank')->sort()->values()->all());
        // rank_score persisted as a positive number for the volume student.
        $this->assertGreaterThan(0, $rows->firstWhere('rank', 1)->rank_score);
    }

    public function test_command_is_idempotent_within_a_day(): void
    {
        $this->makeStudent('JUMU-2026-201');
        $this->submit(User::where('student_id', 'JUMU-2026-201')->first(), 10, 20);

        $this->artisan('muraja:snapshot-ranks')->assertSuccessful();
        $this->artisan('muraja:snapshot-ranks')->assertSuccessful();

        $this->assertSame(
            1,
            RankSnapshot::where('subject_type', 'student')
                ->where('captured_on', $this->today->toDateString())
                ->count(),
            're-running the command the same day must update, not duplicate',
        );
    }

    public function test_attach_deltas_reports_upward_movement_and_null_without_history(): void
    {
        $student = $this->makeStudent('JUMU-2026-201');
        $this->submit($student, 10, 20);

        // Seed a prior snapshot where the student was ranked worse (rank 3),
        // both yesterday and at the start of this week.
        foreach ([$this->today->copy()->subDay(), $this->today->copy()->startOfWeek(Carbon::SUNDAY)] as $day) {
            RankSnapshot::create([
                'subject_type' => 'student',
                'subject_id'   => $student->id,
                'rank'         => 3,
                'rank_score'   => 10.0,
                'captured_on'  => $day->toDateString(),
            ]);
        }

        $controller = app(LeaderboardController::class);
        $rows = $this->invokeAttachDeltas($controller, $controller->studentBoard(), 'student');
        $row  = collect($rows)->firstWhere('id', $student->id);

        // Now rank 1 vs prior rank 3 → moved up 2 positions.
        $this->assertSame(2, $row['rank_delta_today']);
        $this->assertSame(2, $row['rank_delta_week']);

        // A second student with no prior snapshot gets null deltas.
        $fresh = $this->makeStudent('JUMU-2026-202');
        $this->submit($fresh, 5, 5);
        $rows2 = $this->invokeAttachDeltas($controller, $controller->studentBoard(), 'student');
        $freshRow = collect($rows2)->firstWhere('id', $fresh->id);
        $this->assertNull($freshRow['rank_delta_today']);
        $this->assertNull($freshRow['rank_delta_week']);
    }

    private function invokeAttachDeltas(LeaderboardController $controller, array $rows, string $type): array
    {
        $m = new ReflectionMethod($controller, 'attachDeltas');
        $m->setAccessible(true);

        return $m->invoke($controller, $rows, $type);
    }
}
