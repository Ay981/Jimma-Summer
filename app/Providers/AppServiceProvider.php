<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->scoped(\App\Services\ConsistencyService::class);

        $this->app->bind(
            \Illuminate\Routing\Middleware\ThrottleRequests::class,
            \App\Http\Middleware\ThrottleRequests::class,
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.env') === 'production') {
            \URL::forceScheme('https');
        }

        // Shape dynamic Arabic (e.g. halqa names) into presentation-form glyphs
        // so DomPDF renders it correctly. Usage in Blade: @ar($halqa)
        Blade::directive('ar', function ($expression) {
            return "<?php echo e(\App\Support\ArabicText::shape($expression)); ?>";
        });
    }
}
