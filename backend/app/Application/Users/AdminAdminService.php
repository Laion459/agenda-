<?php

namespace App\Application\Users;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminAdminService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = User::query()
            ->where('role', 'ADMIN')
            ->when(isset($filters['is_active']) && $filters['is_active'] !== '', function ($builder) use ($filters) {
                $value = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($value !== null) {
                    $builder->where('is_active', $value);
                }
            });

        if (! empty($filters['search'])) {
            $like = '%'.mb_strtolower($filters['search']).'%';
            $query->where(function ($builder) use ($like) {
                $builder->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(phone) LIKE ?', [$like]);
            });
        }

        if (! empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }

        if (! empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }

        $perPage = (int) ($filters['per_page'] ?? 15);

        return $query->orderByDesc('created_at')->paginate(max($perPage, 1))->appends($filters);
    }

    public function create(array $data): User
    {
        // Gera senha se não fornecida
        if (empty($data['password'])) {
            $data['password'] = Str::random(12);
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? '',
            'password' => Hash::make($data['password']),
            'role' => 'ADMIN',
            'is_active' => $data['is_active'] ?? true,
        ]);

        return $user;
    }

    public function update(int $userId, array $data): User
    {
        $user = User::where('id', $userId)
            ->where('role', 'ADMIN')
            ->firstOrFail();
        
        if (isset($data['name'])) {
            $user->name = $data['name'];
        }
        
        if (isset($data['email'])) {
            $user->email = $data['email'];
        }
        
        if (isset($data['phone'])) {
            $user->phone = $data['phone'];
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }
        
        if (isset($data['is_active'])) {
            $user->is_active = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
        }
        
        $user->save();
        
        return $user;
    }

    public function delete(int $userId): bool
    {
        $user = User::where('id', $userId)
            ->where('role', 'ADMIN')
            ->firstOrFail();
        
        return $user->delete();
    }

    public function getStatistics(): array
    {
        $total = User::where('role', 'ADMIN')->count();
        $active = User::where('role', 'ADMIN')->where('is_active', true)->count();
        $inactive = $total - $active;

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $inactive,
        ];
    }
}

