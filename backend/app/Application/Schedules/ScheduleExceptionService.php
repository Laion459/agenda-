<?php

namespace App\Application\Schedules;

use App\Models\Doctor;
use App\Models\ScheduleException;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ScheduleExceptionService
{
    public function listForDoctor(User $user): \Illuminate\Database\Eloquent\Collection
    {
        $doctor = $user->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'doctor' => __('Usuário não possui perfil de médico.'),
            ]);
        }

        return ScheduleException::where('doctor_id', $doctor->id)
            ->orderBy('date', 'desc')
            ->get();
    }

    public function create(User $user, array $data): ScheduleException
    {
        $doctor = $user->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'doctor' => __('Usuário não possui perfil de médico.'),
            ]);
        }

        // Valida se é CUSTOM_HOURS, deve ter start_time e end_time
        if ($data['type'] === 'CUSTOM_HOURS') {
            if (empty($data['start_time']) || empty($data['end_time'])) {
                throw ValidationException::withMessages([
                    'start_time' => __('Horários customizados requerem start_time e end_time.'),
                    'end_time' => __('Horários customizados requerem start_time e end_time.'),
                ]);
            }
        }

        return DB::transaction(function () use ($doctor, $data) {
            return ScheduleException::updateOrCreate(
                [
                    'doctor_id' => $doctor->id,
                    'date' => $data['date'],
                ],
                [
                    'type' => $data['type'],
                    'start_time' => $data['start_time'] ?? null,
                    'end_time' => $data['end_time'] ?? null,
                    'reason' => $data['reason'] ?? null,
                ]
            );
        });
    }

    public function update(ScheduleException $exception, User $user, array $data): ScheduleException
    {
        $doctor = $user->doctor;

        if (! $doctor || $exception->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'exception' => __('Você não tem permissão para atualizar esta exceção.'),
            ]);
        }

        // Valida se é CUSTOM_HOURS, deve ter start_time e end_time
        if (($data['type'] ?? $exception->type) === 'CUSTOM_HOURS') {
            $startTime = $data['start_time'] ?? $exception->start_time;
            $endTime = $data['end_time'] ?? $exception->end_time;

            if (empty($startTime) || empty($endTime)) {
                throw ValidationException::withMessages([
                    'start_time' => __('Horários customizados requerem start_time e end_time.'),
                    'end_time' => __('Horários customizados requerem start_time e end_time.'),
                ]);
            }
        }

        return DB::transaction(function () use ($exception, $data) {
            $exception->update($data);
            return $exception->fresh();
        });
    }

    public function delete(ScheduleException $exception, User $user): void
    {
        $doctor = $user->doctor;

        if (! $doctor || $exception->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'exception' => __('Você não tem permissão para remover esta exceção.'),
            ]);
        }

        $exception->delete();
    }
}

