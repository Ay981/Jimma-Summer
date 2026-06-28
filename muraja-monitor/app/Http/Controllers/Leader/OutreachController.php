<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\ContactLog;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\User;
use App\Jobs\SendFcmPush;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class OutreachController extends Controller
{
    public function markFollowedUp(Request $request, Pair $pair): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);

        $note = $request->input('note', 'Followed up on missed submission.');

        // Log contact for both students in the pair
        foreach ([$pair->student_a_id, $pair->student_b_id] as $studentId) {
            ContactLog::create([
                'student_id'         => $studentId,
                'contacted_by'       => $leader->id,
                'method'             => 'in_person',
                'note'               => $note,
                'contacted_at'       => now(),
                'follow_up_required' => false,
            ]);
        }

        return back()->with('success', 'Follow-up recorded.');
    }

    public function notifyAbsent(): RedirectResponse
    {
        $leader  = auth()->user();
        $halqa   = $leader->ledHalqa()->with(['pairs.studentA', 'pairs.studentB'])->first();

        abort_if(!$halqa, 403);

        $today = Carbon::today()->toDateString();

        $count = 0;
        foreach ($halqa->pairs as $pair) {
            $submitted = PairSubmission::whereIn('subject_student_id', [$pair->student_a_id, $pair->student_b_id])
                ->where('submission_date', $today)
                ->exists();

            if (!$submitted) {
                foreach ([$pair->studentA, $pair->studentB] as $student) {
                    $student->notifications()->create([
                        'id'              => Str::uuid(),
                        'type'            => 'App\Notifications\LeaderReminder',
                        'notifiable_type' => User::class,
                        'notifiable_id'   => $student->id,
                        'data'            => [
                            'message' => 'Your leader sent a reminder: please submit your muraja\'a for today.',
                            'from'    => $leader->name,
                        ],
                        'created_at' => now(),
                    ]);
                    $count++;
                }
            }
        }

        // Also fix double json_encode on data while we're here — done above already

        SendFcmPush::toUsers(
            $halqa->pairs->flatMap(fn ($p) => [$p->student_a_id, $p->student_b_id])->filter()->unique()->values()->toArray(),
            "Reminder from {$leader->name}",
            'Please submit your muraja\'a for today.',
            '/student/dashboard',
        );

        return back()->with('success', "Reminder sent to {$count} students.");
    }
}
