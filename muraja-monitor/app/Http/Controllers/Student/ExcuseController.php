<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\MissedSubmissionExcuse;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ExcuseController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $request->validate([
            'missed_date' => ['required', 'date'],
            'reason'      => ['required', 'string', 'max:500'],
            'makeup_date' => ['required', 'date'],
        ]);

        $missed = Carbon::parse($request->missed_date)->startOfDay();
        $makeup = Carbon::parse($request->makeup_date)->startOfDay();
        $now    = Carbon::now();

        // Must be filed within 48 hours of the missed day
        $deadline = $missed->copy()->addHours(48);
        if ($now->gt($deadline)) {
            return back()->with('error', 'The 48-hour excuse window for ' . $missed->format('M d') . ' has passed.');
        }

        // The missed day must be a scheduled day for this student
        $scheduledDays = $user->available_days ?? [];
        if (!empty($scheduledDays) && !in_array(strtolower($missed->format('l')), $scheduledDays, true)) {
            return back()->with('error', 'That day was not in your schedule.');
        }

        // The missed day must not already have a submission
        if (PairSubmission::where('subject_student_id', $user->id)->where('submission_date', $missed->toDateString())->exists()) {
            return back()->with('error', 'You already submitted on that day.');
        }

        // Makeup must be within the same calendar week (Sun–Sat) as the missed day
        $weekStart = $missed->copy()->startOfWeek(Carbon::SUNDAY);
        $weekEnd   = $missed->copy()->endOfWeek(Carbon::SATURDAY);
        if ($makeup->lt($weekStart) || $makeup->gt($weekEnd)) {
            return back()->with('error', 'Makeup date must be within the same week (' . $weekStart->format('M d') . '–' . $weekEnd->format('M d') . ').');
        }

        // Makeup must be today or later
        if ($makeup->lt(Carbon::today())) {
            return back()->with('error', 'Makeup date must be today or a future date.');
        }

        MissedSubmissionExcuse::updateOrCreate(
            ['student_id' => $user->id, 'missed_date' => $missed->toDateString()],
            ['reason' => $request->reason, 'makeup_date' => $makeup->toDateString(), 'fulfilled' => false]
        );

        return back()->with('success', 'Excuse filed. Ask your partner to record your makeup session on ' . $makeup->format('M d, Y') . ' to protect your streak.');
    }
}
