<?php

namespace Database\Seeders;

use App\Domain\Shared\Enums\UserRole;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = [
            'manage users',
            'manage doctors',
            'manage patients',
            'manage schedules',
            'manage appointments',
            'view reports',
            'manage health insurances',
        ];

        $permissionModels = collect($permissions)
            ->map(fn (string $permission) => Permission::findOrCreate($permission, 'web'));

        $adminRole = Role::findOrCreate(UserRole::ADMIN->value, 'web');
        $doctorRole = Role::findOrCreate(UserRole::DOCTOR->value, 'web');
        $patientRole = Role::findOrCreate(UserRole::PATIENT->value, 'web');

        $adminRole->syncPermissions($permissionModels);

        $doctorRole->syncPermissions($permissionModels->whereIn('name', [
            'manage schedules',
            'manage appointments',
        ]));

        $patientRole->syncPermissions($permissionModels->whereIn('name', [
            'manage appointments',
        ]));
    }
}


