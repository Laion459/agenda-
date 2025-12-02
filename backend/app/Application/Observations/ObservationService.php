<?php

namespace App\Application\Observations;

use App\Models\Appointment;
use App\Models\Observation;
use App\Models\ObservationHistory;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ObservationService
{
    public function create(User $doctorUser, Appointment $appointment, array $data): Observation
    {
        $doctor = $doctorUser->doctor;

        if (! $doctor || $appointment->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'appointment' => __('Somente o médico responsável pode registrar observações.'),
            ]);
        }

        return DB::transaction(function () use ($appointment, $doctor, $data, $doctorUser) {
            $observation = Observation::create([
                'appointment_id' => $appointment->id,
                'doctor_id' => $doctor->id,
                'patient_id' => $appointment->patient_id,
                'anamnesis' => $data['anamnesis'],
                'diagnosis' => $data['diagnosis'] ?? null,
                'prescription' => $data['prescription'] ?? null,
                'notes' => $data['notes'] ?? null,
                'attachments' => $data['attachments'] ?? null,
            ]);

            // Registrar histórico de criação
            ObservationHistory::create([
                'observation_id' => $observation->id,
                'changed_by' => $doctorUser->id,
                'action' => 'created',
                'old_values' => null,
                'new_values' => $observation->toArray(),
                'change_summary' => __('Observação clínica criada'),
                'changed_at' => now(),
            ]);

            return $observation;
        });
    }

    public function listForPatient(User $patientUser, int $perPage = 20): LengthAwarePaginator
    {
        $patient = $patientUser->patient;

        if (! $patient) {
            throw ValidationException::withMessages([
                'patient' => __('Somente pacientes podem acessar este histórico.'),
            ]);
        }

        return Observation::query()
            ->where('patient_id', $patient->id)
            ->with([
                'doctor.user',
                'patient.user',
                'appointment.doctor.user',
            ])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function listForDoctor(User $doctorUser, int $patientId, int $perPage = 20): LengthAwarePaginator
    {
        $doctor = $doctorUser->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'doctor' => __('Somente médicos podem acessar este histórico.'),
            ]);
        }

        $hasRelationship = Appointment::query()
            ->where('doctor_id', $doctor->id)
            ->where('patient_id', $patientId)
            ->exists();

        if (! $hasRelationship) {
            throw ValidationException::withMessages([
                'patient' => __('Você não possui atendimentos registrados para este paciente.'),
            ]);
        }

        return Observation::query()
            ->where('patient_id', $patientId)
            ->with([
                'doctor.user',
                'patient.user',
                'appointment.doctor.user',
            ])
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function update(User $doctorUser, Observation $observation, array $data): Observation
    {
        $doctor = $doctorUser->doctor;

        if (! $doctor || $observation->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'observation' => __('Somente o médico responsável pode atualizar observações.'),
            ]);
        }

        return DB::transaction(function () use ($observation, $doctorUser, $data) {
            $oldValues = $observation->toArray();

            $observation->update([
                'anamnesis' => $data['anamnesis'] ?? $observation->anamnesis,
                'diagnosis' => $data['diagnosis'] ?? $observation->diagnosis,
                'prescription' => $data['prescription'] ?? $observation->prescription,
                'notes' => $data['notes'] ?? $observation->notes,
                'attachments' => $data['attachments'] ?? $observation->attachments,
            ]);

            $newValues = $observation->fresh()->toArray();

            // Calcular mudanças
            $changes = [];
            foreach (['anamnesis', 'diagnosis', 'prescription', 'notes'] as $field) {
                if (($oldValues[$field] ?? null) !== ($newValues[$field] ?? null)) {
                    $changes[] = ucfirst($field);
                }
            }

            // Registrar histórico de atualização
            ObservationHistory::create([
                'observation_id' => $observation->id,
                'changed_by' => $doctorUser->id,
                'action' => 'updated',
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'change_summary' => !empty($changes) 
                    ? __('Campos atualizados: :fields', ['fields' => implode(', ', $changes)])
                    : __('Observação atualizada'),
                'changed_at' => now(),
            ]);

            return $observation->fresh();
        });
    }

    public function getHistory(Observation $observation)
    {
        return ObservationHistory::query()
            ->where('observation_id', $observation->id)
            ->with('changedBy:id,name,email')
            ->orderByDesc('changed_at')
            ->get();
    }
}
