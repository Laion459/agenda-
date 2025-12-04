<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @OA\Schema(
 *     schema="Patient",
 *     type="object",
 *     title="Paciente",
 *
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

    /**
     * Normaliza o CPF antes de salvar (remove formatação, mantém apenas números).
     * Formata o CPF na leitura (adiciona pontos e traço).
     */
    protected function cpf(): Attribute
    {
        return Attribute::make(
            get: function (?string $value) {
                if (empty($value)) {
                    return null;
                }
                
                // Se já estiver formatado, retorna como está
                if (preg_match('/^\d{3}\.\d{3}\.\d{3}-\d{2}$/', $value)) {
                    return $value;
                }
                
                // Se estiver sem formatação, formata
                $cpf = preg_replace('/[^0-9]/', '', $value);
                if (strlen($cpf) === 11) {
                    return substr($cpf, 0, 3).'.'.
                           substr($cpf, 3, 3).'.'.
                           substr($cpf, 6, 3).'-'.
                           substr($cpf, 9, 2);
                }
                
                return $value;
            },
            set: fn (?string $value) => $value ? preg_replace('/[^0-9]/', '', $value) : null,
        );
    }
}
