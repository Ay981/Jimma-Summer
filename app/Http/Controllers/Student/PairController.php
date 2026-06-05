<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Pair;
use App\Models\PairSubmission;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PairController extends Controller
{
    public function show(Request $request): Response
    {
        $user  = $request->user();
        $today = now()->toDateString();

        $pair = Pair::where(function ($q) use ($user) {
            $q->where('student_a_id', $user->id)->orWhere('student_b_id', $user->id);
        })->with(['studentA:id,name,phone', 'studentB:id,name,phone'])->first();

        if (! $pair) {
            return Inertia::render('Student/Pair', ['pair' => null]);
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
                    ? PairSubmission::where('subject_student_id', $partner->id)->where('submission_date', $today)->exists()
                    : false,
                'history'         => $partnerHistory,
            ],
        ]);
    }
}
