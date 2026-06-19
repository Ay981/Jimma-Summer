<?php

namespace App\Channels;

use App\Services\FcmService;
use Illuminate\Notifications\Notification;

class FcmChannel
{
    public function __construct(private readonly FcmService $fcm) {}

    public function send(mixed $notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toFcm')) return;

        $payload = $notification->toFcm($notifiable);
        if (!$payload) return;

        $this->fcm->sendToUser(
            $notifiable->getKey(),
            $payload['title'],
            $payload['body'],
            $payload['url'] ?? null,
        );
    }
}
