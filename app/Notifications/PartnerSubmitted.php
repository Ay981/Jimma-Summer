<?php

namespace App\Notifications;

use App\Models\PairSubmission;
use Illuminate\Notifications\Notification;

class PartnerSubmitted extends Notification
{
    public function __construct(
        private readonly PairSubmission $submission,
        private readonly string $partnerName,
    ) {}

    public function via(mixed $notifiable): array
    {
        return ['database', \App\Channels\FcmChannel::class];
    }

    public function toDatabase(mixed $notifiable): array
    {
        return [
            'message'      => "{$this->partnerName} has recorded your revision for today.",
            'partner_name' => $this->partnerName,
            'submission_id'=> $this->submission->id,
            'juz'          => $this->submission->juz,
            'page_from'    => $this->submission->page_from,
            'page_to'      => $this->submission->page_to,
            'minutes_spent'=> $this->submission->minutes_spent,
        ];
    }

    public function toFcm(mixed $notifiable): array
    {
        return [
            'title' => 'Revision recorded',
            'body'  => "{$this->partnerName} recorded your Juz {$this->submission->juz} session.",
            'url'   => '/student/dashboard',
        ];
    }
}
