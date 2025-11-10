<?php

namespace App\Application\Auth;

use App\Domain\Shared\Enums\UserRole;
use App\Models\User;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Hashing\Hasher;
use Illuminate\Support\Facades\Auth;

class AuthService
{
    public function __construct(
        private Hasher $hasher
    ) {
    }

    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! $this->hasher->check($password, $user->password)) {
            throw new AuthenticationException(__('auth.failed'));
        }

        if (! $user->is_active) {
            throw new AuthenticationException(__('Sua conta está desativada. Entre em contato com o suporte.'));
        }

        $token = $user->createToken('agenda-plus-token')->plainTextToken;

        return [
            'token' => $token,
            'user' => $user->load(['patient', 'doctor']),
        ];
    }

    public function logout(): void
    {
        /** @var User $user */
        $user = Auth::user();
        $user?->currentAccessToken()?->delete();
    }

    public function registerPatient(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'role' => UserRole::PATIENT,
            'password' => $data['password'],
        ]);

        $user->assignRole(UserRole::PATIENT->value);

        $user->patient()->create([
            'cpf' => $data['cpf'],
            'birth_date' => $data['birth_date'],
            'address' => $data['address'] ?? null,
            'gender' => $data['gender'] ?? null,
            'profile_completed_at' => now(),
        ]);

        return $user->load('patient');
    }
}


