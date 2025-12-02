<?php

namespace App\Application\Appointments;

use App\Application\Notifications\NotificationDispatcher;
use App\Domain\Appointments\AppointmentStatusWorkflow;
use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Infrastructure\Cache\CacheManager;
use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\DatabaseManager;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function __construct(
        private NotificationDispatcher $notifications,
        private DatabaseManager $db,
        private AppointmentStatusWorkflow $statusWorkflow,
        private CacheManager $cacheManager,
        private AppointmentCreationService $creationService,
        private AppointmentValidationService $validationService
    ) {}

    public function listForPatient(User $user, array $filters = []): LengthAwarePaginator
    {
        /** @var Patient $patient */
        $patient = $user->patient;
        $patient?->loadMissing('user');

        $cacheKey = 'appointments:patient:'.$patient->id.':'.md5(json_encode($filters));

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

        $cacheKey = 'appointments:doctor:'.$doctor->id.':'.md5(json_encode($filters));

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
        $cacheKey = 'appointments:admin:'.md5(json_encode($filters));

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
        $patient = $this->getPatientProfile($user);
        $doctor = $this->getDoctor($data['doctor_id']);
        $scheduledAt = Carbon::parse($data['scheduled_at']);
        
        // Se não foi fornecida duração, busca do schedule do médico
        $duration = $data['duration_minutes'] ?? null;
        if (! $duration) {
            $dayOfWeek = $scheduledAt->dayOfWeekIso;
            $schedule = $doctor->schedules()
                ->where('day_of_week', $dayOfWeek)
                ->where('is_blocked', false)
                ->first();
            
            if ($schedule) {
                $duration = $schedule->slot_duration_minutes ?? 30;
            } else {
                $duration = 30; // Fallback padrão
            }
        }

        $this->validateCreation($doctor, $patient, $scheduledAt, $duration);

        $appointment = $this->db->transaction(function () use ($patient, $doctor, $user, $scheduledAt, $duration, $data) {
            return $this->creationService->create(
                $patient,
                $doctor,
                $user,
                $scheduledAt,
                $duration,
                $data
            );
        });

        $this->clearAppointmentCache($patient->id, $doctor->id);

        return $appointment;
    }

    public function createForAdmin(User $user, array $data): Appointment
    {
        $patient = Patient::with('user')->findOrFail($data['patient_id']);
        $doctor = $this->getDoctor($data['doctor_id']);
        $scheduledAt = Carbon::parse($data['scheduled_at']);
        $duration = $data['duration_minutes'] ?? 30;

        $this->validateCreation($doctor, $patient, $scheduledAt, $duration);

        $appointment = $this->db->transaction(function () use ($patient, $doctor, $user, $scheduledAt, $duration, $data) {
            return $this->creationService->create(
                $patient,
                $doctor,
                $user,
                $scheduledAt,
                $duration,
                $data
            );
        });

        $this->clearAppointmentCache($patient->id, $doctor->id);

        return $appointment;
    }

    /**
     * Obtém perfil de paciente do usuário
     */
    protected function getPatientProfile(User $user): Patient
    {
        $patient = $user->patient;

        if (! $patient) {
            throw ValidationException::withMessages([
                'patient' => __('Usuário não possui perfil de paciente.'),
            ]);
        }

        return $patient;
    }

    /**
     * Obtém médico com relacionamentos carregados
     */
    protected function getDoctor(int $doctorId): Doctor
    {
        return Doctor::with('user')->findOrFail($doctorId);
    }

    /**
     * Valida todas as condições para criação de consulta
     */
    protected function validateCreation(
        Doctor $doctor,
        Patient $patient,
        CarbonInterface $scheduledAt,
        int $duration
    ): void {
        $this->validationService->ensureProfilesAreActive($doctor, $patient);
        $this->validationService->ensureDoctorAllowsScheduling($doctor);
        $this->validationService->ensurePatientProfileCompleted($patient);
        $this->validationService->ensureScheduleIsValid($doctor, $scheduledAt, $duration);
        $this->validationService->ensureNoConflicts($doctor, $patient, $scheduledAt, $duration);
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

        $context = [
            'patient' => $appointment->patient->user->name,
            'doctor' => $appointment->doctor->user->name,
            'date' => $appointment->scheduled_at->translatedFormat('d/m/Y'),
            'time' => $appointment->scheduled_at->translatedFormat('H:i'),
        ];

        $this->notifications->dispatchFromTemplate(
            $appointment->patient->user,
            'appointment.confirmed.patient',
            $context,
            metadata: ['appointment_id' => $appointment->id]
        );

        $this->notifications->dispatchFromTemplate(
            $appointment->doctor->user,
            'appointment.confirmed.doctor',
            $context,
            metadata: ['appointment_id' => $appointment->id]
        );

        // Notifica administradores
        $admins = User::where('role', UserRole::ADMIN->value)->get();
        foreach ($admins as $admin) {
            $this->notifications->dispatchFromTemplate(
                $admin,
                'appointment.confirmed.admin',
                $context,
                metadata: ['appointment_id' => $appointment->id]
            );
        }

        $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);

        return $appointment;
    }

    public function cancel(Appointment $appointment, User $user, ?string $reason = null): Appointment
    {
        if ($appointment->status === AppointmentStatus::CANCELLED) {
            return $appointment;
        }

        $this->validationService->ensureCancellationAllowed($appointment, $user);

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

        $context = [
            'patient' => $appointment->patient->user->name,
            'doctor' => $appointment->doctor->user->name,
            'date' => $appointment->scheduled_at->translatedFormat('d/m/Y'),
            'time' => $appointment->scheduled_at->translatedFormat('H:i'),
            'reason' => $reason ? $reason : __('Não informado'),
        ];

        $this->notifications->dispatchFromTemplate(
            $appointment->patient->user,
            'appointment.cancelled.patient',
            $context,
            metadata: ['appointment_id' => $appointment->id, 'reason' => $reason]
        );

        $this->notifications->dispatchFromTemplate(
            $appointment->doctor->user,
            'appointment.cancelled.doctor',
            $context,
            metadata: ['appointment_id' => $appointment->id, 'reason' => $reason]
        );

        // Notifica administradores
        $admins = User::where('role', UserRole::ADMIN->value)->get();
        foreach ($admins as $admin) {
            $this->notifications->dispatchFromTemplate(
                $admin,
                'appointment.cancelled.admin',
                $context,
                metadata: ['appointment_id' => $appointment->id, 'reason' => $reason]
            );
        }

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
        $doctor = $appointment->doctor;
        $patient = $appointment->patient;
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);

        // Se a duração não foi fornecida, tenta pegar do schedule do médico para o novo dia
        $duration = $data['duration_minutes'] ?? null;
        if (! $duration) {
            $duration = $doctor->schedules()
                ->where('day_of_week', $newDate->dayOfWeekIso)
                ->where('is_blocked', false)
                ->first()
                ?->slot_duration_minutes ?? $appointment->duration_minutes ?? 30;
        }

        if ($role !== UserRole::ADMIN) {
            $this->validationService->ensureScheduleIsValid($doctor, $newDate, $duration);
        }

        $this->validationService->ensureRescheduleAllowed($appointment, $user);
        $this->validationService->ensureNoConflicts($doctor, $patient, $newDate, $duration, $appointment->id);

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

        // Notifica administradores
        $admins = User::where('role', UserRole::ADMIN->value)->get();
        foreach ($admins as $admin) {
            $this->notifications->dispatchFromTemplate(
                $admin,
                'appointment.rescheduled.admin',
                $rescheduleContext,
                metadata: ['appointment_id' => $appointment->id]
            );
        }

        $this->clearAppointmentCache($appointment->patient_id, $appointment->doctor_id);

        return $appointment->refresh();
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
        $this->cacheManager->clearAppointmentCache($patientId, $doctorId);
    }
}
