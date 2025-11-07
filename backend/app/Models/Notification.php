<?php

namespace App\Models;

use App\Domain\Shared\Enums\NotificationChannel;
use App\Domain\Shared\Enums\NotificationType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'subject',
        'message',
        'channel',
        'is_read',
        'sent_at',
        'read_at',
        'metadata',
    ];

    protected $casts = [
        'type' => NotificationType::class,
        'channel' => NotificationChannel::class,
        'is_read' => 'boolean',
        'sent_at' => 'datetime',
        'read_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function markAsRead(): void
    {
        $this->forceFill([
            'is_read' => true,
            'read_at' => now(),
        ])->save();
    }
}


