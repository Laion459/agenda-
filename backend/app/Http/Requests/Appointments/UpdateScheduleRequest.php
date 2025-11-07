<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'DOCTOR';
    }

    public function rules(): array
    {
        return [
            'day_of_week' => ['sometimes', 'integer', 'between:1,7'],
            'start_time' => ['sometimes', 'date_format:H:i'],
            'end_time' => ['sometimes', 'date_format:H:i'],
            'slot_duration_minutes' => ['sometimes', 'integer', 'min:10', 'max:120'],
            'is_blocked' => ['sometimes', 'boolean'],
            'blocked_reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}


