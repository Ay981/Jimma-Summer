<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PairChangeApproved extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(private readonly string $newPartnerName) {}

    public function via(object $notifiable): array { return ['database', \App\Channels\FcmChannel::class]; }

    public function toFcm(object $notifiable): array
    {
        return [
            'title' => 'Partner updated',
            'body'  => "Your new muraja'a partner is {$this->newPartnerName}.",
            'url'   => '/student/pair',
        ];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message'          => "Your muraja'a partner has been updated. Your new partner is {$this->newPartnerName}.",
            'new_partner_name' => $this->newPartnerName,
        ];
    }
}
