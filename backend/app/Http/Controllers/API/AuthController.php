<?php

namespace App\Http\Controllers\API;

use App\Application\Auth\AuthService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterPatientRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(private AuthService $authService)
    {
    }

    public function register(RegisterPatientRequest $request): JsonResponse
    {
        $user = $this->authService->registerPatient($request->validated());

        return response()->json([
            'message' => __('Paciente registrado com sucesso.'),
            'data' => $user,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $payload = $this->authService->login(
            $request->input('email'),
            $request->input('password')
        );

        return response()->json([
            'token' => $payload['token'],
            'user' => $payload['user'],
        ]);
    }

    public function me(): JsonResponse
    {
        return response()->json(Auth::user()->load(['patient', 'doctor']));
    }

    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return response()->json([
            'message' => __('Sessão encerrada com sucesso.'),
        ]);
    }
}


