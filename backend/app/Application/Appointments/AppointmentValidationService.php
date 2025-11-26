<?php

namespace App\Application\Appointments;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Validation\ValidationException;

/**
 * Serviço responsável pelas validações de consultas
 *
 * Centraliza todas as regras de validação de negócio
 */
class AppointmentValidationService
{
    /**
     * Valida se os perfis estão ativos
     */
    public function ensureProfilesAreActive(Doctor $doctor, Patient $patient): void
    {
        if (! $doctor->is_active || ! $doctor->user?->is_active) {
            throw ValidationException::withMessages([
                'doctor_id' => __('Este médico está inativo e não pode receber novos agendamentos.'),
            ]);
        }

        if (! $patient->user?->is_active) {
            throw ValidationException::withMessages([
                'patient' => __('Sua conta está inativa. Entre em contato com o suporte.'),
            ]);
        }
    }

    /**
     * Valida se o médico permite agendamentos
     */
    public function ensureDoctorAllowsScheduling(Doctor $doctor): void
    {
        $totalSchedules = $doctor->schedules()->count();
        $blockedSchedules = $doctor->schedules()->where('is_blocked', true)->count();
        
        // Se não tem nenhum schedule configurado
        if ($totalSchedules === 0) {
            throw ValidationException::withMessages([
                'doctor_id' => __('O médico não possui agenda configurada. Configure horários de atendimento antes de agendar consultas.'),
            ]);
        }
        
        // Se todos os schedules estão bloqueados
        if ($blockedSchedules === $totalSchedules && $totalSchedules > 0) {
            throw ValidationException::withMessages([
                'doctor_id' => __('O médico não possui agenda liberada para novos agendamentos. Todos os horários estão bloqueados.'),
            ]);
        }
    }

    /**
     * Valida se o perfil do paciente está completo
     */
    public function ensurePatientProfileCompleted(Patient $patient): void
    {
        if (! $patient->profile_completed_at) {
            throw ValidationException::withMessages([
                'patient' => __('Complete seu perfil antes de agendar uma consulta.'),
            ]);
        }
    }

    /**
     * Valida se a agenda é válida para o horário
     */
    public function ensureScheduleIsValid(Doctor $doctor, CarbonInterface $scheduledAt, int $duration): void
    {
        if ($scheduledAt->lessThan(now()->addDay())) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('Consultas devem ser agendadas com pelo menos 24 horas de antecedência.'),
            ]);
        }

        $schedule = $doctor->schedules()
            ->where('day_of_week', $scheduledAt->dayOfWeekIso)
            ->where('is_blocked', false)
            ->where('start_time', '<=', $scheduledAt->format('H:i:s'))
            ->where('end_time', '>=', $scheduledAt->copy()->addMinutes($duration)->format('H:i:s'))
            ->first();

        if (! $schedule) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('O médico não possui agenda disponível nesse horário.'),
            ]);
        }
    }

    /**
     * Valida se não há conflitos de horário
     */
    public function ensureNoConflicts(
        Doctor $doctor,
        Patient $patient,
        CarbonInterface $scheduledAt,
        int $duration,
        ?int $ignoreAppointmentId = null
    ): void {
        $endTime = $scheduledAt->copy()->addMinutes($duration);

        // Query compatível com SQLite e PostgreSQL
        $isPostgres = \Illuminate\Support\Facades\DB::getDriverName() === 'pgsql';

        $hasConflict = \App\Models\Appointment::query()
            ->when($ignoreAppointmentId, fn ($query) => $query->where('id', '!=', $ignoreAppointmentId))
            ->where(function ($query) use ($doctor, $patient) {
                $query->where('doctor_id', $doctor->id)
                    ->orWhere('patient_id', $patient->id);
            })
            ->where(function ($query) use ($scheduledAt, $endTime, $isPostgres) {
                // Conflito: nova consulta começa durante outra
                $query->whereBetween('scheduled_at', [$scheduledAt, $endTime])
                    // Conflito: nova consulta termina durante outra
                    ->orWhere(function ($q) use ($scheduledAt, $endTime, $isPostgres) {
                        if ($isPostgres) {
                            $q->whereRaw(
                                "scheduled_at + (duration_minutes || ' minutes')::interval BETWEEN ? AND ?",
                                [$scheduledAt, $endTime]
                            );
                        } else {
                            // SQLite: usar datetime() para adicionar minutos
                            $q->whereRaw(
                                "datetime(scheduled_at, '+' || duration_minutes || ' minutes') BETWEEN ? AND ?",
                                [$scheduledAt, $endTime]
                            );
                        }
                    })
                    // Conflito: nova consulta está completamente dentro de outra
                    ->orWhere(function ($builder) use ($scheduledAt, $endTime, $isPostgres) {
                        $builder->where('scheduled_at', '<', $scheduledAt);

                        if ($isPostgres) {
                            $builder->whereRaw(
                                "scheduled_at + (duration_minutes || ' minutes')::interval > ?",
                                [$endTime]
                            );
                        } else {
                            $builder->whereRaw(
                                "datetime(scheduled_at, '+' || duration_minutes || ' minutes') > ?",
                                [$endTime]
                            );
                        }
                    });
            })
            ->exists();

        if ($hasConflict) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('Existe conflito de horário com outra consulta.'),
            ]);
        }
    }

    /**
     * Valida se o cancelamento é permitido
     */
    public function ensureCancellationAllowed(Appointment $appointment, User $user): void
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role === UserRole::ADMIN) {
            return;
        }

        $scheduledAt = $appointment->scheduled_at;

        if (! $scheduledAt) {
            return;
        }

        if ($scheduledAt->diffInHours(now(), false) >= -12) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('Cancelamentos só são permitidos com antecedência mínima de 12 horas.'),
            ]);
        }
    }

    /**
     * Valida se a remarcação é permitida
     */
    public function ensureRescheduleAllowed(Appointment $appointment, User $user): void
    {
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role !== UserRole::ADMIN) {
            $countReschedules = $appointment->logs()
                ->where('metadata->action', 'rescheduled')
                ->count();

            if ($countReschedules >= 2) {
                throw ValidationException::withMessages([
                    'scheduled_at' => __('Limite de remarcações atingido para esta consulta.'),
                ]);
            }

            if ($appointment->scheduled_at->diffInHours(now(), false) >= -12) {
                throw ValidationException::withMessages([
                    'scheduled_at' => __('Remarcações só são permitidas com antecedência mínima de 12 horas.'),
                ]);
            }
        }

        if ($role === UserRole::DOCTOR && ! $appointment->doctor->user?->is_active) {
            throw ValidationException::withMessages([
                'doctor_id' => __('Perfil do médico inativo.'),
            ]);
        }

        if ($role === UserRole::PATIENT && ! $appointment->patient->user?->is_active) {
            throw ValidationException::withMessages([
                'patient_id' => __('Perfil de paciente inativo.'),
            ]);
        }
    }
}
