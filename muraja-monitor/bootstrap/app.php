<?php

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withCommands([\App\Console\Commands\CaptureOnboardingScreenshots::class])
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('muraja:remind morning')
            ->dailyAt('07:00')
            ->timezone('Africa/Addis_Ababa');

        $schedule->command('muraja:remind evening')
            ->dailyAt('18:00')
            ->timezone('Africa/Addis_Ababa');
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR |
                     Request::HEADER_X_FORWARDED_HOST |
                     Request::HEADER_X_FORWARDED_PORT |
                     Request::HEADER_X_FORWARDED_PROTO |
                     Request::HEADER_X_FORWARDED_AWS_ELB,
        );

        $middleware->web(prepend: [
            \App\Http\Middleware\NoCacheHeaders::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\MustChangePassword::class,
        ]);

      $middleware->alias([
    'guest'                => \App\Http\Middleware\RedirectIfAuthenticated::class,
    'role'                 => \App\Http\Middleware\RoleMiddleware::class,
    'must.change.password' => \App\Http\Middleware\MustChangePassword::class,
    'profile.complete'     => \App\Http\Middleware\MustCompleteProfile::class,
]);
    })
    
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
