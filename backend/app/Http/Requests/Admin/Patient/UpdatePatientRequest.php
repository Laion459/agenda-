<?php

namespace App\Http\Requests\Admin\Patient;

use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manage patients') ?? false;
    }

    public function rules(): array
    {
        /** @var Patient $patient */
        $patient = $this->route('patient');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($patient?->user_id),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
            'cpf' => [
                'sometimes',
                'required',
                'string',
                'max:14',
                Rule::unique('patients', 'cpf')->ignore($patient?->id),
            ],
            'birth_date' => ['sometimes', 'required', 'date'],
            'gender' => ['sometimes', 'nullable', Rule::in(['M', 'F', 'OTHER'])],
            'address' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'health_insurances' => ['nullable', 'array'],
            'health_insurances.*.id' => ['required', 'integer', Rule::exists('health_insurances', 'id')],
            'health_insurances.*.policy_number' => ['nullable', 'string', 'max:100'],
            'health_insurances.*.is_active' => ['nullable', 'boolean'],
        ];
    }
}


