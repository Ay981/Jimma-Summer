<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Halqa;
use App\Models\Pair;
use App\Models\PairChangeRequest;
use App\Models\User;
use App\Notifications\PairChangeApproved;
use App\Notifications\PairChangeRejected;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PairChangeController extends Controller
{
    // ── List all requests ─────────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $query = PairChangeRequest::with([
            'student:id,name,student_id,halqa_id',
            'currentPartner:id,name',
            'requestedPartner:id,name,halqa_id',
            'leader:id,name',
        ]);

        if ($status = $request->filter_status) {
            $query->where('status', $status);
        }
        if ($type = $request->filter_type) {
            $query->where('type', $type);
        }
        if ($halqa = $request->filter_halqa) {
            $query->whereHas('student', fn ($q) => $q->where('halqa_id', $halqa));
        }

        $requests = $query->orderByDesc('requested_at')->get()->map(fn ($r) => [
            'id'                => $r->id,
            'student_name'      => $r->student?->name,
            'student_code'      => $r->student?->student_id,
            'student_halqa_id'  => $r->student?->halqa_id,
            'partner_name'      => $r->currentPartner?->name,
            'requested_partner' => $r->requestedPartner?->name,
            'reason'            => $r->reason,
            'type'              => $r->type,
            'status'            => $r->status,
            'leader_name'       => $r->leader?->name,
            'requested_at'      => Carbon::parse($r->requested_at)->format('d M Y'),
        ])->toArray();

        return Inertia::render('Admin/PairChangeRequests', [
            'requests'     => $requests,
            'halqas'       => Halqa::select('id', 'name')->orderBy('name')->get(),
            'filter_status'=> $request->filter_status ?? '',
            'filter_type'  => $request->filter_type ?? '',
            'filter_halqa' => $request->filter_halqa ?? '',
        ]);
    }

    // ── Show detail + preview swap ────────────────────────────────────────────

    public function show(PairChangeRequest $changeRequest): Response
    {
        $changeRequest->load([
            'student:id,name,student_id,halqa_id',
            'currentPartner:id,name,halqa_id',
            'requestedPartner:id,name,halqa_id',
            'leader:id,name',
            'pair',
        ]);

        $student   = $changeRequest->student;
        $halqa     = Halqa::find($student->halqa_id);

        // Current partner's pair (so we can show the swap preview)
        $reqPartner       = $changeRequest->requestedPartner;
        $reqPartnerPair   = null;
        $reqPartnerPartner = null;

        if ($reqPartner) {
            $reqPartnerPair = Pair::where('student_a_id', $reqPartner->id)
                ->orWhere('student_b_id', $reqPartner->id)->first();
            if ($reqPartnerPair) {
                $reqPartnerPartner = $reqPartnerPair->student_a_id === $reqPartner->id
                    ? $reqPartnerPair->studentB
                    : $reqPartnerPair->studentA;
            }
        }

        // For admin partner picker — include same-halqa students + cross-halqa requested partner
        $sameHalqaStudents = User::where('role', 'student')
            ->where('is_active', true)
            ->where('id', '!=', $student->id)
            ->where(function ($q) use ($student, $reqPartner) {
                $q->where('halqa_id', $student->halqa_id);
                if ($reqPartner) $q->orWhere('id', $reqPartner->id);
            })
            ->get(['id', 'name', 'student_id'])
            ->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'student_id' => $s->student_id])
            ->toArray();

        // Halqa size check for cross-halqa
        $crossHalqaWarning = null;
        if ($changeRequest->type === 'cross_halqa' && $reqPartner) {
            $halqaXSize = User::where('halqa_id', $student->halqa_id)->where('role', 'student')->count();
            $halqaYSize = User::where('halqa_id', $reqPartner->halqa_id)->where('role', 'student')->count();
            if ($halqaXSize % 2 !== 0 || $halqaYSize % 2 !== 0) {
                $crossHalqaWarning = 'One or both halqas already have an odd number of students. Verify before swapping.';
            }
        }

        return Inertia::render('Admin/PairChangeDetail', [
            'change_request'       => [
                'id'                   => $changeRequest->id,
                'status'               => $changeRequest->status,
                'type'                 => $changeRequest->type,
                'reason'               => $changeRequest->reason,
                'requested_at'         => Carbon::parse($changeRequest->requested_at)->format('d M Y'),
                'leader_name'          => $changeRequest->leader?->name,
                'rejection_reason'     => $changeRequest->rejection_reason,
            ],
            'student'              => ['id' => $student->id, 'name' => $student->name, 'student_id' => $student->student_id, 'halqa' => $halqa?->name],
            'current_partner'      => $changeRequest->currentPartner ? ['id' => $changeRequest->currentPartner->id, 'name' => $changeRequest->currentPartner->name] : null,
            'requested_partner'    => $reqPartner    ? ['id' => $reqPartner->id,    'name' => $reqPartner->name]    : null,
            'req_partner_partner'  => $reqPartnerPartner ? ['id' => $reqPartnerPartner->id, 'name' => $reqPartnerPartner->name] : null,
            'same_halqa_students'  => $sameHalqaStudents,
            'cross_halqa_warning'  => $crossHalqaWarning,
        ]);
    }

    // ── Approve + execute swap ────────────────────────────────────────────────

    public function approve(Request $request, PairChangeRequest $changeRequest): RedirectResponse
    {
        if ($changeRequest->status !== 'escalated_to_admin') {
            return back()->with('error', 'Request is no longer pending.');
        }

        $request->validate([
            'new_partner_id' => ['nullable', 'exists:users,id'],
            'confirm_cross'  => ['nullable', 'string'],
        ]);

        // Load relationships so we can fall back to requested partner
        $changeRequest->loadMissing(['requestedPartner', 'student']);

        if ($changeRequest->type === 'cross_halqa' && ($request->confirm_cross ?? '') !== 'CONFIRM') {
            return back()->withErrors(['confirm_cross' => 'Type CONFIRM to execute a cross-halqa swap.']);
        }

        $student    = User::findOrFail($changeRequest->requested_by);
        $newPartner = $request->filled('new_partner_id')
            ? User::findOrFail($request->new_partner_id)
            : $changeRequest->requestedPartner;

        if (!$newPartner) {
            return back()->withErrors(['new_partner_id' => 'Select a partner to pair with.']);
        }

        // Halqa size guard for cross-halqa
        if ($changeRequest->type === 'cross_halqa') {
            $halqaXSize = User::where('halqa_id', $student->halqa_id)->where('role', 'student')->count();
            $halqaYSize = User::where('halqa_id', $newPartner->halqa_id)->where('role', 'student')->count();
            if (($halqaXSize - 1) % 2 !== 0 || ($halqaYSize + 1) % 2 !== 0) {
                return back()->with('error', 'This swap would create an odd number in one halqa. Adjust manually.');
            }
        }

        $affectedIds = [];

        DB::transaction(function () use ($student, $newPartner, $changeRequest, $request, &$affectedIds) {
            $isCrossHalqa = $changeRequest->type === 'cross_halqa';

            // 1. Remove student from their current pair
            $currentPair = Pair::where('student_a_id', $student->id)
                ->orWhere('student_b_id', $student->id)->first();
            if ($currentPair) {
                $orphanId = $this->removeMemberFromPair($currentPair, $student->id);
                if ($orphanId) $affectedIds[] = $orphanId;
            }

            // 2. Remove new partner from their current pair
            $partnerPair = Pair::where('student_a_id', $newPartner->id)
                ->orWhere('student_b_id', $newPartner->id)->first();
            $partnerOrphanId = null;
            if ($partnerPair) {
                $partnerOrphanId = $this->removeMemberFromPair($partnerPair, $newPartner->id);
                if ($partnerOrphanId) $affectedIds[] = $partnerOrphanId;
            }

            // 3. Cross-halqa: move students to correct halqas
            if ($isCrossHalqa) {
                $newStudent    = clone $student;
                $originalHalqa = $student->halqa_id;
                $student->update(['halqa_id' => $newPartner->halqa_id]);
                if ($partnerOrphanId) {
                    User::where('id', $partnerOrphanId)->update(['halqa_id' => $originalHalqa]);
                }
            }

            // 4. Create new pair
            Pair::create([
                'student_a_id' => $student->id,
                'student_b_id' => $newPartner->id,
                'halqa_id'     => $student->halqa_id,
                'status'       => 'active',
            ]);

            $affectedIds[] = $student->id;
            $affectedIds[] = $newPartner->id;

            // 5. Mark request approved
            $changeRequest->update([
                'status'         => 'approved',
                'reviewed_by'    => request()->user()->id,
                'reviewed_at'    => now(),
                'requested_partner_id' => $newPartner->id,
            ]);

            AuditLog::create([
                'user_id'     => request()->user()->id,
                'action'      => 'pair_change_approved',
                'target_type' => 'pair_change_request',
                'target_id'   => $changeRequest->id,
                'meta'        => [
                    'student_name'       => $student->name,
                    'new_partner_name'   => $newPartner->name,
                    'type'               => $changeRequest->type,
                    'affected_student_ids' => $affectedIds,
                ],
            ]);
        });

        // Notify affected students
        foreach (array_unique(array_filter($affectedIds)) as $uid) {
            $u = User::find($uid);
            if (!$u) continue;
            $partnerOfU = Pair::where('student_a_id', $uid)->orWhere('student_b_id', $uid)
                ->first()?->load(['studentA', 'studentB']);
            $partnerName = $partnerOfU
                ? ($partnerOfU->student_a_id === $uid ? $partnerOfU->studentB?->name : $partnerOfU->studentA?->name) ?? 'a new partner'
                : 'no partner (solo)';
            $u->notify(new PairChangeApproved($partnerName));
        }

        return redirect()->route('admin.pair-changes.index')->with('success', 'Pair change approved and executed.');
    }

    // ── Reject ────────────────────────────────────────────────────────────────

    public function reject(Request $request, PairChangeRequest $changeRequest): RedirectResponse
    {
        if ($changeRequest->status !== 'escalated_to_admin') {
            return back()->with('error', 'Request is no longer pending.');
        }

        $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $changeRequest->update([
            'status'           => 'rejected',
            'reviewed_by'      => $request->user()->id,
            'reviewed_at'      => now(),
            'rejection_reason' => $request->rejection_reason,
        ]);

        // Notify leader
        $leader = User::find($changeRequest->leader_id);
        $leader?->notify(new PairChangeRejected(
            $changeRequest->student?->name ?? 'the student',
            $request->rejection_reason
        ));

        AuditLog::create([
            'user_id'     => $request->user()->id,
            'action'      => 'pair_change_rejected',
            'target_type' => 'pair_change_request',
            'target_id'   => $changeRequest->id,
            'meta'        => ['reason' => $request->rejection_reason],
        ]);

        return back()->with('success', 'Request rejected. Leader has been notified.');
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function removeMemberFromPair(Pair $pair, int $userId): ?int
    {
        if ($pair->student_b_id === null) {
            $pair->delete();
            return null;
        }
        if ($pair->student_a_id === $userId) {
            $orphanId = $pair->student_b_id;
            $pair->update(['student_a_id' => $pair->student_b_id, 'student_b_id' => null, 'status' => 'solo']);
            return $orphanId;
        }
        $orphanId = $pair->student_a_id;
        $pair->update(['student_b_id' => null, 'status' => 'solo']);
        return $orphanId;
    }
}
