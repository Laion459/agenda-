<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\HealthInsurance\StoreHealthInsuranceRequest;
use App\Http\Requests\HealthInsurance\UpdateHealthInsuranceRequest;
use App\Http\Resources\HealthInsuranceResource;
use App\Models\HealthInsurance;
use Illuminate\Http\JsonResponse;

class HealthInsuranceController extends Controller
{
    public function index(): JsonResponse
    {
        return HealthInsuranceResource::collection(
            HealthInsurance::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
        )->response();
    }

    public function store(StoreHealthInsuranceRequest $request): JsonResponse
    {
        $insurance = HealthInsurance::create($request->validated());

        return HealthInsuranceResource::make($insurance)
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateHealthInsuranceRequest $request, HealthInsurance $healthInsurance): JsonResponse
    {
        $healthInsurance->update($request->validated());

        return HealthInsuranceResource::make($healthInsurance)->response();
    }

    public function destroy(HealthInsurance $healthInsurance): JsonResponse
    {
        $healthInsurance->update(['is_active' => false]);
        $healthInsurance->delete();

        return response()->json([
            'message' => __('Convênio inativado com sucesso.'),
        ]);
    }
}


