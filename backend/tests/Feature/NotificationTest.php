<?php

namespace Tests\Feature;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_pode_listar_notificacoes(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
        ]);

        Notification::factory()->count(5)->create([
            'user_id' => $user->id,
        ]);

        $this->authAs($user);
        
        $response = $this->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'type', 'subject', 'message', 'is_read'],
                ],
            ]);

        $this->assertCount(5, $response->json('data'));
    }

    public function test_usuario_pode_marcar_notificacao_como_lida(): void
    {
        $user = User::factory()->create();
        
        $notification = Notification::factory()->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        $this->authAs($user);
        
        $response = $this->postJson("/api/notifications/{$notification->id}/read");

        $response->assertStatus(200);

        $notification->refresh();
        $this->assertTrue($notification->is_read);
    }

    public function test_usuario_pode_marcar_todas_como_lidas(): void
    {
        $user = User::factory()->create();
        
        Notification::factory()->count(3)->create([
            'user_id' => $user->id,
            'is_read' => false,
        ]);

        $this->authAs($user);
        
        $response = $this->postJson('/api/notifications/read-all');

        $response->assertStatus(200);

        $this->assertEquals(0, Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count());
    }

    public function test_notificacao_e_criada_ao_agendar_consulta(): void
    {
        $doctor = $this->createActiveDoctor();
        $patient = $this->createActivePatient();

        $this->authAs($patient->user);
        
        $this->postJson('/api/appointments', [
                'doctor_id' => $doctor->id,
                'scheduled_at' => now()->addDays(2)->toIso8601String(),
                'duration_minutes' => 30,
            ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $doctor->user_id,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $patient->user_id,
        ]);
    }

    protected function createActiveDoctor(): Doctor
    {
        $user = User::factory()->create([
            'role' => UserRole::DOCTOR,
            'is_active' => true,
        ]);

        return Doctor::factory()->create([
            'user_id' => $user->id,
            'is_active' => true,
        ]);
    }

    protected function createActivePatient(): Patient
    {
        $user = User::factory()->create([
            'role' => UserRole::PATIENT,
            'is_active' => true,
        ]);

        return Patient::factory()->create([
            'user_id' => $user->id,
            'profile_completed_at' => now(),
        ]);
    }
}

