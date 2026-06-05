<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\JournalEntry;
use App\Models\PairSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JournalController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $entries = JournalEntry::where('user_id', $user->id)
            ->with('submission:id,juz,page_from,page_to,submission_date')
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(fn ($e) => [
                'id'         => $e->id,
                'text'       => $e->text,
                'created_at' => $e->created_at->format('M d, Y'),
                'submission' => $e->submission ? [
                    'juz'      => $e->submission->juz,
                    'page_from'=> $e->submission->page_from,
                    'page_to'  => $e->submission->page_to,
                    'date'     => $e->submission->submission_date->format('M d'),
                ] : null,
            ]);

        $todaySubmission = PairSubmission::where('subject_student_id', $user->id)
            ->where('submission_date', now()->toDateString())
            ->first();

        $canAddEntry = $todaySubmission !== null
            && ! JournalEntry::where('user_id', $user->id)
                ->where('submission_id', $todaySubmission->id)
                ->exists();

        return Inertia::render('Student/Journal', [
            'entries'    => $entries,
            'can_add'    => $canAddEntry,
            'today_sub'  => $todaySubmission ? [
                'id'  => $todaySubmission->id,
                'juz' => $todaySubmission->juz,
            ] : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'text'          => ['required', 'string', 'min:5', 'max:2000'],
            'submission_id' => ['nullable', 'exists:pair_submissions,id'],
        ]);

        $user = $request->user();

        // Prevent duplicate journal entry for same submission
        if ($request->submission_id) {
            $exists = JournalEntry::where('user_id', $user->id)
                ->where('submission_id', $request->submission_id)
                ->exists();
            if ($exists) {
                return back()->withErrors(['text' => 'You already wrote a reflection for this submission.']);
            }
        }

        JournalEntry::create([
            'user_id'       => $user->id,
            'submission_id' => $request->submission_id,
            'text'          => $request->text,
        ]);

        return redirect()->route('student.journal')->with('success', 'Reflection saved.');
    }
}
