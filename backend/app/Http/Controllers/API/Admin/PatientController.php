<?php

namespace App\Http\Controllers\API\Admin;

use App\Application\Patients\AdminPatientService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Patient\StorePatientRequest;
use App\Http\Requests\Admin\Patient\UpdatePatientRequest;
use App\Http\Resources\PatientResource;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function __construct(private AdminPatientService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $patients = $this->service->list($request->all());

        return PatientResource::collection($patients)->response();
    }

    public function store(StorePatientRequest $request): JsonResponse
    {
        $patient = $this->service->create($request->validated());

        return PatientResource::make($patient)->response()->setStatusCode(201);
    }

    public function show(Patient $patient): JsonResponse
    {
        $patient->load(['user', 'healthInsurances']);

        return PatientResource::make($patient)->response();
    }

    public function update(UpdatePatientRequest $request, Patient $patient): JsonResponse
    {
        $patient = $this->service->update($patient, $request->validated());

        return PatientResource::make($patient)->response();
    }

    public function destroy(Patient $patient): JsonResponse
    {
        $this->service->deactivate($patient);

        return response()->json(null, 204);
    }
}


