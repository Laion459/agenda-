<?php

namespace App\Http\Controllers\API;

use App\Http\Requests\HealthInsurance\StoreHealthInsuranceRequest;
use App\Http\Requests\HealthInsurance\UpdateHealthInsuranceRequest;
use App\Http\Resources\HealthInsuranceResource;
use App\Models\HealthInsurance;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Convênios')]
class HealthInsuranceController extends Controller
{
    #[OA\Get(
        path: '/health-insurances',
        summary: 'Listar convênios ativos',
        description: 'Lista todos os convênios ativos disponíveis. Endpoint público (não requer autenticação).',
        tags: ['Convênios'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Lista de convênios',
                content: new OA\JsonContent(type: 'object')
            ),
        ]
    )]
    public function index(): JsonResponse
    {
        return HealthInsuranceResource::collection(
            HealthInsurance::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
        )->response();
    }

    #[OA\Post(
        path: '/health-insurances',
        summary: 'Criar convênio',
        description: 'Cria um novo convênio. Apenas administradores podem criar convênios.',
        tags: ['Convênios'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['name'],
                properties: [
                    new OA\Property(property: 'name', type: 'string', example: 'Unimed'),
                    new OA\Property(property: 'description', type: 'string', example: 'Plano de saúde'),
                    new OA\Property(property: 'coverage_percentage', type: 'number', format: 'float', example: 80.00),
                    new OA\Property(property: 'is_active', type: 'boolean', example: true),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Convênio criado',
                content: new OA\JsonContent(type: 'object')
            ),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function store(StoreHealthInsuranceRequest $request): JsonResponse
    {
        $insurance = HealthInsurance::create($request->validated());

        return HealthInsuranceResource::make($insurance)
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Put(
        path: '/health-insurances/{id}',
        summary: 'Atualizar convênio',
        description: 'Atualiza dados de um convênio. Apenas administradores podem atualizar.',
        tags: ['Convênios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'name', type: 'string'),
                    new OA\Property(property: 'description', type: 'string'),
                    new OA\Property(property: 'coverage_percentage', type: 'number', format: 'float'),
                    new OA\Property(property: 'is_active', type: 'boolean'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Convênio atualizado', content: new OA\JsonContent(type: 'object')),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function update(UpdateHealthInsuranceRequest $request, HealthInsurance $healthInsurance): JsonResponse
    {
        $healthInsurance->update($request->validated());

        return HealthInsuranceResource::make($healthInsurance)->response();
    }

    #[OA\Delete(
        path: '/health-insurances/{id}',
        summary: 'Inativar convênio',
        description: 'Inativa um convênio usando soft delete. O registro não é removido fisicamente. Apenas administradores podem inativar.',
        tags: ['Convênios'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'id', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Convênio inativado',
                content: new OA\JsonContent(
                    properties: [new OA\Property(property: 'message', type: 'string')]
                )
            ),
            new OA\Response(response: 403, description: 'Apenas administradores'),
        ]
    )]
    public function destroy(HealthInsurance $healthInsurance): JsonResponse
    {
        $healthInsurance->update(['is_active' => false]);
        $healthInsurance->delete();

        return response()->json([
            'message' => __('Convênio inativado com sucesso.'),
        ]);
    }
}
