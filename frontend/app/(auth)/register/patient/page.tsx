'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AxiosError } from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { User, ArrowLeft, ChevronDown, Calendar, CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { registerPatient } from '@/services/auth-service';
import { clsx } from 'clsx';
import { TYPOGRAPHY, COLORS, TRANSITIONS } from '@/constants/design-tokens';

const schema = z
  .object({
    name: z.string().min(3, 'Informe o nome completo'),
    cpf: z.string().min(11, 'Informe o CPF'),
    birth_date: z.string().min(1, 'Informe a data de nascimento'),
    gender: z.string().min(1, 'Selecione o sexo'),
    phone: z.string().min(10, 'Informe o telefone'),
    email: z.string().email('E-mail inválido'),
    address: z.string().min(5, 'Informe o endereço'),
    city: z.string().min(2, 'Informe a cidade'),
    state: z.string().min(2, 'Selecione a UF'),
    password: z.string().min(8, 'Senha com pelo menos 8 caracteres'),
    confirm_password: z.string(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'Você deve aceitar os termos',
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'As senhas não conferem',
    path: ['confirm_password'],
  });

type RegisterForm = z.infer<typeof schema>;

const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const GENDERS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
];

export default function PatientRegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    try {
      await registerPatient({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        cpf: values.cpf,
        birth_date: values.birth_date,
        address: values.address,
        gender: values.gender as 'M' | 'F' | 'OTHER',
      });
      router.push('/');
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      setError('email', {
        type: 'manual',
        message: axiosError?.response?.data?.message ?? 'Não foi possível cadastrar',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Painel Esquerdo - Hero Premium */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-12 flex-col relative overflow-hidden">
        {/* Efeitos de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center">
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                <User className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">Agenda+</h1>
            </div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Cadastro de Paciente
            </h2>
            <p className="text-xl text-white/95 leading-relaxed mb-8">
              Crie sua conta e comece a agendar suas consultas de forma simples e rápida.
            </p>
            <div className="space-y-4">
              {[
                { icon: CheckCircle2, text: 'Agendamento rápido e fácil' },
                { icon: CheckCircle2, text: 'Acompanhamento do seu histórico' },
                { icon: CheckCircle2, text: 'Notificações sobre suas consultas' },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="flex items-center space-x-3 animate-fade-in" style={{ animationDelay: `${idx * 100 + 200}ms` }}>
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-white/95 text-lg">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Painel Direito - Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-2xl space-y-6 animate-fade-in">
          {/* Header Mobile */}
          <div className="lg:hidden space-y-3 text-center mb-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Cadastro de Paciente</h1>
            <p className="text-slate-600 dark:text-slate-400">Crie sua conta para agendar consultas</p>
          </div>

          {/* Card do Formulário */}
          <Card className="shadow-2xl border-2 border-slate-200 dark:border-slate-700">
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Criar Conta</CardTitle>
              <CardDescription className="text-base">Preencha os dados abaixo para se cadastrar</CardDescription>
            </CardHeader>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-6 pb-6">
        {/* Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-500" />
                Nome Completo
              </Label>
              <Input id="name" placeholder="João da Silva" className="h-11" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500 animate-fade-in">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <div className="relative">
                <Input
                  id="birth_date"
                  type="date"
                  {...register('birth_date')}
                  className="pr-10"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              {errors.birth_date && <p className="text-xs text-red-500">{errors.birth_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 98765-4321" {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" placeholder="000.000.000-00" {...register('cpf')} />
              {errors.cpf && <p className="text-xs text-red-500">{errors.cpf.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <div className="relative">
                <select
                  id="gender"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  {...register('gender')}
                >
                  <option value="">Selecione</option>
                  {GENDERS.map((gender) => (
                    <option key={gender.value} value={gender.value}>
                      {gender.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              {errors.gender && <p className="text-xs text-red-500">{errors.gender.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
          </div>
        </div>

        {/* Full Width - Address */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" placeholder="Rua, número, bairro" {...register('address')} />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" placeholder="São Paulo" {...register('city')} />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">UF</Label>
              <div className="relative">
                <select
                  id="state"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  {...register('state')}
                >
                  <option value="">UF</option>
                  {BRAZIL_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
            </div>
          </div>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <PasswordInput
              id="password"
              placeholder="Mínimo 8 caracteres"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirmar Senha</Label>
            <PasswordInput
              id="confirm_password"
              placeholder="Repita a senha"
              {...register('confirm_password')}
            />
            {errors.confirm_password && (
              <p className="text-xs text-red-500">{errors.confirm_password.message}</p>
            )}
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="acceptTerms"
            className="mt-1 w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            {...register('acceptTerms')}
          />
          <Label htmlFor="acceptTerms" className="text-sm text-slate-700 cursor-pointer">
            Aceito os{' '}
            <Link href="/terms" className="text-purple-600 hover:underline">
              termos de uso
            </Link>{' '}
            e{' '}
            <Link href="/privacy" className="text-purple-600 hover:underline">
              política de privacidade
            </Link>
          </Label>
        </div>
        {errors.acceptTerms && (
          <p className="text-xs text-red-500">{errors.acceptTerms.message}</p>
        )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 text-base font-semibold"
                disabled={loading}
              >
                {loading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          </Card>

          {/* Already have account */}
          <div className="text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">Já tem conta?</p>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full border-2 border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 dark:text-purple-400 h-11 transition-all duration-200">
                Fazer login
              </Button>
            </Link>
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-200">
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

