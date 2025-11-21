<?php

namespace App\Providers;

use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Appointments\AppointmentStatusWorkflow;
use App\Services\Notifications\SmsProviderInterface;
use App\Services\Notifications\NullSmsProvider;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\URL;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\PermissionRegistrar;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(NotificationDispatcher::class);
        $this->app->alias(NotificationDispatcher::class, 'notifications.dispatcher');
        $this->app->bind(SmsProviderInterface::class, NullSmsProvider::class);
        $this->app->singleton(AppointmentStatusWorkflow::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (! $this->app->environment('production')) {
            config([
                'cache.default' => 'array',
                'permission.cache.store' => 'array',
            ]);
        }

        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Limpa o cache do Spatie Permission ao iniciar
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        RateLimiter::for('login', function (Request $request) {
            return [
                Limit::perMinute(5)->by($request->input('email').$request->ip()),
            ];
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });

        Password::defaults(function () {
            return Password::min(8)
                ->mixedCase()
                ->numbers()
                ->symbols();
        });
    }
}
