<?php

namespace App\Application\Schedules;

use App\Models\Doctor;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class ScheduleService
{
    public function listForDoctor(User $user): LengthAwarePaginator
    {
        $doctor = $user->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'user' => __('Usuário não possui perfil de médico.'),
            ]);
        }

        return $doctor->schedules()
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->paginate(15);
    }

    public function create(User $user, array $data): Schedule
    {
        $doctor = $user->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'user' => __('Usuário não possui perfil de médico.'),
            ]);
        }

        $this->ensureNoOverlap($doctor, $data);

        return $doctor->schedules()->create($data);
    }

    public function update(Schedule $schedule, User $user, array $data): Schedule
    {
        $doctor = $user->doctor;

        if (! $doctor) {
            throw ValidationException::withMessages([
                'user' => __('Usuário não possui perfil de médico.'),
            ]);
        }

        if ($schedule->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'schedule' => __('Você não tem permissão para alterar este horário.'),
            ]);
        }

        $this->ensureNoOverlap($doctor, $data, $schedule->id);

        $schedule->update($data);

        return $schedule;
    }

    public function delete(Schedule $schedule, User $user): void
    {
        $doctor = $user->doctor;

        if (! $doctor || $schedule->doctor_id !== $doctor->id) {
            throw ValidationException::withMessages([
                'schedule' => __('Você não tem permissão para remover este horário.'),
            ]);
        }

        $schedule->delete();
    }

    protected function ensureNoOverlap(Doctor $doctor, array $data, ?int $ignoreId = null): void
    {
        $start = Carbon::createFromFormat('H:i', $data['start_time']);
        $end = Carbon::createFromFormat('H:i', $data['end_time']);

        if ($start->greaterThanOrEqualTo($end)) {
            throw ValidationException::withMessages([
                'end_time' => __('O horário de término deve ser maior que o início.'),
            ]);
        }

        $query = $doctor->schedules()
            ->where('day_of_week', $data['day_of_week'])
            ->when($ignoreId, fn (Builder $builder) => $builder->where('id', '!=', $ignoreId))
            ->where(function (Builder $builder) use ($start, $end) {
                $builder->whereBetween('start_time', [$start->format('H:i'), $end->format('H:i')])
                    ->orWhereBetween('end_time', [$start->format('H:i'), $end->format('H:i')])
                    ->orWhere(function (Builder $inner) use ($start, $end) {
                        $inner->where('start_time', '<=', $start->format('H:i'))
                            ->where('end_time', '>=', $end->format('H:i'));
                    });
            });

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'start_time' => __('Conflito com outro horário configurado.'),
            ]);
        }
    }
}


