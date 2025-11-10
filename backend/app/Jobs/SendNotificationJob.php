<?php

namespace App\Jobs;

use App\Domain\Shared\Enums\NotificationChannel;
use App\Mail\NotificationMail;
use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(private int $notificationId)
    {
        $this->onQueue('notifications');
    }

    public function handle(): void
    {
        /** @var Notification|null $notification */
        $notification = Notification::with('user')->find($this->notificationId);

        if (! $notification || ! $notification->user?->email) {
            return;
        }

        try {
            if ($notification->channel === NotificationChannel::EMAIL) {
                Mail::to($notification->user->email)->send(new NotificationMail($notification));
            }

            // Outros canais (SMS, IN_APP) podem ser tratados aqui futuramente.
        } catch (\Throwable $exception) {
            Log::error('Failed to send notification', [
                'notification_id' => $this->notificationId,
                'error' => $exception->getMessage(),
            ]);

            $this->fail($exception);
        }
    }
}


