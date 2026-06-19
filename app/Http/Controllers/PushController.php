<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->validate(['token' => ['required', 'string', 'max:255']]);

        DeviceToken::updateOrCreate(
            ['token'   => $request->token],
            ['user_id' => auth()->id(), 'platform' => 'android'],
        );

        return response()->json(['ok' => true]);
    }
}
