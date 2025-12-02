<?php

namespace App\Http\Requests\Schedules;

use Illuminate\Foundation\Http\FormRequest;

class StoreAvailabilityPeriodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === \App\Domain\Shared\Enums\UserRole::DOCTOR;
    }

    public function rules(): array
    {
        return [
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'start_date.after_or_equal' => __('Data de início deve ser hoje ou uma data futura.'),
            'end_date.after_or_equal' => __('Data de fim deve ser posterior ou igual à data de início.'),
        ];
    }
}
