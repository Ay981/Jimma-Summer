<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

class PairChangeRejected extends Notification
{
    public function __construct(
        private readonly string $studentName,
        private readonly string $reason,
    ) {}

    public function via(object $notifiable): array { return ['database']; }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message'      => "Pair change request for {$this->studentName} was rejected by admin: {$this->reason}",
            'student_name' => $this->studentName,
            'reason'       => $this->reason,
        ];
    }
}
