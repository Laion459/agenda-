<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HealthInsurance extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'coverage_percentage',
        'is_active',
    ];

    protected $casts = [
        'coverage_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function patients()
    {
        return $this->belongsToMany(Patient::class, 'patient_health_insurance')
            ->withPivot(['policy_number', 'is_active'])
            ->withTimestamps();
    }

    public function doctors()
    {
        return $this->belongsToMany(Doctor::class, 'doctor_health_insurance')
            ->withPivot('is_active')
            ->withTimestamps();
    }
}


