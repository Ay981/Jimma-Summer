<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\MeetingLog;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MeetingController extends Controller
{
    public function index(): Response
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;

        abort_if(!$halqa, 403);

        $meetings = MeetingLog::where('halqa_id', $halqa->id)
            ->orderByDesc('meeting_date')
            ->get()
            ->map(fn ($m) => [
                'id'               => $m->id,
                'meeting_date'     => Carbon::parse($m->meeting_date)->toDateString(),
                'attendance_count' => $m->attendance_count,
                'notes'            => $m->notes,
                'created_at'       => Carbon::parse($m->created_at)->format('Y-m-d H:i'),
            ])->toArray();

        return Inertia::render('Leader/Meetings', [
            'meetings' => $meetings,
            'halqa'    => ['id' => $halqa->id, 'name' => $halqa->name],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa, 403);

        $request->validate([
            'meeting_date'     => ['required', 'date'],
            'attendance_count' => ['required', 'integer', 'min:0', 'max:500'],
            'notes'            => ['nullable', 'string', 'max:5000'],
        ]);

        MeetingLog::create([
            'halqa_id'         => $halqa->id,
            'leader_id'        => $leader->id,
            'meeting_date'     => $request->meeting_date,
            'attendance_count' => $request->attendance_count,
            'notes'            => $request->notes,
        ]);

        return redirect()->route('leader.meetings')->with('success', 'Meeting logged.');
    }

    public function destroy(MeetingLog $meeting): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa || $meeting->halqa_id !== $halqa->id, 403);

        $meeting->delete();

        return back()->with('success', 'Meeting log deleted.');
    }
}
