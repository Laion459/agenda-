<?php

namespace App\Http\Requests\Observations;

use Illuminate\Foundation\Http\FormRequest;

class StoreObservationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'DOCTOR';
    }

    public function rules(): array
    {
        return [
            'anamnesis' => ['required', 'string'],
            'diagnosis' => ['nullable', 'string'],
            'prescription' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'attachments' => ['nullable', 'array'],
        ];
    }
}


