<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('schedule_exceptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->onDelete('cascade');
            $table->date('date');
            $table->enum('type', ['BLOCKED', 'CUSTOM_HOURS', 'UNAVAILABLE'])->default('BLOCKED');
            $table->time('start_time')->nullable(); // Para CUSTOM_HOURS
            $table->time('end_time')->nullable(); // Para CUSTOM_HOURS
            $table->string('reason')->nullable(); // Motivo do bloqueio/ajuste
            $table->timestamps();

            // Garante que não há duplicatas de exceção para o mesmo médico e data
            $table->unique(['doctor_id', 'date']);
            $table->index('doctor_id');
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedule_exceptions');
    }
};
