<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            AyatRotationSeeder::class,
            ProgramSettingsSeeder::class,
            DemoSeeder::class,
        ]);

        // Create a default admin account for first-run setup
        User::firstOrCreate(
            ['student_id' => 'ADMIN001'],
            [
                'name'                 => 'System Admin',
                'student_id'           => 'ADMIN001',
                'phone'                => null,
                'password'             => Hash::make('Muraja@1446'),
                'role'                 => 'admin',
                'halqa_id'             => null,
                'is_active'            => true,
                'must_change_password' => true,
            ]
        );
    }
}
