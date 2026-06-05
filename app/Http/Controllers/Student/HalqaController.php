<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Halqa;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use App\Services\ConsistencyService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HalqaController extends Controller
{
    public function __construct(private readonly ConsistencyService $consistency) {}

    public function show(Request $request): Response
    {
        $user = $request->user()->load('halqa.leader');

        if (! $user->halqa_id) {
            return Inertia::render('Student/Halqa', ['halqa' => null]);
        }

        $halqa = $user->halqa->load('pairs.studentA:id,name', 'pairs.studentB:id,name');

        // Halqa rank among all halqas
        $start       = Carbon::parse(ProgramSetting::get('program_start_date', now()->toDateString()));
        $programDays = max(1, $start->diffInDays(now()) + 1);

        $allHalqas = Halqa::with('members:id,halqa_id')->get()->map(function ($h) use ($programDays) {
            $memberIds = $h->members->pluck('id');
            if ($memberIds->isEmpty()) {
                return ['id' => $h->id, 'consistency' => 0];
            }
            $total = PairSubmission::whereIn('subject_student_id', $memberIds)->count();
            return ['id' => $h->id, 'consistency' => ($total / ($programDays * $memberIds->count())) * 100];
        })->sortByDesc('consistency')->values();

        $rank = $allHalqas->search(fn ($h) => $h['id'] === $user->halqa_id) + 1;

        return Inertia::render('Student/Halqa', [
            'halqa' => [
                'name'              => $halqa->name,
                'leader_name'       => $halqa->leader?->name ?? '—',
                'group_consistency' => $this->consistency->getGroupConsistency($user->halqa_id),
                'rank'              => $rank,
                'total_halqas'      => $allHalqas->count(),
                'pairs'             => $halqa->pairs->map(fn ($p) => [
                    'id'        => $p->id,
                    'student_a' => $p->studentA->name,
                    'student_b' => $p->studentB?->name ?? 'Solo',
                    'status'    => $p->status,
                ]),
            ],
        ]);
    }
}
