<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = ActivityLog::query()
            ->with('user')
            ->when($request->input('action'), fn ($query, $action) => $query->where('action', 'like', "%{$action}%"))
            ->when($request->input('user_id'), fn ($query, $userId) => $query->where('user_id', $userId))
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 25));

        return ActivityLogResource::collection($logs)->response();
    }
}


