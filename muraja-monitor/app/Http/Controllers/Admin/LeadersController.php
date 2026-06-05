<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ContactLog;
use App\Models\MeetingLog;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class LeadersController extends Controller
{
    public function index(): Response
    {
        $leaders = User::where('role', 'leader')->where('is_active', true)
            ->with('ledHalqa.members', 'ledHalqa.pairs')
            ->get();

        $today   = Carbon::today();
        $week    = $today->copy()->subDays(6)->toDateString();

        $data = $leaders->map(function ($leader) use ($today, $week) {
            $halqa = $leader->ledHalqa;

            // Login frequency (last 30 days)
            $logins30 = AuditLog::where('user_id', $leader->id)
                ->where('action', 'login')
                ->where('created_at', '>=', $today->copy()->subDays(29))
                ->count();

            // Last login
            $lastLogin = AuditLog::where('user_id', $leader->id)
                ->where('action', 'login')
                ->orderByDesc('created_at')
                ->value('created_at');

            // Contact notes this week
            $notesThisWeek = ContactLog::where('contacted_by', $leader->id)
                ->where('contacted_at', '>=', $week)
                ->count();

            // Total contact notes
            $totalNotes = ContactLog::where('contacted_by', $leader->id)->count();

            // Meeting logs
            $meetingCount = $halqa ? MeetingLog::where('halqa_id', $halqa->id)->count() : 0;
            $lastMeeting  = $halqa ? MeetingLog::where('halqa_id', $halqa->id)->orderByDesc('meeting_date')->value('meeting_date') : null;

            // Active members
            $memberCount = $halqa?->members->where('role', 'student')->count() ?? 0;
            $pairCount   = $halqa?->pairs->count() ?? 0;

            $neverLoggedIn = $lastLogin === null;
            $inactiveThisWeek = !$lastLogin || Carbon::parse($lastLogin)->lt($today->copy()->subDays(6));

            return [
                'id'               => $leader->id,
                'name'             => $leader->name,
                'student_id'       => $leader->student_id,
                'halqa'            => $halqa?->name ?? '— unassigned —',
                'member_count'     => $memberCount,
                'pair_count'       => $pairCount,
                'logins_30d'       => $logins30,
                'last_login'       => $lastLogin ? Carbon::parse($lastLogin)->diffForHumans() : 'Never',
                'notes_this_week'  => $notesThisWeek,
                'total_notes'      => $totalNotes,
                'meeting_count'    => $meetingCount,
                'last_meeting'     => $lastMeeting ? Carbon::parse($lastMeeting)->toDateString() : null,
                'never_logged_in'  => $neverLoggedIn,
                'inactive_this_week' => $inactiveThisWeek,
            ];
        })->values()->toArray();

        return Inertia::render('Admin/Leaders', ['leaders' => $data]);
    }
}
