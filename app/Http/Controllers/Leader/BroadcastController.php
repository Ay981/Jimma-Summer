<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ContactLog;
use App\Models\LeaderEscalation;
use App\Models\User;
use App\Services\FcmService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BroadcastController extends Controller
{
  public function broadcast(Request $request): RedirectResponse
  {
    $request->validate(["message" => ["required", "string", "max:500"]]);

    $leader = auth()->user();
    $halqa = $leader->ledHalqa()->with("members")->first();
    abort_if(!$halqa, 403);

    $students = $halqa->members()->where("role", "student")->get();
    $count = 0;

    foreach ($students as $student) {
      // In-app notification
      $student->notifications()->create([
        "id" => Str::uuid(),
        "type" => "App\Notifications\LeaderBroadcast",
        "notifiable_type" => User::class,
        "notifiable_id" => $student->id,
        "data" => [
          "message" => $request->message,
          "from" => $leader->name,
        ],
        "created_at" => now(),
      ]);

      // Auto-log as contact entry (type: broadcast)
      ContactLog::create([
        "student_id" => $student->id,
        "contacted_by" => $leader->id,
        "method" => "message",
        "note" => "[Broadcast] {$request->message}",
        "contacted_at" => now(),
        "follow_up_required" => false,
        "outcome" => "pending",
      ]);

      $count++;
    }

    app(FcmService::class)->sendToUsers(
      $students->pluck('id')->toArray(),
      "Message from {$leader->name}",
      $request->message,
      '/student/announcements',
    );

    return back()->with("success", "Broadcast sent to {$count} students.");
  }

  public function nudge(Request $request, int $studentId): RedirectResponse
  {
    $leader = auth()->user();
    $halqa = $leader->ledHalqa;
    $student = User::findOrFail($studentId);

    abort_if(!$halqa || $student->halqa_id !== $halqa->id, 403);

    $request->validate(["message" => ["required", "string", "max:280"]]);

    $student->notifications()->create([
      "id" => Str::uuid(),
      "type" => "App\Notifications\LeaderNudge",
      "notifiable_type" => User::class,
      "notifiable_id" => $student->id,
      "data" => [
        "message" => $request->message,
        "from" => $leader->name,
      ],
      "created_at" => now(),
    ]);

    ContactLog::create([
      "student_id" => $studentId,
      "contacted_by" => $leader->id,
      "method" => "message",
      "note" => "[Nudge] {$request->message}",
      "contacted_at" => now(),
      "follow_up_required" => false,
      "outcome" => "pending",
    ]);

    app(FcmService::class)->sendToUser(
      $studentId,
      "Message from {$leader->name}",
      $request->message,
      '/student/dashboard',
    );

    return back()->with("success", "Nudge sent to {$student->name}.");
  }

  public function escalate(Request $request, int $studentId): RedirectResponse
  {
    $leader = auth()->user();
    $halqa = $leader->ledHalqa;
    $student = User::findOrFail($studentId);

    abort_if(!$halqa || $student->halqa_id !== $halqa->id, 403);
    $request->validate(["note_summary" => ["required", "string", "max:500"]]);

    LeaderEscalation::create([
      "student_id" => $studentId,
      "leader_id" => $leader->id,
      "note_summary" => $request->note_summary,
    ]);

    return back()->with("success", "Escalation flagged to admin.");
  }

  public function resetPassword(int $studentId): RedirectResponse
  {
    $leader = auth()->user();
    $halqa = $leader->ledHalqa;
    $student = User::findOrFail($studentId);

    abort_if(
      !$halqa ||
        $student->halqa_id !== $halqa->id ||
        $student->role !== "student",
      403,
    );

    $defaultPassword = \App\Models\ProgramSetting::get(
      "default_password",
      "ChangeMe@" . rand(1000, 9999),
    );
    $student->update([
      "password" => \Hash::make($defaultPassword),
      "must_change_password" => true,
    ]);

    AuditLog::create([
      "user_id" => $leader->id,
      "action" => "leader_password_reset",
      "target_type" => "user",
      "target_id" => $student->id,
    ]);

    // Return the default password in the flash so the React UI can show it once
    return back()->with("password_reset", [
      "student" => $student->name,
      "password" => $defaultPassword,
    ]);
  }
}
