<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Patient */
class PatientResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->whenLoaded('user', fn () => $this->user->name),
            'cpf' => $this->cpf,
            'birth_date' => $this->birth_date,
            'gender' => $this->gender,
            'address' => $this->address,
            'profile_completed_at' => $this->profile_completed_at,
            'user' => new UserResource($this->whenLoaded('user')),
            'health_insurances' => HealthInsuranceResource::collection($this->whenLoaded('healthInsurances')),
        ];
    }
}


