<?php

namespace App\Application\Reports;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\HealthInsurance;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AdminReportService
{
    public function appointmentSummary(array $filters = []): array
    {
        $start = $this->parseDate($filters['start_date'] ?? null, now()->subMonth());
        $end = $this->parseDate($filters['end_date'] ?? null, now());

        $cacheKey = 'report:appointments:' . md5(json_encode($filters) . $start->toDateString() . $end->toDateString());

        return Cache::remember($cacheKey, now()->addMinutes(15), function () use ($start, $end, $filters) {
            $query = Appointment::query()
                ->whereBetween('scheduled_at', [$start, $end]);

        if (! empty($filters['doctor_id'])) {
            $query->where('doctor_id', $filters['doctor_id']);
        }

        if (! empty($filters['patient_id'])) {
            $query->where('patient_id', $filters['patient_id']);
        }

        $statusSummary = $query->clone()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->status->value => $row->total])
            ->all();

        $total = array_sum($statusSummary);

        $trend = $query->clone()
            ->select(DB::raw("DATE(scheduled_at) as date"), DB::raw('COUNT(*) as total'))
            ->groupBy(DB::raw("DATE(scheduled_at)"))
            ->orderBy(DB::raw("DATE(scheduled_at)"))
            ->get();

            return [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'total' => $total,
                'by_status' => $this->formatStatusSummary($statusSummary, $total),
                'trend' => $trend->map(fn ($row) => [
                    'date' => $row->date,
                    'total' => (int) $row->total,
                ]),
            ];
        });
    }

    public function doctorOccupancy(array $filters = []): Collection
    {
        $start = $this->parseDate($filters['start_date'] ?? null, now()->subMonth());
        $end = $this->parseDate($filters['end_date'] ?? null, now());

        $cacheKey = 'report:occupancy:' . md5(json_encode($filters) . $start->toDateString() . $end->toDateString());

        return Cache::remember($cacheKey, now()->addMinutes(15), function () use ($start, $end, $filters) {
            return Doctor::query()
            ->withCount([
                'appointments as confirmed_appointments_count' => fn ($query) => $query
                    ->whereBetween('scheduled_at', [$start, $end])
                    ->where('status', AppointmentStatus::CONFIRMED->value),
                'appointments as completed_appointments_count' => fn ($query) => $query
                    ->whereBetween('scheduled_at', [$start, $end])
                    ->where('status', AppointmentStatus::COMPLETED->value),
                'appointments as total_appointments_count' => fn ($query) => $query
                    ->whereBetween('scheduled_at', [$start, $end]),
            ])
            ->with('user')
            ->when(! empty($filters['doctor_id']), fn ($builder) => $builder->where('id', $filters['doctor_id']))
            ->get()
            ->map(function (Doctor $doctor) {
                $total = $doctor->total_appointments_count;
                $confirmed = $doctor->confirmed_appointments_count;
                $completed = $doctor->completed_appointments_count;

                return [
                    'doctor_id' => $doctor->id,
                    'doctor_name' => $doctor->user->name,
                    'total_appointments' => $total,
                    'confirmed' => $confirmed,
                    'completed' => $completed,
                    'occupancy_rate' => $total > 0 ? round(($confirmed / $total) * 100, 1) : 0,
                ];
            });
        });
    }

    public function insuranceUsage(array $filters = []): Collection
    {
        $start = $this->parseDate($filters['start_date'] ?? null, now()->subMonth());
        $end = $this->parseDate($filters['end_date'] ?? null, now());

        $cacheKey = 'report:insurance:' . md5(json_encode($filters) . $start->toDateString() . $end->toDateString());

        return Cache::remember($cacheKey, now()->addMinutes(15), function () use ($start, $end) {
            $usage = DB::table('appointments')
            ->join('patients', 'appointments.patient_id', '=', 'patients.id')
            ->join('patient_health_insurance', 'patients.id', '=', 'patient_health_insurance.patient_id')
            ->select('patient_health_insurance.health_insurance_id', DB::raw('COUNT(*) as total'))
            ->whereBetween('appointments.scheduled_at', [$start, $end])
            ->groupBy('patient_health_insurance.health_insurance_id')
            ->pluck('total', 'patient_health_insurance.health_insurance_id');

        return HealthInsurance::whereIn('id', $usage->keys())
            ->get()
            ->map(function (HealthInsurance $insurance) use ($usage) {
                return [
                    'health_insurance_id' => $insurance->id,
                    'name' => $insurance->name,
                    'total_appointments' => (int) $usage->get($insurance->id, 0),
                ];
            });
        });
    }

    /**
     * Relatório de faturamento
     */
    public function billing(array $filters = []): array
    {
        $start = $this->parseDate($filters['start_date'] ?? null, now()->subMonth());
        $end = $this->parseDate($filters['end_date'] ?? null, now());

        $cacheKey = 'report:billing:' . md5(json_encode($filters) . $start->toDateString() . $end->toDateString());

        return Cache::remember($cacheKey, now()->addMinutes(15), function () use ($start, $end, $filters) {
            $query = Appointment::query()
                ->whereBetween('scheduled_at', [$start, $end])
                ->whereNotNull('price');

            if (! empty($filters['doctor_id'])) {
                $query->where('doctor_id', $filters['doctor_id']);
            }

            if (! empty($filters['patient_id'])) {
                $query->where('patient_id', $filters['patient_id']);
            }

            $totalRevenue = $query->sum('price');
            $totalAppointments = $query->count();
            $averageTicket = $totalAppointments > 0 ? round($totalRevenue / $totalAppointments, 2) : 0;

            $byStatus = $query->clone()
                ->select('status', DB::raw('SUM(price) as revenue'), DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get()
                ->mapWithKeys(fn ($row) => [
                    $row->status->value => [
                        'revenue' => (float) $row->revenue,
                        'count' => (int) $row->count,
                    ],
                ])
                ->all();

            $byDoctor = $query->clone()
                ->join('doctors', 'appointments.doctor_id', '=', 'doctors.id')
                ->join('users', 'doctors.user_id', '=', 'users.id')
                ->select('doctors.id', 'users.name', DB::raw('SUM(appointments.price) as revenue'), DB::raw('COUNT(*) as count'))
                ->groupBy('doctors.id', 'users.name')
                ->get()
                ->map(fn ($row) => [
                    'doctor_id' => $row->id,
                    'doctor_name' => $row->name,
                    'revenue' => (float) $row->revenue,
                    'appointments_count' => (int) $row->count,
                ]);

        $byMonth = $query->clone()
            ->select('scheduled_at', 'price')
            ->get()
            ->groupBy(fn ($row) => Carbon::parse($row->scheduled_at)->format('Y-m'))
            ->map(fn ($rows, $month) => [
                'month' => $month,
                'revenue' => (float) $rows->sum('price'),
                'count' => (int) $rows->count(),
            ])
            ->values();

            return [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'total_revenue' => (float) $totalRevenue,
                'total_appointments' => $totalAppointments,
                'average_ticket' => $averageTicket,
                'by_status' => $byStatus,
                'by_doctor' => $byDoctor,
                'by_month' => $byMonth,
            ];
        });
    }

    private function parseDate(?string $value, Carbon $default): Carbon
    {
        return $value ? Carbon::parse($value)->startOfDay() : $default->copy()->startOfDay();
    }

    /**
     * @param  array<string, int>  $summary
     * @return array<string, array{total:int, percentage:float}>
     */
    private function formatStatusSummary(array $summary, int $total): array
    {
        $result = [];
        foreach (AppointmentStatus::cases() as $status) {
            $count = $summary[$status->value] ?? 0;
            $result[$status->value] = [
                'total' => $count,
                'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0.0,
            ];
        }

        return $result;
    }
}


