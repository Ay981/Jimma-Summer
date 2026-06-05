<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairingRequest;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

        // Pending pair requests
        $requests = PairingRequest::where('status', 'pending')
            ->with('student:id,name,phone')
            ->get()
            ->map(fn ($r) => [
                'id'                      => $r->id,
                'student'                 => ['id' => $r->student->id, 'name' => $r->student->name, 'phone' => $r->student->phone],
                'requested_partner_name'  => $r->requested_partner_name,
                'requested_partner_phone' => $r->requested_partner_phone,
            ])->toArray();

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
            'requests'  => $requests,
            'unassigned'=> array_values(array_filter($unassigned, fn ($s) => !in_array($s['id'], array_merge(
                array_column(array_column($suggested['matched'], 'student_a'), 'id'),
                array_column(array_column($suggested['matched'], 'student_b'), 'id'),
            )))),
            'suggested' => $suggested['matched'],
            'no_match'  => $suggested['no_match'],
            'halqas'    => Halqa::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    // ── Pair request: approve ─────────────────────────────────────────────────

    public function approveRequest(PairingRequest $pairingRequest): RedirectResponse
    {
        abort_if($pairingRequest->status !== 'pending', 422);

        // Try to find the requested partner by name + phone
        $partner = User::where('name', 'like', '%' . $pairingRequest->requested_partner_name . '%')
            ->where('role', 'student')
            ->first();

        // Create pair even if partner not found (solo until they're added)
        $pair = Pair::create([
            'student_a_id' => $pairingRequest->student_id,
            'student_b_id' => $partner?->id,
            'status'       => $partner ? 'active' : 'solo',
        ]);

        $pairingRequest->update(['status' => 'approved']);

        return back()->with('success', $partner
            ? "Pair created: {$pairingRequest->student->name} ↔ {$partner->name}"
            : "Pair created (partner not found in system yet).");
    }

    // ── Pair request: reject ──────────────────────────────────────────────────

    public function rejectRequest(PairingRequest $pairingRequest): RedirectResponse
    {
        abort_if($pairingRequest->status !== 'pending', 422);
        $pairingRequest->update(['status' => 'rejected']);
        return back()->with('success', 'Request rejected. Student moved to assignment pool.');
    }

    // ── Confirm bulk assignment ───────────────────────────────────────────────

    public function confirmAssignment(Request $request): RedirectResponse
    {
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
