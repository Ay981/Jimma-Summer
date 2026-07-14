<?php

namespace Tests\Feature\AvailableDays;

use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\PostgresTestCase;

/**
 * Encodes the CORRECT behaviour for the admin students list + detail pages.
 *
 * These are expected to FAIL until the available_days bugs are fixed:
 *  - StudentController::index() computes consistency as submitted / raw calendar
 *    days ($effDays), ignoring available_days.
 *  - StudentController::index() derives status from a schedule-blind sparkline, so
 *    a perfectly-attending part-week student is mislabelled slipping/at_risk.
 *  - StudentController::show() (and studentDetailData) build the heatmap
 *    `scheduled` flag from available_times (prayer slots) instead of available_days,
 *    so off-days are not marked "not scheduled".
 */
class AdminStudentsConsistencyTest extends PostgresTestCase
{
    use RefreshDatabase;

    private Carbon $today;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->today = Carbon::parse('2026-07-12'); // Sunday
        Carbon::setTestNow($this->today->copy()->setTime(9, 0));
        ProgramSetting::set('program_start_date', $this->today->copy()->subDays(60)->toDateString());

        $this->admin = User::create([
            'name'       => 'Admin',
            'student_id' => 'ADMIN-001',
            'password'   => 'password',
            'role'       => 'admin',
        ]);
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
            'available_times'   => ['after_asr'], // deliberately non-weekday values
            'profile_completed' => true,
        ]);
        $student->forceFill(['created_at' => $this->today->copy()->subDays(60)])->save();

        return $student->fresh();
    }

    private function submitEveryScheduledDay(User $student): void
    {
        $pair = Pair::create(['student_a_id' => $student->id, 'status' => 'active']);
        $days = array_map('strtolower', $student->available_days ?? []);
        // Cover the whole program window (started 60 days ago) so a perfect
        // attendee is genuinely 100% consistent.
        $cursor = $this->today->copy()->subDays(60);
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

    private function rowFor(array $students, string $studentId): array
    {
        foreach ($students as $row) {
            if (($row['student_id'] ?? null) === $studentId) {
                return $row;
            }
        }
        $this->fail("Student {$studentId} not found in students prop.");
    }

    public function test_index_consistency_ignores_days_off(): void
    {
        $student = $this->makeStudent(['monday', 'wednesday', 'friday'], 'JUMU-2026-101');
        $this->submitEveryScheduledDay($student);

        $response = $this->actingAs($this->admin)->get('/admin/students');
        $response->assertOk();

        $students = $response->viewData('page')['props']['students'];
        $row = $this->rowFor($students, 'JUMU-2026-101');

        // A student who submitted every scheduled day is 100% consistent — NOT ~43%
        // (which is 6 scheduled days / 14 calendar days in the window).
        $this->assertEqualsWithDelta(
            100.0,
            $row['consistency'],
            0.05,
            "Admin students page must measure consistency against scheduled days; got {$row['consistency']}%."
        );
    }

    public function test_index_status_is_on_track_for_perfect_part_week_student(): void
    {
        $student = $this->makeStudent(['monday', 'wednesday', 'friday'], 'JUMU-2026-102');
        $this->submitEveryScheduledDay($student);

        $response = $this->actingAs($this->admin)->get('/admin/students');
        $students = $response->viewData('page')['props']['students'];
        $row = $this->rowFor($students, 'JUMU-2026-102');

        // Today (Sun) and yesterday (Sat) are days off, so the schedule-blind
        // sparkline counts them as consecutive misses and mislabels the student.
        $this->assertContains(
            $row['status'],
            ['on_track'],
            "A student perfect on every scheduled day must be on_track, got '{$row['status']}'."
        );
        $this->assertNotContains($row['status'], ['slipping', 'at_risk', 'inactive']);
    }

    public function test_detail_heatmap_marks_off_days_as_not_scheduled(): void
    {
        $student = $this->makeStudent(['monday', 'wednesday', 'friday'], 'JUMU-2026-103');
        $this->submitEveryScheduledDay($student);

        $response = $this->actingAs($this->admin)->get('/admin/students/'.$student->id);
        $response->assertOk();

        $heatmap = collect($response->viewData('page')['props']['heatmap']);

        // A Sunday in the window is NOT a scheduled day for a Mon/Wed/Fri student.
        $sunday = $heatmap->firstWhere('date', $this->today->toDateString());
        $this->assertNotNull($sunday, 'Heatmap should include today.');
        $this->assertFalse(
            $sunday['scheduled'],
            'Sunday must be marked not-scheduled for a Mon/Wed/Fri student (heatmap uses available_days, not available_times).'
        );

        // A Monday in the window IS a scheduled day.
        $monday = $heatmap->first(fn ($c) => Carbon::parse($c['date'])->isMonday());
        $this->assertTrue($monday['scheduled'], 'Monday must be marked scheduled.');
    }
}
