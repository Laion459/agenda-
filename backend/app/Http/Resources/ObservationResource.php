<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Observation */
class ObservationResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'appointment_id' => $this->appointment_id,
            'doctor_id' => $this->doctor_id,
            'patient_id' => $this->patient_id,
            'anamnesis' => $this->anamnesis,
            'diagnosis' => $this->diagnosis,
            'prescription' => $this->prescription,
            'notes' => $this->notes,
            'attachments' => $this->attachments,
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


