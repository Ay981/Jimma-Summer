<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\MeetingActionItem;
use App\Models\MeetingLog;
use App\Models\User;
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
            ->map(fn ($m) => $this->formatMeeting($m))
            ->toArray();

        // Open action items (from previous meetings)
        $openActions = MeetingActionItem::whereHas('meeting', fn ($q) => $q->where('halqa_id', $halqa->id))
            ->where('status', 'open')
            ->with(['student:id,name', 'meeting'])
            ->orderBy('due_date')
            ->get()
            ->map(fn ($a) => [
                'id'          => $a->id,
                'student'     => $a->student->name,
                'student_id'  => $a->student_id,
                'description' => $a->description,
                'due_date'    => $a->due_date?->toDateString(),
                'meeting_date'=> Carbon::parse($a->meeting->meeting_date)->toDateString(),
                'overdue'     => $a->due_date && $a->due_date->isPast(),
            ])->toArray();

        // Students for agenda suggestions (at-risk / with follow-up)
        $atRiskStudentIds = collect();
        foreach ($halqa->pairs()->with(['studentA', 'studentB'])->get() as $pair) {
            // Simple heuristic: no submission in last 3 days
            $ids = array_filter([$pair->student_a_id, $pair->student_b_id]);
            foreach ($ids as $id) {
                $last = \App\Models\PairSubmission::where('subject_student_id', $id)->orderByDesc('submission_date')->value('submission_date');
                if (!$last || Carbon::parse($last)->diffInDays(Carbon::today()) >= 3) {
                    $atRiskStudentIds->push($id);
                }
            }
        }
        $suggestedStudents = User::whereIn('id', $atRiskStudentIds->unique()->values())
            ->get(['id', 'name'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])
            ->toArray();

        $allStudents = User::where('halqa_id', $halqa->id)->where('role', 'student')
            ->get(['id', 'name'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name])
            ->toArray();

        return Inertia::render('Leader/Meetings', [
            'meetings'          => $meetings,
            'open_actions'      => $openActions,
            'halqa'             => ['id' => $halqa->id, 'name' => $halqa->name],
            'suggested_students'=> $suggestedStudents,
            'all_students'      => $allStudents,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa, 403);

        $request->validate([
            'meeting_date'     => ['required', 'date'],
            'meeting_time'     => ['nullable', 'string'],
            'notes'            => ['nullable', 'string', 'max:5000'],
            'highlights'       => ['nullable', 'string', 'max:2000'],
            'concerns'         => ['nullable', 'string', 'max:2000'],
            'agenda_items'     => ['nullable', 'array'],
            'attendance'       => ['nullable', 'array'],
            'action_items'     => ['nullable', 'array'],
            'state'            => ['in:draft,final'],
        ]);

        $attendance = $request->input('attendance', []);
        $attendedCount = count(array_filter($attendance, fn ($v) => $v === 'present'));

        $meeting = MeetingLog::create([
            'halqa_id'         => $halqa->id,
            'leader_id'        => $leader->id,
            'meeting_date'     => $request->meeting_date,
            'meeting_time'     => $request->meeting_time,
            'attendance_count' => $attendedCount,
            'notes'            => $request->notes,
            'agenda_items'     => $request->agenda_items,
            'attendance'       => $attendance,
            'highlights'       => $request->highlights,
            'concerns'         => $request->concerns,
            'state'            => $request->input('state', 'draft'),
        ]);

        // Create action items
        foreach ($request->input('action_items', []) as $item) {
            if (empty($item['description']) || empty($item['student_id'])) continue;
            MeetingActionItem::create([
                'meeting_id'  => $meeting->id,
                'student_id'  => $item['student_id'],
                'description' => $item['description'],
                'due_date'    => $item['due_date'] ?? null,
            ]);
        }

        return redirect()->route('leader.meetings')->with('success',
            $request->input('state') === 'draft' ? 'Meeting saved as draft.' : 'Meeting finalised.'
        );
    }

    public function update(Request $request, MeetingLog $meeting): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa || $meeting->halqa_id !== $halqa->id, 403);

        $request->validate([
            'notes'      => ['nullable', 'string', 'max:5000'],
            'highlights' => ['nullable', 'string', 'max:2000'],
            'concerns'   => ['nullable', 'string', 'max:2000'],
            'state'      => ['in:draft,final'],
        ]);

        $attendance    = $request->input('attendance', $meeting->attendance ?? []);
        $attendedCount = count(array_filter($attendance, fn ($v) => $v === 'present'));

        $meeting->update([
            'notes'            => $request->notes,
            'highlights'       => $request->highlights,
            'concerns'         => $request->concerns,
            'attendance'       => $attendance,
            'attendance_count' => $attendedCount,
            'state'            => $request->input('state', $meeting->state),
        ]);

        return back()->with('success', 'Meeting updated.');
    }

    public function destroy(MeetingLog $meeting): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa || $meeting->halqa_id !== $halqa->id, 403);
        $meeting->delete();
        return back()->with('success', 'Meeting log deleted.');
    }

    public function resolveAction(MeetingActionItem $actionItem): RedirectResponse
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa;
        abort_if(!$halqa || $actionItem->meeting->halqa_id !== $halqa->id, 403);
        $actionItem->update(['status' => 'resolved', 'resolved_at' => now()]);
        return back()->with('success', 'Action item resolved.');
    }

    private function formatMeeting(MeetingLog $m): array
    {
        return [
            'id'               => $m->id,
            'meeting_date'     => Carbon::parse($m->meeting_date)->toDateString(),
            'meeting_time'     => $m->meeting_time,
            'attendance_count' => $m->attendance_count,
            'notes'            => $m->notes,
            'highlights'       => $m->highlights,
            'concerns'         => $m->concerns,
            'agenda_items'     => $m->agenda_items ?? [],
            'attendance'       => $m->attendance ?? [],
            'state'            => $m->state,
            'created_at'       => Carbon::parse($m->created_at)->format('Y-m-d H:i'),
        ];
    }
}
