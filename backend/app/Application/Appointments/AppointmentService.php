<?php

namespace App\Application\Appointments;

use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Domain\Shared\Enums\NotificationType;
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
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function __construct(
        private NotificationDispatcher $notifications,
        private DatabaseManager $db
    ) {
    }

    public function listForPatient(User $user, array $filters = []): LengthAwarePaginator
    {
        /** @var Patient $patient */
        $patient = $user->patient;

        $query = Appointment::query()
            ->with(['doctor.user', 'patient.user'])
            ->where('patient_id', $patient->id)
            ->orderByDesc('scheduled_at');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate($filters['per_page'] ?? 10);
    }

    public function listForDoctor(User $user, array $filters = []): LengthAwarePaginator
    {
        /** @var Doctor $doctor */
        $doctor = $user->doctor;

        $query = Appointment::query()
            ->with(['doctor.user', 'patient.user'])
            ->where('doctor_id', $doctor->id)
            ->orderByDesc('scheduled_at');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate($filters['per_page'] ?? 10);
    }

    public function listForAdmin(array $filters = []): LengthAwarePaginator
    {
        $query = Appointment::query()
            ->with(['doctor.user', 'patient.user'])
            ->orderByDesc('scheduled_at');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->paginate($filters['per_page'] ?? 10);
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
        $scheduledAt = Carbon::parse($data['scheduled_at']);
        $duration = $data['duration_minutes'] ?? 30;

        $this->ensureScheduleIsValid($doctor, $scheduledAt, $duration);
        $this->ensureNoConflicts($doctor, $patient, $scheduledAt, $duration);

        return $this->db->transaction(function () use ($patient, $doctor, $user, $scheduledAt, $duration, $data) {
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

            $this->notifications->dispatch(
                $doctor->user,
                NotificationType::REMINDER,
                __('Nova consulta agendada'),
                __('Uma nova consulta foi agendada para :date', ['date' => $scheduledAt->translatedFormat('d/m/Y H:i')]),
                metadata: ['appointment_id' => $appointment->id]
            );

            $this->notifications->dispatch(
                $patient->user,
                NotificationType::CONFIRMATION,
                __('Consulta registrada'),
                __('Sua consulta foi registrada e aguarda confirmação do médico.'),
                metadata: ['appointment_id' => $appointment->id]
            );

            return $appointment->load(['doctor.user', 'patient.user']);
        });
    }

    public function confirm(Appointment $appointment, User $user): Appointment
    {
        $appointment->loadMissing(['doctor.user', 'patient.user']);

        if ($appointment->status !== AppointmentStatus::PENDING) {
            throw ValidationException::withMessages([
                'status' => __('Somente consultas pendentes podem ser confirmadas.'),
            ]);
        }

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

        $this->notifications->dispatch(
            $appointment->patient->user,
            NotificationType::CONFIRMATION,
            __('Consulta confirmada'),
            __('Sua consulta com :doctor foi confirmada para :date', [
                'doctor' => $appointment->doctor->user->name,
                'date' => $appointment->scheduled_at->translatedFormat('d/m/Y H:i'),
            ]),
            metadata: ['appointment_id' => $appointment->id]
        );

        return $appointment;
    }

    public function cancel(Appointment $appointment, User $user, ?string $reason = null): Appointment
    {
        if ($appointment->status === AppointmentStatus::CANCELLED) {
            return $appointment;
        }

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

        $this->notifications->dispatch(
            $appointment->patient->user,
            NotificationType::CANCELLATION,
            __('Consulta cancelada'),
            __('Sua consulta com :doctor foi cancelada.', ['doctor' => $appointment->doctor->user->name]),
            metadata: ['appointment_id' => $appointment->id, 'reason' => $reason]
        );

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

        $this->notifications->dispatch(
            $appointment->patient->user,
            NotificationType::RESCHEDULING,
            __('Remarcação pendente de confirmação'),
            __('Sua consulta foi remarcada para :date e aguarda confirmação do médico.', ['date' => $newDate->translatedFormat('d/m/Y H:i')]),
            metadata: ['appointment_id' => $appointment->id]
        );

        $this->notifications->dispatch(
            $appointment->doctor->user,
            NotificationType::RESCHEDULING,
            __('Paciente solicitou remarcação'),
            __('Consulta remarcada para :date. Confirme a nova data em sua agenda.', ['date' => $newDate->translatedFormat('d/m/Y H:i')]),
            metadata: ['appointment_id' => $appointment->id]
        );

        return $appointment->refresh();
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
}


