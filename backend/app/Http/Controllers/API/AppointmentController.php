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
        $this->authorizeParticipant(request()->user(), $appointment);

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
        $this->authorizeDoctor($request->user(), $appointment);

        $appointment = $this->service->confirm($appointment, $request->user());

        return (new AppointmentResource($appointment))->response();
    }

    public function cancel(UpdateAppointmentStatusRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorizeParticipant($request->user(), $appointment);

        $appointment = $this->service->cancel($appointment, $request->user(), $request->input('reason'));

        return (new AppointmentResource($appointment))->response();
    }

    public function reschedule(RescheduleAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $this->authorizeParticipant($request->user(), $appointment);

        $appointment = $this->service->reschedule($appointment, $request->user(), $request->validated());

        return (new AppointmentResource($appointment))->response();
    }

    protected function authorizeDoctor($user, Appointment $appointment): void
    {
        $role = $this->resolveRole($user);

        if ($role !== UserRole::DOCTOR && $role !== UserRole::ADMIN) {
            abort(403, __('Somente o médico responsável pode executar esta ação.'));
        }

        if ($role === UserRole::DOCTOR && $appointment->doctor_id !== $user->doctor?->id) {
            abort(403, __('Somente o médico responsável pode executar esta ação.'));
        }
    }

    protected function authorizeParticipant($user, Appointment $appointment): void
    {
        $role = $this->resolveRole($user);

        if ($role === UserRole::ADMIN) {
            return;
        }

        $isDoctor = $role === UserRole::DOCTOR && $appointment->doctor_id === $user->doctor?->id;
        $isPatient = $role === UserRole::PATIENT && $appointment->patient_id === $user->patient?->id;

        if (! $isDoctor && ! $isPatient) {
            abort(403, __('Você não está autorizado para esta consulta.'));
        }
    }

    private function resolveRole($user): UserRole
    {
        return $user->role instanceof UserRole ? $user->role : UserRole::from($user->role);
    }
}


