<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
  public function run(): void
  {
    if (app()->environment("production") && !env("ALLOW_PROD_SEED", false)) {
      $this->command?->warn(
        "Seeder skipped in production. Set ALLOW_PROD_SEED=true to override.",
      );
      return;
    }

    $this->call([
      AyatRotationSeeder::class,
      ProgramSettingsSeeder::class,
      // DemoSeeder::class,  ← dev only, never run in production
    ]);

    // Create admin account only on first deploy — never overwrites
    User::firstOrCreate(
      ["student_id" => "ADMIN001"],
      [
        "name" => "System Admin",
        "phone" => null,
        "password" => Hash::make(
          env("ADMIN_SEED_PASSWORD", "ChangeMe@" . rand(1000, 9999)),
        ),
        "role" => "admin",
        "halqa_id" => null,
        "is_active" => true,
        "must_change_password" => true,
      ],
    );
  }
}
