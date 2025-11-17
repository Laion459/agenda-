<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    /**
     * Health check endpoint para monitoramento
     */
    public function check(): JsonResponse
    {
        $status = 'healthy';
        $checks = [];

        // Verificar banco de dados
        try {
            DB::connection()->getPdo();
            $checks['database'] = 'ok';
        } catch (\Exception $e) {
            $checks['database'] = 'error: ' . $e->getMessage();
            $status = 'unhealthy';
        }

        // Verificar cache Redis
        try {
            Cache::store('redis')->put('health_check', 'ok', 10);
            $checks['cache'] = 'ok';
        } catch (\Exception $e) {
            $checks['cache'] = 'error: ' . $e->getMessage();
            $status = 'degraded';
        }

        // Verificar fila de jobs
        try {
            $queueConnection = config('queue.default');
            $checks['queue'] = 'ok';
        } catch (\Exception $e) {
            $checks['queue'] = 'error: ' . $e->getMessage();
            $status = 'degraded';
        }

        $response = [
            'status' => $status,
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
            'version' => config('app.version', '1.0.0'),
        ];

        $httpStatus = $status === 'healthy' ? 200 : ($status === 'degraded' ? 200 : 503);

        return response()->json($response, $httpStatus);
    }

    /**
     * Health check simplificado (apenas banco de dados)
     * Usado por load balancers
     */
    public function ping(): JsonResponse
    {
        try {
            DB::connection()->getPdo();
            return response()->json(['status' => 'ok'], 200);
        } catch (\Exception $e) {
            return response()->json(['status' => 'error'], 503);
        }
    }
}

