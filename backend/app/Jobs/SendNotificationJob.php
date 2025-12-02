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

    /**
     * Número de tentativas antes de falhar permanentemente
     * Configurado para 3 tentativas conforme requisito
     */
    public int $tries = 3;

    /**
     * Tempo de espera entre tentativas (em segundos)
     * 120 segundos = 2 minutos entre tentativas
     */
    public int $backoff = 120;

    /**
     * Tempo máximo de processamento do job (em segundos)
     */
    public int $timeout = 60;

    public function __construct(private int $notificationId)
    {
        $this->onQueue('notifications');
    }

    public function handle(): void
    {
        /** @var Notification|null $notification */
        $notification = Notification::with('user')->find($this->notificationId);

        if (! $notification || $notification->is_suppressed) {
            return;
        }

        if (! $notification->user?->email && $notification->channel === NotificationChannel::EMAIL) {
            $notification->forceFill([
                'error_message' => __('Destinatário sem e-mail configurado'),
                'last_attempt_at' => now(),
                'sent_attempts' => $notification->sent_attempts + 1,
            ])->save();

            return;
        }

        try {
            if ($notification->channel === NotificationChannel::EMAIL) {
                Mail::to($notification->user->email)->send(new NotificationMail($notification));
            }

            // Outros canais (SMS, IN_APP) podem ser tratados aqui futuramente.
            $notification->forceFill([
                'sent_attempts' => $notification->sent_attempts + 1,
                'last_attempt_at' => now(),
                'error_message' => null,
            ])->save();
        } catch (\Throwable $exception) {
            Log::error('Failed to send notification', [
                'notification_id' => $this->notificationId,
                'error' => $exception->getMessage(),
            ]);
            $notification->forceFill([
                'sent_attempts' => $notification->sent_attempts + 1,
                'last_attempt_at' => now(),
                'error_message' => $exception->getMessage(),
            ])->save();

            $this->fail($exception);
        }
    }
}
