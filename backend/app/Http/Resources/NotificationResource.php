<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Notification */
class NotificationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'subject' => $this->subject,
            'message' => $this->message,
            'channel' => $this->channel->value,
            'is_read' => $this->is_read,
            'sent_at' => $this->sent_at,
            'read_at' => $this->read_at,
            'metadata' => $this->metadata,
        ];
    }
}


