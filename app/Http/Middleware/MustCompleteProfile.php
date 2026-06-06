<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * After the student changes their first password (must_change_password = false),
 * they must complete their profile before accessing anything else.
 */
class MustCompleteProfile
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (
            $user
            && $user->role === 'student'
            && !$user->must_change_password
            && !$user->profile_completed
        ) {
            $allowed = [
                'student.profile.complete',
                'student.profile.complete.store',
                'logout',
            ];

            if (!$request->routeIs(...$allowed)) {
                return redirect()->route('student.profile.complete');
            }
        }

        return $next($request);
    }
}
