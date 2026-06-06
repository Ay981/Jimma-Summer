<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pair;
use App\Models\PairingRequest;
use App\Models\ProgramSetting;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PairingController extends Controller
{
    public function index(): Response
    {
        $windowOpen     = (bool) ProgramSetting::get('pairing_window_open', false);
        $windowDeadline = ProgramSetting::get('pairing_window_deadline');

        $requests = PairingRequest::with([
            'student:id,name,student_id',
            'requestedPartner:id,name,student_id',
        ])->get();

        // Build a quick lookup: student_id → requested_partner_id
        $requestMap = $requests->pluck('requested_partner_id', 'student_id');

        $rows = $requests->map(function ($r) use ($requestMap) {
            $theirRequest = $requestMap[$r->requested_partner_id] ?? null;

            if ($theirRequest === $r->student_id) {
                $type = 'mutual';       // both want each other
            } elseif ($theirRequest === null) {
                $type = 'one_sided';    // partner has no request
            } else {
                $type = 'conflict';     // partner wants someone else
            }

            return [
                'student_name'         => $r->student?->name,
                'student_code'         => $r->student?->student_id,
                'partner_name'         => $r->requestedPartner?->name,
                'partner_code'         => $r->requestedPartner?->student_id,
                'type'                 => $type,
                'submitted_at'         => $r->updated_at?->toDateTimeString(),
            ];
        })->values();

        $totalStudents   = User::where('role', 'student')->where('is_active', true)->count();
        $requestedCount  = $requests->count();
        $existingPairs   = Pair::count();

        return Inertia::render('Admin/Pairing', [
            'window_open'     => $windowOpen,
            'window_deadline' => $windowDeadline,
            'requests'        => $rows,
            'stats'           => [
                'total_students'  => $totalStudents,
                'requested'       => $requestedCount,
                'no_request'      => $totalStudents - $requestedCount,
                'mutual'          => $rows->where('type', 'mutual')->count() / 2,
                'one_sided'       => $rows->where('type', 'one_sided')->count(),
                'conflict'        => $rows->where('type', 'conflict')->count(),
                'existing_pairs'  => $existingPairs,
            ],
        ]);
    }

    // ── Open / close window ───────────────────────────────────────────────────

    public function setWindow(Request $request): RedirectResponse
    {
        $request->validate([
            'open'     => ['required', 'boolean'],
            'deadline' => ['nullable', 'date'],
        ]);

        ProgramSetting::set('pairing_window_open', $request->open ? '1' : '0');
        ProgramSetting::set('pairing_window_deadline', $request->deadline ?? '');

        $msg = $request->open ? 'Pairing window opened.' : 'Pairing window closed.';
        return back()->with('success', $msg);
    }

    // ── Run global pairing ────────────────────────────────────────────────────

    public function run(): RedirectResponse
    {
        if (Pair::exists()) {
            return back()->with('error', 'Pairs already exist. Clear them first if you want to re-run pairing.');
        }

        $students = User::where('role', 'student')
            ->where('is_active', true)
            ->get()
            ->keyBy('id');

        $requests  = PairingRequest::all();
        $requestMap = $requests->pluck('requested_partner_id', 'student_id'); // student_id → partner_id

        $paired  = collect(); // set of student IDs already paired
        $newPairs = [];

        // ── Pass 1: mutual requests ───────────────────────────────────────────
        foreach ($requestMap as $studentId => $partnerId) {
            if ($paired->contains($studentId) || $paired->contains($partnerId)) continue;
            if (!isset($students[$studentId]) || !isset($students[$partnerId])) continue;

            $theirRequest = $requestMap[$partnerId] ?? null;
            if ((int)$theirRequest === (int)$studentId) {
                // Mutual — pair them
                $newPairs[] = [min($studentId, $partnerId), max($studentId, $partnerId)];
                $paired->push($studentId)->push($partnerId);
            }
        }

        // ── Pass 2: one-sided requests (A→B, B has no request) ───────────────
        foreach ($requestMap as $studentId => $partnerId) {
            if ($paired->contains($studentId) || $paired->contains($partnerId)) continue;
            if (!isset($students[$studentId]) || !isset($students[$partnerId])) continue;

            $partnerHasRequest = $requestMap->has($partnerId);
            if (!$partnerHasRequest) {
                $newPairs[] = [min($studentId, $partnerId), max($studentId, $partnerId)];
                $paired->push($studentId)->push($partnerId);
            }
            // conflicts (both requested different people) → fall to random pool
        }

        // ── Pass 3: remaining students — pair by time slot overlap ───────────
        $remaining = $students->keys()->reject(fn ($id) => $paired->contains($id))->values();

        // Sort by available_times fingerprint so overlapping schedules cluster together
        $remaining = $remaining->sortBy(fn ($id) => implode(',', $students[$id]->available_times ?? []))->values();

        // Greedy pairing: try to find best time-overlap match for each student
        $pool   = $remaining->toArray();
        $used   = [];

        for ($i = 0; $i < count($pool); $i++) {
            if (isset($used[$i])) continue;
            $aId    = $pool[$i];
            $aSlots = collect($students[$aId]->available_times ?? []);
            $bestJ  = null;
            $bestScore = -1;

            for ($j = $i + 1; $j < count($pool); $j++) {
                if (isset($used[$j])) continue;
                $bSlots = collect($students[$pool[$j]]->available_times ?? []);
                $score  = $aSlots->intersect($bSlots)->count();
                if ($score > $bestScore) {
                    $bestScore = $score;
                    $bestJ     = $j;
                }
            }

            if ($bestJ !== null) {
                $bId = $pool[$bestJ];
                $newPairs[] = [min($aId, $bId), max($aId, $bId)];
                $used[$i] = true;
                $used[$bestJ] = true;
            }
            // If no match found (odd one out), left unpaired for now
        }

        // ── Persist ───────────────────────────────────────────────────────────
        DB::transaction(function () use ($newPairs) {
            foreach ($newPairs as [$a, $b]) {
                Pair::create([
                    'student_a_id' => $a,
                    'student_b_id' => $b,
                    'halqa_id'     => null,
                    'status'       => 'active',
                ]);
            }
        });

        $total    = count($newPairs);
        $unpaired = $students->count() - ($total * 2);

        $msg = "{$total} pair(s) created successfully.";
        if ($unpaired > 0) {
            $msg .= " {$unpaired} student(s) could not be paired (odd number) — assign manually.";
        }

        return back()->with('success', $msg);
    }
}
