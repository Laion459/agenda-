<?php

namespace App\Http\Controllers\API;

use App\Application\Observations\ObservationService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Observations\StoreObservationRequest;
use App\Http\Resources\ObservationResource;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ObservationController extends Controller
{
    public function __construct(private ObservationService $service)
    {
        $this->middleware('auth:sanctum');
    }

    public function store(StoreObservationRequest $request, Appointment $appointment): JsonResponse
    {
        $observation = $this->service->create($request->user(), $appointment, $request->validated());

        return (new ObservationResource($observation))->response()->setStatusCode(201);
    }

    public function index(Request $request): JsonResponse
    {
        $observations = $this->service->listForPatient(
            $request->user(),
            (int) $request->query('per_page', 20)
        );

        return ObservationResource::collection($observations)->response();
    }
}


