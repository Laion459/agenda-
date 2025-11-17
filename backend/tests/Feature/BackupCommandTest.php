<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BackupCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_comando_backup_pode_ser_executado(): void
    {
        // Simular ambiente de teste (SQLite não suporta pg_dump)
        // Em produção, este teste seria executado com PostgreSQL
        
        $this->artisan('backup:database', ['--retention' => 30])
            ->expectsOutput('Backup do banco de dados criado')
            ->assertExitCode(0);
    }

    public function test_comando_arquivamento_pode_ser_executado(): void
    {
        $this->artisan('reports:archive', ['--months' => 6])
            ->expectsOutput('Nenhum relatório encontrado para arquivar.')
            ->assertExitCode(0);
    }
}

