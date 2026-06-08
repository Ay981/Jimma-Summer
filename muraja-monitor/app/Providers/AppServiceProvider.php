<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Request-scoped so its in-request caches are shared across the many
        // app(ConsistencyService::class) resolutions (leaderboard, badges, …)
        // and reset between requests (incl. under Octane).
        $this->app->scoped(\App\Services\ConsistencyService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
