<?php

namespace App\Http\Controllers\API\Admin;

use App\Application\Users\AdminAdminService;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(private AdminAdminService $service) {}

    public function index(Request $request): JsonResponse
    {
        $admins = $this->service->list($request->all());

        return UserResource::collection($admins)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'required|string|max:20',
            'password' => 'nullable|string|min:8',
            'is_active' => 'sometimes|boolean',
        ]);

        $admin = $this->service->create($validated);

        return (new UserResource($admin))->response()->setStatusCode(201);
    }

    public function update(Request $request, int $adminId): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $adminId,
            'phone' => 'sometimes|string|max:20',
            'password' => 'nullable|string|min:8',
            'is_active' => 'sometimes|boolean',
        ]);

        $admin = $this->service->update($adminId, $validated);

        return (new UserResource($admin))->response();
    }

    public function destroy(int $adminId): JsonResponse
    {
        $this->service->delete($adminId);

        return response()->json(['message' => 'Administrador removido com sucesso'], 200);
    }

    public function statistics(): JsonResponse
    {
        $stats = $this->service->getStatistics();
        return response()->json($stats);
    }
}

