<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Halqa;
use App\Models\MeetingLog;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class HalqaController extends Controller
{
    // ── Index ─────────────────────────────────────────────────────────────────

    public function index(): Response
    {
        $today        = Carbon::today();
        $programStart = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $programDays  = max(1, $programStart->diffInDays($today) + 1);

        $halqas = Halqa::with([
            'leader:id,name,student_id',
            'pairs',
            'members' => fn ($q) => $q->where('role', 'student'),
        ])->get()->map(function ($halqa) use ($programDays) {
            $memberIds = $halqa->members->pluck('id');
            $totalSubs = $memberIds->isEmpty() ? 0
                : PairSubmission::whereIn('subject_student_id', $memberIds)->count();
            $groupCons = $memberIds->isEmpty() ? 0
                : round(($totalSubs / ($programDays * $memberIds->count())) * 100, 1);

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
                'id'               => $halqa->id,
                'name'             => $halqa->name,
                'leader'           => $halqa->leader ? [
                    'id'         => $halqa->leader->id,
                    'name'       => $halqa->leader->name,
                    'student_id' => $halqa->leader->student_id,
                ] : null,
                'student_count'    => $halqa->members->count(),
                'pair_count'       => $halqa->pairs->count(),
                'group_consistency'=> $groupCons,
                'meetings'         => $meetings,
            ];
        });

        // Students not yet in any halqa (for assignment preview)
        $assignedStudentIds = User::where('role', 'student')->whereNotNull('halqa_id')->pluck('id');
        $unassignedCount = User::where('role', 'student')->where('is_active', true)->whereNull('halqa_id')->count();
        $totalActiveStudents = User::where('role', 'student')->where('is_active', true)->count();

        return Inertia::render('Admin/Halqas', [
            'halqas'               => $halqas->values(),
            'total_active_students'=> $totalActiveStudents,
            'unassigned_count'     => $unassignedCount,
        ]);
    }

    // ── Bulk create halqas + leader accounts ─────────────────────────────────

    public function bulkCreate(Request $request): RedirectResponse
    {
        $request->validate([
            'num_leaders' => ['required', 'integer', 'min:1', 'max:50'],
        ]);

        $n = (int) $request->num_leaders;

        // Count active students
        $totalStudents = User::where('role', 'student')->where('is_active', true)->count();
        if ($totalStudents === 0) {
            return back()->with('error', 'No active students exist yet. Import students before creating halqas.');
        }

        $credentials = DB::transaction(function () use ($n) {
            $creds = [];

            for ($i = 1; $i <= $n; $i++) {
                $halqaName = "Halqa {$i}";
                // Skip if halqa already exists with this name
                $halqa = Halqa::firstOrCreate(['name' => $halqaName]);

                // Skip if a leader is already assigned
                if ($halqa->leader_id) {
                    continue;
                }

                $username = 'leader-' . str_pad($i, 2, '0', STR_PAD_LEFT);
                $password = 'Muraja@1446';

                // Unique student_id for leader
                $studentId = 'LDR-' . str_pad($i, 4, '0', STR_PAD_LEFT);
                if (User::where('student_id', $studentId)->exists()) {
                    continue; // Leader already exists
                }

                $leader = User::create([
                    'name'                 => $username,
                    'student_id'           => $studentId,
                    'password'             => Hash::make($password),
                    'role'                 => 'leader',
                    'halqa_id'             => $halqa->id,
                    'is_active'            => true,
                    'must_change_password' => true,
                    'profile_completed'    => true, // leaders skip profile completion
                ]);

                $halqa->update(['leader_id' => $leader->id]);

                $creds[] = [
                    'halqa'    => $halqa->name,
                    'username' => $username,
                    'password' => $password,
                ];
            }

            return $creds;
        });

        session()->flash('credentials', $credentials);

        $count = count($credentials);
        return back()->with('success', "{$n} halqa(s) created with {$count} leader account(s).");
    }

    // ── Create single halqa ───────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['name' => ['required', 'string', 'max:255', 'unique:halqas,name']]);
        Halqa::create(['name' => $request->name]);
        return back()->with('success', 'Halqa created.');
    }

    // ── Rename ────────────────────────────────────────────────────────────────

    public function update(Request $request, Halqa $halqa): RedirectResponse
    {
        $request->validate(['name' => ['required', 'string', 'max:255', 'unique:halqas,name,' . $halqa->id]]);
        $halqa->update(['name' => $request->name]);
        return back()->with('success', 'Halqa renamed.');
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public function destroy(Halqa $halqa): RedirectResponse
    {
        if ($halqa->members()->where('role', 'student')->exists()) {
            return back()->with('error', 'Cannot delete a halqa that still has students.');
        }
        $halqa->delete();
        return back()->with('success', 'Halqa deleted.');
    }

    // ── Random assign students to halqas ─────────────────────────────────────

    public function randomAssign(Request $request): RedirectResponse
    {
        // FIX 8: Guard
        $halqas = Halqa::all();
        if ($halqas->isEmpty()) {
            return back()->with('error', 'Create halqas first before assigning students.');
        }

        $students = User::where('role', 'student')
            ->where('is_active', true)
            ->whereNull('halqa_id')
            ->get();

        if ($students->isEmpty()) {
            return back()->with('error', 'No unassigned students to distribute.');
        }

        $n     = $halqas->count();
        $total = $students->count();

        // Sort students by available_times so compatible ones cluster
        $sorted = $students->sortBy(fn ($s) => implode(',', $s->available_times ?? []));
        $chunks = $sorted->chunk((int) ceil($total / $n));

        $halqaList = $halqas->values();
        DB::transaction(function () use ($chunks, $halqaList) {
            foreach ($chunks as $i => $chunk) {
                $halqa = $halqaList[$i % $halqaList->count()];
                foreach ($chunk as $student) {
                    $student->update(['halqa_id' => $halqa->id]);
                }
            }
        });

        return back()->with('success', "{$total} students randomly assigned to {$n} halqa(s).");
    }

    // ── Random pair within halqa ──────────────────────────────────────────────

    public function randomPair(Request $request, Halqa $halqa): RedirectResponse
    {
        $students = User::where('halqa_id', $halqa->id)
            ->where('role', 'student')
            ->where('is_active', true)
            ->get();

        if ($students->count() < 2) {
            return back()->with('error', 'Not enough students in this halqa to form pairs.');
        }

        $result    = $this->doRandomPairing($students->toArray());
        $unmatchedCount = count($result['no_match']);

        DB::transaction(function () use ($result, $halqa) {
            foreach ($result['matched'] as $p) {
                Pair::firstOrCreate(
                    [
                        'student_a_id' => min($p['a'], $p['b']),
                        'student_b_id' => max($p['a'], $p['b']),
                    ],
                    ['halqa_id' => $halqa->id, 'status' => 'active']
                );
            }
            // Solo student
            foreach ($result['no_match'] as $s) {
                User::find($s['id'])?->update(['is_solo' => true]);
            }
        });

        $msg = count($result['matched']) . ' pair(s) created in ' . $halqa->name . '.';
        if ($unmatchedCount > 0) {
            $msg .= " {$unmatchedCount} student(s) could not be auto-paired — assign manually.";
        }
        return back()->with('success', $msg);
    }

    // ── Swap students between halqas ──────────────────────────────────────────

    public function swapStudents(Request $request): RedirectResponse
    {
        $request->validate([
            'student_a_id' => ['required', 'exists:users,id'],
            'student_b_id' => ['required', 'exists:users,id'],
        ]);

        $a = User::findOrFail($request->student_a_id);
        $b = User::findOrFail($request->student_b_id);

        if ($a->halqa_id === $b->halqa_id) {
            return back()->with('error', 'Both students are in the same halqa. Use pair swap instead.');
        }

        DB::transaction(function () use ($a, $b) {
            [$a->halqa_id, $b->halqa_id] = [$b->halqa_id, $a->halqa_id];
            $a->save();
            $b->save();

            // Notify both
            foreach ([$a, $b] as $student) {
                $student->notifications()->create([
                    'id'              => Str::uuid(),
                    'type'            => 'App\Notifications\HalqaSwap',
                    'notifiable_type' => User::class,
                    'notifiable_id'   => $student->id,
                    'data'            => json_encode(['message' => 'You have been moved to a new halqa.']),
                    'created_at'      => now(),
                ]);
            }
        });

        return back()->with('success', "{$a->name} and {$b->name} have been swapped.");
    }

    // ── Assign pair to halqa ──────────────────────────────────────────────────

    public function assignPair(Request $request, Halqa $halqa): RedirectResponse
    {
        $request->validate(['pair_id' => ['required', 'exists:pairs,id']]);
        Pair::findOrFail($request->pair_id)->update(['halqa_id' => $halqa->id]);
        return back()->with('success', 'Pair assigned to halqa.');
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Greedy pairing by shared time slots — same logic as PairController::suggestPairs.
     * Returns ['matched' => [[a, b], ...], 'no_match' => [...]]
     */
    private function doRandomPairing(array $students): array
    {
        if (count($students) < 2) {
            return ['matched' => [], 'no_match' => $students];
        }

        $pool    = collect($students)->keyBy('id');
        $matched = [];
        $result  = [];

        $sorted = $pool->map(function ($s) use ($pool) {
            $slots   = $s['available_times'] ?? [];
            $options = $pool->filter(fn ($o) => $o['id'] !== $s['id'] && count(array_intersect($slots, $o['available_times'] ?? [])) > 0)->count();
            return array_merge((array) $s, ['_options' => $options]);
        })->sortBy('_options');

        foreach ($sorted as $sid => $student) {
            if (in_array($sid, $matched)) continue;

            $bestId    = null;
            $bestScore = -1;

            foreach ($pool as $oid => $other) {
                if ($oid === $sid || in_array($oid, $matched)) continue;
                $shared = count(array_intersect($student['available_times'] ?? [], $other['available_times'] ?? []));
                if ($shared > $bestScore) {
                    $bestScore = $shared;
                    $bestId    = $oid;
                }
            }

            if ($bestId !== null) {
                $result[]  = ['a' => (int) $sid, 'b' => (int) $bestId];
                $matched[] = $sid;
                $matched[] = $bestId;
            }
        }

        $noMatch = $pool->filter(fn ($s) => !in_array($s['id'], $matched))
            ->map(fn ($s) => ['id' => $s['id'], 'name' => $s['name']])
            ->values()->toArray();

        return ['matched' => $result, 'no_match' => $noMatch];
    }
}
