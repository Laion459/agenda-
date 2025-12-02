<?php

namespace App\Http\Controllers\API;

use App\Application\Schedules\AvailabilityPeriodService;
use App\Http\Requests\Schedules\StoreAvailabilityPeriodRequest;
use App\Http\Requests\Schedules\UpdateAvailabilityPeriodRequest;
use App\Http\Resources\AvailabilityPeriodResource;
use App\Models\AvailabilityPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Períodos de Disponibilidade')]
class AvailabilityPeriodController extends Controller
{
    public function __construct(private AvailabilityPeriodService $service)
    {
        $this->middleware('auth:sanctum');
    }

    #[OA\Get(
        path: '/doctor/availability-periods',
        summary: 'Listar períodos de disponibilidade',
        description: 'Lista todos os períodos de disponibilidade configurados pelo médico',
        tags: ['Períodos de Disponibilidade'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de períodos',
                content: new OA\JsonContent(type: 'object')
            ),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $periods = $this->service->listForDoctor($request->user());

        return AvailabilityPeriodResource::collection($periods)->response();
    }

    #[OA\Post(
        path: '/doctor/availability-periods',
        summary: 'Criar período de disponibilidade',
        description: 'Define um período em que o médico está disponível para agendamentos',
        tags: ['Períodos de Disponibilidade'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['start_date', 'end_date'],
                properties: [
                    new OA\Property(property: 'start_date', type: 'string', format: 'date', example: '2025-01-01'),
                    new OA\Property(property: 'end_date', type: 'string', format: 'date', example: '2025-03-31'),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                    new OA\Property(property: 'description', type: 'string', example: 'Próximos 3 meses'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Período criado'),
            new OA\Response(response: 422, description: 'Dados inválidos'),
        ]
    )]
    public function store(StoreAvailabilityPeriodRequest $request): JsonResponse
    {
        $period = $this->service->create($request->user(), $request->validated());

        return (new AvailabilityPeriodResource($period))->response()->setStatusCode(201);
    }

    #[OA\Put(
        path: '/doctor/availability-periods/{id}',
        summary: 'Atualizar período',
        tags: ['Períodos de Disponibilidade'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Período atualizado'),
            new OA\Response(response: 403, description: 'Sem permissão'),
        ]
    )]
    public function update(UpdateAvailabilityPeriodRequest $request, AvailabilityPeriod $availabilityPeriod): JsonResponse
    {
        $period = $this->service->update($availabilityPeriod, $request->user(), $request->validated());

        return (new AvailabilityPeriodResource($period))->response();
    }

    #[OA\Delete(
        path: '/doctor/availability-periods/{id}',
        summary: 'Remover período',
        tags: ['Períodos de Disponibilidade'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Período removido'),
            new OA\Response(response: 403, description: 'Sem permissão'),
        ]
    )]
    public function destroy(Request $request, AvailabilityPeriod $availabilityPeriod): JsonResponse
    {
        $this->service->delete($availabilityPeriod, $request->user());

        return response()->json(['message' => __('Período removido com sucesso.')]);
    }
}
