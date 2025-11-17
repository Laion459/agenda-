<?php

namespace App\Application\Appointments;

use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Appointments\AppointmentStatusWorkflow;
use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Schedule;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\DatabaseManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function __construct(
        private NotificationDispatcher $notifications,
        private DatabaseManager $db,
        private AppointmentStatusWorkflow $statusWorkflow
    ) {
    }

    public function listForPatient(User $user, array $filters = []): LengthAwarePaginator
    {
        /** @var Patient $patient */
        $patient = $user->patient;
        $patient?->loadMissing('user');

        $cacheKey = 'appointments:patient:' . $patient->id . ':' . md5(json_encode($filters));

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($patient, $filters) {
            $query = Appointment::query()
                ->with(['doctor.user', 'patient.user'])
                ->where('patient_id', $patient->id)
                ->orderByDesc('scheduled_at');

            if (! empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            $this->applyPeriodFilter($query, $filters);

            return $query->paginate($filters['per_page'] ?? 10);
        });
    }

    public function listForDoctor(User $user, array $filters = []): LengthAwarePaginator
    {
        /** @var Doctor $doctor */
        $doctor = $user->doctor;

        $cacheKey = 'appointments:doctor:' . $doctor->id . ':' . md5(json_encode($filters));

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($doctor, $filters) {
            $query = Appointment::query()
                ->with(['doctor.user', 'patient.user'])
                ->where('doctor_id', $doctor->id)
                ->orderByDesc('scheduled_at');

            if (! empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            $this->applyPeriodFilter($query, $filters);

            return $query->paginate($filters['per_page'] ?? 10);
        });
    }

    public function listForAdmin(array $filters = []): LengthAwarePaginator
    {
        $cacheKey = 'appointments:admin:' . md5(json_encode($filters));

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($filters) {
            $query = Appointment::query()
                ->with(['doctor.user', 'patient.user'])
                ->orderByDesc('scheduled_at');

            if (! empty($filters['status'])) {
                $query->where('status', $filters['status']);
            }

            $this->applyPeriodFilter($query, $filters);

            return $query->paginate($filters['per_page'] ?? 10);
        });
    }

    public function createForPatient(User $user, array $data): Appointment
    {
        $patient = $user->patient;

        if (! $patient) {
            throw ValidationException::withMessages([
                'patient' => __('Usuário não possui perfil de paciente.'),
            ]);
        }

        $doctor = Doctor::with('user')->findOrFail($data['doctor_id']);

        $this->ensureProfilesAreActive($doctor, $patient);
        $this->ensureDoctorAllowsScheduling($doctor);
        $this->ensurePatientProfileCompleted($patient);
        $scheduledAt = Carbon::parse($data['scheduled_at']);
        $duration = $data['duration_minutes'] ?? 30;

        $this->ensureScheduleIsValid($doctor, $scheduledAt, $duration);
        $this->ensureNoConflicts($doctor, $patient, $scheduledAt, $duration);

        $appointment = $this->db->transaction(function () use ($patient, $doctor, $user, $scheduledAt, $duration, $data) {
            /** @var Appointment $appointment */
            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'scheduled_at' => $scheduledAt,
                'duration_minutes' => $duration,
                'status' => AppointmentStatus::PENDING,
                'type' => $data['type'] ?? 'PRESENTIAL',
                'price' => $data['price'] ?? null,
                'notes' => $data['notes'] ?? null,
                'metadata' => $data['metadata'] ?? null,
                'created_by' => $user->id,
            ]);

            AppointmentLog::create([
                'appointment_id' => $appointment->id,
                'old_status' => null,
                'new_status' => AppointmentStatus::PENDING,
                'changed_by' => $user->id,
                'metadata' => ['action' => 'created'],
                'changed_at' => now(),
            ]);

            $context = [
                'patient' => $patient->user->name,
                'doctor' => $doctor->user->name,
                'date' => $scheduledAt->translatedFormat('d/m/Y'),
                'time' => $scheduledAt->translatedFormat('H:i'),
            ];

            $this->notifications->dispatchFromTemplate(
                $doctor->user,
                'appointment.created.doctor',
                $context,
                metadata: ['appointment_id' => $appointment->id]
            );

            $this->notifications->dispatchFromTemplate(
                $patient->user,
                'appointment.created.patient',
                $context,
                metadata: ['appointment_id' => $appointment->id]
            );

            return $appointment->load(['doctor.user', 'patient.user']);
        });

        // Limpar cache relacionado
        $this->clearAppointmentCache($patient->id, $doctor->id);

        return $appointment;
    }

    public function confirm(Appointment $appointment, User $user): Appointment
    {
        $appointment->loadMissing(['doctor.user', 'patient.user']);

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);
        $this->statusWorkflow->validateTransition(
            $appointment->status,
            AppointmentStatus::CONFIRMED,
            $role
        );

        $appointment->update([
            'status' => AppointmentStatus::CONFIRMED,
            'confirmed_at' => now(),
        ]);

        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status' => AppointmentStatus::PENDING,
            'new_status' => AppointmentStatus::CONFIRMED,
            'changed_by' => $user->id,
            'metadata' => ['action' => 'confirmed'],
            'changed_at' => now(),
        ]);

        $this->notifications->dispatchFromTemplate(
            $appointment->patient->user,
            'appointment.confirmed.patient',
            [
                'doctor' => $appointment->doctor->user->name,
                'date' => $appointment->scheduled_at->translatedFormat('d/m/Y'),
                'time' => $appointment->scheduled_at->translatedFormat('H:i'),
            ],
            metadata: ['appointment_id' => $appointment->id]
        );

        $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);

        return $appointment;
    }

    public function cancel(Appointment $appointment, User $user, ?string $reason = null): Appointment
    {
        if ($appointment->status === AppointmentStatus::CANCELLED) {
            return $appointment;
        }

        $this->ensureCancellationAllowed($appointment, $user);

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);
        $this->statusWorkflow->validateTransition(
            $appointment->status,
            AppointmentStatus::CANCELLED,
            $role
        );

        $appointment->update([
            'status' => AppointmentStatus::CANCELLED,
            'cancelled_at' => now(),
        ]);

        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status' => $appointment->getOriginal('status'),
            'new_status' => AppointmentStatus::CANCELLED,
            'changed_by' => $user->id,
            'reason' => $reason,
            'metadata' => ['action' => 'cancelled'],
            'changed_at' => now(),
        ]);

        $this->notifications->dispatchFromTemplate(
            $appointment->patient->user,
            'appointment.cancelled.patient',
            [
                'doctor' => $appointment->doctor->user->name,
                'reason' => $reason ? $reason : __('Não informado'),
            ],
            metadata: ['appointment_id' => $appointment->id, 'reason' => $reason]
        );

        $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);

        return $appointment->refresh();
    }

    public function complete(Appointment $appointment, User $user): Appointment
    {
        $appointment->loadMissing(['doctor.user', 'patient.user']);

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);
        $this->statusWorkflow->validateTransition(
            $appointment->status,
            AppointmentStatus::COMPLETED,
            $role
        );

        $appointment->update([
            'status' => AppointmentStatus::COMPLETED,
            'completed_at' => now(),
        ]);

        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status' => $appointment->getOriginal('status'),
            'new_status' => AppointmentStatus::COMPLETED,
            'changed_by' => $user->id,
            'metadata' => ['action' => 'completed'],
            'changed_at' => now(),
        ]);

        $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);

        return $appointment->refresh();
    }

    public function reschedule(Appointment $appointment, User $user, array $data): Appointment
    {
        $newDate = Carbon::parse($data['scheduled_at']);
        $duration = $data['duration_minutes'] ?? $appointment->duration_minutes;

        $doctor = $appointment->doctor;
        $patient = $appointment->patient;

        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        if ($role !== UserRole::ADMIN) {
            $this->ensureScheduleIsValid($doctor, $newDate, $duration);
        }

        $this->ensureRescheduleAllowed($appointment, $user);
        $this->ensureNoConflicts($doctor, $patient, $newDate, $duration, $appointment->id);

        $oldStatus = $appointment->status;

        $appointment->update([
            'scheduled_at' => $newDate,
            'duration_minutes' => $duration,
            'status' => AppointmentStatus::PENDING,
            'confirmed_at' => null,
            'cancelled_at' => null,
        ]);

        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status' => $oldStatus,
            'new_status' => AppointmentStatus::PENDING,
            'changed_by' => $user->id,
            'metadata' => ['action' => 'rescheduled'],
            'changed_at' => now(),
        ]);

        $rescheduleContext = [
            'patient' => $appointment->patient->user->name,
            'doctor' => $appointment->doctor->user->name,
            'date' => $newDate->translatedFormat('d/m/Y'),
            'time' => $newDate->translatedFormat('H:i'),
        ];

        $this->notifications->dispatchFromTemplate(
            $appointment->patient->user,
            'appointment.rescheduled.patient',
            $rescheduleContext,
            metadata: ['appointment_id' => $appointment->id]
        );

        $this->notifications->dispatchFromTemplate(
            $appointment->doctor->user,
            'appointment.rescheduled.doctor',
            $rescheduleContext,
            metadata: ['appointment_id' => $appointment->id]
        );

        $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);

        return $appointment->refresh();
    }

    protected function ensureProfilesAreActive(Doctor $doctor, Patient $patient): void
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

    protected function ensureDoctorAllowsScheduling(Doctor $doctor): void
    {
        if ($doctor->schedules()->where('is_blocked', true)->count() === $doctor->schedules()->count()) {
            throw ValidationException::withMessages([
                'doctor_id' => __('O médico não possui agenda liberada para novos agendamentos.'),
            ]);
        }
    }

    protected function ensurePatientProfileCompleted(Patient $patient): void
    {
        if (! $patient->profile_completed_at) {
            throw ValidationException::withMessages([
                'patient' => __('Complete seu perfil antes de agendar uma consulta.'),
            ]);
        }
    }

    protected function ensureCancellationAllowed(Appointment $appointment, User $user): void
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

    protected function ensureRescheduleAllowed(Appointment $appointment, User $user): void
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

    protected function ensureScheduleIsValid(Doctor $doctor, CarbonInterface $scheduledAt, int $duration): void
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

    protected function ensureNoConflicts(Doctor $doctor, Patient $patient, CarbonInterface $scheduledAt, int $duration, ?int $ignoreAppointmentId = null): void
    {
        $endTime = $scheduledAt->copy()->addMinutes($duration);

        $conflictQuery = Appointment::query()
            ->when($ignoreAppointmentId, fn (Builder $query) => $query->where('id', '!=', $ignoreAppointmentId))
            ->where(function (Builder $query) use ($doctor, $patient) {
                $query->where('doctor_id', $doctor->id)
                    ->orWhere('patient_id', $patient->id);
            })
            ->where(function (Builder $query) use ($scheduledAt, $endTime) {
                $query->whereBetween('scheduled_at', [$scheduledAt, $endTime])
                    ->orWhereBetween(DB::raw("scheduled_at + (duration_minutes || ' minutes')::interval"), [$scheduledAt, $endTime])
                    ->orWhere(function (Builder $builder) use ($scheduledAt, $endTime) {
                        $builder->where('scheduled_at', '<', $scheduledAt)
                            ->where(DB::raw("scheduled_at + (duration_minutes || ' minutes')::interval"), '>', $endTime);
                    });
            });

        if ($conflictQuery->exists()) {
            throw ValidationException::withMessages([
                'scheduled_at' => __('Existe conflito de horário com outra consulta.'),
            ]);
        }
    }

    protected function applyPeriodFilter(Builder $query, array $filters): void
    {
        if (empty($filters['period'])) {
            return;
        }

        $now = now();

        match ($filters['period']) {
            'future' => $query->where('scheduled_at', '>', $now),
            'past' => $query->where('scheduled_at', '<', $now),
            'all' => null, // Não aplica filtro
            default => null,
        };
    }

    /**
     * Limpa cache relacionado a consultas
     */
    protected function clearAppointmentCache(?int $patientId = null, ?int $doctorId = null): void
    {
        $patterns = ['appointments:*'];

        if ($patientId) {
            $patterns[] = "appointments:patient:{$patientId}:*";
        }

        if ($doctorId) {
            $patterns[] = "appointments:doctor:{$doctorId}:*";
        }

        foreach ($patterns as $pattern) {
            try {
                Cache::flush(); // Em produção, usar cache tags ou Redis SCAN
            } catch (\Exception $e) {
                // Ignorar erros de cache
            }
        }
    }
}
