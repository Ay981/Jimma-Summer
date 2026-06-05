<?php

namespace Database\Seeders;

use App\Models\ProgramSetting;
use Illuminate\Database\Seeder;

class ProgramSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'program_name'            => "Muraja'a Monitor — Summer 1446",
            'program_start_date'      => now()->format('Y-m-d'),
            'program_end_date'        => now()->addDays(90)->format('Y-m-d'),
            'default_password'        => 'Muraja@1446',
            'certificate_threshold'   => '80',
            'badge_streak_bronze'     => '7',
            'badge_streak_silver'     => '14',
            'badge_streak_gold'       => '30',
            'badge_pages_bronze'      => '100',
            'badge_pages_silver'      => '300',
            'badge_pages_gold'        => '604',
            'exam_mode'               => '0',
            'ramadan_mode'            => '0',
            'date_override'           => '',
        ];

        foreach ($defaults as $key => $value) {
            ProgramSetting::firstOrCreate(['key' => $key], ['value' => $value]);
        }
    }
}
