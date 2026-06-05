<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Notifications\PartnerSubmitted;
use App\Services\BadgeService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CheckinController extends Controller
{
    public function __construct(private readonly BadgeService $badges) {}

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

        if (PairSubmission::where('subject_student_id', $user->id)->where('submission_date', $today)->exists()) {
            return back()->withErrors(['submit' => 'You have already submitted today.']);
        }

        $pair = Pair::where(function ($q) use ($user) {
            $q->where('student_a_id', $user->id)->orWhere('student_b_id', $user->id);
        })->first();

        $submission = PairSubmission::create([
            'pair_id'            => $pair?->id,
            'submitted_by'       => $user->id,
            'subject_student_id' => $user->id,
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

        // Check and award badges
        $this->badges->checkAndAward($user);

        // Notify partner
        if ($pair) {
            $partner = $pair->student_a_id === $user->id ? $pair->studentB : $pair->studentA;
            $partner?->notify(new PartnerSubmitted($submission, $user->name));
        }

        return redirect()->route('student.dashboard')->with('success', 'JazakAllah khayran! Recorded.');
    }

    public function update(Request $request, PairSubmission $submission): RedirectResponse
    {
        $user = $request->user();

        // Only the subject student (or submitter) can edit
        abort_if($submission->subject_student_id !== $user->id && $submission->submitted_by !== $user->id, 403);

        // Check edit window: editable before program end date
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
