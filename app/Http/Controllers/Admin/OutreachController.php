<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactLog;
use App\Models\PairSubmission;
use App\Models\User;
use App\Models\Watchlist;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Str;
use Inertia\Inertia;
use Inertia\Response;

class OutreachController extends Controller
{
    public function index(): Response
    {
        $logs = ContactLog::with(['student:id,name,student_id', 'contactedBy:id,name'])
            ->orderByDesc('contacted_at')
            ->get()
            ->map(fn ($c) => [
                'id'                 => $c->id,
                'student'            => ['id' => $c->student->id, 'name' => $c->student->name, 'student_id' => $c->student->student_id],
                'by'                 => $c->contactedBy?->name ?? '—',
                'method'             => $c->method,
                'note'               => $c->note,
                'contacted_at'       => Carbon::parse($c->contacted_at)->format('Y-m-d H:i'),
                'follow_up_required' => $c->follow_up_required,
            ])->toArray();

        // No-submission-today list (for quick bulk action)
        $today      = Carbon::today()->toDateString();
        $submitted  = PairSubmission::where('submission_date', $today)->pluck('subject_student_id')->unique();
        $notToday   = User::where('role', 'student')->where('is_active', true)
            ->whereNotIn('id', $submitted)
            ->get(['id', 'name', 'student_id'])
            ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'student_id' => $u->student_id])
            ->toArray();

        return Inertia::render('Admin/Outreach', [
            'logs'     => $logs,
            'notToday' => $notToday,
        ]);
    }

    public function storeNote(Request $request): RedirectResponse
    {
        $request->validate([
            'student_id'         => ['required', 'exists:users,id'],
            'method'             => ['required', 'in:call,message,in_person'],
            'note'               => ['required', 'string', 'max:1000'],
            'follow_up_required' => ['boolean'],
        ]);

        ContactLog::create([
            'student_id'         => $request->student_id,
            'contacted_by'       => auth()->id(),
            'method'             => $request->method,
            'note'               => $request->note,
            'contacted_at'       => now(),
            'follow_up_required' => $request->boolean('follow_up_required'),
        ]);

        return back()->with('success', 'Contact note added.');
    }

    public function bulkNotify(Request $request): RedirectResponse
    {
        $request->validate(['student_ids' => ['required', 'array'], 'student_ids.*' => ['exists:users,id']]);

        $notified = 0;
        foreach ($request->student_ids as $sid) {
            $student = User::find($sid);
            if (!$student) continue;
            $student->notifications()->create([
                'id'              => Str::uuid(),
                'type'            => 'App\Notifications\AdminOutreach',
                'notifiable_type' => User::class,
                'notifiable_id'   => $sid,
                'data'            => json_encode(['message' => 'Reminder from admin: please log your muraja\'a for today.']),
                'created_at'      => now(),
            ]);
            $notified++;
        }

        return back()->with('success', "Notification sent to {$notified} students.");
    }

    public function bulkWatchlist(Request $request): RedirectResponse
    {
        $request->validate(['student_ids' => ['required', 'array'], 'student_ids.*' => ['exists:users,id']]);

        foreach ($request->student_ids as $sid) {
            $exists = Watchlist::where('student_id', $sid)->whereNull('resolved_at')->exists();
            if (!$exists) {
                Watchlist::create(['student_id' => $sid, 'added_by' => auth()->id(), 'added_at' => now()]);
            }
        }

        return back()->with('success', count($request->student_ids) . ' student(s) added to watchlist.');
    }
}
