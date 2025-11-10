<?php

namespace App\Models;

use App\Domain\Shared\Enums\AppointmentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'scheduled_at',
        'duration_minutes',
        'status',
        'type',
        'price',
        'notes',
        'metadata',
        'confirmed_at',
        'cancelled_at',
        'completed_at',
        'reminder_sent_at',
        'created_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'duration_minutes' => 'integer',
        'status' => AppointmentStatus::class,
        'price' => 'decimal:2',
        'metadata' => 'array',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'completed_at' => 'datetime',
        'reminder_sent_at' => 'datetime',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function observations()
    {
        return $this->hasMany(Observation::class);
    }

    public function logs()
    {
        return $this->hasMany(AppointmentLog::class);
    }

    public function scopeWithStatus($query, AppointmentStatus $status)
    {
        return $query->where('status', $status->value);
    }
}


