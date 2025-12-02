<?php

namespace App\Application\Appointments;

use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Carbon\Carbon;
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
     * Considera exceções de agenda e períodos de disponibilidade
     */
    public function ensureScheduleIsValid(Doctor $doctor, CarbonInterface $scheduledAt, int $duration): void
    {
        if ($scheduledAt->lessThan(now()->addDay())) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('Consultas devem ser agendadas com pelo menos 24 horas de antecedência.'),
            ]);
        }

        $dateStr = $scheduledAt->format('Y-m-d');
        $timeStr = $scheduledAt->format('H:i:s');
        $endTime = $scheduledAt->copy()->addMinutes($duration);
        $endTimeStr = $endTime->format('H:i:s');

        // 1. Verifica períodos de disponibilidade
        $activePeriods = $doctor->availabilityPeriods()
            ->where('is_active', true)
            ->get();

        if ($activePeriods->isNotEmpty()) {
            $isWithinPeriod = $activePeriods->contains(function ($period) use ($scheduledAt) {
                $periodStart = $period->start_date->copy()->startOfDay();
                $periodEnd = $period->end_date->copy()->endOfDay();
                $checkDate = $scheduledAt->copy()->startOfDay();
                
                return $checkDate->greaterThanOrEqualTo($periodStart) 
                    && $checkDate->lessThanOrEqualTo($periodEnd);
            });

            if (! $isWithinPeriod) {
                throw ValidationException::withMessages([
                    'scheduled_at' => __('A data selecionada está fora do período de disponibilidade do médico.'),
                ]);
            }
        }

        // 2. Verifica exceções de agenda
        $exception = $doctor->scheduleExceptions()
            ->where('date', $dateStr)
            ->first();

        if ($exception) {
            if ($exception->type === 'BLOCKED' || $exception->type === 'UNAVAILABLE') {
                throw ValidationException::withMessages([
                    'scheduled_at' => __('Esta data está bloqueada na agenda do médico.'),
                ]);
            }

            if ($exception->type === 'CUSTOM_HOURS') {
                if (! $exception->start_time || ! $exception->end_time) {
                    throw ValidationException::withMessages([
                        'scheduled_at' => __('Esta data possui horários customizados inválidos.'),
                    ]);
                }

                // Usa a data do agendamento, não hoje
                $customStart = $scheduledAt->copy()->setTimeFromTimeString($exception->start_time);
                $customEnd = $scheduledAt->copy()->setTimeFromTimeString($exception->end_time);
                
                if ($customEnd->lt($customStart)) {
                    $customEnd->addDay();
                }
                
                // Verifica se o horário de início e fim da consulta estão dentro do horário customizado
                if ($scheduledAt->lt($customStart) || $endTime->gt($customEnd)) {
                    throw ValidationException::withMessages([
                        'scheduled_at' => __('O horário selecionado está fora dos horários disponíveis para esta data.'),
                    ]);
                }

                // Se passou todas as validações de exceção customizada, está válido
                return;
            }
        }

        // 3. Verifica schedules padrão do dia da semana
        $dayOfWeek = $scheduledAt->dayOfWeekIso;
        $schedules = $doctor->schedules()
            ->where('day_of_week', $dayOfWeek)
            ->where('is_blocked', false)
            ->get();

        if ($schedules->isEmpty()) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('O médico não possui agenda disponível neste dia da semana.'),
            ]);
        }

        // Verifica se o horário está dentro de algum schedule
        $isValid = false;
        foreach ($schedules as $schedule) {
            // Usa a data do agendamento para criar os horários do schedule
            $scheduleStart = $scheduledAt->copy()->setTimeFromTimeString($schedule->start_time);
            $scheduleEnd = $scheduledAt->copy()->setTimeFromTimeString($schedule->end_time);
            
            if ($scheduleEnd->lt($scheduleStart)) {
                $scheduleEnd->addDay();
            }
            
            // Verifica se o horário de início e fim da consulta estão dentro do schedule
            if ($scheduledAt->gte($scheduleStart) && $endTime->lte($scheduleEnd)) {
                $isValid = true;
                break;
            }
        }

        if (! $isValid) {
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
