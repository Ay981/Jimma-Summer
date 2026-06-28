<?php

namespace App\Jobs;

use App\Services\FcmService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendFcmPush implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $timeout = 30;

    public function __construct(
        private readonly array $userIds,
        private readonly string $title,
        private readonly string $body,
        private readonly ?string $url = null,
    ) {}

    public static function toUser(int $userId, string $title, string $body, ?string $url = null): void
    {
        static::dispatch([$userId], $title, $body, $url);
    }

    public static function toUsers(array $userIds, string $title, string $body, ?string $url = null): void
    {
        static::dispatch($userIds, $title, $body, $url);
    }

    public function handle(FcmService $fcm): void
    {
        if (count($this->userIds) === 1) {
            $fcm->sendToUser($this->userIds[0], $this->title, $this->body, $this->url);
        } else {
            $fcm->sendToUsers($this->userIds, $this->title, $this->body, $this->url);
        }
    }
}
