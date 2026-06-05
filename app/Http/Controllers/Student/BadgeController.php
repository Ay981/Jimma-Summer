<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Services\BadgeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BadgeController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $earned = Badge::where('user_id', $user->id)
            ->orderByDesc('earned_at')
            ->get()
            ->map(fn ($b) => [
                'type'      => $b->badge_type,
                'earned_at' => $b->earned_at->format('M d, Y'),
            ]);

        $earnedTypes = $earned->pluck('type')->toArray();
        $locked      = collect(array_keys(BadgeService::DEFINITIONS))
            ->reject(fn ($t) => in_array($t, $earnedTypes, true))
            ->map(fn ($t) => ['type' => $t])
            ->values();

        return Inertia::render('Student/Badges', [
            'earned' => $earned,
            'locked' => $locked,
            'defs'   => BadgeService::DEFINITIONS,
        ]);
    }
}
