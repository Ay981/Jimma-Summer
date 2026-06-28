<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PairChangeRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $studentName,
        private readonly string $reason,
    ) {}

    public function via(object $notifiable): array { return ['database', \App\Channels\FcmChannel::class]; }

    public function toFcm(object $notifiable): array
    {
        return [
            'title' => 'Pair change rejected',
            'body'  => "Pair change request was rejected: {$this->reason}",
            'url'   => '/student/pair-change-requests',
        ];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'message'      => "Pair change request for {$this->studentName} was rejected by admin: {$this->reason}",
            'student_name' => $this->studentName,
            'reason'       => $this->reason,
        ];
    }
}
