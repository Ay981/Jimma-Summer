<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pair;
use App\Models\PairingRequest;
use App\Models\ProgramSetting;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PairingController extends Controller
{
    const MIN_SCORE  = 1; // score=0 → refuse to pair, send to incompatibles
    const FLAG_SCORE = 4; // score ≤ 4 → pair but flag needs_review

    public function index(): Response
    {
        $windowOpen     = (bool) ProgramSetting::get('pairing_window_open', false);
        $windowDeadline = ProgramSetting::get('pairing_window_deadline');

        $requests = PairingRequest::with([
            'student:id,name,student_id',
            'requestedPartner:id,name,student_id',
        ])->get();

        $requestMap = $requests->pluck('requested_partner_id', 'student_id');

        $rows = $requests->map(function ($r) use ($requestMap) {
            $theirRequest = $requestMap[$r->requested_partner_id] ?? null;
            $type = $theirRequest === $r->student_id ? 'mutual'
                  : ($theirRequest === null ? 'one_sided' : 'conflict');
            return [
                'student_name' => $r->student?->name,
                'student_code' => $r->student?->student_id,
                'partner_name' => $r->requestedPartner?->name,
                'partner_code' => $r->requestedPartner?->student_id,
                'type'         => $type,
                'submitted_at' => $r->updated_at?->toDateTimeString(),
            ];
        })->values();

        $totalStudents  = User::where('role', 'student')->where('is_active', true)->count();
        $requestedCount = $requests->count();
        $existingPairs  = Pair::count();

        // Incompatible students from last run (stored in session via flash)
        $incompatibles = session('pairing_incompatibles', []);

        // Flagged (low-score) pairs
        $flagged = Pair::where('needs_review', true)
            ->with(['studentA:id,name,student_id', 'studentB:id,name,student_id'])
            ->get()
            ->map(fn ($p) => [
                'id'                  => $p->id,
                'student_a'           => ['name' => $p->studentA?->name, 'student_id' => $p->studentA?->student_id],
                'student_b'           => ['name' => $p->studentB?->name, 'student_id' => $p->studentB?->student_id],
                'compatibility_score' => $p->compatibility_score,
            ])->values();

        return Inertia::render('Admin/Pairing', [
            'window_open'     => $windowOpen,
            'window_deadline' => $windowDeadline,
            'requests'        => $rows,
            'incompatibles'   => $incompatibles,
            'flagged'         => $flagged,
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

        return back()->with('success', $request->open ? 'Pairing window opened.' : 'Pairing window closed.');
    }

    // ── Run global pairing ────────────────────────────────────────────────────

    public function run(): RedirectResponse
    {
        $alreadyPairedIds = Pair::get()->flatMap(fn ($p) => array_filter([$p->student_a_id, $p->student_b_id]))->unique();

        $students = User::where('role', 'student')
            ->where('is_active', true)
            ->whereNotIn('id', $alreadyPairedIds)
            ->get()
            ->keyBy('id');

        if ($students->isEmpty()) {
            return back()->with('success', 'All active students are already paired.');
        }

        $requests   = PairingRequest::all();
        $requestMap = $requests->pluck('requested_partner_id', 'student_id');

        $memoOrder = ['less_than_1'=>0,'1_5'=>1,'6_10'=>2,'11_20'=>3,'21_29'=>4,'full_hifz'=>5];
        $scoreOf = function (int $aId, int $bId) use ($students, $memoOrder): int {
            $a = $students[$aId];
            $b = $students[$bId];
            $times = count(array_intersect($a->available_times ?? [], $b->available_times ?? []));
            $days  = count(array_intersect($a->available_days  ?? [], $b->available_days  ?? []));
            $levelDiff = abs(($memoOrder[$a->memo_level ?? ''] ?? 0) - ($memoOrder[$b->memo_level ?? ''] ?? 0));
            $juzDiff   = abs(($a->current_juz ?? 1) - ($b->current_juz ?? 1));
            return $times + $days + max(0, 3 - $levelDiff) + max(0, 3 - intdiv($juzDiff, 4));
        };

        $paired        = collect();
        $newPairs      = []; // [aId, bId, halqaId, score]
        $soloCount     = 0;
        $incompatibles = []; // students with no viable partner (all scores = 0)

        $studentsByHalqa = $students->groupBy(fn ($s) => $s->halqa_id ?? '__none__');

        foreach ($studentsByHalqa as $halqaKey => $halqaStudents) {
            $halqaId  = $halqaKey === '__none__' ? null : (int) $halqaKey;
            $groupIds = $halqaStudents->keyBy('id');

            $groupRequestMap = $requestMap->filter(
                fn ($partnerId, $studentId) => $groupIds->has($studentId) && $groupIds->has($partnerId)
            );

            // Pass 1: mutual requests — always honour regardless of score
            foreach ($groupRequestMap as $studentId => $partnerId) {
                if ($paired->contains($studentId) || $paired->contains($partnerId)) continue;
                if ((int)($requestMap[$partnerId] ?? 0) === (int)$studentId) {
                    $score      = $scoreOf($studentId, $partnerId);
                    $newPairs[] = [min($studentId, $partnerId), max($studentId, $partnerId), $halqaId, $score];
                    $paired->push($studentId)->push($partnerId);
                }
            }

            // Pass 2: one-sided — honour regardless of score
            foreach ($groupRequestMap as $studentId => $partnerId) {
                if ($paired->contains($studentId) || $paired->contains($partnerId)) continue;
                if (!$requestMap->has($partnerId)) {
                    $score      = $scoreOf($studentId, $partnerId);
                    $newPairs[] = [min($studentId, $partnerId), max($studentId, $partnerId), $halqaId, $score];
                    $paired->push($studentId)->push($partnerId);
                }
            }

            // Pass 3: greedy — only pair if score >= MIN_SCORE
            $remaining = $groupIds->keys()->reject(fn ($id) => $paired->contains($id))->values()->toArray();

            if (count($remaining) >= 2) {
                // Pre-check: students with NO viable partner at all (max possible score = 0)
                $viable = array_filter($remaining, function ($id) use ($remaining, $scoreOf) {
                    foreach ($remaining as $oid) {
                        if ($oid !== $id && $scoreOf($id, $oid) >= self::MIN_SCORE) return true;
                    }
                    return false;
                });
                $trueIncompat = array_diff($remaining, $viable);
                foreach ($trueIncompat as $id) {
                    $incompatibles[] = [
                        'id'             => $id,
                        'name'           => $students[$id]->name,
                        'student_id'     => $students[$id]->student_id,
                        'available_days' => $students[$id]->available_days  ?? [],
                        'available_times'=> $students[$id]->available_times ?? [],
                        'memo_level'     => $students[$id]->memo_level      ?? '',
                        'current_juz'    => $students[$id]->current_juz     ?? 1,
                    ];
                }
                $remaining = array_values($viable);

                if (count($remaining) >= 2) {
                    if (count($remaining) % 2 !== 0) {
                        $sums = [];
                        foreach ($remaining as $id) {
                            $sums[$id] = array_sum(array_map(fn ($oid) => $id !== $oid ? $scoreOf($id, $oid) : 0, $remaining));
                        }
                        arsort($sums);
                        $soloId    = array_key_first($sums);
                        $remaining = array_values(array_filter($remaining, fn ($id) => $id !== $soloId));
                        $soloCount++;
                    }

                    $candidates = [];
                    for ($i = 0; $i < count($remaining); $i++) {
                        for ($j = $i + 1; $j < count($remaining); $j++) {
                            $s = $scoreOf($remaining[$i], $remaining[$j]);
                            if ($s >= self::MIN_SCORE) {
                                $candidates[] = [$remaining[$i], $remaining[$j], $s];
                            }
                        }
                    }
                    usort($candidates, fn ($x, $y) => $y[2] <=> $x[2]);

                    $usedInPass = [];
                    foreach ($candidates as [$aId, $bId, $score]) {
                        if (in_array($aId, $usedInPass) || in_array($bId, $usedInPass)) continue;
                        $newPairs[]   = [min($aId, $bId), max($aId, $bId), $halqaId, $score];
                        $usedInPass[] = $aId;
                        $usedInPass[] = $bId;
                    }

                    // Any remaining students who had a viable partner but still went unmatched
                    // (can happen if odd after filtering) → add to incompatibles notice
                    $stillUnmatched = array_diff($remaining, $usedInPass);
                    foreach ($stillUnmatched as $id) {
                        $incompatibles[] = [
                            'id'             => $id,
                            'name'           => $students[$id]->name,
                            'student_id'     => $students[$id]->student_id,
                            'available_days' => $students[$id]->available_days  ?? [],
                            'available_times'=> $students[$id]->available_times ?? [],
                            'memo_level'     => $students[$id]->memo_level      ?? '',
                            'current_juz'    => $students[$id]->current_juz     ?? 1,
                        ];
                    }
                }
            } elseif (count($remaining) === 1) {
                $id = $remaining[0];
                $incompatibles[] = [
                    'id'             => $id,
                    'name'           => $students[$id]->name,
                    'student_id'     => $students[$id]->student_id,
                    'available_days' => $students[$id]->available_days  ?? [],
                    'available_times'=> $students[$id]->available_times ?? [],
                    'memo_level'     => $students[$id]->memo_level      ?? '',
                    'current_juz'    => $students[$id]->current_juz     ?? 1,
                ];
            }
        }

        DB::transaction(function () use ($newPairs) {
            foreach ($newPairs as [$a, $b, $halqaId, $score]) {
                Pair::create([
                    'student_a_id'        => $a,
                    'student_b_id'        => $b,
                    'halqa_id'            => $halqaId,
                    'status'              => 'active',
                    'compatibility_score' => $score,
                    'needs_review'        => $score <= self::FLAG_SCORE,
                ]);
            }
        });

        $total = count($newPairs);
        $msg   = "{$total} pair(s) created successfully.";
        if ($soloCount > 0) {
            $msg .= " {$soloCount} student(s) set aside (odd number in halqa) — assign manually.";
        }
        if (count($incompatibles) > 0) {
            $msg .= " " . count($incompatibles) . " student(s) could not be paired due to incompatible schedules — see notice below.";
        }
        $flagged = count(array_filter($newPairs, fn ($p) => $p[3] <= self::FLAG_SCORE));
        if ($flagged > 0) {
            $msg .= " {$flagged} pair(s) flagged for review (low compatibility).";
        }

        return back()
            ->with('success', $msg)
            ->with('pairing_incompatibles', $incompatibles);
    }

    // ── Incompatibles notice PDF ──────────────────────────────────────────────

    public function incompatiblePdf(Request $request)
    {
        $incompatibles = session('pairing_incompatibles', []);

        if (empty($incompatibles)) {
            // Rebuild from currently unpaired, profile-complete students
            $pairedIds = Pair::get()->flatMap(fn ($p) => array_filter([$p->student_a_id, $p->student_b_id]))->unique();
            $students  = User::where('role', 'student')
                ->where('is_active', true)
                ->whereNotIn('id', $pairedIds)
                ->get();

            foreach ($students as $s) {
                $incompatibles[] = [
                    'name'            => $s->name,
                    'student_id'      => $s->student_id,
                    'available_days'  => $s->available_days  ?? [],
                    'available_times' => $s->available_times ?? [],
                    'memo_level'      => $s->memo_level      ?? '',
                    'current_juz'     => $s->current_juz     ?? 1,
                ];
            }
        }

        $pdf = Pdf::loadView('pdf.incompatible-notice', ['students' => $incompatibles]);
        return $pdf->download('incompatible-students-notice.pdf');
    }
}

