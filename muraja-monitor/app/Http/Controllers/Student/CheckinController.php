<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\MissedSubmissionExcuse;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Notifications\PartnerSubmitted;
use App\Services\BadgeService;
use App\Services\ConsistencyService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CheckinController extends Controller
{
    public function __construct(
        private readonly BadgeService $badges,
        private readonly ConsistencyService $consistency,
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'juz'          => ['required', 'integer', 'min:1', 'max:30'],
            'page_from'    => ['required', 'integer', 'min:1', 'max:604'],
            'page_to'      => ['required', 'integer', 'min:1', 'max:604', 'gte:page_from'],
            'minutes_spent'=> ['required', 'integer', 'min:1', 'max:480'],
        ]);

        $user  = $request->user();
        $today = now()->toDateString();

        $pair = Pair::where(function ($q) use ($user) {
            $q->where('student_a_id', $user->id)->orWhere('student_b_id', $user->id);
        })->with(['studentA', 'studentB'])->first();

        $partner = $pair
            ? ($pair->student_a_id === $user->id ? $pair->studentB : $pair->studentA)
            : null;

        // Subject is the partner (paired) or self (solo / no pair yet)
        $subject = $partner ?? $user;

        if (PairSubmission::where('submitted_by', $user->id)
            ->where('subject_student_id', $subject->id)
            ->where('submission_date', $today)
            ->exists()) {
            $msg = $partner
                ? "You have already recorded {$partner->name}'s session for today."
                : 'You have already submitted today.';
            return back()->withErrors(['submit' => $msg]);
        }

        $submission = PairSubmission::create([
            'pair_id'            => $pair?->id,
            'submitted_by'       => $user->id,
            'subject_student_id' => $subject->id,
            'juz'                => $request->juz,
            'page_from'          => $request->page_from,
            'page_to'            => $request->page_to,
            'minutes_spent'      => $request->minutes_spent,
            'submission_date'    => $today,
            'submitted_at'       => now(),
        ]);

        AuditLog::create([
            'user_id'     => $user->id,
            'action'      => 'submission_filed',
            'target_type' => 'pair_submission',
            'target_id'   => $submission->id,
        ]);

        // Recompute consistency and badges for the subject (partner or self)
        $this->consistency->forget($subject->id);
        $this->badges->checkAndAward($subject);

        // Mark any unfulfilled excuse for the subject
        MissedSubmissionExcuse::where('student_id', $subject->id)
            ->where('makeup_date', $today)
            ->where('fulfilled', false)
            ->update(['fulfilled' => true]);

        // Notify the subject (partner) that their session was recorded
        if ($partner) {
            $partner->notify(new PartnerSubmitted($submission, $user->name));
        }

        return redirect()->route('student.dashboard')->with('success', 'JazakAllah khayran! Recorded.');
    }

    public function update(Request $request, PairSubmission $submission): RedirectResponse
    {
        $user = $request->user();

        // Only the submitter (the one who filed it) or the subject can edit
        abort_if($submission->submitted_by !== $user->id && $submission->subject_student_id !== $user->id, 403);

        $endDate = \App\Models\ProgramSetting::get('program_end_date');
        if ($endDate && now()->gt(\Carbon\Carbon::parse($endDate))) {
            return back()->withErrors(['edit' => 'The edit window has closed for this program.']);
        }

        $request->validate([
            'juz'          => ['required', 'integer', 'min:1', 'max:30'],
            'page_from'    => ['required', 'integer', 'min:1', 'max:604'],
            'page_to'      => ['required', 'integer', 'min:1', 'max:604', 'gte:page_from'],
            'minutes_spent'=> ['required', 'integer', 'min:1', 'max:480'],
        ]);

        $submission->update([
            'juz'          => $request->juz,
            'page_from'    => $request->page_from,
            'page_to'      => $request->page_to,
            'minutes_spent'=> $request->minutes_spent,
            'edited_at'    => now(),
            'is_edited'    => true,
        ]);

        AuditLog::create([
            'user_id'     => $user->id,
            'action'      => 'submission_edited',
            'target_type' => 'pair_submission',
            'target_id'   => $submission->id,
        ]);

        return back()->with('success', 'Submission updated.');
    }
}
