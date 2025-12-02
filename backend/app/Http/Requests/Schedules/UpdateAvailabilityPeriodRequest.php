<?php

namespace App\Http\Requests\Schedules;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAvailabilityPeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === \App\Domain\Shared\Enums\UserRole::DOCTOR;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after_or_equal:start_date'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'end_date.after_or_equal' => __('Data de fim deve ser posterior ou igual à data de início.'),
        ];
    }
}
