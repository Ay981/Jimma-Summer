<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PairController extends Controller
{
    public function index(): Response
    {
        $today        = Carbon::today();
        $programStart = Carbon::parse(ProgramSetting::get('program_start_date', $today->toDateString()));
        $window14     = $today->copy()->subDays(13);
        $effStart     = $programStart->gt($window14) ? $programStart->copy() : $window14->copy();
        $effDays      = max(1, $effStart->diffInDays($today) + 1);

        // All pairs
        $pairs = Pair::with(['studentA:id,name', 'studentB:id,name', 'halqa:id,name'])->get();

        $pairIds = $pairs->pluck('id');

        // Bulk: last submission per pair
        $lastSubsByPair = PairSubmission::whereIn('pair_id', $pairIds)
            ->selectRaw('pair_id, MAX(submission_date::text) as last_sub')
            ->groupBy('pair_id')
            ->pluck('last_sub', 'pair_id');

        // Bulk: consistency per pair (14-day window)
        $subs14 = PairSubmission::whereIn('pair_id', $pairIds)
            ->whereBetween('submission_date', [$window14->toDateString(), $today->toDateString()])
            ->get()
            ->groupBy('pair_id');

        $effDates = collect(range(0, $effDays - 1))->map(fn ($i) => $effStart->copy()->addDays($i)->toDateString());

        $pairRows = $pairs->map(function ($pair) use ($subs14, $lastSubsByPair, $effDates, $effDays) {
            $pairSubs = $subs14[$pair->id] ?? collect();
            $byDate   = $pairSubs->groupBy(fn ($s) => Carbon::parse($s->submission_date)->toDateString());
            $bothDays = $effDates->filter(function ($d) use ($byDate, $pair) {
                if (!isset($byDate[$d])) return false;
                $who = $byDate[$d]->pluck('subject_student_id')->unique();
                return $pair->student_b_id && $who->contains($pair->student_a_id) && $who->contains($pair->student_b_id);
            });
            $cons = round(($bothDays->count() / $effDays) * 100, 1);

            return [
                'id'                  => $pair->id,
                'halqa'               => $pair->halqa?->name ?? '—',
                'student_a'           => ['id' => $pair->student_a_id, 'name' => $pair->studentA?->name ?? '—'],
                'student_b'           => $pair->student_b_id ? ['id' => $pair->student_b_id, 'name' => $pair->studentB?->name] : null,
                'status'              => $pair->status,
                'consistency'         => $cons,
                'last_sub'            => $lastSubsByPair[$pair->id] ?? null,
                'created_at'          => Carbon::parse($pair->created_at)->toDateString(),
                'compatibility_score' => $pair->compatibility_score,
                'needs_review'        => (bool) $pair->needs_review,
            ];
        });

        $requests = [];

        // Unassigned students (no pair)
        $assignedIds = Pair::whereNotNull('student_b_id')
            ->get()
            ->flatMap(fn ($p) => [$p->student_a_id, $p->student_b_id])
            ->unique()->toArray();
        $soloA = Pair::whereNull('student_b_id')->pluck('student_a_id')->toArray();

        $unassigned = User::where('role', 'student')
            ->where('is_active', true)
            ->whereNotIn('id', array_merge($assignedIds, $soloA))
            ->get(['id', 'name', 'halqa_id', 'available_times', 'available_days', 'memo_level', 'current_juz'])
            ->map(fn ($s) => [
                'id'             => $s->id,
                'name'           => $s->name,
                'halqa_id'       => $s->halqa_id,
                'available_times'=> $s->available_times ?? [],
                'available_days' => $s->available_days  ?? [],
                'memo_level'     => $s->memo_level      ?? '',
                'current_juz'    => $s->current_juz     ?? 1,
            ])->toArray();

        // Suggested pairs (greedy shared-slot matching, grouped by halqa)
        $suggested = $this->suggestPairs($unassigned);

        $allStudents = User::where('role', 'student')
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'halqa_id'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'halqa_id' => $s->halqa_id]);

        return Inertia::render('Admin/Pairs', [
            'pairs'     => $pairRows->values(),
            'requests'  => [],
            'unassigned'=> array_values(array_filter($unassigned, fn ($s) => !in_array($s['id'], array_merge(
                array_column(array_column($suggested['matched'], 'student_a'), 'id'),
                array_column(array_column($suggested['matched'], 'student_b'), 'id'),
            )))),
            'suggested' => $suggested['matched'],
            'no_match'  => $suggested['no_match'],
            'halqas'    => Halqa::select('id', 'name')->orderBy('name')->get(),
            'students'  => $allStudents,
        ]);
    }

    // ── Manually create a pair ────────────────────────────────────────────────

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'student_a_id' => ['required', 'exists:users,id'],
            'student_b_id' => ['required', 'exists:users,id', 'different:student_a_id'],
        ]);

        $studentA = User::findOrFail($request->student_a_id);
        $studentB = User::findOrFail($request->student_b_id);

        if (!$studentA->halqa_id || !$studentB->halqa_id) {
            return back()->with('error', 'Both students must be assigned to a halqa before being paired.');
        }
        if ($studentA->halqa_id !== $studentB->halqa_id) {
            return back()->with('error', 'Students must be in the same halqa to be paired.');
        }

        $alreadyPaired = Pair::where(function ($q) use ($studentA, $studentB) {
            $q->where('student_a_id', $studentA->id)
              ->orWhere('student_b_id', $studentA->id)
              ->orWhere('student_a_id', $studentB->id)
              ->orWhere('student_b_id', $studentB->id);
        })->exists();

        if ($alreadyPaired) {
            return back()->with('error', 'One or both students are already in a pair.');
        }

        Pair::create([
            'student_a_id' => $studentA->id,
            'student_b_id' => $studentB->id,
            'halqa_id'     => $studentA->halqa_id,
            'status'       => 'active',
        ]);

        return back()->with('success', 'Pair created.');
    }

    // ── Swap students between pairs (same halqa) ──────────────────────────────

    public function swapPairStudents(Request $request): RedirectResponse
    {
        $request->validate([
            'pair_a_id' => ['required', 'exists:pairs,id'],
            'pair_b_id' => ['required', 'exists:pairs,id'],
            'slot'      => ['required', 'in:a,b'],
        ]);

        $pairA = Pair::findOrFail($request->pair_a_id);
        $pairB = Pair::findOrFail($request->pair_b_id);

        abort_if($pairA->halqa_id !== $pairB->halqa_id, 422, 'Pairs must be in the same halqa.');

        // Swap student_b of pairA with student_b of pairB (or student_a based on slot)
        $slot = $request->slot;
        DB::transaction(function () use ($pairA, $pairB, $slot) {
            if ($slot === 'b') {
                [$pairA->student_b_id, $pairB->student_b_id] = [$pairB->student_b_id, $pairA->student_b_id];
            } else {
                [$pairA->student_a_id, $pairB->student_a_id] = [$pairB->student_a_id, $pairA->student_a_id];
            }
            $pairA->save();
            $pairB->save();

            // Notify affected students
            foreach (array_filter([$pairA->student_a_id, $pairA->student_b_id, $pairB->student_a_id, $pairB->student_b_id]) as $uid) {
                $u = User::find($uid);
                $u?->notifications()->create([
                    'id'              => Str::uuid(),
                    'type'            => 'App\Notifications\PairSwap',
                    'notifiable_type' => User::class,
                    'notifiable_id'   => $uid,
                    'data'            => json_encode(['message' => 'You have been moved to a new pair.']),
                    'created_at'      => now(),
                ]);
            }
        });

        return back()->with('success', 'Pair students swapped.');
    }

    // ── Cross-halqa pair merge ────────────────────────────────────────────────

    public function crossHalqaPair(Request $request): RedirectResponse
    {
        $request->validate([
            'student_a_id' => ['required', 'exists:users,id'],
            'student_b_id' => ['required', 'exists:users,id'],
        ]);

        $studentA = User::findOrFail($request->student_a_id);
        $studentB = User::findOrFail($request->student_b_id);

        abort_if($studentA->halqa_id === $studentB->halqa_id, 422, 'Both students are already in the same halqa. Use pair swap instead.');

        DB::transaction(function () use ($studentA, $studentB) {
            // Find A's current pair and old partner
            $pairA = Pair::where(fn ($q) => $q->where('student_a_id', $studentA->id)->orWhere('student_b_id', $studentA->id))->first();
            $oldPartnerId = null;
            if ($pairA) {
                $oldPartnerId = $pairA->student_a_id === $studentA->id ? $pairA->student_b_id : $pairA->student_a_id;
                $pairA->delete();
            }

            // Move A to B's halqa
            $studentA->update(['halqa_id' => $studentB->halqa_id]);

            // Find or create pair for A+B
            Pair::create([
                'student_a_id' => $studentA->id,
                'student_b_id' => $studentB->id,
                'halqa_id'     => $studentB->halqa_id,
                'status'       => 'active',
            ]);

            // Move A's old partner to A's original halqa and pair them with someone there
            if ($oldPartnerId) {
                $oldPartner = User::find($oldPartnerId);
                if ($oldPartner) {
                    $oldPartner->update(['halqa_id' => $studentA->getOriginal('halqa_id') ?? $oldPartner->halqa_id]);
                }
            }

            // Notify all affected
            foreach (array_filter([$studentA->id, $studentB->id, $oldPartnerId]) as $uid) {
                $u = User::find($uid);
                $u?->notifications()->create([
                    'id'              => \Illuminate\Support\Str::uuid(),
                    'type'            => 'App\Notifications\HalqaSwap',
                    'notifiable_type' => User::class,
                    'notifiable_id'   => $uid,
                    'data'            => json_encode(['message' => 'You have been reassigned to a new halqa or pair.']),
                    'created_at'      => now(),
                ]);
            }
        });

        return back()->with('error', 'Cross-halqa pairing is disabled. Pairs must be within the same halqa.');
    }

    // ── Confirm bulk assignment ───────────────────────────────────────────────

    public function confirmAssignment(Request $request): RedirectResponse
    {
        // FIX 8: Guard against no halqas
        if (Halqa::count() === 0) {
            return back()->with('error', 'Create halqas first before assigning students.');
        }

        $request->validate([
            'pairs'           => ['required', 'array'],
            'pairs.*.a'       => ['required', 'integer', 'exists:users,id'],
            'pairs.*.b'       => ['required', 'integer', 'exists:users,id'],
            'pairs.*.halqa_id'=> ['nullable', 'exists:halqas,id'],
        ]);

        $students = User::whereIn('id', collect($request->pairs)->flatMap(fn ($p) => [$p['a'], $p['b']])->unique()->toArray())
            ->get(['id', 'halqa_id'])->keyBy('id');

        DB::transaction(function () use ($request, $students) {
            foreach ($request->pairs as $p) {
                $sA = $students[$p['a']] ?? null;
                $sB = $students[$p['b']] ?? null;

                // Enforce same halqa
                if (!$sA || !$sB || !$sA->halqa_id || $sA->halqa_id !== $sB->halqa_id) continue;

                $exists = Pair::where(fn ($q) => $q->where('student_a_id', $p['a'])->orWhere('student_b_id', $p['a']))
                    ->orWhere(fn ($q) => $q->where('student_a_id', $p['b'])->orWhere('student_b_id', $p['b']))
                    ->exists();
                if ($exists) continue;

                Pair::create([
                    'student_a_id' => $p['a'],
                    'student_b_id' => $p['b'],
                    'halqa_id'     => $sA->halqa_id,
                    'status'       => 'active',
                ]);
            }
        });

        return redirect()->route('admin.pairs')->with('success', 'Pairs confirmed and created.');
    }

    // ── Delete pair ───────────────────────────────────────────────────────────

    public function destroy(Pair $pair): RedirectResponse
    {
        $pair->delete();
        return back()->with('success', 'Pair deleted.');
    }

    // ── Assign pair to halqa ──────────────────────────────────────────────────

    public function assignHalqa(Request $request, Pair $pair): RedirectResponse
    {
        $request->validate(['halqa_id' => ['nullable', 'exists:halqas,id']]);
        $pair->update(['halqa_id' => $request->halqa_id]);
        return back()->with('success', 'Halqa assigned.');
    }

    // ── Pairing score ─────────────────────────────────────────────────────────

    private function pairScore(array $a, array $b): int
    {
        $memoOrder = ['less_than_1'=>0,'1_5'=>1,'6_10'=>2,'11_20'=>3,'21_29'=>4,'full_hifz'=>5];

        $times = count(array_intersect($a['available_times'] ?? [], $b['available_times'] ?? []));
        $days  = count(array_intersect($a['available_days']  ?? [], $b['available_days']  ?? []));

        $levelDiff  = abs(($memoOrder[$a['memo_level'] ?? ''] ?? 0) - ($memoOrder[$b['memo_level'] ?? ''] ?? 0));
        $levelBonus = max(0, 3 - $levelDiff);

        $juzDiff   = abs(($a['current_juz'] ?? 1) - ($b['current_juz'] ?? 1));
        $juzBonus  = max(0, 3 - intdiv($juzDiff, 4));

        return $times + $days + $levelBonus + $juzBonus;
    }

    // ── Greedy pairing by compatibility score ─────────────────────────────────

    private function suggestPairs(array $students): array
    {
        $allResult = [];
        $noMatch   = [];

        // Group by halqa — pairs strictly within each group
        $groups = collect($students)->groupBy(fn ($s) => $s['halqa_id'] ?? '__none__');

        foreach ($groups as $group) {
            $pool = $group->keyBy('id')->toArray();

            if (count($pool) < 2) {
                $noMatch = array_merge($noMatch, array_values($pool));
                continue;
            }

            // Remove the best-connected student when odd (they lose least)
            if (count($pool) % 2 !== 0) {
                $sums = [];
                foreach ($pool as $id => $s) {
                    $sums[$id] = array_sum(array_map(
                        fn ($o) => $this->pairScore($s, $o),
                        array_filter($pool, fn ($o) => $o['id'] !== $id)
                    ));
                }
                arsort($sums);
                $soloId = array_key_first($sums);
                $noMatch[] = ['id' => $pool[$soloId]['id'], 'name' => $pool[$soloId]['name'], 'available_times' => $pool[$soloId]['available_times'] ?? []];
                unset($pool[$soloId]);
            }

            // Build all candidate pairs, score them, sort descending (global greedy)
            $candidates = [];
            $ids = array_keys($pool);
            for ($i = 0; $i < count($ids); $i++) {
                for ($j = $i + 1; $j < count($ids); $j++) {
                    $a = $pool[$ids[$i]];
                    $b = $pool[$ids[$j]];
                    $candidates[] = ['a' => $a, 'b' => $b, 'score' => $this->pairScore($a, $b)];
                }
            }
            usort($candidates, fn ($x, $y) => $y['score'] <=> $x['score']);

            $matched = [];
            foreach ($candidates as $c) {
                if (in_array($c['a']['id'], $matched) || in_array($c['b']['id'], $matched)) continue;
                $sharedTimes = array_values(array_intersect($c['a']['available_times'] ?? [], $c['b']['available_times'] ?? []));
                $allResult[] = [
                    'halqa_id'     => $c['a']['halqa_id'] ?? null,
                    'student_a'    => ['id' => $c['a']['id'], 'name' => $c['a']['name'], 'available_times' => $c['a']['available_times'] ?? []],
                    'student_b'    => ['id' => $c['b']['id'], 'name' => $c['b']['name'], 'available_times' => $c['b']['available_times'] ?? []],
                    'shared_slots' => $sharedTimes,
                ];
                $matched[] = $c['a']['id'];
                $matched[] = $c['b']['id'];
            }

            // Anyone left unpaired (shouldn't happen after odd removal, but guard it)
            foreach ($pool as $id => $s) {
                if (!in_array($id, $matched)) {
                    $noMatch[] = ['id' => $s['id'], 'name' => $s['name'], 'available_times' => $s['available_times'] ?? []];
                }
            }
        }

        return ['matched' => $allResult, 'no_match' => $noMatch];
    }
}
