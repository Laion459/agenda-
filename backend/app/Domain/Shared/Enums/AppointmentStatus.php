<?php

namespace App\Domain\Shared\Enums;

enum AppointmentStatus: string
{
    case PENDING = 'PENDING';
    case CONFIRMED = 'CONFIRMED';
    case COMPLETED = 'COMPLETED';
    case CANCELLED = 'CANCELLED';

    public function isFinal(): bool
    {
        return in_array($this, [self::COMPLETED, self::CANCELLED], true);
    }
}
