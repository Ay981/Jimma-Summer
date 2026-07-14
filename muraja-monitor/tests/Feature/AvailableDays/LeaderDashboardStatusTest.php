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
 * Regression for the /leader/dashboard screenshot bug: never-submitted pairs were
 * shown "On Track" at 0% (and inflated the On Track count) because the pair
 * schedule was read from available_times (prayer slots) instead of available_days,
 * collapsing the scheduled-day count to 1 and tripping the ≤2-day grace branch.
 */
class LeaderDashboardStatusTest extends PostgresTestCase
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

    private function student(string $sid, array $days): User
    {
        $s = User::create([
            'name' => "S {$sid}", 'student_id' => $sid, 'password' => 'password',
            'role' => 'student', 'available_days' => $days,
            'available_times' => ['after_asr'], 'profile_completed' => true,
        ]);
        $s->forceFill(['created_at' => $this->today->copy()->subDays(60)])->save();
        return $s->fresh();
    }

    public function test_never_submitted_pair_is_at_risk_not_on_track(): void
    {
        $leader = User::create([
            'name' => 'Leader', 'student_id' => 'LEAD-001',
            'password' => 'password', 'role' => 'leader',
        ]);
        $halqa = Halqa::create(['name' => 'مع القرآن', 'leader_id' => $leader->id]);
        $leader->forceFill(['halqa_id' => $halqa->id])->save();

        $a = $this->student('JUMU-2026-301', ['monday', 'wednesday', 'friday']);
        $b = $this->student('JUMU-2026-302', ['monday', 'wednesday', 'friday']);
        $a->forceFill(['halqa_id' => $halqa->id])->save();
        $b->forceFill(['halqa_id' => $halqa->id])->save();
        Pair::create([
            'student_a_id' => $a->id, 'student_b_id' => $b->id,
            'halqa_id' => $halqa->id, 'status' => 'active',
        ]);
        // No submissions at all.

        $response = $this->actingAs($leader)->get('/leader/dashboard');
        $response->assertOk();

        $props   = $response->viewData('page')['props'];
        $pair    = $props['pairs'][0];
        $summary = $props['summary'];

        $this->assertSame('at_risk', $pair['status'], 'Never-submitted pair must be at_risk, not on_track.');
        $this->assertSame(0, $summary['on_track'], 'Never-submitted pair must not be counted On Track.');
    }
}
