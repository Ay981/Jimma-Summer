<?php

namespace App\Services;

use App\Models\DeviceToken;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FcmService
{
    // Token endpoints in order of preference — oauth2.googleapis.com may be blocked on some networks
    private const TOKEN_ENDPOINTS = [
        'https://www.googleapis.com/oauth2/v4/token',
        'https://accounts.google.com/o/oauth2/token',
        'https://oauth2.googleapis.com/token',
    ];

    public function sendToUser(int $userId, string $title, string $body, ?string $url = null): void
    {
        $tokens = DeviceToken::where('user_id', $userId)->pluck('token')->toArray();
        if (empty($tokens)) return;

        $this->sendV1($tokens, $title, $body, $url);
    }

    public function sendToUsers(array $userIds, string $title, string $body, ?string $url = null): void
    {
        $tokens = DeviceToken::whereIn('user_id', $userIds)->pluck('token')->toArray();
        if (empty($tokens)) return;

        foreach (array_chunk($tokens, 500) as $chunk) {
            $this->sendV1($chunk, $title, $body, $url);
        }
    }

    private function sendV1(array $tokens, string $title, string $body, ?string $url): void
    {
        $projectId   = config('services.fcm.project_id');
        $accessToken = $this->getAccessToken();

        if (!$projectId || !$accessToken) {
            Log::warning('FCM: no access token available — push not sent');
            return;
        }

        foreach ($tokens as $token) {
            $response = Http::withToken($accessToken)
                ->timeout(10)
                ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                    'message' => [
                        'token'        => $token,
                        'notification' => ['title' => $title, 'body' => $body],
                        'data'         => ['url' => $url ?? ''],
                        'android'      => ['priority' => 'high', 'notification' => ['sound' => 'default']],
                    ],
                ]);

            if (!$response->successful()) {
                $errorCode = $response->json('error.details.0.errorCode')
                    ?? $response->json('error.status');

                if (in_array($errorCode, ['UNREGISTERED', 'INVALID_ARGUMENT'])) {
                    DeviceToken::where('token', $token)->delete();
                } else {
                    Log::warning('FCM send failed', ['status' => $response->status(), 'body' => $response->body()]);
                }
            }
        }
    }

    private function getAccessToken(): ?string
    {
        $cached = Cache::get('fcm_access_token');
        if ($cached) return $cached;

        $keyPath = config('services.fcm.service_account_path');
        if (!$keyPath || !file_exists($keyPath)) {
            Log::warning('FCM service account file not found: ' . $keyPath);
            return null;
        }

        $key    = json_decode(file_get_contents($keyPath), true);
        $now    = $this->networkTime();
        $b64url = fn($d) => rtrim(strtr(base64_encode($d), '+/', '-_'), '=');

        $header = $b64url(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $claim  = $b64url(json_encode([
            'iss'   => $key['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud'   => 'https://oauth2.googleapis.com/token',
            'iat'   => $now,
            'exp'   => $now + 3600,
        ]));

        $toSign = "{$header}.{$claim}";
        openssl_sign($toSign, $signature, $key['private_key'], OPENSSL_ALGO_SHA256);
        $jwt = "{$toSign}." . $b64url($signature);

        // Try each endpoint until one works
        foreach (self::TOKEN_ENDPOINTS as $endpoint) {
            try {
                $response = Http::asForm()->timeout(8)->post($endpoint, [
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion'  => $jwt,
                ]);

                if ($response->successful() && $token = $response->json('access_token')) {
                    Cache::put('fcm_access_token', $token, 3500);
                    return $token;
                }
            } catch (\Exception) {
                continue; // try next endpoint
            }
        }

        Log::warning('FCM: all token endpoints failed');
        return null;
    }

    /**
     * Trusted wall-clock seconds, immune to local clock drift.
     *
     * Google rejects the OAuth2 JWT if its iat/exp are outside a tight window of
     * Google's own clock. The host clock here has drifted by >1 day before, which
     * silently breaks every push. So we derive "now" from Google's Date response
     * header instead, storing the offset from the local clock for an hour.
     */
    private function networkTime(): int
    {
        $offset = Cache::get('fcm_time_offset');
        if ($offset === null) {
            $offset = 0;
            try {
                $response = Http::timeout(8)->head('https://www.googleapis.com/');
                if ($date = $response->header('Date')) {
                    $offset = strtotime($date) - time();
                    Cache::put('fcm_time_offset', $offset, 3600);
                }
            } catch (\Exception) {
                // fall back to local clock
            }
        }

        return time() + (int) $offset;
    }
}
