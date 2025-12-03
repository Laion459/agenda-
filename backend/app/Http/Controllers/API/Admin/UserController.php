<?php

namespace App\Http\Controllers\API\Admin;

use App\Application\Users\AdminUserService;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(private AdminUserService $service) {}

    public function index(Request $request): JsonResponse
    {
        $users = $this->service->list($request->all());

        return UserResource::collection($users)->response();
    }

    public function export(Request $request): JsonResponse
    {
        [$header, $rows] = $this->service->toCsv($request->all());

        $filename = 'users-'.now()->format('Ymd_His').'.csv';

        $callback = static function () use ($header, $rows): void {
            $output = fopen('php://output', 'w');
            fputcsv($output, $header, ';');
            foreach ($rows as $row) {
                fputcsv($output, $row, ';');
            }
            fclose($output);
        };

        return response()->streamDownload($callback, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function statistics(): JsonResponse
    {
        $stats = $this->service->getStatistics();
        return response()->json($stats);
    }

    public function update(Request $request, int $userId): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $userId,
            'phone' => 'sometimes|string|max:20',
            'is_active' => 'sometimes|boolean',
        ]);

        $user = $this->service->update($userId, $validated);

        return (new UserResource($user))->response();
    }
}
