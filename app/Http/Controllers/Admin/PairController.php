<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use App\Services\FcmService;
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

        // Block only if either student is in an ACTIVE pair (has a second member)
        $alreadyActive = Pair::whereNotNull('student_b_id')
            ->where(function ($q) use ($studentA, $studentB) {
                $q->where('student_a_id', $studentA->id)
                  ->orWhere('student_b_id', $studentA->id)
                  ->orWhere('student_a_id', $studentB->id)
                  ->orWhere('student_b_id', $studentB->id);
            })->exists();

        if ($alreadyActive) {
            return back()->with('error', 'One or both students are already in an active pair.');
        }

        // Remove any leftover solo pairs for these students before creating the new one
        Pair::whereNull('student_b_id')
            ->where(function ($q) use ($studentA, $studentB) {
                $q->where('student_a_id', $studentA->id)
                  ->orWhere('student_a_id', $studentB->id);
            })->delete();

        $halqaId = $studentA->halqa_id ?? $studentB->halqa_id;

        Pair::create([
            'student_a_id' => $studentA->id,
            'student_b_id' => $studentB->id,
            'halqa_id'     => $halqaId,
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

    // ── Reassign a student to a new partner ──────────────────────────────────

    public function reassign(Request $request): RedirectResponse
    {
        $request->validate([
            'student_id'     => ['required', 'exists:users,id'],
            'new_partner_id' => ['nullable', 'exists:users,id', 'different:student_id'],
        ]);

        $student    = User::findOrFail($request->student_id);
        $newPartner = $request->new_partner_id ? User::findOrFail($request->new_partner_id) : null;

        if ($newPartner && $student->halqa_id !== $newPartner->halqa_id) {
            return back()->with('error', 'Both students must be in the same halqa.');
        }

        DB::transaction(function () use ($student, $newPartner) {
            // ── 1. Remove student from their current pair ─────────────────────
            $currentPair = Pair::where('student_a_id', $student->id)
                ->orWhere('student_b_id', $student->id)->first();

            if ($currentPair) {
                if ($currentPair->student_b_id === null) {
                    // Solo pair — just delete it
                    $currentPair->delete();
                } elseif ($currentPair->student_a_id === $student->id) {
                    // Student is A — promote B to A, make pair solo
                    $currentPair->update([
                        'student_a_id' => $currentPair->student_b_id,
                        'student_b_id' => null,
                        'status'       => 'solo',
                    ]);
                } else {
                    // Student is B — just remove B
                    $currentPair->update(['student_b_id' => null, 'status' => 'solo']);
                }
                $this->notifyUsers([$currentPair->student_a_id], 'Your partner has been reassigned. You are now solo.');
            }

            // ── 2. Remove new partner from their current pair ─────────────────
            if ($newPartner) {
                $partnerPair = Pair::where('student_a_id', $newPartner->id)
                    ->orWhere('student_b_id', $newPartner->id)->first();

                if ($partnerPair) {
                    if ($partnerPair->student_b_id === null) {
                        $partnerPair->delete();
                    } elseif ($partnerPair->student_a_id === $newPartner->id) {
                        $partnerPair->update([
                            'student_a_id' => $partnerPair->student_b_id,
                            'student_b_id' => null,
                            'status'       => 'solo',
                        ]);
                    } else {
                        $partnerPair->update(['student_b_id' => null, 'status' => 'solo']);
                    }
                    $this->notifyUsers([$partnerPair->student_a_id], 'Your partner has been reassigned. You are now solo.');
                }

                // ── 3. Create new pair ────────────────────────────────────────
                Pair::create([
                    'student_a_id' => $student->id,
                    'student_b_id' => $newPartner->id,
                    'halqa_id'     => $student->halqa_id,
                    'status'       => 'active',
                ]);

                $this->notifyUsers([$student->id, $newPartner->id], 'You have been assigned a new muraja\'ah partner.');
            }
            // If no new partner, student stays unassigned (their old pair was dissolved above)
        });

        $msg = $newPartner
            ? "{$student->name} has been re-paired with {$newPartner->name}."
            : "{$student->name} has been removed from their pair.";

        return back()->with('success', $msg);
    }

    private function notifyUsers(array $userIds, string $message): void
    {
        $ids = array_filter($userIds);
        foreach ($ids as $uid) {
            $u = User::find($uid);
            $u?->notifications()->create([
                'id'              => Str::uuid(),
                'type'            => 'App\Notifications\PairSwap',
                'notifiable_type' => User::class,
                'notifiable_id'   => $uid,
                'data'            => ['message' => $message],
                'created_at'      => now(),
            ]);
        }

        app(FcmService::class)->sendToUsers(array_values($ids), 'Pair update', $message, '/student/pair');
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

    // ── Pair detail ───────────────────────────────────────────────────────────

    public function show(Pair $pair): Response
    {
        $pair->load(['studentA', 'studentB', 'halqa']);

        $consistency = app(\App\Services\ConsistencyService::class);
        $today = Carbon::today();
        $start = $today->copy()->subDays(29);

        $students = collect(array_filter([$pair->studentA, $pair->studentB]))
            ->map(function ($s) use ($consistency, $today, $start) {
                $allSubs = PairSubmission::where('subject_student_id', $s->id)->get();
                $recent  = PairSubmission::where('subject_student_id', $s->id)
                    ->where('submission_date', '>=', $start->toDateString())->get();

                $subDates = $recent->pluck('submission_date')
                    ->map(fn ($d) => Carbon::parse($d)->toDateString())->flip()->toArray();

                $heatmap = collect(range(29, 0))->map(fn ($i) => [
                    'date'      => $today->copy()->subDays($i)->toDateString(),
                    'submitted' => isset($subDates[$today->copy()->subDays($i)->toDateString()]),
                ])->values()->toArray();

                $excuses = \App\Models\MissedSubmissionExcuse::where('student_id', $s->id)
                    ->orderByDesc('missed_date')->take(10)->get()
                    ->map(fn ($e) => [
                        'missed_date' => $e->missed_date->toDateString(),
                        'makeup_date' => $e->makeup_date->toDateString(),
                        'reason'      => $e->reason,
                        'fulfilled'   => $e->fulfilled,
                    ])->toArray();

                return [
                    'id'          => $s->id,
                    'name'        => $s->name,
                    'student_id'  => $s->student_id,
                    'memo_level'  => $s->memo_level,
                    'consistency' => round($consistency->getConsistency($s->id) ?? 0, 1),
                    'streak'      => $consistency->getStreak($s->id),
                    'pages'       => (int) $allSubs->sum(fn ($r) => $r->page_to - $r->page_from + 1),
                    'minutes'     => (int) $allSubs->sum('minutes_spent'),
                    'sessions'    => $allSubs->count(),
                    'heatmap'     => $heatmap,
                    'excuses'     => $excuses,
                ];
            })->values()->toArray();

        $subjectIds = array_filter([$pair->student_a_id, $pair->student_b_id]);
        $history = PairSubmission::whereIn('subject_student_id', $subjectIds)
            ->orderByDesc('submission_date')->take(50)->get()
            ->map(fn ($s) => [
                'date'         => Carbon::parse($s->submission_date)->toDateString(),
                'subject_id'   => $s->subject_student_id,
                'submitted_by' => $s->submitted_by,
                'juz'          => $s->juz,
                'pages'        => $s->page_to - $s->page_from + 1,
                'minutes'      => $s->minutes_spent,
            ])->toArray();

        return Inertia::render('Admin/PairDetail', [
            'pair' => [
                'id'                  => $pair->id,
                'halqa'               => $pair->halqa?->name ?? '—',
                'halqa_id'            => $pair->halqa_id,
                'status'              => $pair->status,
                'compatibility_score' => $pair->compatibility_score,
                'needs_review'        => (bool) $pair->needs_review,
                'created_at'          => Carbon::parse($pair->created_at)->toDateString(),
            ],
            'students' => $students,
            'history'  => $history,
            'halqas'   => Halqa::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    // ── Clear needs-review flag ───────────────────────────────────────────────

    public function clearReview(Pair $pair): RedirectResponse
    {
        $pair->update(['needs_review' => false]);
        return back()->with('success', 'Review flag cleared.');
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
