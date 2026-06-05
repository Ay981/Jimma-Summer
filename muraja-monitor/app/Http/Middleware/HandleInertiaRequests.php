<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id'                   => $user->id,
                    'name'                 => $user->name,
                    'role'                 => $user->role,
                    'halqa_id'             => $user->halqa_id,
                    'weekly_target'        => $user->weekly_target,
                    'must_change_password' => $user->must_change_password,
                ] : null,
            ],
            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
            ],
            'notifications' => $user ? [
                'unread_count' => $user->unreadNotifications()->count(),
                'latest'       => $user->unreadNotifications()
                    ->take(5)
                    ->get()
                    ->map(fn ($n) => [
                        'id'   => $n->id,
                        'data' => $n->data,
                        'time' => $n->created_at->diffForHumans(),
                    ])
                    ->toArray(),
            ] : ['unread_count' => 0, 'latest' => []],
        ];
    }
}
