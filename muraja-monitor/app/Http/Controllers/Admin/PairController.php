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
                'id'          => $pair->id,
                'halqa'       => $pair->halqa?->name ?? '—',
                'student_a'   => ['id' => $pair->student_a_id, 'name' => $pair->studentA?->name ?? '—'],
                'student_b'   => $pair->student_b_id ? ['id' => $pair->student_b_id, 'name' => $pair->studentB?->name] : null,
                'status'      => $pair->status,
                'consistency' => $cons,
                'last_sub'    => $lastSubsByPair[$pair->id] ?? null,
                'created_at'  => Carbon::parse($pair->created_at)->toDateString(),
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
            ->get(['id', 'name', 'available_times'])
            ->map(fn ($s) => [
                'id'             => $s->id,
                'name'           => $s->name,
                'available_times'=> $s->available_times ?? [],
            ])->toArray();

        // Suggested pairs (greedy shared-slot matching)
        $suggested = $this->suggestPairs($unassigned);

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
        ]);
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

        return back()->with('success', 'Cross-halqa pairing complete. Affected students notified.');
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

        DB::transaction(function () use ($request) {
            foreach ($request->pairs as $p) {
                // Skip if either student already has a pair
                $exists = Pair::where(fn ($q) => $q->where('student_a_id', $p['a'])->orWhere('student_b_id', $p['a']))
                    ->orWhere(fn ($q) => $q->where('student_a_id', $p['b'])->orWhere('student_b_id', $p['b']))
                    ->exists();
                if ($exists) continue;

                Pair::create([
                    'student_a_id' => $p['a'],
                    'student_b_id' => $p['b'],
                    'halqa_id'     => $p['halqa_id'] ?? null,
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

    // ── Greedy pairing by shared time slots ───────────────────────────────────

    private function suggestPairs(array $students): array
    {
        if (count($students) < 2) return ['matched' => [], 'no_match' => $students];

        // Build compatibility score map
        $pool    = collect($students)->keyBy('id');
        $matched = [];
        $result  = [];

        // Sort: students with fewer compatible partners first (hardest to match)
        $sorted = $pool->map(function ($s) use ($pool) {
            $slots    = $s['available_times'];
            $options  = $pool->filter(fn ($o) => $o['id'] !== $s['id'] && count(array_intersect($slots, $o['available_times'])) > 0)->count();
            return array_merge($s, ['_options' => $options]);
        })->sortBy('_options');

        foreach ($sorted as $sid => $student) {
            if (in_array($sid, $matched)) continue;

            $bestId    = null;
            $bestScore = -1;
            $bestSlots = [];

            foreach ($pool as $oid => $other) {
                if ($oid === $sid || in_array($oid, $matched)) continue;
                $shared = array_values(array_intersect($student['available_times'], $other['available_times']));
                if (count($shared) > $bestScore) {
                    $bestScore = count($shared);
                    $bestId    = $oid;
                    $bestSlots = $shared;
                }
            }

            if ($bestId !== null) {
                $result[]  = [
                    'student_a'   => ['id' => $student['id'], 'name' => $student['name'], 'available_times' => $student['available_times']],
                    'student_b'   => ['id' => $pool[$bestId]['id'], 'name' => $pool[$bestId]['name'], 'available_times' => $pool[$bestId]['available_times']],
                    'shared_slots'=> $bestSlots,
                ];
                $matched[] = $sid;
                $matched[] = $bestId;
            }
        }

        $noMatch = $pool->filter(fn ($s) => !in_array($s['id'], $matched))->map(fn ($s) => ['id' => $s['id'], 'name' => $s['name'], 'available_times' => $s['available_times']])->values()->toArray();

        return ['matched' => $result, 'no_match' => $noMatch];
    }
}
