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
        ];
    }
}


