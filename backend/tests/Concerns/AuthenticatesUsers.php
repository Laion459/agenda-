<?php

namespace Tests\Concerns;

use App\Models\User;
use Laravel\Sanctum\Sanctum;

trait AuthenticatesUsers
{
    /**
     * Autentica usuário usando Sanctum (recomendado para testes)
     */
    protected function actingAsUser(User $user): self
    {
        Sanctum::actingAs($user, ['*']);
        
        return $this;
    }

    /**
     * Retorna headers de autenticação com token
     */
    protected function actingAsWithToken(User $user): array
    {
        $token = $user->createToken('test-token')->plainTextToken;
        
        return [
            'Authorization' => "Bearer {$token}",
        ];
    }

    /**
     * Helper para usar Sanctum::actingAs (mais simples)
     */
    protected function authAs(User $user): self
    {
        return $this->actingAsUser($user);
    }
}

