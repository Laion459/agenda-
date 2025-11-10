<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Jobs\AnonymizeUserJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PrivacyController extends Controller
{
    public function accept(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->forceFill([
            'privacy_policy_accepted_at' => now(),
            'privacy_policy_version' => config('privacy.policy_version'),
        ])->save();

        return response()->json([
            'message' => __('Termos de privacidade aceitos com sucesso.'),
        ]);
    }

    public function requestErasure(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->forceFill([
            'data_erasure_requested_at' => now(),
        ])->save();

        AnonymizeUserJob::dispatch($user->id);

        return response()->json([
            'message' => __('Solicitação de exclusão recebida. Entraremos em contato em breve.'),
        ]);
    }

    public function export(Request $request): JsonResponse
    {
        $user = $request->user()->load(['patient', 'doctor', 'notifications']);

        return response()->json([
            'data' => [
                'user' => $user->only([
                    'id',
                    'name',
                    'email',
                    'phone',
                    'role',
                    'created_at',
                    'privacy_policy_accepted_at',
                    'privacy_policy_version',
                ]),
                'patient' => $user->patient,
                'doctor' => $user->doctor,
                'notifications' => $user->notifications()
                    ->latest()
                    ->take(50)
                    ->get(['type', 'subject', 'sent_at', 'channel', 'metadata']),
            ],
        ]);
    }
}


