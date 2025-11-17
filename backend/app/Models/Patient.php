<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @OA\Schema(
 *     schema="Patient",
 *     type="object",
 *     title="Paciente",
 *     @OA\Property(property="id", type="integer", example=1),
 *     @OA\Property(property="cpf", type="string", example="123.456.789-00"),
 *     @OA\Property(property="birth_date", type="string", format="date", example="1990-01-15"),
 *     @OA\Property(property="gender", type="string", enum={"M", "F", "OTHER"}, nullable=true),
 *     @OA\Property(property="address", type="string", nullable=true),
 *     @OA\Property(property="user", type="object", ref="#/components/schemas/User")
 * )
 */
class Patient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'cpf',
        'birth_date',
        'gender',
        'address',
        'profile_completed_at',
    ];

    protected $casts = [
        'birth_date' => 'date',
        'profile_completed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function healthInsurances()
    {
        return $this->belongsToMany(HealthInsurance::class, 'patient_health_insurance')
            ->withPivot(['policy_number', 'is_active'])
            ->withTimestamps();
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
