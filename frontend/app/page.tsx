'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Stethoscope, User, Shield, Calendar, ArrowLeft, CheckCircle2, TrendingUp, Users, Heart, Sparkles, ArrowRight, Star, BarChart3 } from 'lucide-react';
import { login } from '@/services/auth-service';
import { useAuthStore } from '@/store/auth-store';
import { getRedirectPathByRole } from '@/lib/auth-redirect';
import { clsx } from 'clsx';
import { TYPOGRAPHY, COLORS, SPACING, TRANSITIONS, ELEVATION } from '@/constants/design-tokens';

const patientSchema = z.object({
  emailOrCpf: z.string().min(1, 'Informe o e-mail ou CPF'),
  password: z.string().min(6, 'Informe a senha'),
  remember: z.boolean().optional(),
});

const doctorSchema = z.object({
  emailOrCrm: z.string().min(1, 'Informe o e-mail ou CRM'),
  password: z.string().min(6, 'Informe a senha'),
  remember: z.boolean().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;
type DoctorForm = z.infer<typeof doctorSchema>;

export default function HomePage() {
  const [loginType, setLoginType] = useState<'doctor' | 'patient' | null>(null);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const patientForm = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
  });

  const doctorForm = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
  });

  const handlePatientSubmit = async (values: PatientForm) => {
    setLoading(true);
    try {
      const loginData = values.emailOrCpf.includes('@')
        ? { email: values.emailOrCpf, password: values.password }
        : { cpf: values.emailOrCpf, password: values.password };

      const result = await login(loginData);
      setAuth(result);
      router.replace(getRedirectPathByRole(result.user));
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; errors?: { email?: string[] } }>;
      const errorMessage = axiosError?.response?.data?.message || axiosError?.response?.data?.errors?.email?.[0] || 'Credenciais inválidas. Verifique seu e-mail/CPF e senha.';
      patientForm.setError('emailOrCpf', {
        type: 'manual',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSubmit = async (values: DoctorForm) => {
    setLoading(true);
    try {
      const loginData = values.emailOrCrm.includes('@')
        ? { email: values.emailOrCrm, password: values.password }
        : { crm: values.emailOrCrm, password: values.password };

      const result = await login(loginData);
      setAuth(result);
      router.replace(getRedirectPathByRole(result.user));
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; errors?: { email?: string[] } }>;
      const errorMessage = axiosError?.response?.data?.message || axiosError?.response?.data?.errors?.email?.[0] || 'Credenciais inválidas. Verifique seu e-mail/CRM e senha.';
      doctorForm.setError('emailOrCrm', {
        type: 'manual',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loginType === 'patient') {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Painel Esquerdo - Hero Premium */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-12 flex-col relative overflow-hidden">
          {/* Efeitos de fundo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative z-10 flex flex-col justify-center">
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center space-x-4 mb-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Agenda+</h1>
              </div>
              <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                Login do Paciente
              </h2>
              <p className="text-xl text-white/95 leading-relaxed mb-8">
                Acesse sua conta e gerencie suas consultas de forma simples, rápida e segura.
              </p>
              <div className="space-y-3">
                {[
                  'Agende consultas em poucos cliques',
                  'Visualize seu histórico completo',
                  'Receba notificações importantes',
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
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-blue-50/30 dark:from-slate-800/50 dark:via-transparent dark:to-slate-800/50" />
          
          <div className="max-w-md mx-auto w-full relative z-10">
            <div className="space-y-4 text-center mb-10 animate-fade-in">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <User className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className={clsx(TYPOGRAPHY.heading.h2, COLORS.text.primary)}>
                Login do Paciente
              </h1>
              <p className={clsx(TYPOGRAPHY.body.base, COLORS.text.secondary)}>
                Acesse sua conta e gerencie suas consultas
              </p>
            </div>
            <form onSubmit={patientForm.handleSubmit(handlePatientSubmit)} className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="space-y-2">
                <Label htmlFor="emailOrCpf" className={clsx("flex items-center gap-2", COLORS.text.primary)}>
                  <User className="h-4 w-4" />
                  E-mail ou CPF
                </Label>
                <Input
                  id="emailOrCpf"
                  placeholder="seu@email.com ou CPF"
                  className="h-12"
                  {...patientForm.register('emailOrCpf')}
                />
                {patientForm.formState.errors.emailOrCpf && (
                  <p className="text-xs text-red-500 animate-fade-in">{patientForm.formState.errors.emailOrCpf.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className={clsx(COLORS.text.primary)}>Senha</Label>
                <PasswordInput
                  id="password"
                  placeholder="Digite sua senha"
                  className="h-12"
                  {...patientForm.register('password')}
                />
                {patientForm.formState.errors.password && (
                  <p className="text-xs text-red-500 animate-fade-in">{patientForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    {...patientForm.register('remember')}
                  />
                  <Label htmlFor="remember" className={clsx("text-sm cursor-pointer", COLORS.text.secondary)}>
                    Lembrar-me
                  </Label>
                </div>
                <Link href="/forgot-password" className={clsx("text-sm hover:underline transition-all duration-200", "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300")}>
                  Esqueceu a senha?
                </Link>
              </div>
              <Button 
                type="submit" 
                className={clsx(
                  "w-full h-12 bg-gradient-to-br from-purple-600 to-indigo-600",
                  "hover:from-purple-700 hover:to-indigo-700",
                  "text-white shadow-xl hover:shadow-2xl",
                  "transition-all duration-300"
                )}
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-8 space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Link href="/register/patient" className="block">
                <Button
                  variant="outline"
                  className={clsx(
                    "w-full h-12 border-2 border-purple-200 dark:border-purple-800",
                    "hover:border-purple-300 dark:hover:border-purple-700",
                    "hover:bg-purple-50 dark:hover:bg-purple-900/20",
                    "text-purple-600 dark:text-purple-400",
                    "shadow-md hover:shadow-lg transition-all duration-300"
                  )}
                >
                  Criar conta de paciente
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => setLoginType(null)}
                className={clsx(
                  "w-full inline-flex items-center justify-center space-x-2",
                  COLORS.text.secondary,
                  "hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loginType === 'doctor') {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Painel Esquerdo - Hero Premium */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 flex-col relative overflow-hidden">
          {/* Efeitos de fundo */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="relative z-10 flex flex-col justify-center">
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center space-x-4 mb-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                  <Calendar className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">Agenda+</h1>
              </div>
              <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                Login do Médico
              </h2>
              <p className="text-xl text-white/95 leading-relaxed mb-8">
                Acesse sua conta profissional e gerencie sua agenda de forma eficiente e moderna.
              </p>
              <div className="space-y-3">
                {[
                  'Gerencie sua agenda em tempo real',
                  'Visualize todas as suas consultas',
                  'Registre observações clínicas',
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
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 via-transparent to-purple-50/30 dark:from-slate-800/50 dark:via-transparent dark:to-slate-800/50" />
          
          <div className="max-w-md mx-auto w-full relative z-10">
            <div className="space-y-4 text-center mb-10 animate-fade-in">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Stethoscope className="h-10 w-10 text-white" />
                </div>
              </div>
              <h1 className={clsx(TYPOGRAPHY.heading.h2, COLORS.text.primary)}>
                Login do Médico
              </h1>
              <p className={clsx(TYPOGRAPHY.body.base, COLORS.text.secondary)}>
                Acesse sua conta profissional
              </p>
            </div>
            <form onSubmit={doctorForm.handleSubmit(handleDoctorSubmit)} className="space-y-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="space-y-2">
                <Label htmlFor="emailOrCrm" className={clsx("flex items-center gap-2", COLORS.text.primary)}>
                  <Stethoscope className="h-4 w-4" />
                  E-mail ou CRM
                </Label>
                <Input
                  id="emailOrCrm"
                  placeholder="seu@email.com ou CRM"
                  className="h-12"
                  {...doctorForm.register('emailOrCrm')}
                />
                {doctorForm.formState.errors.emailOrCrm && (
                  <p className="text-xs text-red-500 animate-fade-in">{doctorForm.formState.errors.emailOrCrm.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctorPassword" className={clsx(COLORS.text.primary)}>Senha</Label>
                <PasswordInput
                  id="doctorPassword"
                  placeholder="Digite sua senha"
                  className="h-12"
                  {...doctorForm.register('password')}
                />
                {doctorForm.formState.errors.password && (
                  <p className="text-xs text-red-500 animate-fade-in">{doctorForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="doctorRemember"
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    {...doctorForm.register('remember')}
                  />
                  <Label htmlFor="doctorRemember" className={clsx("text-sm cursor-pointer", COLORS.text.secondary)}>
                    Lembrar-me
                  </Label>
                </div>
                <Link href="/forgot-password" className={clsx("text-sm hover:underline transition-all duration-200", "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300")}>
                  Esqueceu a senha?
                </Link>
              </div>
              <Button 
                type="submit" 
                className={clsx(
                  "w-full h-12 bg-gradient-to-br from-indigo-600 to-purple-600",
                  "hover:from-indigo-700 hover:to-purple-700",
                  "text-white shadow-xl hover:shadow-2xl",
                  "transition-all duration-300"
                )}
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
            <div className="mt-8 space-y-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <Link href="/register/doctor" className="block">
                <Button
                  variant="outline"
                  className={clsx(
                    "w-full h-12 border-2 border-indigo-200 dark:border-indigo-800",
                    "hover:border-indigo-300 dark:hover:border-indigo-700",
                    "hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
                    "text-indigo-600 dark:text-indigo-400",
                    "shadow-md hover:shadow-lg transition-all duration-300"
                  )}
                >
                  Criar conta de médico
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => setLoginType(null)}
                className={clsx(
                  "w-full inline-flex items-center justify-center space-x-2",
                  COLORS.text.secondary,
                  "hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Painel Esquerdo - Hero Premium */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-12 flex-col relative overflow-hidden">
        {/* Efeitos de fundo decorativos */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo Premium */}
          <div className="mb-12 animate-fade-in">
            <div className="flex items-center space-x-4 mb-12">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/30 transition-transform duration-300 hover:scale-110">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className={clsx("text-4xl font-bold text-white mb-1 tracking-tight")}>
                  Agenda+
                </h1>
                <p className="text-white/80 text-sm font-medium">Sistema de Agendamento Clínico</p>
              </div>
            </div>

            <h2 className={clsx(
              "text-6xl font-bold text-white mb-6 leading-tight",
              "animate-fade-in"
            )} style={{ animationDelay: '100ms' }}>
              Transforme a gestão da sua clínica
            </h2>
            
            <p className={clsx(
              "text-xl text-white/95 leading-relaxed mb-8 max-w-lg",
              "animate-fade-in"
            )} style={{ animationDelay: '200ms' }}>
              A solução completa para gerenciar consultas, organizar agendas e oferecer o melhor atendimento aos seus pacientes com tecnologia de ponta.
            </p>

            {/* Features destacadas */}
            <div className="space-y-4 mb-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
              {[
                { icon: CheckCircle2, text: 'Agendamento inteligente e automatizado' },
                { icon: CheckCircle2, text: 'Gestão completa de pacientes e médicos' },
                { icon: CheckCircle2, text: 'Relatórios e análises em tempo real' },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-white/95 text-lg">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Elementos Visuais Premium - Substituindo Imagem */}
          <div className="flex-1 flex items-center justify-center relative mt-8">
            <div className="relative w-full max-w-2xl">
              {/* Grid de Cards Flutuantes com Ícones */}
              <div className="grid grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
                {/* Card 1 - Agendamento */}
                <div className={clsx(
                  "relative group",
                  "bg-white/10 backdrop-blur-md rounded-2xl p-6",
                  "border border-white/20",
                  "shadow-2xl hover:shadow-3xl",
                  "transform hover:-translate-y-2 transition-all duration-300",
                  "animate-fade-in"
                )} style={{ animationDelay: '500ms' }}>
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">Agendamento</h3>
                  <p className="text-white/80 text-xs">Rápido e fácil</p>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white/30 animate-pulse" />
                </div>

                {/* Card 2 - Gestão */}
                <div className={clsx(
                  "relative group",
                  "bg-white/10 backdrop-blur-md rounded-2xl p-6",
                  "border border-white/20",
                  "shadow-2xl hover:shadow-3xl",
                  "transform hover:-translate-y-2 transition-all duration-300",
                  "animate-fade-in"
                )} style={{ animationDelay: '600ms' }}>
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">Gestão</h3>
                  <p className="text-white/80 text-xs">Completa</p>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full border-2 border-white/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>

                {/* Card 3 - Tecnologia */}
                <div className={clsx(
                  "relative group",
                  "bg-white/10 backdrop-blur-md rounded-2xl p-6",
                  "border border-white/20",
                  "shadow-2xl hover:shadow-3xl",
                  "transform hover:-translate-y-2 transition-all duration-300",
                  "animate-fade-in"
                )} style={{ animationDelay: '700ms' }}>
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">Tecnologia</h3>
                  <p className="text-white/80 text-xs">De ponta</p>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-400 rounded-full border-2 border-white/30 animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                {/* Card 4 - Segurança */}
                <div className={clsx(
                  "relative group col-span-1",
                  "bg-white/10 backdrop-blur-md rounded-2xl p-6",
                  "border border-white/20",
                  "shadow-2xl hover:shadow-3xl",
                  "transform hover:-translate-y-2 transition-all duration-300",
                  "animate-fade-in"
                )} style={{ animationDelay: '800ms' }}>
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1">Segurança</h3>
                  <p className="text-white/80 text-xs">Total</p>
                </div>

                {/* Card 5 - Suporte */}
                <div className={clsx(
                  "relative group col-span-2",
                  "bg-white/10 backdrop-blur-md rounded-2xl p-6",
                  "border border-white/20",
                  "shadow-2xl hover:shadow-3xl",
                  "transform hover:-translate-y-2 transition-all duration-300",
                  "animate-fade-in"
                )} style={{ animationDelay: '900ms' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Heart className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">Atendimento de Excelência</h3>
                      <p className="text-white/80 text-sm">Suporte dedicado para médicos e pacientes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Elementos decorativos flutuantes */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center animate-pulse-slow">
                <Sparkles className="h-12 w-12 text-white/80" />
              </div>
              <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-blue-400/20 backdrop-blur-md rounded-full border border-blue-300/30 flex items-center justify-center animate-pulse-slow" style={{ animationDelay: '1s' }}>
                <TrendingUp className="h-10 w-10 text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Painel Direito - Acesso Premium */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-slate-900 p-8 lg:p-12 flex flex-col justify-center relative">
        {/* Background decorativo sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-blue-50/50 dark:from-slate-800/50 dark:via-transparent dark:to-slate-800/50" />
        
        <div className="max-w-md mx-auto w-full relative z-10">
          {/* Logo mobile premium */}
          <div className="lg:hidden flex items-center space-x-3 mb-8 animate-fade-in">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className={clsx("text-2xl font-bold", COLORS.text.primary)}>Agenda+</h1>
              <p className={clsx("text-xs", COLORS.text.secondary)}>Sistema de Agendamento</p>
            </div>
          </div>

          {/* Título de Acesso Premium */}
          <div className="mb-10 animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className={clsx(TYPOGRAPHY.heading.h2, COLORS.text.primary)}>
                Escolha seu acesso
              </h3>
            </div>
            <p className={clsx(TYPOGRAPHY.body.base, COLORS.text.secondary)}>
              Selecione o tipo de acesso para continuar
            </p>
          </div>

          {/* Botões de Acesso Premium */}
          <div className="space-y-4 mb-8">
            {/* Botão Médico - Premium */}
            <Button
              onClick={() => setLoginType('doctor')}
              className={clsx(
                "w-full h-auto p-6 bg-gradient-to-br from-purple-600 to-indigo-600",
                "hover:from-purple-700 hover:to-indigo-700",
                "text-white flex items-center space-x-4 justify-between",
                "shadow-xl hover:shadow-2xl transition-all duration-300",
                "group animate-fade-in",
                "border border-purple-500/20"
              )}
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="h-7 w-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg mb-1">Sou Médico</div>
                  <div className="text-sm font-normal text-white/90">
                    Gerenciar consultas e agenda
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-white/80 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>

            {/* Botão Paciente - Premium */}
            <Button
              onClick={() => setLoginType('patient')}
              variant="outline"
              className={clsx(
                "w-full h-auto p-6 border-2 border-purple-200 dark:border-purple-800",
                "bg-white dark:bg-slate-800",
                "hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50",
                "dark:hover:from-purple-900/20 dark:hover:to-indigo-900/20",
                "hover:border-purple-300 dark:hover:border-purple-700",
                "flex items-center space-x-4 justify-between",
                "shadow-lg hover:shadow-xl transition-all duration-300",
                "group animate-fade-in"
              )}
              style={{ animationDelay: '200ms' }}
            >
              <div className="flex items-center space-x-4">
                <div className={clsx(
                  "w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100",
                  "dark:from-purple-900/30 dark:to-indigo-900/30",
                  "rounded-xl flex items-center justify-center",
                  "border border-purple-200 dark:border-purple-800",
                  "group-hover:scale-110 transition-transform duration-300"
                )}>
                  <User className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <div className={clsx("font-bold text-lg mb-1", COLORS.text.primary)}>
                    Sou Paciente
                  </div>
                  <div className={clsx("text-sm font-normal", COLORS.text.secondary)}>
                    Agendar e visualizar consultas
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </div>

          {/* Link de Cadastro Premium */}
          <div className="text-center mb-8 animate-fade-in" style={{ animationDelay: '300ms' }}>
            <p className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary, "inline mr-2")}>
              Primeira vez aqui?
            </p>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">
              <Link href="/register/doctor" className="hover:underline transition-all duration-200 hover:text-purple-700 dark:hover:text-purple-300">
                Médico
              </Link>
              {' ou '}
              <Link href="/register/patient" className="hover:underline transition-all duration-200 hover:text-purple-700 dark:hover:text-purple-300">
                Paciente
              </Link>
            </span>
          </div>

          {/* Área Administrativa Premium */}
          <div className="flex justify-center mb-10 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <Link 
              href="/admin/login" 
              className={clsx(
                "flex items-center space-x-2 px-4 py-2 rounded-lg",
                "text-slate-600 dark:text-slate-400",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                "hover:text-slate-900 dark:hover:text-slate-200",
                "transition-all duration-200",
                "border border-slate-200 dark:border-slate-700",
                "hover:border-slate-300 dark:hover:border-slate-600",
                "hover:shadow-md"
              )}
            >
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Área Administrativa</span>
            </Link>
          </div>

          {/* Estatísticas Premium */}
          <div className={clsx(
            "grid grid-cols-3 gap-4 pt-8 border-t-2",
            "border-slate-200 dark:border-slate-700",
            "animate-fade-in"
          )} style={{ animationDelay: '500ms' }}>
            {[
              { value: '5.000+', label: 'Médicos', icon: Stethoscope, color: 'purple' },
              { value: '50.000+', label: 'Pacientes', icon: Users, color: 'blue' },
              { value: '98%', label: 'Satisfação', icon: Star, color: 'amber' },
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className={clsx(
                    "text-center p-4 rounded-xl",
                    "bg-gradient-to-br from-slate-50 to-white",
                    "dark:from-slate-800 dark:to-slate-900",
                    "border border-slate-200 dark:border-slate-700",
                    "hover:shadow-lg transition-all duration-300",
                    "hover:-translate-y-1",
                    "group"
                  )}
                >
                  <div className={clsx(
                    "w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center",
                    stat.color === 'purple' && "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
                    stat.color === 'blue' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                    stat.color === 'amber' && "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
                    "group-hover:scale-110 transition-transform duration-300"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className={clsx(TYPOGRAPHY.heading.h3, COLORS.text.primary, "mb-1")}>
                    {stat.value}
                  </div>
                  <div className={clsx(TYPOGRAPHY.body.small, COLORS.text.secondary)}>
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
