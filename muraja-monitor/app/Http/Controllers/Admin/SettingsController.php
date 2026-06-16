<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AyatRotation;
use App\Models\PrayerTimesCache;
use App\Models\ProgramSetting;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
  public function index(): Response
  {
    $keys = [
      "program_name",
      "default_password",
      "certificate_threshold",
      "badge_streak_bronze",
      "badge_streak_silver",
      "badge_streak_gold",
      "badge_pages_bronze",
      "badge_pages_silver",
      "badge_pages_gold",
      "exam_mode",
      "ramadan_mode",
      "date_override",
    ];

    $settings = collect($keys)
      ->mapWithKeys(fn($k) => [$k => ProgramSetting::get($k, "")])
      ->toArray();

    $ayat = AyatRotation::orderBy("id")
      ->get()
      ->map(
        fn($a) => [
          "id" => $a->id,
          "text" => $a->text,
          "reference" => $a->reference,
        ],
      )
      ->toArray();

    $todayPrayer = PrayerTimesCache::where(
      "date",
      today()->toDateString(),
    )->first();

    return Inertia::render("Admin/Settings", [
      "settings" => $settings,
      "ayat" => $ayat,
      "prayer_today" => $todayPrayer
        ? ["fajr" => $todayPrayer->fajr, "isha" => $todayPrayer->isha]
        : null,
    ]);
  }

  public function update(Request $request): RedirectResponse
  {
    $request->validate([
      "program_name" => ["required", "string", "max:255"],
      "default_password" => ["required", "string", "min:8"],
      "certificate_threshold" => ["required", "integer", "min:0", "max:100"],
      "badge_streak_bronze" => ["required", "integer", "min:1"],
      "badge_streak_silver" => ["required", "integer", "min:1"],
      "badge_streak_gold" => ["required", "integer", "min:1"],
      "badge_pages_bronze" => ["required", "integer", "min:1"],
      "badge_pages_silver" => ["required", "integer", "min:1"],
      "badge_pages_gold" => ["required", "integer", "min:1"],
      "exam_mode" => ["boolean"],
      "ramadan_mode" => ["boolean"],
      "date_override" => ["nullable", "date"],
    ]);

    $fields = [
      "program_name",
      "default_password",
      "certificate_threshold",
      "badge_streak_bronze",
      "badge_streak_silver",
      "badge_streak_gold",
      "badge_pages_bronze",
      "badge_pages_silver",
      "badge_pages_gold",
      "date_override",
    ];

    foreach ($fields as $f) {
      ProgramSetting::set($f, $request->input($f) ?? "");
    }
    ProgramSetting::set(
      "exam_mode",
      $request->boolean("exam_mode") ? "1" : "0",
    );
    ProgramSetting::set(
      "ramadan_mode",
      $request->boolean("ramadan_mode") ? "1" : "0",
    );

    return back()->with("success", "Settings saved.");
  }

  public function fetchPrayerTimes(): RedirectResponse
  {
    $date = today()->toDateString();
    $url = "https://api.aladhan.com/v1/timings/{$date}?latitude=7.6667&longitude=36.8333&method=3";

    try {
      $response = Http::timeout(10)->get($url);
      if (!$response->successful()) {
        throw new \Exception("HTTP error: " . $response->status());
      }

      $data = $response->json();
      $timings = $data["data"]["timings"] ?? null;

      if (!$timings) {
        throw new \Exception("No timings in response");
      }

      PrayerTimesCache::updateOrCreate(
        ["date" => $date],
        ["fajr" => $timings["Fajr"], "isha" => $timings["Isha"]],
      );

      return back()->with(
        "success",
        "Prayer times fetched: Fajr {$timings["Fajr"]} · Isha {$timings["Isha"]}",
      );
    } catch (\Exception $e) {
      Log::warning("Prayer times fetch failed", ["error" => $e->getMessage()]);
      return back()->with(
        "error",
        "Could not fetch prayer times. Check your internet connection.",
      );
    }
  }

  // ── Ayat management ───────────────────────────────────────────────────────

  public function storeAyat(Request $request): RedirectResponse
  {
    $request->validate([
      "text" => ["required", "string"],
      "reference" => ["required", "string", "max:100"],
    ]);
    AyatRotation::create([
      "text" => $request->text,
      "reference" => $request->reference,
    ]);
    return back()->with("success", "Ayat added.");
  }

  public function destroyAyat(AyatRotation $ayat): RedirectResponse
  {
    $ayat->delete();
    return back()->with("success", "Ayat removed.");
  }
}
