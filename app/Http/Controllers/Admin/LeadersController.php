<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\ContactLog;
use App\Models\MeetingLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class LeadersController extends Controller
{
  public function index(): Response
  {
    $leaders = User::where("role", "leader")
      ->where("is_active", true)
      ->with("ledHalqa.members", "ledHalqa.pairs")
      ->get();

    $today = Carbon::today();
    $week = $today->copy()->subDays(6)->toDateString();

    $data = $leaders
      ->map(function ($leader) use ($today, $week) {
        $halqa = $leader->ledHalqa;

        // Login frequency (last 30 days)
        $logins30 = AuditLog::where("user_id", $leader->id)
          ->where("action", "login")
          ->where("created_at", ">=", $today->copy()->subDays(29))
          ->count();

        // Last login
        $lastLogin = AuditLog::where("user_id", $leader->id)
          ->where("action", "login")
          ->orderByDesc("created_at")
          ->value("created_at");

        // Contact notes this week
        $notesThisWeek = ContactLog::where("contacted_by", $leader->id)
          ->where("contacted_at", ">=", $week)
          ->count();

        // Total contact notes
        $totalNotes = ContactLog::where("contacted_by", $leader->id)->count();

        // Meeting logs
        $meetingCount = $halqa
          ? MeetingLog::where("halqa_id", $halqa->id)->count()
          : 0;
        $lastMeeting = $halqa
          ? MeetingLog::where("halqa_id", $halqa->id)
            ->orderByDesc("meeting_date")
            ->value("meeting_date")
          : null;

        // Active members
        $memberCount = $halqa?->members->where("role", "student")->count() ?? 0;
        $pairCount = $halqa?->pairs->count() ?? 0;

        $neverLoggedIn = $lastLogin === null;
        $inactiveThisWeek =
          !$lastLogin ||
          Carbon::parse($lastLogin)->lt($today->copy()->subDays(6));

        return [
          "id" => $leader->id,
          "name" => $leader->name,
          "student_id" => $leader->student_id,
          "halqa" => $halqa?->name ?? "— unassigned —",
          "member_count" => $memberCount,
          "pair_count" => $pairCount,
          "logins_30d" => $logins30,
          "last_login" => $lastLogin
            ? Carbon::parse($lastLogin)->diffForHumans()
            : "Never",
          "notes_this_week" => $notesThisWeek,
          "total_notes" => $totalNotes,
          "meeting_count" => $meetingCount,
          "last_meeting" => $lastMeeting
            ? Carbon::parse($lastMeeting)->toDateString()
            : null,
          "never_logged_in" => $neverLoggedIn,
          "inactive_this_week" => $inactiveThisWeek,
        ];
      })
      ->values()
      ->toArray();

    return Inertia::render("Admin/Leaders", ["leaders" => $data]);
  }

  // ── Detail ────────────────────────────────────────────────────────────────

  public function show(User $leader): Response
  {
    abort_if($leader->role !== "leader", 404);

    $halqa = $leader
      ->ledHalqa()
      ->with("members", "pairs.studentA", "pairs.studentB")
      ->first();
    $today = Carbon::today();

    // Login history (last 30 days)
    $logins = AuditLog::where("user_id", $leader->id)
      ->where("action", "login")
      ->orderByDesc("created_at")
      ->limit(50)
      ->get()
      ->map(
        fn($l) => [
          "date" => Carbon::parse($l->created_at)->toDateTimeString(),
          "ago" => Carbon::parse($l->created_at)->diffForHumans(),
        ],
      );

    // Meetings
    $meetings = $halqa
      ? MeetingLog::where("halqa_id", $halqa->id)
        ->orderByDesc("meeting_date")
        ->get()
        ->map(
          fn($m) => [
            "id" => $m->id,
            "date" => $m->meeting_date->toDateString(),
            "attendance_count" => $m->attendance_count,
            "notes" => $m->notes,
            "highlights" => $m->highlights,
            "concerns" => $m->concerns,
          ],
        )
      : collect();

    // Contact notes filed by this leader
    $contacts = ContactLog::where("contacted_by", $leader->id)
      ->with("student:id,name,student_id")
      ->orderByDesc("contacted_at")
      ->limit(50)
      ->get()
      ->map(
        fn($c) => [
          "id" => $c->id,
          "student_db_id" => $c->student?->id,
          "student_name" => $c->student?->name ?? "—",
          "student_id" => $c->student?->student_id ?? "—",
          "method" => $c->method,
          "note" => $c->note,
          "date" => Carbon::parse($c->contacted_at)->toDateString(),
        ],
      );

    // Members
    $members = $halqa
      ? $halqa->members->where("role", "student")->values()->map(
        fn($s) => [
          "id" => $s->id,
          "name" => $s->name,
          "student_id" => $s->student_id,
          "is_active" => $s->is_active,
        ],
      )
      : collect();

    $lastLogin = AuditLog::where("user_id", $leader->id)
      ->where("action", "login")
      ->orderByDesc("created_at")
      ->value("created_at");

    return Inertia::render("Admin/LeaderDetail", [
      "leader" => [
        "id" => $leader->id,
        "name" => $leader->name,
        "student_id" => $leader->student_id,
        "phone" => $leader->phone,
        "is_active" => $leader->is_active,
        "halqa" => $halqa?->name ?? "— unassigned —",
        "halqa_id" => $halqa?->id,
        "member_count" => $members->count(),
        "logins_30d" => AuditLog::where("user_id", $leader->id)
          ->where("action", "login")
          ->where("created_at", ">=", $today->copy()->subDays(29))
          ->count(),
        "last_login" => $lastLogin
          ? Carbon::parse($lastLogin)->diffForHumans()
          : "Never",
        "never_logged_in" => $lastLogin === null,
      ],
      "members" => $members,
      "meetings" => $meetings,
      "contacts" => $contacts,
      "logins" => $logins,
    ]);
  }

  // ── Update name ───────────────────────────────────────────────────────────

  public function update(Request $request, User $leader): RedirectResponse
  {
    abort_if($leader->role !== "leader", 404);

    $request->validate([
      "name" => ["required", "string", "max:255"],
      "phone" => ["nullable", "string", "max:20"],
    ]);

    $leader->update($request->only("name", "phone"));

    AuditLog::create([
      "user_id" => auth()->id(),
      "action" => "leader_updated",
      "meta" => ["target_id" => $leader->id],
    ]);

    return back()->with("success", "Leader updated.");
  }

  // ── Toggle active ─────────────────────────────────────────────────────────

  public function toggleActive(User $leader): RedirectResponse
  {
    abort_if($leader->role !== "leader", 404);
    $leader->update(["is_active" => !$leader->is_active]);
    return back()->with(
      "success",
      $leader->is_active ? "Leader reactivated." : "Leader deactivated.",
    );
  }

  // ── Reset leader password ─────────────────────────────────────────────────

  public function resetPassword(User $leader): RedirectResponse
  {
    abort_if($leader->role !== "leader", 403);

    $defaultPassword = \App\Models\ProgramSetting::get(
      "default_password",
      "ChangeMe@" . rand(1000, 9999),
    );
    $leader->update([
      "password" => Hash::make($defaultPassword),
      "must_change_password" => true,
    ]);

    AuditLog::create([
      "user_id" => auth()->id(),
      "action" => "leader_password_reset",
      "meta" => ["target_id" => $leader->id, "target_name" => $leader->name],
    ]);

    return back()->with(
      "success",
      "Password reset for {$leader->name}. They must change it on next login.",
    );
  }
}
