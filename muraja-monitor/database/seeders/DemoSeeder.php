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
    if (app()->environment("production") && !env("ALLOW_PROD_SEED", false)) {
      $this->command?->warn(
        "DemoSeeder skipped in production. Set ALLOW_PROD_SEED=true to override.",
      );
      return;
    }

    // ── Halqa ────────────────────────────────────────────────────────────
    $halqa = Halqa::firstOrCreate(["name" => "Demo Halqa"]);

    // ── Leader ───────────────────────────────────────────────────────────
    $leader = User::firstOrCreate(
      ["student_id" => "LDR001"],
      [
        "name" => "Demo Leader",
        "phone" => "0911111111",
        "password" => Hash::make(
          env("LEADER_SEED_PASSWORD", "ChangeMe@" . rand(1000, 9999)),
        ),
        "role" => "leader",
        "halqa_id" => $halqa->id,
        "is_active" => true,
        "must_change_password" => false,
      ],
    );

    // Assign leader to halqa
    $halqa->update(["leader_id" => $leader->id]);

    // ── Students ─────────────────────────────────────────────────────────
    $studentA = User::firstOrCreate(
      ["student_id" => "STU001"],
      [
        "name" => "Ahmed Ali",
        "phone" => "0922222222",
        "password" => Hash::make(
          env("STUDENT_SEED_PASSWORD", "ChangeMe@" . rand(1000, 9999)),
        ),
        "role" => "student",
        "halqa_id" => $halqa->id,
        "weekly_target" => 20,
        "is_active" => true,
        "must_change_password" => false,
      ],
    );

    $studentB = User::firstOrCreate(
      ["student_id" => "STU002"],
      [
        "name" => "Fatima Omar",
        "phone" => "0933333333",
        "password" => Hash::make(
          env("STUDENT_SEED_PASSWORD", "ChangeMe@" . rand(1000, 9999)),
        ),
        "role" => "student",
        "halqa_id" => $halqa->id,
        "weekly_target" => 20,
        "is_active" => true,
        "must_change_password" => false,
      ],
    );

    // ── Pair ─────────────────────────────────────────────────────────────
    Pair::firstOrCreate(
      ["student_a_id" => $studentA->id, "student_b_id" => $studentB->id],
      ["halqa_id" => $halqa->id, "status" => "active"],
    );

    // ── Leader activation code (for testing /leader/setup) ────────────────
    LeaderCode::firstOrCreate(
      ["code" => "LDR-TEST"],
      ["halqa_id" => $halqa->id, "is_active" => true, "used_by" => null],
    );

    $this->command->info("");
    $this->command->info("  Demo accounts:");
    $this->command->info("  ─────────────────────────────────────────");
    $this->command->info(
      "  Admin    │ ADMIN001   │ (see ADMIN_SEED_PASSWORD env)",
    );
    $this->command->info(
      "  Leader   │ LDR001     │ (see LEADER_SEED_PASSWORD env)",
    );
    $this->command->info(
      "  Student  │ STU001     │ (see STUDENT_SEED_PASSWORD env)",
    );
    $this->command->info(
      "  Student  │ STU002     │ (see STUDENT_SEED_PASSWORD env)",
    );
    $this->command->info("  Setup code: LDR-TEST");
    $this->command->info("  ─────────────────────────────────────────");
  }
}
