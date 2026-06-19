<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token'    => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'in:android,web'],
        ]);

        DeviceToken::updateOrCreate(
            ['token'   => $validated['token']],
            ['user_id' => auth()->id(), 'platform' => $validated['platform'] ?? 'android'],
        );

        return response()->json(['ok' => true]);
    }
}
