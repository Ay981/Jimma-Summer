<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class MurajaDayReminder extends Notification
{
    public function __construct(
        private readonly string $slot = 'morning',
    ) {}

    public function via(mixed $notifiable): array
    {
        return ['database', \App\Channels\FcmChannel::class];
    }

    public function toDatabase(mixed $notifiable): array
    {
        return [
            'message'  => $this->message(),
            'slot'     => $this->slot,
            'redirect' => '/student/dashboard',
        ];
    }

    public function toFcm(mixed $notifiable): array
    {
        return [
            'title' => 'Muraja day',
            'body'  => $this->message(),
            'url'   => '/student/dashboard',
        ];
    }

    private function message(): string
    {
        return $this->slot === 'evening'
            ? "Today is your muraja day — don't forget to submit your revision before the day ends."
            : "Today is your muraja day — don't forget to submit your revision.";
    }
}
