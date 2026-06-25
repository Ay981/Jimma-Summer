<?php

namespace App\Http\Controllers;

use App\Models\ProgramSetting;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class TelegramWebhookController extends Controller
{
    public function __construct(private TelegramService $telegram) {}

    public function handle(Request $request): Response
    {
        $secret = config('services.telegram.webhook_secret');
        if ($secret && $request->header('X-Telegram-Bot-Api-Secret-Token') !== $secret) {
            Log::warning('Telegram webhook: invalid secret token');
            return response('Unauthorized', 401);
        }

        $update  = $request->json()->all();
        $message = $update['message'] ?? null;

        if (!$message || ($message['chat']['type'] ?? '') !== 'private') {
            return response('OK', 200);
        }

        $chatId = $message['chat']['id'];
        $text   = trim($message['text'] ?? '');

        $this->dispatch($chatId, $text);

        return response('OK', 200);
    }

    private function dispatch(int $chatId, string $text): void
    {
        if (str_starts_with($text, '/')) {
            $this->handleCommand($chatId, $text);
            return;
        }

        // Detect forgot-password intent in free text
        $lower = mb_strtolower($text);
        if (
            str_contains($lower, 'forgot') ||
            str_contains($lower, 'forget') ||
            str_contains($lower, 'reset') ||
            str_contains($lower, 'password') ||
            str_contains($lower, 'كلمة المرور') ||
            str_contains($lower, 'نسيت')
        ) {
            $this->handleForgot($chatId);
            return;
        }

        $this->telegram->sendMessage(
            $chatId,
            "👋 Hello! I'm the <b>Muraja'a Monitor</b> support bot.\n\n" .
            "Send /forgot if you forgot your password.\n" .
            "Send /help to see available commands."
        );
    }

    private function handleCommand(int $chatId, string $text): void
    {
        $command = strtolower(explode('@', explode(' ', $text)[0])[0]);
        $arg     = trim(substr($text, strlen(explode(' ', $text)[0])));

        match ($command) {
            '/start'  => $this->handleStart($chatId),
            '/help'   => $this->handleHelp($chatId),
            '/forgot' => $this->handleForgot($chatId),
            '/link'   => $this->handleLink($chatId, $arg),
            default   => $this->telegram->sendMessage($chatId, "Unknown command. Send /help for options."),
        };
    }

    private function handleStart(int $chatId): void
    {
        $this->telegram->sendMessage(
            $chatId,
            "👋 Welcome to <b>Muraja'a Monitor</b> support bot!\n\n" .
            "• /forgot — Reset your password\n" .
            "• /link — Connect your Telegram to your account\n" .
            "• /help — Show this message"
        );
    }

    private function handleHelp(int $chatId): void
    {
        $this->telegram->sendMessage(
            $chatId,
            "<b>Available commands:</b>\n\n" .
            "/forgot — Reset your forgotten password\n" .
            "/link <code>TOKEN</code> — Link this Telegram to your account\n" .
            "/help — Show this message\n\n" .
            "Get your link token from your profile page in the app."
        );
    }

    // ── /link TOKEN ──────────────────────────────────────────────────────────

    private function handleLink(int $chatId, string $token): void
    {
        if (empty($token)) {
            $this->telegram->sendMessage(
                $chatId,
                "Please provide the token from your profile page.\n" .
                "Example: <code>/link ABC12345</code>"
            );
            return;
        }

        $token  = strtoupper(trim($token));
        $userId = Cache::pull("tg_link:{$token}");

        if (!$userId) {
            $this->telegram->sendMessage(
                $chatId,
                "❌ Invalid or expired token.\n\n" .
                "Go to your profile page and generate a new one — tokens expire after 10 minutes."
            );
            return;
        }

        $user = User::find($userId);
        if (!$user) {
            $this->telegram->sendMessage($chatId, "❌ Account not found.");
            return;
        }

        // Check this chat_id isn't already linked to a different account
        if (User::where('telegram_chat_id', $chatId)->where('id', '!=', $userId)->exists()) {
            $this->telegram->sendMessage(
                $chatId,
                "❌ This Telegram account is already linked to a different student. " .
                "Contact your leader to resolve this."
            );
            return;
        }

        $user->update(['telegram_chat_id' => $chatId]);

        Log::info('Telegram account linked', ['user_id' => $userId, 'chat_id' => $chatId]);

        $this->telegram->sendMessage(
            $chatId,
            "✅ <b>Telegram linked successfully!</b>\n\n" .
            "👤 <b>{$user->name}</b> ({$user->student_id})\n\n" .
            "You can now use /forgot to reset your password securely anytime."
        );
    }

    // ── /forgot ──────────────────────────────────────────────────────────────

    private function handleForgot(int $chatId): void
    {
        $user = User::where('telegram_chat_id', $chatId)
            ->where('is_active', true)
            ->first();

        if (!$user) {
            $appUrl = config('app.url');
            $this->telegram->sendMessage(
                $chatId,
                "❌ <b>Your Telegram is not linked to any account.</b>\n\n" .
                "To link it:\n" .
                "1. Log in at {$appUrl}/login\n" .
                "2. Go to your Profile page\n" .
                "3. Click <b>Generate Link Code</b>\n" .
                "4. Send <code>/link YOUR_CODE</code> here\n\n" .
                "If you can't log in at all, contact your leader for a manual password reset."
            );
            return;
        }

        $newPassword = ProgramSetting::get(
            'default_password',
            'ChangeMe@' . rand(1000, 9999)
        );

        $user->update([
            'password'             => Hash::make($newPassword),
            'must_change_password' => true,
        ]);

        Log::info('Telegram password reset', ['user_id' => $user->id, 'chat_id' => $chatId]);

        $this->telegram->sendMessage(
            $chatId,
            "✅ <b>Password reset successfully!</b>\n\n" .
            "👤 <b>{$user->name}</b> ({$user->student_id})\n" .
            "🔑 New password: <code>{$newPassword}</code>\n\n" .
            "⚠️ You will be asked to set a new password after logging in.\n\n" .
            "Login: " . config('app.url') . "/login"
        );
    }
}
