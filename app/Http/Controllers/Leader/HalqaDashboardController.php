<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\ProgramSetting;
use App\Services\HalqaDashboardService;
use Inertia\Inertia;
use Inertia\Response;

class HalqaDashboardController extends Controller
{
    public function index(): Response
    {
        $leader = auth()->user();
        $halqa  = $leader->ledHalqa()->with(['pairs.studentA', 'pairs.studentB'])->first();

        if (!$halqa) {
            return Inertia::render('Leader/Dashboard', [
                'halqa'          => null,
                'pairs'          => [],
                'students'       => [],
                'summary'        => ['on_track' => 0, 'slipping' => 0, 'at_risk' => 0, 'inactive' => 0],
                'today_subs'     => 0,
                'absence_queue'  => [],
                'follow_up_queue'=> [],
                'group_identity' => null,
            ]);
        }

        return Inertia::render(
            'Leader/Dashboard',
            app(HalqaDashboardService::class)->dashboardProps($halqa, $leader),
        );
    }

    // ── Certificate downloads (only when certificates_published is on) ─────────

    public function downloadMyCertificate(): \Symfony\Component\HttpFoundation\Response
    {
        abort_unless((bool) ProgramSetting::get('certificates_published', false), 403, 'Certificates are not yet published.');

        $lb = new \App\Http\Controllers\Admin\LeaderboardController();
        return $lb->leaderCertificate(auth()->user());
    }

    public function downloadStudentCertificate(\App\Models\User $student): \Symfony\Component\HttpFoundation\Response
    {
        abort_unless((bool) ProgramSetting::get('certificates_published', false), 403, 'Certificates are not yet published.');

        // Confirm the student belongs to this leader's halqa
        $halqa = auth()->user()->ledHalqa;
        abort_if(!$halqa, 403, 'No halqa assigned.');
        abort_unless(
            \App\Models\Pair::where('halqa_id', $halqa->id)
                ->where(fn ($q) => $q->where('student_a_id', $student->id)->orWhere('student_b_id', $student->id))
                ->exists(),
            403,
            'Student is not in your halqa.'
        );

        $lb = new \App\Http\Controllers\Admin\LeaderboardController();
        return $lb->certificate($student);
    }
}
