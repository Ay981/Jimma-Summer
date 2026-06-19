<?php

namespace App\Console\Commands;

use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use App\Notifications\MurajaDayReminder;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendMurajaReminders extends Command
{
    protected $signature   = 'muraja:remind {slot=morning : morning or evening}';
    protected $description = 'Remind students whose schedule includes today to submit their muraja, if they have not already.';

    public function handle(): int
    {
        $slot  = $this->argument('slot') === 'evening' ? 'evening' : 'morning';
        $today = Carbon::today();

        // ── Program window guard (mirrors CheckinController) ──
        $startDate = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        if ($today->lt($startDate)) {
            $this->info('Program has not started yet — no reminders sent.');
            return self::SUCCESS;
        }
        $endDate = ProgramSetting::get('program_end_date');
        if ($endDate && $today->gt(Carbon::parse($endDate))) {
            $this->info('Program has ended — no reminders sent.');
            return self::SUCCESS;
        }

        $todayName = strtolower($today->format('l'));

        $students = User::where('role', 'student')
            ->whereNotNull('available_days')
            ->get()
            ->filter(fn (User $s) => in_array(
                $todayName,
                array_map('strtolower', $s->available_days ?? []),
                true,
            ));

        $submittedToday = PairSubmission::where('submission_date', $today->toDateString())
            ->pluck('subject_student_id')
            ->flip();

        $sent = 0;
        foreach ($students as $student) {
            if ($submittedToday->has($student->id)) {
                continue;
            }
            $student->notify(new MurajaDayReminder($slot));
            $sent++;
        }

        $this->info("Sent {$slot} muraja reminders to {$sent} student(s).");
        return self::SUCCESS;
    }
}
