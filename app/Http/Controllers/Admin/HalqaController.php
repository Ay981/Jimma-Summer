<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Halqa;
use App\Models\LeaderCode;
use App\Models\MeetingLog;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class HalqaController extends Controller
{
    public function index(): Response
    {
        $today        = Carbon::today();
        $programStart = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $programDays  = max(1, $programStart->diffInDays($today) + 1);

        $halqas = Halqa::with([
            'leader:id,name',
            'pairs',
            'members' => fn ($q) => $q->where('role', 'student'),
        ])->get()->map(function ($halqa) use ($programDays) {
            $memberIds   = $halqa->members->pluck('id');
            $totalSubs   = $memberIds->isEmpty() ? 0
                : PairSubmission::whereIn('subject_student_id', $memberIds)->count();
            $groupCons   = $memberIds->isEmpty() ? 0
                : round(($totalSubs / ($programDays * $memberIds->count())) * 100, 1);

            $codes = LeaderCode::where('halqa_id', $halqa->id)
                ->with('usedByUser:id,name')
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($c) => [
                    'id'        => $c->id,
                    'code'      => $c->code,
                    'is_active' => $c->is_active,
                    'used_by'   => $c->usedByUser?->name,
                    'created_at'=> Carbon::parse($c->created_at)->toDateString(),
                ])->toArray();

            $meetings = MeetingLog::where('halqa_id', $halqa->id)
                ->orderByDesc('meeting_date')
                ->take(5)
                ->get()
                ->map(fn ($m) => [
                    'id'               => $m->id,
                    'meeting_date'     => Carbon::parse($m->meeting_date)->toDateString(),
                    'attendance_count' => $m->attendance_count,
                    'notes'            => $m->notes,
                ])->toArray();

            return [
                'id'              => $halqa->id,
                'name'            => $halqa->name,
                'leader'          => $halqa->leader?->name ?? 'No leader',
                'student_count'   => $halqa->members->count(),
                'pair_count'      => $halqa->pairs->count(),
                'group_consistency'=> $groupCons,
                'codes'           => $codes,
                'meetings'        => $meetings,
            ];
        });

        return Inertia::render('Admin/Halqas', [
            'halqas' => $halqas->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['name' => ['required', 'string', 'max:255', 'unique:halqas,name']]);
        Halqa::create(['name' => $request->name]);
        return back()->with('success', 'Halqa created.');
    }

    public function update(Request $request, Halqa $halqa): RedirectResponse
    {
        $request->validate(['name' => ['required', 'string', 'max:255', 'unique:halqas,name,' . $halqa->id]]);
        $halqa->update(['name' => $request->name]);
        return back()->with('success', 'Halqa renamed.');
    }

    public function destroy(Halqa $halqa): RedirectResponse
    {
        // Only allow deletion if no students are assigned
        if ($halqa->members()->where('role', 'student')->exists()) {
            return back()->with('error', 'Cannot delete a halqa that still has students.');
        }
        $halqa->delete();
        return back()->with('success', 'Halqa deleted.');
    }

    public function generateCode(Halqa $halqa): RedirectResponse
    {
        // Deactivate any unused existing codes first
        LeaderCode::where('halqa_id', $halqa->id)->whereNull('used_by')->update(['is_active' => false]);

        $code = 'LDR-' . strtoupper(Str::random(4));
        // Ensure uniqueness
        while (LeaderCode::where('code', $code)->exists()) {
            $code = 'LDR-' . strtoupper(Str::random(4));
        }

        LeaderCode::create([
            'halqa_id'  => $halqa->id,
            'code'      => $code,
            'is_active' => true,
        ]);

        return back()->with('success', "New code generated: {$code}");
    }

    public function deactivateCode(LeaderCode $code): RedirectResponse
    {
        $code->update(['is_active' => false]);
        return back()->with('success', 'Code deactivated.');
    }

    public function assignPair(Request $request, Halqa $halqa): RedirectResponse
    {
        $request->validate(['pair_id' => ['required', 'exists:pairs,id']]);
        Pair::findOrFail($request->pair_id)->update(['halqa_id' => $halqa->id]);
        return back()->with('success', 'Pair assigned to halqa.');
    }
}
