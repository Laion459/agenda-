<?php

namespace App\Application\Schedules;

use App\Models\AvailabilityPeriod;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AvailabilityPeriodService
{
    public function listForDoctor(User $user): \Illuminate\Database\Eloquent\Collection
    {
        $doctor = $user->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'doctor' => __('Usuário não possui perfil de médico.'),
            ]);
        }

        return AvailabilityPeriod::where('doctor_id', $doctor->id)
            ->orderBy('start_date', 'desc')
            ->get();
    }

    public function create(User $user, array $data): AvailabilityPeriod
    {
        $doctor = $user->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'doctor' => __('Usuário não possui perfil de médico.'),
            ]);
        }

        // Valida que start_date <= end_date
        if ($data['start_date'] > $data['end_date']) {
            throw ValidationException::withMessages([
                'start_date' => __('Data de início deve ser anterior ou igual à data de fim.'),
                'end_date' => __('Data de fim deve ser posterior ou igual à data de início.'),
            ]);
        }

        return DB::transaction(function () use ($doctor, $data) {
            return AvailabilityPeriod::create([
                'doctor_id' => $doctor->id,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'is_active' => $data['is_active'] ?? true,
                'description' => $data['description'] ?? null,
            ]);
        });
    }

    public function update(AvailabilityPeriod $period, User $user, array $data): AvailabilityPeriod
    {
        $doctor = $user->doctor;

        if (! $doctor || $period->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'period' => __('Você não tem permissão para atualizar este período.'),
            ]);
        }

        // Valida que start_date <= end_date
        $startDate = $data['start_date'] ?? $period->start_date;
        $endDate = $data['end_date'] ?? $period->end_date;

        if ($startDate > $endDate) {
            throw ValidationException::withMessages([
                'start_date' => __('Data de início deve ser anterior ou igual à data de fim.'),
                'end_date' => __('Data de fim deve ser posterior ou igual à data de início.'),
            ]);
        }

        return DB::transaction(function () use ($period, $data) {
            $period->update($data);
            return $period->fresh();
        });
    }

    public function delete(AvailabilityPeriod $period, User $user): void
    {
        $doctor = $user->doctor;

        if (! $doctor || $period->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'period' => __('Você não tem permissão para remover este período.'),
            ]);
        }

        $period->delete();
    }
}

