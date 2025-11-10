<?php

namespace App\Application\Notifications;

use App\Domain\Shared\Enums\NotificationChannel;
use App\Domain\Shared\Enums\NotificationType;
use App\Jobs\SendNotificationJob;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Arr;

class NotificationDispatcher
{
    public function dispatch(User $user, NotificationType $type, string $subject, string $message, ?NotificationChannel $channel = null, array $metadata = []): Notification
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'subject' => $subject,
            'message' => $message,
            'channel' => ($channel ?? NotificationChannel::EMAIL),
            'sent_at' => now(),
            'metadata' => $metadata,
        ]);

        SendNotificationJob::dispatch($notification->id);

        return $notification;
    }

    public function dispatchFromTemplate(
        User $user,
        string $templateKey,
        array $context = [],
        ?NotificationChannel $channel = null,
        array $metadata = []
    ): Notification {
        $template = config("notifications.templates.{$templateKey}");

        if (! $template) {
            throw new \InvalidArgumentException("Notification template [{$templateKey}] not found.");
        }

        /** @var NotificationType $type */
        $type = Arr::get($template, 'type', NotificationType::CONFIRMATION);
        $subject = $this->interpolate(Arr::get($template, 'subject', ''), $context);
        $message = $this->interpolate(Arr::get($template, 'message', ''), $context);

        $metadata = array_merge($metadata, [
            'template' => $templateKey,
            'context' => $context,
        ]);

        return $this->dispatch(
            $user,
            $type,
            $subject,
            $message,
            $channel ?? NotificationChannel::EMAIL,
            $metadata
        );
    }

    private function interpolate(string $template, array $context): string
    {
        if ($template === '') {
            return '';
        }

        $replacements = collect($context)
            ->mapWithKeys(fn ($value, $key) => [":{$key}" => $value])
            ->toArray();

        return strtr($template, $replacements);
    }
}


