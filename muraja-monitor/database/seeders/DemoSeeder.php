<?php

namespace Database\Seeders;

use App\Models\Halqa;
use App\Models\LeaderCode;
use App\Models\Pair;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        // ── Halqa ────────────────────────────────────────────────────────────
        $halqa = Halqa::firstOrCreate(['name' => 'Demo Halqa']);

        // ── Leader ───────────────────────────────────────────────────────────
        $leader = User::firstOrCreate(
            ['student_id' => 'LDR001'],
            [
                'name'                 => 'Demo Leader',
                'phone'                => '0911111111',
                'password'             => Hash::make('Leader@123'),
                'role'                 => 'leader',
                'halqa_id'             => $halqa->id,
                'is_active'            => true,
                'must_change_password' => false,
            ]
        );

        // Assign leader to halqa
        $halqa->update(['leader_id' => $leader->id]);

        // ── Students ─────────────────────────────────────────────────────────
        $studentA = User::firstOrCreate(
            ['student_id' => 'STU001'],
            [
                'name'                 => 'Ahmed Ali',
                'phone'                => '0922222222',
                'password'             => Hash::make('Student@123'),
                'role'                 => 'student',
                'halqa_id'             => $halqa->id,
                'weekly_target'        => 20,
                'is_active'            => true,
                'must_change_password' => false,
            ]
        );

        $studentB = User::firstOrCreate(
            ['student_id' => 'STU002'],
            [
                'name'                 => 'Fatima Omar',
                'phone'                => '0933333333',
                'password'             => Hash::make('Student@123'),
                'role'                 => 'student',
                'halqa_id'             => $halqa->id,
                'weekly_target'        => 20,
                'is_active'            => true,
                'must_change_password' => false,
            ]
        );

        // ── Pair ─────────────────────────────────────────────────────────────
        Pair::firstOrCreate(
            ['student_a_id' => $studentA->id, 'student_b_id' => $studentB->id],
            ['halqa_id' => $halqa->id, 'status' => 'active']
        );

        // ── Leader activation code (for testing /leader/setup) ────────────────
        LeaderCode::firstOrCreate(
            ['code' => 'LDR-TEST'],
            ['halqa_id' => $halqa->id, 'is_active' => true, 'used_by' => null]
        );

        $this->command->info('');
        $this->command->info('  Demo accounts:');
        $this->command->info('  ─────────────────────────────────────────');
        $this->command->info('  Admin    │ ADMIN001   │ Muraja@1446');
        $this->command->info('  Leader   │ LDR001     │ Leader@123');
        $this->command->info('  Student  │ STU001     │ Student@123');
        $this->command->info('  Student  │ STU002     │ Student@123');
        $this->command->info('  Setup code: LDR-TEST');
        $this->command->info('  ─────────────────────────────────────────');
    }
}
