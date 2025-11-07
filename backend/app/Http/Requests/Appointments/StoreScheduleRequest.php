<?php

namespace App\Http\Requests\Appointments;

use Illuminate\Foundation\Http\FormRequest;

class StoreScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'DOCTOR';
    }

    public function rules(): array
    {
        return [
            'day_of_week' => ['required', 'integer', 'between:1,7'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
            'slot_duration_minutes' => ['required', 'integer', 'min:10', 'max:120'],
            'is_blocked' => ['boolean'],
            'blocked_reason' => ['nullable', 'string', 'max:255'],
        ];
    }
}


