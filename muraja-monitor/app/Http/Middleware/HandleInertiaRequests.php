<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
  /**
   * The root template that's loaded on the first page visit.
   *
   * @see https://inertiajs.com/server-side-setup#root-template
   *
   * @var string
   */
  protected $rootView = "app";

  /**
   * Determines the current asset version.
   *
   * @see https://inertiajs.com/asset-versioning
   */
  public function version(Request $request): ?string
  {
    return parent::version($request);
  }

  /**
   * Define the props that are shared by default.
   *
   * @see https://inertiajs.com/shared-data
   *
   * @return array<string, mixed>
   */
  public function share(Request $request): array
  {
    $user = $request->user();

    return [
      ...parent::share($request),
      "auth" => [
        "user" => $user
          ? [
            "id" => $user->id,
            "name" => $user->name,
            "role" => $user->role,
            "halqa_id" => $user->halqa_id,
            "weekly_target" => $user->weekly_target,
            "must_change_password" => $user->must_change_password,
          ]
          : null,
      ],
      "flash" => [
        "success" => session("success"),
        "error" => session("error"),
        // Use pull() so PII from failed CSV rows is consumed immediately and not re-shared
        "import_result" => session()->has("import_result")
          ? session()->pull("import_result")
          : null,
      ],
      "notifications" => $user
        ? [
          "unread_count" => $user->unreadNotifications()->count(),
          "latest" => $user
            ->unreadNotifications()
            ->take(5)
            ->get()
            ->map(
              fn($n) => [
                "id" => $n->id,
                "data" => $n->data,
                "time" => $n->created_at->diffForHumans(),
              ],
            )
            ->toArray(),
        ]
        : ["unread_count" => 0, "latest" => []],
      // Ambient streak/consistency indicators shown in the student header on every page.
      // Students only; null before the program starts so the indicators stay hidden.
      "student_stats" =>
        $user && $user->role === "student"
          ? (function () use ($user) {
            $svc = app(\App\Services\ConsistencyService::class);
            $consistency = $svc->getConsistency($user->id);
            if ($consistency === null) {
              return null;
            }
            $available = $user->available_days ?? [];
            $scheduledToday =
              empty($available) ||
              in_array(strtolower(now()->format("l")), $available, true);
            $submittedToday = \App\Models\PairSubmission::where(
              "subject_student_id",
              $user->id,
            )
              ->where("submission_date", now()->toDateString())
              ->exists();
            // done  → submitted today (green)
            // due   → scheduled today but not yet submitted (red, urgent)
            // rest  → not a scheduled day, nothing due (orange)
            $streakState = $submittedToday
              ? "done"
              : ($scheduledToday
                ? "due"
                : "rest");
            return [
              "streak" => $svc->getStreak($user->id),
              "consistency" => round($consistency),
              "streak_state" => $streakState,
            ];
          })()
          : null,
    ];
  }
}
