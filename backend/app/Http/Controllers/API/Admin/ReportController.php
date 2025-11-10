<?php

namespace App\Http\Controllers\API\Admin;

use App\Application\Reports\AdminReportService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private AdminReportService $service)
    {
    }

    public function appointmentSummary(Request $request): JsonResponse
    {
        $data = $this->service->appointmentSummary($request->all());

        return response()->json($data);
    }

    public function doctorOccupancy(Request $request): JsonResponse
    {
        $data = $this->service->doctorOccupancy($request->all());

        return response()->json([
            'data' => $data,
        ]);
    }

    public function insuranceUsage(Request $request): JsonResponse
    {
        $data = $this->service->insuranceUsage($request->all());

        return response()->json([
            'data' => $data,
        ]);
    }
}


