<?php

namespace App\Http\Requests\Schedules;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreScheduleExceptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === \App\Domain\Shared\Enums\UserRole::DOCTOR;
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date', 'after_or_equal:today'],
            'type' => ['required', 'string', Rule::in(['BLOCKED', 'CUSTOM_HOURS', 'UNAVAILABLE'])],
            'start_time' => [
                'nullable',
                'required_if:type,CUSTOM_HOURS',
                'date_format:H:i',
            ],
            'end_time' => [
                'nullable',
                'required_if:type,CUSTOM_HOURS',
                'date_format:H:i',
                'after:start_time',
            ],
            'reason' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.after_or_equal' => __('A data deve ser hoje ou uma data futura.'),
            'type.in' => __('Tipo de exceção inválido.'),
            'start_time.required_if' => __('Horário de início é obrigatório para horários customizados.'),
            'end_time.required_if' => __('Horário de fim é obrigatório para horários customizados.'),
            'end_time.after' => __('Horário de fim deve ser posterior ao horário de início.'),
        ];
    }
}
