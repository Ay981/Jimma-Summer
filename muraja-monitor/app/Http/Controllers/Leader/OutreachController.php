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

        $todayCarbon = Carbon::today();
        $today       = $todayCarbon->toDateString();
        $todayName   = strtolower($todayCarbon->format('l'));

        // Students who are scheduled today and have not submitted yet.
        $students = $halqa->pairs
            ->flatMap(fn ($p) => [$p->studentA, $p->studentB])
            ->filter()
            ->unique('id')
            ->filter(function ($student) use ($todayName) {
                $days = array_map('strtolower', $student->available_days ?? []);
                return empty($days) || in_array($todayName, $days, true); // day off → don't nag
            });

        $submittedToday = PairSubmission::whereIn('subject_student_id', $students->pluck('id'))
            ->where('submission_date', $today)
            ->pluck('subject_student_id')
            ->flip();

        $notifyIds = [];
        foreach ($students as $student) {
            if ($submittedToday->has($student->id)) {
                continue;
            }
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
            $notifyIds[] = $student->id;
        }

        if (! empty($notifyIds)) {
            SendFcmPush::toUsers(
                $notifyIds,
                "Reminder from {$leader->name}",
                'Please submit your muraja\'a for today.',
                '/student/dashboard',
            );
        }

        $count = count($notifyIds);
        return back()->with('success', "Reminder sent to {$count} students.");
    }
}
