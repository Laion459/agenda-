<?php

namespace App\Application\Notifications;

use App\Domain\Shared\Enums\NotificationChannel;
use App\Domain\Shared\Enums\NotificationType;
use App\Models\Notification;
use App\Models\User;

class NotificationDispatcher
{
    public function dispatch(User $user, NotificationType $type, string $subject, string $message, ?NotificationChannel $channel = null, array $metadata = []): Notification
    {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'subject' => $subject,
            'message' => $message,
            'channel' => ($channel ?? NotificationChannel::EMAIL),
            'sent_at' => now(),
            'metadata' => $metadata,
        ]);
    }
}


