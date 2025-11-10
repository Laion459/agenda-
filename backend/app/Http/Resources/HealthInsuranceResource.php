<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\HealthInsurance */
class HealthInsuranceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'coverage_percentage' => $this->coverage_percentage,
            'is_active' => $this->is_active,
            'pivot' => $this->whenPivotLoaded(
                'patient_health_insurance',
                fn () => [
                    'policy_number' => $this->pivot->policy_number,
                    'is_active' => $this->pivot->is_active,
                ]
            ),
            'pivot_doctor' => $this->whenPivotLoaded(
                'doctor_health_insurance',
                fn () => [
                    'is_active' => $this->pivot->is_active,
                ]
            ),
        ];
    }
}


