<?php

namespace Tests\Feature\AvailableDays;

use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use App\Services\ConsistencyService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\PostgresTestCase;

/**
 * Baseline: proves the CANONICAL implementation (ConsistencyService) already
 * measures consistency against the student's chosen available_days.
 *
 * These tests should PASS today. They pin down the "correct answer" that the
 * buggy call sites (admin students page, leaderboard, etc.) must match once
 * fixed. If these ever break, the source of truth regressed.
 */
class ConsistencyServiceBaselineTest extends PostgresTestCase
{
    use RefreshDatabase;

    /** Anchor on a fixed Sunday so weekday math is deterministic. */
    private Carbon $today;

    protected function setUp(): void
    {
        parent::setUp();
        $this->today = Carbon::parse('2026-07-12'); // Sunday
        Carbon::setTestNow($this->today->copy()->setTime(9, 0));
        // Program started well before the 14-day window so it is not the binding start.
        ProgramSetting::set('program_start_date', $this->today->copy()->subDays(60)->toDateString());
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeStudent(array $days): User
    {
        $n = User::where('role', 'student')->count() + 1;
        $student = User::create([
            'name'              => "Student {$n}",
            'student_id'        => 'JUMU-2026-'.str_pad((string) $n, 3, '0', STR_PAD_LEFT),
            'password'          => 'password',
            'role'              => 'student',
            'available_days'    => $days,
            'profile_completed' => true,
        ]);
        // created_at is guarded by Eloquent timestamps; force it so the effective
        // start is the program start (60 days ago), not "now".
        $student->forceFill(['created_at' => $this->today->copy()->subDays(60)])->save();

        return $student->fresh();
    }

    /** Give the student a submission on every one of their scheduled weekdays in the last N days. */
    private function submitEveryScheduledDay(User $student, int $withinDays = 90): void
    {
        $pair = Pair::create(['student_a_id' => $student->id, 'status' => 'active']);
        $days = array_map('strtolower', $student->available_days ?? []);
        $cursor = $this->today->copy()->subDays($withinDays);
        while ($cursor->lte($this->today)) {
            if (in_array(strtolower($cursor->format('l')), $days, true)) {
                PairSubmission::create([
                    'pair_id'            => $pair->id,
                    'submitted_by'       => $student->id,
                    'subject_student_id' => $student->id,
                    'juz'                => 1,
                    'page_from'          => 1,
                    'page_to'            => 2,
                    'minutes_spent'      => 20,
                    'submission_date'    => $cursor->toDateString(),
                ]);
            }
            $cursor->addDay();
        }
    }

    public function test_perfect_attendance_on_scheduled_days_is_100_percent(): void
    {
        $student = $this->makeStudent(['monday', 'wednesday', 'friday']);
        $this->submitEveryScheduledDay($student);

        $cons = app(ConsistencyService::class)->getConsistency($student->id);

        $this->assertSame(100.0, $cons, 'A student who submits every scheduled day must be 100% consistent.');
    }

    public function test_days_off_do_not_lower_consistency(): void
    {
        // Two students, identical submissions on Mon/Wed/Fri, but one is scheduled
        // only 3 days/week and the other 5 days/week. The 3-day student is perfect;
        // the 5-day student missed Tue/Thu and should be lower.
        $threeDay = $this->makeStudent(['monday', 'wednesday', 'friday']);
        $this->submitEveryScheduledDay($threeDay);

        $fiveDay = $this->makeStudent(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
        // Only submit Mon/Wed/Fri for the 5-day student (misses Tue/Thu).
        $pair = Pair::create(['student_a_id' => $fiveDay->id, 'status' => 'active']);
        $cursor = $this->today->copy()->subDays(90);
        while ($cursor->lte($this->today)) {
            if (in_array(strtolower($cursor->format('l')), ['monday', 'wednesday', 'friday'], true)) {
                PairSubmission::create([
                    'pair_id' => $pair->id, 'submitted_by' => $fiveDay->id,
                    'subject_student_id' => $fiveDay->id, 'juz' => 1,
                    'page_from' => 1, 'page_to' => 2, 'minutes_spent' => 20,
                    'submission_date' => $cursor->toDateString(),
                ]);
            }
            $cursor->addDay();
        }

        $service = app(ConsistencyService::class);
        $this->assertSame(100.0, $service->getConsistency($threeDay->id));
        $this->assertLessThan(100.0, $service->getConsistency($fiveDay->id));
    }

    public function test_never_submitted_is_at_risk_once_program_is_underway(): void
    {
        $student = $this->makeStudent(['monday', 'wednesday', 'friday']);
        // No submissions at all. Program started 60 days ago (see setUp).

        $submittedSet = [];
        $effStart     = $this->today->copy()->subDays(60);
        $status = app(ConsistencyService::class)->deriveStatus(
            $student->available_days,
            $submittedSet,
            $effStart,
            $this->today,
            null,          // never submitted
            0.0,
        );

        $this->assertSame('at_risk', $status, 'A never-submitted student in an ongoing program must be at_risk, not on_track/inactive.');
    }

    public function test_fulfilled_makeup_heals_the_streak(): void
    {
        // Student scheduled every day. Submits daily for a week, misses one middle
        // day but files an excuse and completes the makeup the next day.
        $student = $this->makeStudent(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']);
        $pair    = Pair::create(['student_a_id' => $student->id, 'status' => 'active']);

        $missedDay = $this->today->copy()->subDays(3);

        for ($d = 10; $d >= 0; $d--) {
            $date = $this->today->copy()->subDays($d);
            if ($date->isSameDay($missedDay)) {
                continue; // the missed day — caught up via makeup instead
            }
            PairSubmission::create([
                'pair_id' => $pair->id, 'submitted_by' => $student->id,
                'subject_student_id' => $student->id, 'juz' => 1,
                'page_from' => 1, 'page_to' => 2, 'minutes_spent' => 20,
                'submission_date' => $date->toDateString(),
            ]);
        }

        // Excuse for the missed day, makeup already fulfilled.
        \App\Models\MissedSubmissionExcuse::create([
            'student_id'  => $student->id,
            'missed_date' => $missedDay->toDateString(),
            'makeup_date' => $missedDay->copy()->addDay()->toDateString(),
            'reason'      => 'Sick',
            'fulfilled'   => true,
        ]);

        // The fulfilled makeup should protect the missed day, so the streak spans
        // the whole 11-day window rather than breaking at the missed day.
        $streak = app(ConsistencyService::class)->getStreak($student->id);
        $this->assertGreaterThanOrEqual(11, $streak, "Fulfilled makeup must heal the streak; got {$streak}.");
    }
}
