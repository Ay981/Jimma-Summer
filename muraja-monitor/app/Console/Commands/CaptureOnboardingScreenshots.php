<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\Process\Process;

class CaptureOnboardingScreenshots extends Command
{
    protected $signature   = 'onboarding:capture';
    protected $description = 'Capture annotated screenshots and regenerate onboarding PDF guides';

    public function handle(): int
    {
        $this->ensureDemoAccount();

        $this->info('Launching Playwright capture + PDF generation…');

        $process = new Process(
            ['node', base_path('scripts/capture-onboarding.mjs')],
            base_path(),
            array_merge($_ENV, ['APP_URL' => config('app.url')]),
        );
        $process->setTimeout(300);

        $process->run(function (string $_type, string $output) {
            $this->getOutput()->write($output);
        });

        if (! $process->isSuccessful()) {
            $this->error('Failed (exit ' . $process->getExitCode() . ').');
            return self::FAILURE;
        }

        $this->info('Guides saved to ' . storage_path('app/private/onboarding'));
        return self::SUCCESS;
    }

    private function ensureDemoAccount(): void
    {
        $halqaId = DB::table('users')->where('student_id', 'JUMU-2026-010')->value('halqa_id') ?? 1;

        DB::table('users')->updateOrInsert(
            ['student_id' => 'JUMU-1446-010'],
            [
                'name'              => 'Demo Student',
                'student_id'        => 'JUMU-1446-010',
                'phone'             => '0911000000',
                'password'          => Hash::make('Student@123'),
                'role'              => 'student',
                'halqa_id'          => $halqaId,
                'profile_completed' => false,
                'must_change_password' => false,
                'weekly_target'     => 20,
                'current_juz'       => 1,
                'is_active'         => true,
                'is_monitored'      => false,
                'is_solo'           => false,
                'updated_at'        => now(),
                'created_at'        => now(),
            ]
        );

        $this->line('  Demo account JUMU-1446-010 ready.');
    }
}
