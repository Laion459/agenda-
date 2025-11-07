<?php

namespace Database\Seeders;

use App\Domain\Shared\Enums\AppointmentStatus;
use App\Domain\Shared\Enums\UserRole;
use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\Doctor;
use App\Models\HealthInsurance;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RolePermissionSeeder::class);

        $admin = User::factory()->admin()->create([
            'name' => 'Administrador Agenda+',
            'email' => 'admin@agendaplus.test',
            'phone' => '+5511999990000',
        ]);
        $admin->assignRole(UserRole::ADMIN->value);

        $healthInsurances = HealthInsurance::factory(5)->create();

        $doctors = Doctor::factory(8)
            ->has(Schedule::factory()->count(3), 'schedules')
            ->create()
            ->each(function (Doctor $doctor) use ($healthInsurances) {
                $doctor->user->assignRole(UserRole::DOCTOR->value);
                $healthInsurances->shuffle()->take(2)->each(function ($plan) use ($doctor) {
                    $doctor->healthInsurances()->attach($plan->id, ['is_active' => true]);
                });
            });

        $patients = Patient::factory(20)->create()->each(function (Patient $patient) use ($healthInsurances) {
            $patient->user->assignRole(UserRole::PATIENT->value);
            $healthInsurances->shuffle()->take(random_int(1, 3))->each(function ($plan) use ($patient) {
                $patient->healthInsurances()->attach($plan->id, [
                    'is_active' => true,
                    'policy_number' => fake()->numerify('########'),
                ]);
            });
        });

        $appointments = collect();

        foreach ($patients as $patient) {
            $doctor = $doctors->random();

            $appointments->push(
                Appointment::factory()
                    ->for($patient)
                    ->for($doctor)
                    ->state(['created_by' => $admin->id])
                    ->create()
            );
        }

        // Add some confirmed and completed appointments
        $appointments->take(5)->each(function (Appointment $appointment) {
            $appointment->update([
                'status' => AppointmentStatus::CONFIRMED,
                'confirmed_at' => now()->subDays(2),
            ]);
        });

        $appointments->take(3)->each(function (Appointment $appointment) {
            $appointment->update([
                'status' => AppointmentStatus::COMPLETED,
                'completed_at' => now()->subDay(),
            ]);
        });

        $appointments->each(function (Appointment $appointment) use ($admin) {
            AppointmentLog::factory()->create([
                'appointment_id' => $appointment->id,
                'old_status' => null,
                'new_status' => $appointment->status,
                'changed_by' => $admin->id,
                'changed_at' => $appointment->created_at,
            ]);
        });

        // Notifications for all users
        User::all()->each(function (User $user) {
            Notification::factory()->count(2)->create([
                'user_id' => $user->id,
            ]);
        });
    }
}
