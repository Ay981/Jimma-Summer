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
    ->withCommands([
        \App\Console\Commands\CaptureOnboardingScreenshots::class,
    ])
    ->withSchedule(function (Schedule $schedule): void {
        $schedule->command('muraja:remind morning')
            ->dailyAt('07:00')
            ->timezone('Africa/Addis_Ababa');

        $schedule->command('muraja:remind evening')
            ->dailyAt('18:00')
            ->timezone('Africa/Addis_Ababa');

        // PDF export housekeeping — runs every hour
        $schedule->call(function () {
            // Processing exports not updated in 2h → job silently died; mark failed
            \App\Models\PdfExport::where('status', 'processing')
                ->where('updated_at', '<', now()->subHours(2))
                ->each(function ($export) {
                    if ($export->file_path) {
                        \Illuminate\Support\Facades\Storage::delete($export->file_path);
                    }
                    $export->update([
                        'status'        => 'failed',
                        'error_message' => 'Export timed out — please try again.',
                    ]);
                });

            // Ready exports older than 3 days → delete file + record
            \App\Models\PdfExport::where('status', 'ready')
                ->where('ready_at', '<', now()->subDays(3))
                ->each(function ($export) {
                    if ($export->file_path) {
                        \Illuminate\Support\Facades\Storage::delete($export->file_path);
                    }
                    $export->delete();
                });

            // Old failed records → prune (keep 7 days for debugging)
            \App\Models\PdfExport::where('status', 'failed')
                ->where('updated_at', '<', now()->subDays(7))
                ->delete();
        })->hourly()->name('pdf-exports:cleanup');
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

        $middleware->preventRequestForgery(except: [
            'telegram/webhook',
        ]);

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
