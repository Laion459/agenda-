<?php

namespace App\Models;

use App\Domain\Shared\Enums\Gender;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'cpf',
        'birth_date',
        'address',
        'gender',
        'profile_completed_at',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'gender' => Gender::class,
        'profile_completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function observations()
    {
        return $this->hasMany(Observation::class);
    }

    public function healthInsurances()
    {
        return $this->belongsToMany(HealthInsurance::class, 'patient_health_insurance')
            ->withPivot(['policy_number', 'is_active'])
            ->withTimestamps();
    }

}


