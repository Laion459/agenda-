<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Resources\DoctorResource;
use App\Models\Doctor;
use Illuminate\Http\JsonResponse;

class DoctorController extends Controller
{
    public function index(): JsonResponse
    {
        $query = Doctor::with(['user', 'healthInsurances'])->active();
        
        if (request()->has('crm')) {
            $query->where('crm', request('crm'));
        }
        
        $doctors = $query->paginate(15);

        return DoctorResource::collection($doctors)->response();
    }

    public function show(Doctor $doctor): DoctorResource
    {
        $doctor->loadMissing(['user', 'healthInsurances', 'schedules']);

        return new DoctorResource($doctor);
    }
}


