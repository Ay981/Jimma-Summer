<?php

namespace Tests\Feature;

use App\Models\Halqa;
use App\Models\Pair;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\PostgresTestCase;

/**
 * Admin "View as Leader" — read-only halqa performance view. Verifies the admin
 * GET endpoints render the same prop shape the leader dashboard/pair-detail use,
 * enforce halqa/pair ownership, and degrade gracefully for a leaderless halqa.
 */
class AdminViewAsLeaderTest extends PostgresTestCase
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

    private function admin(): User
    {
        return User::create([
            'name' => 'Admin', 'student_id' => 'ADM-001',
            'password' => 'password', 'role' => 'admin',
        ]);
    }

    private function student(string $sid): User
    {
        $s = User::create([
            'name' => "S {$sid}", 'student_id' => $sid, 'password' => 'password',
            'role' => 'student', 'available_days' => ['monday', 'wednesday', 'friday'],
            'available_times' => ['after_asr'], 'profile_completed' => true,
        ]);
        $s->forceFill(['created_at' => $this->today->copy()->subDays(60)])->save();
        return $s->fresh();
    }

    private function halqaWithPair(?User $leader, string $tag = 'A'): array
    {
        $halqa = Halqa::create(['name' => 'مع القرآن', 'leader_id' => $leader?->id]);
        if ($leader) $leader->forceFill(['halqa_id' => $halqa->id])->save();

        $a = $this->student("JUMU-{$tag}-301");
        $b = $this->student("JUMU-{$tag}-302");
        $a->forceFill(['halqa_id' => $halqa->id])->save();
        $b->forceFill(['halqa_id' => $halqa->id])->save();
        $pair = Pair::create([
            'student_a_id' => $a->id, 'student_b_id' => $b->id,
            'halqa_id' => $halqa->id, 'status' => 'active',
        ]);

        return [$halqa, $pair];
    }

    public function test_admin_can_view_halqa_dashboard_as_leader(): void
    {
        $leader = User::create([
            'name' => 'Leader', 'student_id' => 'LEAD-001',
            'password' => 'password', 'role' => 'leader',
        ]);
        [$halqa] = $this->halqaWithPair($leader);

        $response = $this->actingAs($this->admin())->get("/admin/halqas/{$halqa->id}/dashboard");
        $response->assertOk();

        $props = $response->viewData('page')['props'];
        $this->assertSame('Admin/HalqaDashboard', $response->viewData('page')['component']);
        $this->assertCount(1, $props['pairs']);
        $this->assertArrayHasKey('students', $props);
        $this->assertArrayHasKey('group_identity', $props);
        $this->assertArrayHasKey('summary', $props);
    }

    public function test_admin_can_view_pair_detail_as_leader(): void
    {
        $leader = User::create([
            'name' => 'Leader', 'student_id' => 'LEAD-001',
            'password' => 'password', 'role' => 'leader',
        ]);
        [$halqa, $pair] = $this->halqaWithPair($leader);

        $response = $this->actingAs($this->admin())->get("/admin/halqas/{$halqa->id}/members/{$pair->id}");
        $response->assertOk();

        $props = $response->viewData('page')['props'];
        $this->assertSame('Admin/HalqaPairDetail', $response->viewData('page')['component']);
        $this->assertCount(2, $props['pair']['students']);
        // all_students is a leader-only (pair-change) prop, must be absent for admin
        $this->assertArrayNotHasKey('all_students', $props);
    }

    public function test_pair_from_another_halqa_is_forbidden(): void
    {
        [$halqaA]      = $this->halqaWithPair(null, 'A');
        [, $pairB]     = $this->halqaWithPair(null, 'B');

        $this->actingAs($this->admin())
            ->get("/admin/halqas/{$halqaA->id}/members/{$pairB->id}")
            ->assertForbidden();
    }

    public function test_leaderless_halqa_renders_with_empty_scoped_data(): void
    {
        [$halqa, $pair] = $this->halqaWithPair(null);
        $admin = $this->admin();

        $dash = $this->actingAs($admin)->get("/admin/halqas/{$halqa->id}/dashboard");
        $dash->assertOk();
        $this->assertSame([], $dash->viewData('page')['props']['follow_up_queue']);

        $detail = $this->actingAs($admin)->get("/admin/halqas/{$halqa->id}/members/{$pair->id}");
        $detail->assertOk();
        foreach ($detail->viewData('page')['props']['pair']['students'] as $student) {
            $this->assertSame([], $student['contact_logs']);
            $this->assertSame('', $student['private_note']);
        }
    }

    public function test_non_admin_cannot_access_admin_view(): void
    {
        $leader = User::create([
            'name' => 'Leader', 'student_id' => 'LEAD-001',
            'password' => 'password', 'role' => 'leader',
        ]);
        [$halqa] = $this->halqaWithPair($leader);

        $this->actingAs($leader)
            ->get("/admin/halqas/{$halqa->id}/dashboard")
            ->assertForbidden();
    }
}
