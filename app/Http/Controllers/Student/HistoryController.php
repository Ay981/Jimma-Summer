<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $user  = $request->user();
        $month = $request->get('month', now()->format('Y-m'));

        [$year, $mon] = explode('-', $month);

        $submissions = PairSubmission::where('subject_student_id', $user->id)
            ->whereYear('submission_date', $year)
            ->whereMonth('submission_date', $mon)
            ->with(['submitter:id,name'])
            ->orderByDesc('submission_date')
            ->paginate(25)
            ->through(fn ($s) => [
                'id'            => $s->id,
                'date'          => $s->submission_date->format('M d, Y'),
                'date_raw'      => $s->submission_date->toDateString(),
                'filed_by'      => $s->submitter->name,
                'filed_by_self' => $s->submitted_by === $user->id,
                'juz'           => $s->juz,
                'page_from'     => $s->page_from,
                'page_to'       => $s->page_to,
                'minutes_spent' => $s->minutes_spent,
                'is_edited'     => $s->is_edited,
                'edited_at'     => $s->edited_at?->format('M d H:i'),
            ]);

        $endDate   = ProgramSetting::get('program_end_date');
        $isEditable = ! $endDate || now()->lte(Carbon::parse($endDate));

        // Build month options (program start to now)
        $start       = Carbon::parse(ProgramSetting::get('program_start_date', now()->toDateString()));
        $months      = [];
        $cursor      = $start->copy()->startOfMonth();
        while ($cursor->lte(now())) {
            $months[] = $cursor->format('Y-m');
            $cursor->addMonth();
        }

        return Inertia::render('Student/History', [
            'submissions'   => $submissions,
            'current_month' => $month,
            'months'        => array_reverse($months),
            'is_editable'   => $isEditable,
            'user_id'       => $user->id,
        ]);
    }
}
