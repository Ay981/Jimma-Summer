<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminNote;
use App\Models\PairSubmission;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IntegrityController extends Controller
{
    public function index(): Response
    {
        $flagged = PairSubmission::where('is_flagged', true)
            ->with(['subject:id,name', 'submitter:id,name', 'pair.halqa:id,name'])
            ->orderByDesc('submission_date')
            ->get()
            ->map(fn ($s) => [
                'id'              => $s->id,
                'student'         => $s->subject?->name ?? '—',
                'student_id'      => $s->subject_student_id,
                'filed_by'        => $s->submitter?->name ?? '—',
                'halqa'           => $s->pair?->halqa?->name ?? '—',
                'juz'             => $s->juz,
                'page_from'       => $s->page_from,
                'page_to'         => $s->page_to,
                'minutes_spent'   => $s->minutes_spent,
                'submission_date' => Carbon::parse($s->submission_date)->toDateString(),
                'is_edited'       => $s->is_edited,
                'flag_verdict'    => $s->flag_verdict,
            ])->toArray();

        // Self-filed submissions — a student recorded their OWN muraja instead of
        // their partner's, which breaks the cross-submission rule. This is only
        // expected when the student had no pair (the `?? $user` fallback in
        // CheckinController); a self-filing with a pair attached is a real anomaly.
        $selfSubs = PairSubmission::whereColumn('submitted_by', 'subject_student_id')
            ->with(['subject:id,name', 'pair.halqa:id,name'])
            ->orderByDesc('submission_date')
            ->take(50)
            ->get()
            ->map(fn ($s) => [
                'id'       => $s->id,
                'student'  => $s->subject?->name ?? '—',
                'halqa'    => $s->pair?->halqa?->name ?? '—',
                'date'     => Carbon::parse($s->submission_date)->toDateString(),
                'has_pair' => $s->pair_id !== null,
            ])->toArray();

        return Inertia::render('Admin/Integrity', compact('flagged', 'selfSubs'));
    }

    public function reviewFlag(Request $request, PairSubmission $submission): RedirectResponse
    {
        $request->validate(['verdict' => ['required', 'in:verified,rejected']]);
        $submission->update([
            'flag_verdict'     => $request->verdict,
            'flag_reviewed_by' => auth()->id(),
            'flag_reviewed_at' => now(),
        ]);
        return back()->with('success', 'Submission ' . $request->verdict . '.');
    }

    public function unflag(PairSubmission $submission): RedirectResponse
    {
        $submission->update(['is_flagged' => false, 'flag_verdict' => null, 'flag_reviewed_by' => null, 'flag_reviewed_at' => null]);
        return back()->with('success', 'Flag removed.');
    }
}
