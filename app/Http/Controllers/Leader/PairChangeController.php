<?php

namespace App\Http\Controllers\Leader;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LeaderEscalation;
use App\Models\Pair;
use App\Models\PairChangeRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PairChangeController extends Controller
{
  // ── Submit a new pair change request ─────────────────────────────────────

  public function store(Request $request, Pair $pair): RedirectResponse
  {
    $leader = $request->user();
    $halqa = $leader->ledHalqa;
    abort_if(!$halqa || $pair->halqa_id !== $halqa->id, 403);

    $request->validate([
      "student_id" => ["required", "exists:users,id"],
      "reason" => ["required", "string", "max:1000"],
      "requested_partner_id" => [
        "nullable",
        "exists:users,id",
        "different:student_id",
      ],
      "submission_id" => [
        "nullable",
        Rule::exists("pair_submissions", "id")->where("pair_id", $pair->id),
      ],
    ]);

    $student = User::findOrFail($request->student_id);
    abort_if(
      !in_array($student->id, [$pair->student_a_id, $pair->student_b_id]),
      403,
    );
    $partner =
      $pair->student_a_id === $student->id ? $pair->studentB : $pair->studentA;

    // Block duplicate pending requests for the same student
    $existing = PairChangeRequest::where("requested_by", $student->id)
      ->where("status", "escalated_to_admin")
      ->exists();
    if ($existing) {
      return back()->with(
        "error",
        "A pending pair change request for {$student->name} already exists.",
      );
    }

    $requestedPartner = $request->requested_partner_id
      ? User::findOrFail($request->requested_partner_id)
      : null;

    $type = "unspecified";
    if ($requestedPartner) {
      $type =
        $requestedPartner->halqa_id === $student->halqa_id
          ? "same_halqa"
          : "cross_halqa";
    }

    $changeRequest = PairChangeRequest::create([
      "requested_by" => $student->id,
      "current_pair_id" => $pair->id,
      "current_partner_id" => $partner?->id,
      "requested_partner_id" => $requestedPartner?->id,
      "reason" => $request->reason,
      "type" => $type,
      "status" => "escalated_to_admin",
      "requested_at" => now(),
      "leader_id" => $leader->id,
    ]);

    // Flag on admin outreach
    LeaderEscalation::create([
      "student_id" => $student->id,
      "leader_id" => $leader->id,
      "note_summary" => "Pair change request: {$request->reason}",
    ]);

    AuditLog::create([
      "user_id" => $leader->id,
      "action" => "pair_change_requested",
      "target_type" => "pair_change_request",
      "target_id" => $changeRequest->id,
      "meta" => [
        "student_name" => $student->name,
        "student_id" => $student->id,
        "type" => $type,
        "partner_name" => $partner?->name,
      ],
    ]);

    return back()->with("success", "Request escalated to admin.");
  }

  // ── List requests for this leader's halqa ─────────────────────────────────

  public function index(Request $request): Response
  {
    $leader = $request->user();

    $reqs = PairChangeRequest::where("leader_id", $leader->id)
      ->with([
        "student:id,name,student_id",
        "currentPartner:id,name",
        "requestedPartner:id,name",
      ])
      ->orderByDesc("requested_at")
      ->get()
      ->map(
        fn($r) => [
          "id" => $r->id,
          "student_name" => $r->student?->name,
          "student_code" => $r->student?->student_id,
          "partner_name" => $r->currentPartner?->name,
          "requested_partner" => $r->requestedPartner?->name,
          "reason" => $r->reason,
          "type" => $r->type,
          "status" => $r->status,
          "requested_at" => Carbon::parse($r->requested_at)->format("d M Y"),
        ],
      )
      ->toArray();

    return Inertia::render("Leader/PairChangeRequests", [
      "requests" => $reqs,
    ]);
  }
}
