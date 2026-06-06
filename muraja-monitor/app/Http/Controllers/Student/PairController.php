<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Pair;
use App\Models\PairingRequest;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PairController extends Controller
{
    public function show(Request $request): Response
    {
        $user  = $request->user();
        $today = now()->toDateString();

        $windowOpen     = (bool) ProgramSetting::get('pairing_window_open', false);
        $windowDeadline = ProgramSetting::get('pairing_window_deadline');

        $myRequest = PairingRequest::where('student_id', $user->id)
            ->with('requestedPartner:id,name,student_id')
            ->first();

        $pair = Pair::where(function ($q) use ($user) {
            $q->where('student_a_id', $user->id)->orWhere('student_b_id', $user->id);
        })->with(['studentA:id,name,phone', 'studentB:id,name,phone'])->first();

        $pairingInfo = [
            'window_open'     => $windowOpen,
            'window_deadline' => $windowDeadline,
            'my_request'      => $myRequest ? [
                'partner_name'       => $myRequest->requestedPartner?->name,
                'partner_student_id' => $myRequest->requestedPartner?->student_id,
            ] : null,
        ];

        if (! $pair) {
            return Inertia::render('Student/Pair', [
                'pair'    => null,
                'pairing' => $pairingInfo,
            ]);
        }

        $partner = $pair->student_a_id === $user->id ? $pair->studentB : $pair->studentA;

        $partnerHistory = $partner ? PairSubmission::where('subject_student_id', $partner->id)
            ->orderByDesc('submission_date')
            ->limit(30)
            ->get()
            ->map(fn ($s) => [
                'id'            => $s->id,
                'date'          => $s->submission_date->format('M d, Y'),
                'juz'           => $s->juz,
                'page_from'     => $s->page_from,
                'page_to'       => $s->page_to,
                'minutes_spent' => $s->minutes_spent,
            ]) : [];

        return Inertia::render('Student/Pair', [
            'pair' => [
                'status'          => $pair->status,
                'partner_name'    => $partner?->name ?? '—',
                'partner_phone'   => $partner?->phone ?? '—',
                'today_submitted' => $partner
                    ? PairSubmission::where('subject_student_id', $partner->id)
                        ->where('submission_date', $today)->exists()
                    : false,
                'history' => $partnerHistory,
            ],
            'pairing' => $pairingInfo,
        ]);
    }
}
