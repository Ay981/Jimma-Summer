<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class PairChangeApproved extends Notification
{
    public function __construct(private readonly string $newPartnerName) {}

    public function via(object $notifiable): array { return ['database']; }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message'          => "Your muraja'a partner has been updated. Your new partner is {$this->newPartnerName}.",
            'new_partner_name' => $this->newPartnerName,
        ];
    }
}
