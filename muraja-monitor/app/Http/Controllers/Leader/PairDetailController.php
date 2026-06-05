<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\ContactLog;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\PrivateNote;
use App\Models\Watchlist;
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

        $students = collect([$pair->studentA, $pair->studentB])->map(function ($student) use ($leader) {
            $last30        = collect(range(29, 0))
                ->map(fn ($i) => Carbon::today()->subDays($i)->toDateString());
            $availableDays = $student->available_times ?? []; // e.g. ['saturday','monday']

            $submittedDates = PairSubmission::where('subject_student_id', $student->id)
                ->whereBetween('submission_date', [$last30->first(), $last30->last()])
                ->pluck('submission_date')
                ->map(fn ($d) => Carbon::parse($d)->toDateString())
                ->toArray();

            $heatmap = $last30->map(fn ($date) => [
                'date'      => $date,
                'submitted' => in_array($date, $submittedDates),
                'scheduled' => empty($availableDays)
                    || in_array(strtolower(Carbon::parse($date)->format('l')), $availableDays, true),
            ])->values()->toArray();

            $history = PairSubmission::where('subject_student_id', $student->id)
                ->orderByDesc('submission_date')
                ->take(60)
                ->get()
                ->map(fn ($s) => [
                    'id'              => $s->id,
                    'juz'             => $s->juz,
                    'page_from'       => $s->page_from,
                    'page_to'         => $s->page_to,
                    'pages'           => $s->page_to - $s->page_from + 1,
                    'minutes_spent'   => $s->minutes_spent,
                    'is_edited'       => $s->is_edited,
                    'is_flagged'      => $s->is_flagged,
                    'flag_verdict'    => $s->flag_verdict,
                    'submission_date' => Carbon::parse($s->submission_date)->toDateString(),
                    'submitted_at'    => Carbon::parse($s->submitted_at)->format('H:i'),
                ])->toArray();

            $contactLogs = ContactLog::where('student_id', $student->id)
                ->where('contacted_by', $leader->id)
                ->orderByDesc('contacted_at')
                ->get()
                ->map(fn ($c) => [
                    'id'                 => $c->id,
                    'method'             => $c->method,
                    'note'               => $c->note,
                    'contacted_at'       => Carbon::parse($c->contacted_at)->format('Y-m-d H:i'),
                    'follow_up_required' => $c->follow_up_required,
                ])->toArray();

            $privateNote = PrivateNote::where('student_id', $student->id)
                ->where('leader_id', $leader->id)
                ->value('note');

            $onWatchlist = Watchlist::where('student_id', $student->id)
                ->whereNull('resolved_at')
                ->exists();

            // Last login
            $lastLogin = \App\Models\AuditLog::where('user_id', $student->id)
                ->where('action', 'login')
                ->orderByDesc('created_at')
                ->value('created_at');

            // Recent notifications sent to this student
            $notifLog = $student->notifications()
                ->orderByDesc('created_at')
                ->take(10)
                ->get()
                ->map(fn ($n) => [
                    'id'         => $n->id,
                    'type'       => class_basename($n->type),
                    'message'    => json_decode($n->data, true)['message'] ?? '',
                    'sent_at'    => Carbon::parse($n->created_at)->format('Y-m-d H:i'),
                    'seen_at'    => $n->seen_at ? Carbon::parse($n->seen_at)->format('Y-m-d H:i') : null,
                    'read_at'    => $n->read_at ? Carbon::parse($n->read_at)->format('Y-m-d H:i') : null,
                ])->toArray();

            return [
                'id'           => $student->id,
                'name'         => $student->name,
                'student_id'   => $student->student_id,
                'heatmap'      => $heatmap,
                'history'      => $history,
                'contact_logs' => $contactLogs,
                'private_note' => $privateNote ?? '',
                'on_watchlist' => $onWatchlist,
                'last_login'   => $lastLogin ? Carbon::parse($lastLogin)->diffForHumans() : 'Never',
                'notif_log'    => $notifLog,
            ];
        })->values()->toArray();

        return Inertia::render('Leader/PairDetail', [
            'pair'  => ['id' => $pair->id, 'students' => $students],
            'halqa' => ['id' => $halqa->id, 'name' => $halqa->name],
        ]);
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

    public function updatePrivateNote(Request $request, Pair $pair, int $studentId): RedirectResponse
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
