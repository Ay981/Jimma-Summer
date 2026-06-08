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
                'pair_count'       => $memberIds->isEmpty() ? 0 : Pair::where(function ($q) use ($memberIds) {
                    $q->whereIn('student_a_id', $memberIds)->orWhereIn('student_b_id', $memberIds);
                })->count(),
                'group_consistency'=> $groupCons,
                'meetings'         => $meetings,
                'members'          => $halqa->members
                    ->sortBy('name')
                    ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'student_id' => $u->student_id])
                    ->values(),
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
        $halqas = Halqa::all();
        if ($halqas->isEmpty()) {
            return back()->with('error', 'Create halqas first before assigning students.');
        }

        $students = User::where('role', 'student')
            ->where('is_active', true)
            ->whereNull('halqa_id')
            ->get()
            ->keyBy('id');

        if ($students->isEmpty()) {
            return back()->with('error', 'No unassigned students to distribute.');
        }

        // Build pair groups: paired students must land in the same halqa
        $pairs = Pair::whereIn('student_a_id', $students->keys())
            ->orWhereIn('student_b_id', $students->keys())
            ->get();

        // Build units: each unit is a list of student IDs that must go together
        $assigned = [];
        $units    = [];
        foreach ($pairs as $pair) {
            $aIn = $students->has($pair->student_a_id);
            $bIn = $pair->student_b_id && $students->has($pair->student_b_id);
            if (!$aIn && !$bIn) continue;

            $ids = array_filter([$aIn ? $pair->student_a_id : null, $bIn ? $pair->student_b_id : null]);
            $units[] = array_values($ids);
            foreach ($ids as $id) $assigned[$id] = true;
        }

        // Add solo (unpaired) students as single-member units
        foreach ($students->keys() as $id) {
            if (!isset($assigned[$id])) $units[] = [$id];
        }

        // Sort units by combined available_times fingerprint so compatible ones still cluster
        usort($units, function ($a, $b) use ($students) {
            $sigA = implode(',', $students[$a[0]]->available_times ?? []);
            $sigB = implode(',', $students[$b[0]]->available_times ?? []);
            return strcmp($sigA, $sigB);
        });

        $n         = $halqas->count();
        $halqaList = $halqas->values();

        DB::transaction(function () use ($units, $halqaList, $n, $students) {
            foreach ($units as $i => $unit) {
                $halqa = $halqaList[$i % $n];
                foreach ($unit as $studentId) {
                    $students[$studentId]->update(['halqa_id' => $halqa->id]);
                }
            }

            // Backfill halqa_id on any null-halqa pairs whose both students are now assigned
            Pair::whereNull('halqa_id')->each(function ($pair) {
                $a = User::find($pair->student_a_id);
                $b = $pair->student_b_id ? User::find($pair->student_b_id) : null;
                if ($a?->halqa_id && (!$b || $a->halqa_id === $b->halqa_id)) {
                    $pair->update(['halqa_id' => $a->halqa_id]);
                }
            });
        });

        return back()->with('success', count(array_merge(...$units)) . " students assigned to {$n} halqa(s). Pair groupings preserved.");
    }

    // ── Random pair within halqa ──────────────────────────────────────────────

    public function randomPair(Request $request, Halqa $halqa): RedirectResponse
    {
        // Only unpaired active students in this halqa
        $alreadyPairedIds = Pair::get()
            ->flatMap(fn ($p) => array_filter([$p->student_a_id, $p->student_b_id]))
            ->unique();

        $students = User::where('halqa_id', $halqa->id)
            ->where('role', 'student')
            ->where('is_active', true)
            ->whereNotIn('id', $alreadyPairedIds)
            ->get();

        if ($students->count() < 2) {
            return back()->with('error', 'Not enough unpaired students in this halqa to form pairs.');
        }

        $result         = $this->doRandomPairing($students->toArray());
        $unmatchedCount = count($result['no_match']);

        DB::transaction(function () use ($result, $halqa) {
            foreach ($result['matched'] as $p) {
                Pair::create([
                    'student_a_id' => min($p['a'], $p['b']),
                    'student_b_id' => max($p['a'], $p['b']),
                    'halqa_id'     => $halqa->id,
                    'status'       => 'active',
                ]);
            }
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

        $memoOrder = ['less_than_1'=>0,'1_5'=>1,'6_10'=>2,'11_20'=>3,'21_29'=>4,'full_hifz'=>5];
        $scoreOf = function (array $a, array $b) use ($memoOrder): int {
            $times = count(array_intersect($a['available_times'] ?? [], $b['available_times'] ?? []));
            $days  = count(array_intersect($a['available_days']  ?? [], $b['available_days']  ?? []));
            $levelDiff = abs(($memoOrder[$a['memo_level'] ?? ''] ?? 0) - ($memoOrder[$b['memo_level'] ?? ''] ?? 0));
            $juzDiff   = abs(($a['current_juz'] ?? 1) - ($b['current_juz'] ?? 1));
            return $times + $days + max(0, 3 - $levelDiff) + max(0, 3 - intdiv($juzDiff, 4));
        };

        $pool = collect($students)->keyBy('id')->toArray();

        // If odd, remove student with highest total score sum (they fit best elsewhere)
        if (count($pool) % 2 !== 0) {
            $sums = [];
            foreach ($pool as $id => $s) {
                $sums[$id] = array_sum(array_map(fn ($o) => $scoreOf((array)$s, (array)$o), $pool));
            }
            arsort($sums);
            $soloId = array_key_first($sums);
            $noMatch = [['id' => $pool[$soloId]['id'], 'name' => $pool[$soloId]['name']]];
            unset($pool[$soloId]);
        } else {
            $noMatch = [];
        }

        // Build all candidate pairs, sort by score descending (global greedy)
        $ids = array_keys($pool);
        $candidates = [];
        for ($i = 0; $i < count($ids); $i++) {
            for ($j = $i + 1; $j < count($ids); $j++) {
                $a = (array) $pool[$ids[$i]];
                $b = (array) $pool[$ids[$j]];
                $candidates[] = ['a' => (int)$ids[$i], 'b' => (int)$ids[$j], 'score' => $scoreOf($a, $b)];
            }
        }
        usort($candidates, fn ($x, $y) => $y['score'] <=> $x['score']);

        $matched = [];
        $result  = [];
        foreach ($candidates as $c) {
            if (in_array($c['a'], $matched) || in_array($c['b'], $matched)) continue;
            $result[]  = ['a' => $c['a'], 'b' => $c['b']];
            $matched[] = $c['a'];
            $matched[] = $c['b'];
        }

        return ['matched' => $result, 'no_match' => $noMatch];
    }
}
