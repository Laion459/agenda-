<?php

namespace App\Http\Resources;

use App\Domain\Shared\Enums\UserRole;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

/** @mixin \App\Models\Observation */
class ObservationResource extends JsonResource
{
    public function toArray($request): array
    {
        $user = Auth::user();
        $role = $user?->role instanceof UserRole ? $user->role : ($user?->role ? UserRole::from($user->role) : null);

        $isPatient = $role === UserRole::PATIENT;
        $isDoctorOrAdmin = $role === UserRole::DOCTOR || $role === UserRole::ADMIN;

        return [
            'id' => $this->id,
            'appointment_id' => $this->appointment_id,
            'doctor_id' => $this->doctor_id,
            'patient_id' => $this->patient_id,
            'anamnesis' => $isPatient ? null : $this->anamnesis,
            'diagnosis' => $isPatient ? null : $this->diagnosis,
            'prescription' => $isPatient ? null : $this->prescription,
            'notes' => $isPatient ? null : $this->notes,
            'attachments' => $isPatient ? null : $this->attachments,
            'created_at' => $this->created_at,
            'doctor' => new DoctorResource($this->whenLoaded('doctor')),
            'patient' => new PatientResource($this->whenLoaded('patient')),
            'appointment' => $this->whenLoaded('appointment', function () {
                return [
                    'id' => $this->appointment->id,
                    'scheduled_at' => $this->appointment->scheduled_at,
                    'status' => $this->appointment->status,
                    'doctor' => new DoctorResource($this->appointment->doctor),
                ];
            }),
        ];
    }
}
