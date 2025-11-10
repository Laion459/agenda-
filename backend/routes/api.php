<?php

use App\Http\Controllers\API\AppointmentController;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\DoctorController;
use App\Http\Controllers\API\HealthInsuranceController;
use App\Http\Controllers\API\ObservationController;
use App\Http\Controllers\API\ScheduleController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });
});

Route::get('doctors', [DoctorController::class, 'index']);
Route::get('doctors/{doctor}', [DoctorController::class, 'show']);
Route::get('health-insurances', [HealthInsuranceController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('appointments', [AppointmentController::class, 'index']);
    Route::post('appointments', [AppointmentController::class, 'store']);
    Route::get('appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::post('appointments/{appointment}/confirm', [AppointmentController::class, 'confirm']);
    Route::post('appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
    Route::post('appointments/{appointment}/reschedule', [AppointmentController::class, 'reschedule']);
    Route::post('appointments/{appointment}/observations', [ObservationController::class, 'store']);

    Route::middleware('role:PATIENT')->group(function () {
        Route::get('patient/observations', [ObservationController::class, 'index']);
    });

    Route::middleware('role:DOCTOR')->group(function () {
        Route::get('doctor/patients/{patient}/observations', [ObservationController::class, 'historyForDoctor']);
    });

    Route::post('health-insurances', [HealthInsuranceController::class, 'store'])->middleware('role:ADMIN');
    Route::put('health-insurances/{health_insurance}', [HealthInsuranceController::class, 'update'])->middleware('role:ADMIN');
    Route::delete('health-insurances/{health_insurance}', [HealthInsuranceController::class, 'destroy'])->middleware('role:ADMIN');

    Route::get('doctor/schedules', [ScheduleController::class, 'index']);
    Route::post('doctor/schedules', [ScheduleController::class, 'store']);
    Route::put('doctor/schedules/{schedule}', [ScheduleController::class, 'update']);
    Route::delete('doctor/schedules/{schedule}', [ScheduleController::class, 'destroy']);
});


