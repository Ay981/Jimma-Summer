<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function markRead(string $id, Request $request): RedirectResponse
    {
        $notification = $request->user()->notifications()->find($id);
        if ($notification) {
            $notification->markAsRead();
            if (!$notification->seen_at) {
                $notification->update(['seen_at' => now()]);
            }
        }
        return back();
    }

    public function markSeen(string $id, Request $request): RedirectResponse
    {
        $notification = $request->user()->notifications()->find($id);
        if ($notification && !$notification->seen_at) {
            $notification->update(['seen_at' => now()]);
        }
        return back();
    }

    public function markAllRead(Request $request): RedirectResponse
    {
        $request->user()->unreadNotifications->markAsRead();
        return back();
    }
}
