<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    private string $baseUrl;

    public function __construct()
    {
        $token = config('services.telegram.bot_token');
        $this->baseUrl = "https://api.telegram.org/bot{$token}";
    }

    public function sendMessage(int|string $chatId, string $text, array $extra = []): bool
    {
        $response = Http::post("{$this->baseUrl}/sendMessage", array_merge([
            'chat_id'    => $chatId,
            'text'       => $text,
            'parse_mode' => 'HTML',
        ], $extra));

        if (!$response->successful()) {
            Log::error('Telegram sendMessage failed', [
                'chat_id'  => $chatId,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
            return false;
        }

        return true;
    }

    public function setWebhook(string $url, string $secret): array
    {
        $response = Http::post("{$this->baseUrl}/setWebhook", [
            'url'          => $url,
            'secret_token' => $secret,
            'allowed_updates' => ['message'],
        ]);

        return $response->json();
    }

    public function deleteWebhook(): array
    {
        return Http::post("{$this->baseUrl}/deleteWebhook")->json();
    }

    public function getWebhookInfo(): array
    {
        return Http::get("{$this->baseUrl}/getWebhookInfo")->json();
    }
}
