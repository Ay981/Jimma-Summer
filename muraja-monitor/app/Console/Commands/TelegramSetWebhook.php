<?php

namespace App\Console\Commands;

use App\Services\TelegramService;
use Illuminate\Console\Command;

class TelegramSetWebhook extends Command
{
    protected $signature = 'telegram:set-webhook
                            {--delete : Remove the webhook instead of setting it}
                            {--info   : Show current webhook info}';

    protected $description = 'Register (or remove) the Telegram bot webhook URL';

    public function handle(TelegramService $telegram): int
    {
        if ($this->option('info')) {
            $info = $telegram->getWebhookInfo();
            $this->line(json_encode($info, JSON_PRETTY_PRINT));
            return 0;
        }

        if ($this->option('delete')) {
            $result = $telegram->deleteWebhook();
            $this->info('Webhook deleted: ' . json_encode($result));
            return 0;
        }

        $token = config('services.telegram.bot_token');
        if (empty($token)) {
            $this->error('TELEGRAM_BOT_TOKEN is not set in your .env file.');
            return 1;
        }

        $secret = config('services.telegram.webhook_secret');
        if (empty($secret)) {
            $this->error('TELEGRAM_WEBHOOK_SECRET is not set in your .env file.');
            return 1;
        }

        $url    = rtrim(config('app.url'), '/') . '/telegram/webhook';
        $result = $telegram->setWebhook($url, $secret);

        if ($result['ok'] ?? false) {
            $this->info("✅ Webhook registered: {$url}");
        } else {
            $this->error('Failed to set webhook: ' . json_encode($result));
            return 1;
        }

        return 0;
    }
}
