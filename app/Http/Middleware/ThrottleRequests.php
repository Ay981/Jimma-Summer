<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Routing\Middleware\ThrottleRequests as BaseThrottle;

class ThrottleRequests extends BaseThrottle
{
    public function handle($request, Closure $next, $maxAttempts = 60, $decayMinutes = 1, $prefix = '')
    {
        if (app()->isLocal()) {
            return $next($request);
        }

        return parent::handle($request, $next, $maxAttempts, $decayMinutes, $prefix);
    }

    public function handleRequestUsingNamedLimiter($request, Closure $next, $limiterName, $limiterCallback)
    {
        if (app()->isLocal()) {
            return $next($request);
        }

        return parent::handleRequestUsingNamedLimiter($request, $next, $limiterName, $limiterCallback);
    }
}
