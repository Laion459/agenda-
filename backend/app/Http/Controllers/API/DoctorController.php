<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\ScheduleException;
use App\Models\AvailabilityPeriod;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Médicos')]
class DoctorController extends Controller
{
    public function index(): JsonResponse
    {
        // Para agendamento, mostra médicos ativos (tanto doctor.is_active quanto user.is_active)
        $query = Doctor::with(['user', 'healthInsurances'])
            ->where('doctors.is_active', true)
            ->whereHas('user', function ($q) {
                $q->where('is_active', true);
            });

        if (request()->has('crm')) {
            $query->where('doctors.crm', request('crm'));
        }

        // Para agendamento, retorna todos os médicos ativos (sem paginação limitada)
        $perPage = min((int) request('per_page', 100), 100); // máximo 100
        
        // Busca todos e ordena pelo nome do usuário
        $allDoctors = $query->get();
        $sortedDoctors = $allDoctors->sortBy(function ($doctor) {
            return strtolower($doctor->user?->name ?? '');
        })->values();
        
        // Paginação manual
        $currentPage = (int) request('page', 1);
        $offset = ($currentPage - 1) * $perPage;
        $paginatedDoctors = $sortedDoctors->slice($offset, $perPage);
        
        // Cria uma resposta paginada compatível
        return response()->json([
            'data' => DoctorResource::collection($paginatedDoctors),
            'meta' => [
                'current_page' => $currentPage,
                'per_page' => $perPage,
                'total' => $sortedDoctors->count(),
                'last_page' => (int) ceil($sortedDoctors->count() / $perPage),
            ],
        ]);

        return DoctorResource::collection($doctors)->response();
    }

    public function show(Doctor $doctor): DoctorResource
    {
        $doctor->loadMissing(['user', 'healthInsurances', 'schedules']);

        return new DoctorResource($doctor);
    }

