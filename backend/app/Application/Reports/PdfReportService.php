<?php

namespace App\Application\Reports;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Carbon;

class PdfReportService
{
    public function __construct(
        private AdminReportService $reportService
    ) {}

    public function generateAppointmentSummaryPdf(array $filters = [])
    {
        $data = $this->reportService->appointmentSummary($filters);
        $title = 'Relatório de Resumo de Consultas';
        $period = $this->formatPeriod($filters);

        $html = view('reports.appointment-summary', [
            'title' => $title,
            'period' => $period,
            'data' => $data,
            'generatedAt' => now()->format('d/m/Y H:i:s'),
        ])->render();

        return Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOption('enable-local-file-access', true);
    }

    public function generateDoctorOccupancyPdf(array $filters = [])
    {
        $data = $this->reportService->doctorOccupancy($filters);
        $title = 'Relatório de Ocupação de Médicos';
        $period = $this->formatPeriod($filters);

        $html = view('reports.doctor-occupancy', [
            'title' => $title,
            'period' => $period,
            'data' => $data,
            'generatedAt' => now()->format('d/m/Y H:i:s'),
        ])->render();

        return Pdf::loadHTML($html)
            ->setPaper('a4', 'landscape')
            ->setOption('enable-local-file-access', true);
    }

    public function generateBillingPdf(array $filters = [])
    {
        $data = $this->reportService->billing($filters);
        $title = 'Relatório de Faturamento';
        $period = $this->formatPeriod($filters);

        $html = view('reports.billing', [
            'title' => $title,
            'period' => $period,
            'data' => $data,
            'generatedAt' => now()->format('d/m/Y H:i:s'),
        ])->render();

        return Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOption('enable-local-file-access', true);
    }

    public function generateInsuranceUsagePdf(array $filters = [])
    {
        $data = $this->reportService->insuranceUsage($filters);
        $title = 'Relatório de Uso de Convênios';
        $period = $this->formatPeriod($filters);

        $html = view('reports.insurance-usage', [
            'title' => $title,
            'period' => $period,
            'data' => $data,
            'generatedAt' => now()->format('d/m/Y H:i:s'),
        ])->render();

        return Pdf::loadHTML($html)
            ->setPaper('a4', 'portrait')
            ->setOption('enable-local-file-access', true);
    }

    private function formatPeriod(array $filters): string
    {
        $start = isset($filters['start_date'])
            ? Carbon::parse($filters['start_date'])->format('d/m/Y')
            : Carbon::now()->subMonth()->format('d/m/Y');

        $end = isset($filters['end_date'])
            ? Carbon::parse($filters['end_date'])->format('d/m/Y')
            : Carbon::now()->format('d/m/Y');

        return "{$start} a {$end}";
    }
}
