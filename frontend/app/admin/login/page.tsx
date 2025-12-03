'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Shield, ArrowLeft, Lock, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { login } from '@/services/auth-service';
import { useAuthStore } from '@/store/auth-store';
import { TYPOGRAPHY, COLORS, SPACING, TRANSITIONS, ELEVATION } from '@/constants/design-tokens';

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'Informe a senha'),
});

type LoginForm = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
  });
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      const result = await login(values);
      setAuth(result);
      // Redireciona para o dashboard administrativo
      router.replace('/admin');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setError('email', {
        type: 'manual',
        message: axiosError?.response?.data?.message ?? 'Credenciais inválidas',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Painel Esquerdo - Hero Premium Admin */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 p-12 flex-col relative overflow-hidden">
        {/* Efeitos de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-700/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/20">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Agenda+</h1>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Área Administrativa
            </h2>
            <p className="text-xl text-white/90 leading-relaxed mb-8">
              Acesso restrito para administradores. Gerencie todo o sistema com segurança e eficiência.
            </p>
            <div className="space-y-3">
              {[
                'Controle total do sistema',
                'Relatórios e análises avançadas',
                'Gestão de usuários e permissões',
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-white/90" />
                  <span className="text-white/90">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Painel Direito - Formulário Premium */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-slate-900 p-8 lg:p-12 flex flex-col justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-indigo-50/30 dark:from-slate-800/50 dark:via-transparent dark:to-slate-800/50" />
        
        <div className="max-w-md mx-auto w-full relative z-10">
          <div className="space-y-4 text-center mb-10 animate-fade-in">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-indigo-900 rounded-2xl flex items-center justify-center shadow-xl">
                <Lock className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className={clsx(TYPOGRAPHY.heading.h2, COLORS.text.primary)}>
              Área Administrativa
            </h1>
            <p className={clsx(TYPOGRAPHY.body.base, COLORS.text.secondary)}>
              Acesso restrito para administradores
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="space-y-2">
              <Label htmlFor="email" className={clsx("flex items-center gap-2", COLORS.text.primary)}>
                <Shield className="h-4 w-4" />
                E-mail Administrativo
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@agendamais.com"
                className="h-12"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-500 animate-fade-in">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className={clsx(COLORS.text.primary)}>Senha</Label>
              <PasswordInput
                id="password"
                placeholder="Digite sua senha"
                className="h-12"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-500 animate-fade-in">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className={clsx(
                "w-full h-12 bg-gradient-to-br from-slate-800 to-indigo-900",
                "hover:from-slate-900 hover:to-indigo-950",
                "text-white shadow-xl hover:shadow-2xl",
                "transition-all duration-300"
              )}
              disabled={loading}
            >
              {loading ? 'Acessando...' : 'Acessar Sistema'}
            </Button>
          </form>

          {/* Back Link */}
          <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Link 
              href="/" 
              className={clsx(
                "inline-flex items-center space-x-2",
                COLORS.text.secondary,
                "hover:text-slate-900 dark:hover:text-slate-200",
                "transition-all duration-200",
                "px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