    #[OA\Get(
        path: '/doctors/{id}/available-slots',
        summary: 'Buscar horários disponíveis do médico',
        description: 'Retorna os horários disponíveis do médico para uma data específica, considerando a agenda configurada e consultas já agendadas',
        tags: ['Médicos'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                description: 'ID do médico',
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'date',
                in: 'query',
                required: true,
                description: 'Data para buscar horários (formato: Y-m-d)',
                schema: new OA\Schema(type: 'string', format: 'date', example: '2025-12-15')
            ),
            new OA\Parameter(
                name: 'duration',
                in: 'query',
                required: false,
                description: 'Duração da consulta em minutos (padrão: 30)',
                schema: new OA\Schema(type: 'integer', example: 30)
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de horários disponíveis',
                content: new OA\JsonContent(
                    type: 'object',
                    properties: [
                        new OA\Property(
                            property: 'available_slots',
                            type: 'array',
                            items: new OA\Items(type: 'string', example: '2025-12-15 09:00:00')
                        ),
                        new OA\Property(property: 'date', type: 'string', example: '2025-12-15'),
                        new OA\Property(property: 'doctor_id', type: 'integer', example: 1),
                    ]
                )
            ),
            new OA\Response(response: 404, description: 'Médico não encontrado'),
            new OA\Response(response: 422, description: 'Data inválida ou no passado'),
        ]
    )]
    public function availableSlots(Request $request, Doctor $doctor): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date', 'after_or_equal:today'],
            'duration' => ['nullable', 'integer', 'min:15', 'max:240'],
        ]);

        $date = Carbon::parse($validated['date']);
        $dateStr = $date->format('Y-m-d');

        // Verifica se há exceção para esta data
        $exception = $doctor->scheduleExceptions()
            ->where('date', $dateStr)
            ->first();

        $schedule = null;
        $customStartTime = null;
        $customEndTime = null;
        $duration = $validated['duration'] ?? null; // Será definido pelo schedule se não fornecido

        if ($exception) {
            // Se está bloqueada ou indisponível, retorna vazio
            if ($exception->type === 'BLOCKED' || $exception->type === 'UNAVAILABLE') {
                return response()->json([
                    'available_slots' => [],
                    'date' => $dateStr,
                    'doctor_id' => $doctor->id,
                    'message' => $exception->reason ?? 'Data bloqueada ou indisponível.',
                ]);
            }
            
            // Se tem horários customizados, usa eles
            if ($exception->type === 'CUSTOM_HOURS' && $exception->start_time && $exception->end_time) {
                $customStartTime = $exception->start_time;
                $customEndTime = $exception->end_time;
                // Para exceções customizadas, usa duração fornecida ou padrão de 30min
                $duration = $duration ?? 30;
            } else {
                return response()->json([
                    'available_slots' => [],
                    'date' => $dateStr,
                    'doctor_id' => $doctor->id,
                    'message' => 'Exceção configurada incorretamente.',
                ]);
            }
        } else {
            // Busca os schedules do médico para o dia da semana
            $dayOfWeek = $date->dayOfWeekIso; // 1 = Segunda, 7 = Domingo
            
            $schedules = $doctor->schedules()
                ->where('day_of_week', $dayOfWeek)
                ->where('is_blocked', false)
                ->get();

            if ($schedules->isEmpty()) {
                return response()->json([
                    'available_slots' => [],
                    'date' => $dateStr,
                    'doctor_id' => $doctor->id,
                    'message' => 'O médico não possui agenda disponível neste dia.',
                ]);
            }
            
            // Se não foi fornecida duração, usa a duração do primeiro schedule
            // (todos os schedules do mesmo dia devem ter a mesma duração)
            if (! $duration) {
                $duration = $schedules->first()->slot_duration_minutes ?? 30;
            }
        }

        // Busca consultas já agendadas para essa data
        $startOfDay = $date->copy()->startOfDay();
        $endOfDay = $date->copy()->endOfDay();

        $appointments = Appointment::where('doctor_id', $doctor->id)
            ->whereBetween('scheduled_at', [$startOfDay, $endOfDay])
            ->whereIn('status', ['PENDING', 'CONFIRMED'])
            ->get();

        // Calcula os slots disponíveis
        if ($customStartTime && $customEndTime) {
            // Cria um schedule temporário para usar com horários customizados
            $tempSchedule = (object) [
                'start_time' => $customStartTime,
                'end_time' => $customEndTime,
                'slot_duration_minutes' => $duration,
            ];
            $availableSlots = $this->calculateAvailableSlots(
                $tempSchedule,
                $date,
                $duration,
                $appointments
            );
        } else {
            // Se há múltiplos schedules no mesmo dia, calcula slots para todos e combina
            $allSlots = [];
            foreach ($schedules as $schedule) {
                $scheduleSlots = $this->calculateAvailableSlots(
                    $schedule,
                    $date,
                    $duration,
                    $appointments
                );
                $allSlots = array_merge($allSlots, $scheduleSlots);
            }
            // Remove duplicatas e ordena
            $availableSlots = array_unique($allSlots);
            sort($availableSlots);
        }

        // Prepara informações do schedule para retorno
        $scheduleInfo = null;
        if ($customStartTime && $customEndTime) {
            $scheduleInfo = [
                'start_time' => $customStartTime,
                'end_time' => $customEndTime,
            ];
        } elseif ($schedules->isNotEmpty()) {
            // Retorna informações do primeiro schedule (ou todos se necessário)
            $firstSchedule = $schedules->first();
            $scheduleInfo = [
                'start_time' => $firstSchedule->start_time,
                'end_time' => $firstSchedule->end_time,
            ];
        }
        
        return response()->json([
            'available_slots' => $availableSlots,
            'date' => $date->format('Y-m-d'),
            'doctor_id' => $doctor->id,
            'schedule' => $scheduleInfo,
        ]);
    }

    /**
     * Calcula os slots disponíveis baseado no schedule, data, duração e consultas já agendadas
     */
    private function calculateAvailableSlots(
        $schedule,
        Carbon $date,
        int $duration,
        $appointments
    ): array {
        $slots = [];
        
        // Parse dos horários de início e fim do schedule
        $scheduleStart = Carbon::parse($schedule->start_time);
        $scheduleEnd = Carbon::parse($schedule->end_time);
        
        // Define a data e hora do início do schedule para o dia solicitado
        $currentSlot = $date->copy()
            ->setTime($scheduleStart->hour, $scheduleStart->minute, 0);
        
        $endTime = $date->copy()
            ->setTime($scheduleEnd->hour, $scheduleEnd->minute, 0);
        
        // Considera antecedência mínima de 24 horas
        $minDateTime = now()->addDay();
        
        while ($currentSlot->copy()->addMinutes($duration)->lte($endTime)) {
            // Verifica se o horário está no futuro (mínimo 24h)
            if ($currentSlot->gte($minDateTime)) {
                $slotEnd = $currentSlot->copy()->addMinutes($duration);
                
                // Verifica se há conflito com consultas já agendadas
                $hasConflict = false;
                foreach ($appointments as $appointment) {
                    $appointmentStart = Carbon::parse($appointment->scheduled_at);
                    $appointmentEnd = $appointmentStart->copy()->addMinutes(
                        $appointment->duration_minutes ?? 30
                    );
                    
                    // Verifica sobreposição
                    if (
                        ($currentSlot->lt($appointmentEnd) && $slotEnd->gt($appointmentStart))
                    ) {
                        $hasConflict = true;
                        break;
                    }
                }
                
                if (! $hasConflict) {
                    $slots[] = $currentSlot->format('Y-m-d H:i:s');
                }
            }
            
            // Avança em incrementos de 30 minutos
            $currentSlot->addMinutes(30);
        }
        
        return $slots;
    }

    #[OA\Get(
        path: '/doctors/{id}/available-dates',
        summary: 'Buscar dias disponíveis do médico no mês',
        description: 'Retorna os dias do mês em que o médico possui agenda disponível',
        tags: ['Médicos'],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                required: true,
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'month',
                in: 'query',
                required: false,
                description: 'Mês no formato Y-m (padrão: mês atual)',
                schema: new OA\Schema(type: 'string', example: '2025-12')
            ),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de dias disponíveis',
                content: new OA\JsonContent(
                    type: 'object',
                    properties: [
                        new OA\Property(
                            property: 'available_dates',
                            type: 'array',
                            items: new OA\Items(type: 'string', example: '2025-12-15')
                        ),
                        new OA\Property(property: 'month', type: 'string', example: '2025-12'),
                    ]
                )
            ),
        ]
    )]
    public function availableDates(Request $request, Doctor $doctor): JsonResponse
    {
        $month = $request->input('month', now()->format('Y-m'));
        $startOfMonth = Carbon::parse($month . '-01')->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();
        
        // Busca todos os schedules ativos do médico
        $schedules = $doctor->schedules()
            ->where('is_blocked', false)
            ->get()
            ->groupBy('day_of_week');
        
        if ($schedules->isEmpty()) {
            return response()->json([
                'available_dates' => [],
                'month' => $month,
                'message' => 'Este médico não possui agenda configurada. Configure os horários de atendimento primeiro.',
                'has_schedules' => false,
            ]);
        }
        
        // Busca exceções e períodos de disponibilidade
        $exceptions = $doctor->scheduleExceptions()
            ->whereBetween('date', [$startOfMonth->format('Y-m-d'), $endOfMonth->format('Y-m-d')])
            ->get()
            ->keyBy(function ($exception) {
                return $exception->date->format('Y-m-d');
            });
        
        $activePeriods = $doctor->availabilityPeriods()
            ->where('is_active', true)
            ->get();
        
        // Log para debug (apenas em desenvolvimento)
        $debugInfo = [
            'doctor_id' => $doctor->id,
            'month' => $month,
            'schedules_count' => $schedules->count(),
            'exceptions_count' => $exceptions->count(),
            'active_periods_count' => $activePeriods->count(),
            'start_of_month' => $startOfMonth->format('Y-m-d'),
            'end_of_month' => $endOfMonth->format('Y-m-d'),
            'min_date' => now()->addDay()->startOfDay()->format('Y-m-d'),
        ];
        
        if (app()->environment(['local', 'testing'])) {
            \Log::debug('Available dates calculation', $debugInfo);
        }
        
        $availableDates = [];
        $minDate = now()->addDay()->startOfDay();
        $currentDate = $startOfMonth->copy();
        $rejectedDates = [];
        
        while ($currentDate->lte($endOfMonth)) {
            $dateStr = $currentDate->format('Y-m-d');
            $rejectionReason = null;
            
            // Verifica se já passou o mínimo de 24h
            if ($currentDate->lt($minDate)) {
                $rejectionReason = 'before_min_date';
                $rejectedDates[$dateStr] = $rejectionReason;
                $currentDate->addDay();
                continue;
            }
            
            // 1. Verifica se está dentro de algum período de disponibilidade ativo
            // IMPORTANTE: Se não há períodos cadastrados, todas as datas são permitidas (assumindo schedules)
            // Se há períodos cadastrados, apenas datas dentro dos períodos são permitidas
            $isWithinPeriod = true; // Por padrão, permite se não houver períodos
            
            if ($activePeriods->isNotEmpty()) {
                // Se há períodos cadastrados, verifica se a data está dentro de algum
                $isWithinPeriod = $activePeriods->contains(function ($period) use ($currentDate) {
                    // start_date e end_date já são Carbon devido ao cast no model
                    $periodStart = $period->start_date->copy()->startOfDay();
                    $periodEnd = $period->end_date->copy()->endOfDay();
                    $checkDate = $currentDate->copy()->startOfDay();
                    
                    return $checkDate->greaterThanOrEqualTo($periodStart) 
                        && $checkDate->lessThanOrEqualTo($periodEnd);
                });
            }
            
            if (! $isWithinPeriod) {
                $rejectionReason = 'outside_period';
                $rejectedDates[$dateStr] = $rejectionReason;
                $currentDate->addDay();
                continue;
            }
            
            // 2. Verifica se há exceção para esta data
            $exception = $exceptions->get($dateStr);
            $daySchedule = null;
            $scheduleStart = null;
            $scheduleEnd = null;
            
            if ($exception) {
                // Se está bloqueada ou indisponível, pula
                if ($exception->type === 'BLOCKED' || $exception->type === 'UNAVAILABLE') {
                    $rejectionReason = 'blocked_exception';
                    $rejectedDates[$dateStr] = $rejectionReason;
                    $currentDate->addDay();
                    continue;
                }
                
                // Se tem horários customizados, usa eles
                if ($exception->type === 'CUSTOM_HOURS' && $exception->start_time && $exception->end_time) {
                    $scheduleStart = Carbon::parse($exception->start_time);
                    $scheduleEnd = Carbon::parse($exception->end_time);
                    // Para horários customizados, usa duração padrão de 30 minutos
                    $slotDuration = 30;
                } else {
                    // Exceção inválida, pula
                    $rejectionReason = 'invalid_exception';
                    $rejectedDates[$dateStr] = $rejectionReason;
                    $currentDate->addDay();
                    continue;
                }
            } else {
                // 3. Usa horários do template (schedule) para este dia da semana
                $dayOfWeek = $currentDate->dayOfWeekIso;
                
                if (! $schedules->has($dayOfWeek)) {
                    $rejectionReason = 'no_schedule_for_day';
                    $rejectedDates[$dateStr] = $rejectionReason;
                    $currentDate->addDay();
                    continue;
                }
                
                $daySchedules = $schedules->get($dayOfWeek);
                if ($daySchedules->isEmpty()) {
                    $rejectionReason = 'no_schedule_found';
                    $rejectedDates[$dateStr] = $rejectionReason;
                    $currentDate->addDay();
                    continue;
                }
                
                // Calcula slots totais de todos os schedules do dia
                $totalPossibleSlots = 0;
                $slotDuration = 30; // Padrão
                
                foreach ($daySchedules as $daySchedule) {
                    // Parse dos horários (são do tipo time, então precisamos criar datas do mesmo dia)
                    $scheduleStart = Carbon::today()->setTimeFromTimeString($daySchedule->start_time);
                    $scheduleEnd = Carbon::today()->setTimeFromTimeString($daySchedule->end_time);
                    
                    // Se end_time for menor que start_time, significa que passa da meia-noite
                    // (não é o caso normal, mas vamos tratar)
                    if ($scheduleEnd->lt($scheduleStart)) {
                        $scheduleEnd->addDay();
                    }
                    
                    $scheduleSlotDuration = $daySchedule->slot_duration_minutes ?? 30;
                    $slotDuration = $scheduleSlotDuration; // Usa a duração do último schedule (ou padroniza)
                    
                    // diffInMinutes pode retornar negativo dependendo da ordem, então usamos abs()
                    // ou garantimos que end > start
                    $scheduleMinutes = abs($scheduleStart->diffInMinutes($scheduleEnd));
                    $scheduleSlots = floor($scheduleMinutes / $scheduleSlotDuration);
                    $totalPossibleSlots += $scheduleSlots;
                }
                
                // 4. Verifica se há slots disponíveis
                $appointmentsCount = Appointment::where('doctor_id', $doctor->id)
                    ->whereDate('scheduled_at', $dateStr)
                    ->whereIn('status', ['PENDING', 'CONFIRMED'])
                    ->count();
                
                if ($appointmentsCount >= $totalPossibleSlots) {
                    $rejectionReason = 'no_available_slots';
                    $rejectedDates[$dateStr] = $rejectionReason;
                } else {
                    $availableDates[] = $dateStr;
                }
                
                $currentDate->addDay();
                continue;
            }
            
            // Se chegou aqui, é exceção com horários customizados
            // 4. Verifica se há slots disponíveis para exceção customizada
            $appointmentsCount = Appointment::where('doctor_id', $doctor->id)
                ->whereDate('scheduled_at', $dateStr)
                ->whereIn('status', ['PENDING', 'CONFIRMED'])
                ->count();
            
            // Garante que a diferença seja positiva (end sempre maior que start)
            $totalMinutes = abs($scheduleEnd->diffInMinutes($scheduleStart));
            $possibleSlots = floor($totalMinutes / $slotDuration);
            
            if ($appointmentsCount >= $possibleSlots) {
                $rejectionReason = 'no_available_slots';
                $rejectedDates[$dateStr] = $rejectionReason;
            } else {
                $availableDates[] = $dateStr;
            }
            
            $currentDate->addDay();
        }
        
        // Log detalhado em desenvolvimento
        if (app()->environment(['local', 'testing'])) {
            $debugInfo['available_dates_count'] = count($availableDates);
            $debugInfo['rejected_dates_count'] = count($rejectedDates);
            $debugInfo['rejection_reasons'] = array_count_values($rejectedDates);
            \Log::debug('Available dates result', $debugInfo);
        }
        
        return response()->json([
            'available_dates' => $availableDates,
            'month' => $month,
            'has_schedules' => true,
        ]);
    }
}
