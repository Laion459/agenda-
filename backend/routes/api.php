<?php

use App\Http\Controllers\API\Admin\DoctorController as AdminDoctorController;
use App\Http\Controllers\API\Admin\PatientController as AdminPatientController;
use App\Http\Controllers\API\Admin\ReportController as AdminReportController;
use App\Http\Controllers\API\Admin\UserController as AdminUserController;
use App\Http\Controllers\API\AppointmentController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DoctorController;
use App\Http\Controllers\API\HealthInsuranceController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\ObservationController;
use App\Http\Controllers\API\ScheduleController;
use App\Http\Controllers\API\ProfileController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::get('doctors', [DoctorController::class, 'index']);
Route::get('doctors/{doctor}', [DoctorController::class, 'show']);
Route::get('health-insurances', [HealthInsuranceController::class, 'index']);

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('appointments', [AppointmentController::class, 'index']);
    Route::post('appointments', [AppointmentController::class, 'store']);
    Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::post('appointments/{appointment}/confirm', [AppointmentController::class, 'confirm']);
    Route::post('appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);
    Route::post('appointments/{appointment}/observations', [ObservationController::class, 'store']);
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);

    Route::middleware('role:PATIENT')->group(function () {
        Route::get('patient/observations', [ObservationController::class, 'index']);
    });

    Route::middleware('role:DOCTOR')->group(function () {
        Route::get('doctor/patients/{patient}/observations', [ObservationController::class, 'historyForDoctor']);
    });

    Route::middleware('role:ADMIN')->group(function () {
        Route::post('health-insurances', [HealthInsuranceController::class, 'store']);
        Route::put('health-insurances/{health_insurance}', [HealthInsuranceController::class, 'update']);
        Route::delete('health-insurances/{health_insurance}', [HealthInsuranceController::class, 'destroy']);
        Route::apiResource('admin/doctors', AdminDoctorController::class);
        Route::apiResource('admin/patients', AdminPatientController::class);
        Route::get('admin/users', [AdminUserController::class, 'index']);
        Route::get('admin/users/export', [AdminUserController::class, 'export']);
        Route::get('admin/reports/appointments', [AdminReportController::class, 'appointmentSummary']);
        Route::get('admin/reports/doctor-occupancy', [AdminReportController::class, 'doctorOccupancy']);
        Route::get('admin/reports/insurance-usage', [AdminReportController::class, 'insuranceUsage']);
    });

    Route::get('doctor/schedules', [ScheduleController::class, 'index']);
    Route::post('doctor/schedules', [ScheduleController::class, 'store']);
    Route::put('doctor/schedules/{schedule}', [ScheduleController::class, 'update']);
    Route::delete('doctor/schedules/{schedule}', [ScheduleController::class, 'destroy']);
});


