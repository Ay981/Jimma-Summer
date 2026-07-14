<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\ContactLog;
use App\Models\MissedSubmissionExcuse;
use App\Models\MurajaTest;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\PrivateNote;
use App\Models\Watchlist;
use App\Services\HalqaDashboardService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PairDetailController extends Controller
{
    public function show(Pair $pair): Response
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;

        abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);

        $pair->load(['studentA', 'studentB']);

        $props = app(HalqaDashboardService::class)->pairDetailProps($pair, $halqa, $leader);

        // All active students for the pair-change partner search (leader-only write flow)
        $props['all_students'] = \App\Models\User::where('role', 'student')
            ->where('is_active', true)
            ->get(['id', 'name', 'student_id', 'halqa_id'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'student_id' => $s->student_id, 'halqa_id' => $s->halqa_id])
            ->toArray();

        return Inertia::render('Leader/PairDetail', $props);
    }

    public function addContact(Request $request, Pair $pair): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);

        $request->validate([
            'student_id'         => ['required', 'integer'],
            'method'             => ['required', 'in:call,message,in_person'],
            'note'               => ['required', 'string', 'max:1000'],
            'follow_up_required' => ['boolean'],
            'contacted_at'       => ['required', 'date'],
            'snooze_days'        => ['nullable', 'integer', 'min:1', 'max:90'],
            'outcome'            => ['nullable', 'in:pending,responded,no_response,resolved,escalated'],
        ]);

        $studentId = (int) $request->student_id;
        abort_if(!in_array($studentId, [$pair->student_a_id, $pair->student_b_id]), 403);

        ContactLog::create([
            'student_id'         => $studentId,
            'contacted_by'       => $leader->id,
            'method'             => $request->method,
            'note'               => $request->note,
            'contacted_at'       => $request->contacted_at,
            'follow_up_required' => $request->boolean('follow_up_required'),
            'snooze_until'       => $request->snooze_days ? now()->addDays($request->snooze_days)->toDateString() : null,
            'outcome'            => $request->input('outcome', 'pending'),
        ]);

        return back()->with('success', 'Contact note added.');
    }

    public function updatePrivateNote(Request $request, Pair $pair, int $studentId): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);
        abort_if(!in_array($studentId, [$pair->student_a_id, $pair->student_b_id]), 403);

        $request->validate(['note' => ['nullable', 'string', 'max:5000']]);

        PrivateNote::updateOrCreate(
            ['student_id' => $studentId, 'leader_id' => $leader->id],
            ['note' => $request->note ?? '']
        );

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Note saved.']);
        }

        return back()->with('success', 'Note saved.');
    }

    public function toggleWatchlist(Pair $pair, int $studentId): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);
        abort_if(!in_array($studentId, [$pair->student_a_id, $pair->student_b_id]), 403);

        $entry = Watchlist::where('student_id', $studentId)->whereNull('resolved_at')->first();

        if ($entry) {
            $entry->update(['resolved_at' => now()]);
            return back()->with('success', 'Removed from watchlist.');
        }

        Watchlist::create([
            'student_id' => $studentId,
            'added_by'   => $leader->id,
            'added_at'   => now(),
        ]);

        return back()->with('success', 'Added to watchlist.');
    }

    public function reviewSubmission(Request $request, Pair $pair, PairSubmission $submission): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);
        abort_if($submission->pair_id !== $pair->id, 403);

        $request->validate(['verdict' => ['required', 'in:verified,rejected']]);

        $submission->update([
            'flag_verdict'      => $request->verdict,
            'flag_reviewed_by'  => $leader->id,
            'flag_reviewed_at'  => now(),
        ]);

        return back()->with('success', 'Submission ' . $request->verdict . '.');
    }

    public function flagSubmission(Pair $pair, PairSubmission $submission): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);
        abort_if($submission->pair_id !== $pair->id, 403);

        $submission->update(['is_flagged' => !$submission->is_flagged]);

        return back()->with('success', $submission->is_flagged ? 'Submission flagged.' : 'Flag removed.');
    }
}
