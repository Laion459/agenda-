<?php

namespace App\Http\Controllers\API\Admin;

use App\Application\Reports\AdminReportService;
use App\Application\Reports\PdfReportService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        private AdminReportService $service,
        private PdfReportService $pdfService
    ) {
    }

    public function appointmentSummary(Request $request): JsonResponse
    {
        $data = $this->service->appointmentSummary($request->all());

        return response()->json($data);
    }

    public function appointmentSummaryPdf(Request $request)
    {
        $pdf = $this->pdfService->generateAppointmentSummaryPdf($request->all());

        return $pdf->download('relatorio-consultas-' . now()->format('Y-m-d') . '.pdf');
    }

    public function doctorOccupancy(Request $request): JsonResponse
    {
        $data = $this->service->doctorOccupancy($request->all());

        return response()->json([
            'data' => $data,
        ]);
    }

    public function doctorOccupancyPdf(Request $request)
    {
        $pdf = $this->pdfService->generateDoctorOccupancyPdf($request->all());

        return $pdf->download('relatorio-ocupacao-medicos-' . now()->format('Y-m-d') . '.pdf');
    }

    public function insuranceUsage(Request $request): JsonResponse
    {
        $data = $this->service->insuranceUsage($request->all());

        return response()->json([
            'data' => $data,
        ]);
    }

    public function insuranceUsagePdf(Request $request)
    {
        $pdf = $this->pdfService->generateInsuranceUsagePdf($request->all());

        return $pdf->download('relatorio-convenios-' . now()->format('Y-m-d') . '.pdf');
    }
}


