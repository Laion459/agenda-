<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class TestAdminLogin extends Command
{
    protected $signature = 'test:admin-login';
    protected $description = 'Testa e corrige credenciais do admin';

    public function handle(): int
    {
        $user = User::where('email', 'admin@agendaplus.test')->first();

        if (!$user) {
            $this->error('❌ Usuário admin@agendaplus.test NÃO existe!');
            $this->info('Execute: php artisan db:seed');
            return 1;
        }

        $this->info("✅ Usuário existe: {$user->email}");
        $this->info("   Ativo: " . ($user->is_active ? 'Sim' : 'Não'));
        $this->info("   Tentativas falhas: {$user->failed_login_attempts}");
        $this->info("   Bloqueado até: " . ($user->locked_until ? $user->locked_until : 'Não'));

        $passwordOk = Hash::check('password', $user->password);
        $this->info("   Senha 'password' está correta: " . ($passwordOk ? 'Sim' : 'Não'));

        $needsFix = false;

        if (!$passwordOk) {
            $this->warn('⚠️  Senha incorreta! Corrigindo...');
            $user->password = Hash::make('password');
            $needsFix = true;
        }

        if ($user->locked_until && now()->lessThan($user->locked_until)) {
            $this->warn('⚠️  Usuário está bloqueado! Desbloqueando...');
            $user->locked_until = null;
            $needsFix = true;
        }

        if ($user->failed_login_attempts > 0) {
            $this->warn('⚠️  Resetando tentativas falhas...');
            $user->failed_login_attempts = 0;
            $needsFix = true;
        }

        if (!$user->is_active) {
            $this->warn('⚠️  Usuário está inativo! Ativando...');
            $user->is_active = true;
            $needsFix = true;
        }

        if ($needsFix) {
            $user->save();
            $this->info('✅ Credenciais corrigidas!');
        }

        $this->info('');
        $this->info('✅ Tudo OK! Pode tentar fazer login com:');
        $this->info('   Email: admin@agendaplus.test');
        $this->info('   Senha: password');

        return 0;
    }
}

