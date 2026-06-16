<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\MissedSubmissionExcuse;
use App\Models\Pair;
use App\Models\PairSubmission;
use App\Models\ProgramSetting;
use App\Notifications\PartnerSubmitted;
use App\Services\BadgeService;
use App\Services\ConsistencyService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CheckinController extends Controller
{
  public function __construct(
    private readonly BadgeService $badges,
    private readonly ConsistencyService $consistency,
  ) {}

  public function store(Request $request): RedirectResponse
  {
    $request->validate([
      "juz" => ["required", "integer", "min:1", "max:30"],
      "page_from" => ["required", "integer", "min:1", "max:604"],
      "page_to" => ["required", "integer", "min:1", "max:604", "gte:page_from"],
      "minutes_spent" => ["required", "integer", "min:1", "max:480"],
    ]);

    $user = $request->user();
    $today = now()->toDateString();

    // ── Program window guard ─────────────────────────────────────────────
    $startDate = Carbon::parse(
      ProgramSetting::get("program_start_date", $today),
    );
    if (Carbon::today()->lt($startDate)) {
      return back()->withErrors([
        "submit" =>
          "Submissions open on " . $startDate->format("l, M d Y") . ".",
      ]);
    }

    $endDate = ProgramSetting::get("program_end_date");
    if ($endDate && Carbon::today()->gt(Carbon::parse($endDate))) {
      return back()->withErrors([
        "submit" =>
          "The program has ended. No further submissions are accepted.",
      ]);
    }

    // ── Resolve pair / partner / subject ─────────────────────────────────
    $pair = Pair::where(function ($q) use ($user) {
      $q->where("student_a_id", $user->id)->orWhere("student_b_id", $user->id);
    })
      ->with(["studentA", "studentB"])
      ->first();

    $partner = $pair
      ? ($pair->student_a_id === $user->id
        ? $pair->studentB
        : $pair->studentA)
      : null;

    // Subject is the partner (paired) or self (solo / no pair yet)
    $subject = $partner ?? $user;

    // ── Schedule guard ───────────────────────────────────────────────────
    $scheduledDays = array_map("strtolower", $subject->available_days ?? []);
    $todayName = strtolower(now()->format("l"));

    if (!empty($scheduledDays) && !in_array($todayName, $scheduledDays, true)) {
      // Allow if today is an active makeup date for the subject
      $hasMakeup = MissedSubmissionExcuse::where("student_id", $subject->id)
        ->where("makeup_date", $today)
        ->where("fulfilled", false)
        ->exists();

      if (!$hasMakeup) {
        $next = $this->nextScheduledDay($scheduledDays);
        $msg = $partner
          ? "{$partner->name} is not available today. Next available day: {$next}."
          : "Today is not in your schedule. Your next available day is {$next}.";
        return back()->withErrors(["submit" => $msg]);
      }
    }

    // ── Duplicate guard ──────────────────────────────────────────────────
    if (
      PairSubmission::where("subject_student_id", $subject->id)
        ->where("submission_date", $today)
        ->exists()
    ) {
      $msg = $partner
        ? "{$partner->name}'s session has already been recorded for today."
        : "You have already submitted today.";
      return back()->withErrors(["submit" => $msg]);
    }

    $submission = PairSubmission::create([
      "pair_id" => $pair?->id,
      "submitted_by" => $user->id,
      "subject_student_id" => $subject->id,
      "juz" => $request->juz,
      "page_from" => $request->page_from,
      "page_to" => $request->page_to,
      "minutes_spent" => $request->minutes_spent,
      "submission_date" => $today,
      "submitted_at" => now(),
    ]);

    AuditLog::create([
      "user_id" => $user->id,
      "action" => "submission_filed",
      "target_type" => "pair_submission",
      "target_id" => $submission->id,
    ]);

    // Recompute consistency and badges for the subject (partner or self)
    $this->consistency->forget($subject->id);
    $this->badges->checkAndAward($subject);

    // Mark any unfulfilled excuse for the subject whose makeup is today
    MissedSubmissionExcuse::where("student_id", $subject->id)
      ->where("makeup_date", $today)
      ->where("fulfilled", false)
      ->update(["fulfilled" => true]);

    // Notify the subject (partner) that their session was recorded
    if ($partner) {
      $partner->notify(new PartnerSubmitted($submission, $user->name));
    }

    return redirect()
      ->route("student.dashboard")
      ->with("success", "JazakAllah khayran! Recorded.");
  }

  public function update(
    Request $request,
    PairSubmission $submission,
  ): RedirectResponse {
    $user = $request->user();

    abort_if($submission->submitted_by !== $user->id, 403);
    abort_if(
      $submission->created_at->lt(now()->subHours(24)),
      403,
      "The edit window for this submission has closed.",
    );

    $endDate = \App\Models\ProgramSetting::get("program_end_date");
    if ($endDate && now()->gt(\Carbon\Carbon::parse($endDate))) {
      return back()->withErrors([
        "edit" => "The edit window has closed for this program.",
      ]);
    }

    $request->validate([
      "juz" => ["required", "integer", "min:1", "max:30"],
      "page_from" => ["required", "integer", "min:1", "max:604"],
      "page_to" => ["required", "integer", "min:1", "max:604", "gte:page_from"],
      "minutes_spent" => ["required", "integer", "min:1", "max:480"],
    ]);

    $submission->update([
      "juz" => $request->juz,
      "page_from" => $request->page_from,
      "page_to" => $request->page_to,
      "minutes_spent" => $request->minutes_spent,
      "edited_at" => now(),
      "is_edited" => true,
    ]);

    AuditLog::create([
      "user_id" => $user->id,
      "action" => "submission_edited",
      "target_type" => "pair_submission",
      "target_id" => $submission->id,
    ]);

    return back()->with("success", "Submission updated.");
  }

  private function nextScheduledDay(array $scheduledDays): string
  {
    $week = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    $today = now()->dayOfWeek; // 0 = Sunday
    for ($i = 1; $i <= 7; $i++) {
      $day = $week[($today + $i) % 7];
      if (in_array($day, $scheduledDays, true)) {
        return ucfirst($day);
      }
    }
    return "a scheduled day";
  }
}
