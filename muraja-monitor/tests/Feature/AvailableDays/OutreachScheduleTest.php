<?php

namespace Tests\Feature\AvailableDays;

use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\PostgresTestCase;

/**
 * Encodes correct behaviour for outreach / "no submission today" flows.
 *
 * Expected to FAIL until fixed:
 *  - Admin OutreachController::index() builds the "notToday" list from every
 *    active student who has not submitted today, ignoring available_days — so a
 *    student whose schedule excludes today is wrongly surfaced for outreach.
 *  - Leader OutreachController::notifyAbsent() nags every pair with no submission
 *    today without checking whether today is a scheduled day.
 */
class OutreachScheduleTest extends PostgresTestCase
{
    use RefreshDatabase;

    private Carbon $today;

    protected function setUp(): void
    {
        parent::setUp();
        $this->today = Carbon::parse('2026-07-12'); // Sunday
        Carbon::setTestNow($this->today->copy()->setTime(9, 0));
        ProgramSetting::set('program_start_date', $this->today->copy()->subDays(60)->toDateString());
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
            'profile_completed' => true,
            'is_active'         => true,
        ]);
        $student->forceFill(['created_at' => $this->today->copy()->subDays(60)])->save();

        return $student->fresh();
    }

    public function test_admin_no_submission_list_excludes_students_off_today(): void
    {
        $admin = User::create([
            'name' => 'Admin', 'student_id' => 'ADMIN-001',
            'password' => 'password', 'role' => 'admin',
        ]);

        // Today is Sunday. This student is scheduled Mon/Wed/Fri only, so Sunday is
        // a day off — they should NOT appear in the outreach "didn't submit" list.
        $offToday = $this->makeStudent(['monday', 'wednesday', 'friday'], 'JUMU-2026-201');

        // This student IS scheduled Sunday and hasn't submitted — should appear.
        $onToday = $this->makeStudent(['sunday'], 'JUMU-2026-202');

        $response = $this->actingAs($admin)->get('/admin/outreach');
        $response->assertOk();

        $notToday = collect($response->viewData('page')['props']['notToday'])
            ->pluck('student_id')->all();

        $this->assertNotContains(
            'JUMU-2026-201',
            $notToday,
            'A student whose schedule excludes today must not be flagged for outreach.'
        );
        $this->assertContains(
            'JUMU-2026-202',
            $notToday,
            'A student scheduled today who has not submitted should be flagged.'
        );
    }

    public function test_leader_notify_absent_skips_students_off_today(): void
    {
        $leader = User::create([
            'name' => 'Leader', 'student_id' => 'LEAD-001',
            'password' => 'password', 'role' => 'leader',
        ]);
        $halqa = Halqa::create(['name' => 'Halqa A', 'leader_id' => $leader->id]);
        $leader->forceFill(['halqa_id' => $halqa->id])->save();

        // Both students scheduled Mon/Wed/Fri only; today is Sunday (day off).
        $a = $this->makeStudent(['monday', 'wednesday', 'friday'], 'JUMU-2026-203');
        $b = $this->makeStudent(['monday', 'wednesday', 'friday'], 'JUMU-2026-204');
        $a->forceFill(['halqa_id' => $halqa->id])->save();
        $b->forceFill(['halqa_id' => $halqa->id])->save();
        Pair::create([
            'student_a_id' => $a->id, 'student_b_id' => $b->id,
            'halqa_id' => $halqa->id, 'status' => 'active',
        ]);

        $this->actingAs($leader)->post('/leader/outreach/notify-all')->assertRedirect();

        // No reminder should have been sent, because today is not a scheduled day.
        $this->assertSame(
            0,
            \DB::table('notifications')->count(),
            'notifyAbsent must not nag students on a day their schedule excludes.'
        );
    }
}
