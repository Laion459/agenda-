<?php

namespace App\Http\Controllers\API;

use App\Application\Schedules\ScheduleService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Appointments\StoreScheduleRequest;
use App\Http\Requests\Appointments\UpdateScheduleRequest;
use App\Http\Resources\ScheduleResource;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function __construct(private ScheduleService $service)
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request): JsonResponse
    {
        $schedules = $this->service->listForDoctor($request->user());

        return ScheduleResource::collection($schedules)->response();
    }

    public function store(StoreScheduleRequest $request): JsonResponse
    {
        $schedule = $this->service->create($request->user(), $request->validated());

        return (new ScheduleResource($schedule))->response()->setStatusCode(201);
    }

    public function update(UpdateScheduleRequest $request, Schedule $schedule): JsonResponse
    {
        $schedule = $this->service->update($schedule, $request->user(), $request->validated());

        return (new ScheduleResource($schedule))->response();
    }

    public function destroy(Request $request, Schedule $schedule): JsonResponse
    {
        $this->service->delete($schedule, $request->user());

        return response()->json(['message' => __('Horário removido com sucesso.')]);
    }
}


