<?php

namespace Tests;

use App\Domain\Shared\Enums\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\WithFaker;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Concerns\AuthenticatesUsers;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase, WithFaker, AuthenticatesUsers;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Limpar cache antes de cada teste
        \Illuminate\Support\Facades\Cache::flush();
        
        // Resetar cache de permissões
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        
        // Garantir que os roles existam
        $this->ensureRolesExist();
    }

    /**
     * Garante que os roles necessários existam no banco de dados
     */
    protected function ensureRolesExist(): void
    {
        Role::findOrCreate(UserRole::ADMIN->value, 'web');
        Role::findOrCreate(UserRole::DOCTOR->value, 'web');
        Role::findOrCreate(UserRole::PATIENT->value, 'web');
    }

    /**
     * Helper para criar usuário com role atribuído
     */
    protected function createUserWithRole(UserRole $role, array $attributes = []): \App\Models\User
    {
        $user = \App\Models\User::factory()->create(array_merge([
            'role' => $role,
            'is_active' => true,
        ], $attributes));
        
        $user->assignRole($role->value);
        
        return $user;
    }
}
