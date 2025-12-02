<?php

namespace App\Http\Controllers\API;

use App\Application\Schedules\ScheduleExceptionService;
use App\Http\Requests\Schedules\StoreScheduleExceptionRequest;
use App\Http\Requests\Schedules\UpdateScheduleExceptionRequest;
use App\Http\Resources\ScheduleExceptionResource;
use App\Models\ScheduleException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Exceções de Agenda')]
class ScheduleExceptionController extends Controller
{
    public function __construct(private ScheduleExceptionService $service)
    {
        $this->middleware('auth:sanctum');
    }

    #[OA\Get(
        path: '/doctor/schedule-exceptions',
        summary: 'Listar exceções de agenda',
        description: 'Lista todas as exceções (bloqueios e horários customizados) configuradas pelo médico',
        tags: ['Exceções de Agenda'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de exceções',
                content: new OA\JsonContent(type: 'object')
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $exceptions = $this->service->listForDoctor($request->user());

        return ScheduleExceptionResource::collection($exceptions)->response();
    }

    #[OA\Post(
        path: '/doctor/schedule-exceptions',
        summary: 'Criar exceção de agenda',
        description: 'Cria uma exceção na agenda (bloqueio, horário customizado ou indisponibilidade)',
        tags: ['Exceções de Agenda'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['date', 'type'],
                properties: [
                    new OA\Property(property: 'date', type: 'string', format: 'date', example: '2025-12-25'),
                    new OA\Property(property: 'type', type: 'string', enum: ['BLOCKED', 'CUSTOM_HOURS', 'UNAVAILABLE'], example: 'BLOCKED'),
                    new OA\Property(property: 'start_time', type: 'string', format: 'time', example: '09:00', description: 'Obrigatório para CUSTOM_HOURS'),
                    new OA\Property(property: 'end_time', type: 'string', format: 'time', example: '12:00', description: 'Obrigatório para CUSTOM_HOURS'),
                    new OA\Property(property: 'reason', type: 'string', example: 'Feriado de Natal'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Exceção criada'),
            new OA\Response(response: 422, description: 'Dados inválidos'),
        ]
    )]
    public function store(StoreScheduleExceptionRequest $request): JsonResponse
    {
        $exception = $this->service->create($request->user(), $request->validated());

        return (new ScheduleExceptionResource($exception))->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/doctor/schedule-exceptions/{id}',
        summary: 'Atualizar exceção',
        tags: ['Exceções de Agenda'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Exceção atualizada'),
            new OA\Response(response: 403, description: 'Sem permissão'),
        ]
    )]
    public function update(UpdateScheduleExceptionRequest $request, ScheduleException $scheduleException): JsonResponse
    {
        $exception = $this->service->update($scheduleException, $request->user(), $request->validated());

        return (new ScheduleExceptionResource($exception))->response();
    }

    #[OA\Delete(
        path: '/doctor/schedule-exceptions/{id}',
        summary: 'Remover exceção',
        tags: ['Exceções de Agenda'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Exceção removida'),
            new OA\Response(response: 403, description: 'Sem permissão'),
        ]
    )]
    public function destroy(Request $request, ScheduleException $scheduleException): JsonResponse
    {
        $this->service->delete($scheduleException, $request->user());

        return response()->json(['message' => __('Exceção removida com sucesso.')]);
    }
}
