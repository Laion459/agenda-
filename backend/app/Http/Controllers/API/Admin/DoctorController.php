<?php

namespace App\Http\Controllers\API\Admin;

use App\Application\Doctors\AdminDoctorService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Doctor\StoreDoctorRequest;
use App\Http\Requests\Admin\Doctor\UpdateDoctorRequest;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function __construct(private AdminDoctorService $service)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $doctors = $this->service->list($request->all());

        return DoctorResource::collection($doctors)->response();
    }

    public function store(StoreDoctorRequest $request): JsonResponse
    {
        $doctor = $this->service->create($request->validated());

        return DoctorResource::make($doctor)->response()->setStatusCode(201);
    }

    public function show(Doctor $doctor): JsonResponse
    {
        $doctor->load(['user', 'healthInsurances']);

        return DoctorResource::make($doctor)->response();
    }

    public function update(UpdateDoctorRequest $request, Doctor $doctor): JsonResponse
    {
        $doctor = $this->service->update($doctor, $request->validated());

        return DoctorResource::make($doctor)->response();
    }

    public function destroy(Doctor $doctor): JsonResponse
    {
        $this->service->deactivate($doctor);

        return response()->json(null, 204);
    }
}


