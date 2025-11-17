<?php

namespace App\Http\Controllers\API;

use App\Application\Appointments\AppointmentService;
use App\Domain\Shared\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\CreateAppointmentRequest;
use App\Http\Requests\Appointments\RescheduleAppointmentRequest;
use App\Http\Requests\Appointments\UpdateAppointmentStatusRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AppointmentController extends Controller
{
    public function __construct(private AppointmentService $service)
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $role = $this->resolveRole($user);

        if ($role === UserRole::PATIENT) {
            $appointments = $this->service->listForPatient($user, $request->all());
        } elseif ($role === UserRole::DOCTOR) {
            $appointments = $this->service->listForDoctor($user, $request->all());
        } elseif ($role === UserRole::ADMIN) {
            $appointments = $this->service->listForAdmin($request->all());
        } else {
            return response()->json(['message' => __('Função não suportada para este usuário.')], 403);
        }

        return AppointmentResource::collection($appointments)->response();
    }

    public function store(CreateAppointmentRequest $request): JsonResponse
    {
        $appointment = $this->service->createForPatient($request->user(), $request->validated());

        return (new AppointmentResource($appointment))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Appointment $appointment): JsonResponse
    {
        $this->authorize('view', $appointment);

        $appointment->load([
            'doctor.user',
            'patient.user',
            'creator',
            'observations.doctor.user',
            'observations.patient.user',
            'logs.changedBy',
        ]);

        return (new AppointmentResource($appointment))->response();
    }

    public function confirm(UpdateAppointmentStatusRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('confirm', $appointment);

        $appointment = $this->service->confirm($appointment, $request->user());

        return (new AppointmentResource($appointment))->response();
    }

    public function complete(UpdateAppointmentStatusRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('update', $appointment);

        $appointment = $this->service->complete($appointment, $request->user());

        return (new AppointmentResource($appointment))->response();
    }

    public function cancel(UpdateAppointmentStatusRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('cancel', $appointment);

        $appointment = $this->service->cancel($appointment, $request->user(), $request->input('reason'));

        return (new AppointmentResource($appointment))->response();
    }

    public function reschedule(RescheduleAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorize('reschedule', $appointment);

        $appointment = $this->service->reschedule($appointment, $request->user(), $request->validated());

        return (new AppointmentResource($appointment))->response();
    }

}


