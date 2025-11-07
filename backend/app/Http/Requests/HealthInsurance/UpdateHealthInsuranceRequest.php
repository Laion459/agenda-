<?php

namespace App\Http\Requests\HealthInsurance;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHealthInsuranceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage health insurances') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255', 'unique:health_insurances,name,' . $this->route('health_insurance')->id],
            'description' => ['nullable', 'string'],
            'coverage_percentage' => ['nullable', 'numeric', 'between:0,100'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}


