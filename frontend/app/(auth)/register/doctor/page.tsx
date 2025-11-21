'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Stethoscope, ArrowLeft, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';

const schema = z
  .object({
    name: z.string().min(3, 'Informe o nome completo'),
    crm: z.string().min(4, 'Informe o CRM'),
    crm_uf: z.string().min(2, 'Selecione a UF do CRM'),
    specialty: z.string().min(1, 'Selecione a especialidade'),
    email: z.string().email('E-mail inválido'),
    phone: z.string().min(10, 'Informe o telefone'),
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

const SPECIALTIES = [
  'Cardiologia', 'Dermatologia', 'Endocrinologia', 'Ginecologia',
  'Neurologia', 'Oftalmologia', 'Ortopedia', 'Pediatria',
  'Psiquiatria', 'Urologia', 'Clínica Geral', 'Outra'
];

export default function DoctorRegisterPage() {
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
      const { registerDoctor } = await import('@/services/auth-service');
      await registerDoctor({
        name: values.name,
        email: values.email,
        phone: values.phone,
        password: values.password,
        crm: `${values.crm}-${values.crm_uf}`,
        specialty: values.specialty,
      });
      // Sucesso - redireciona para login
      router.push('/login/doctor?registered=true');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.errors?.email?.[0] || 
                          error?.response?.data?.errors?.crm?.[0] ||
                          'Não foi possível cadastrar. Verifique os dados informados.';
      setError('email', {
        type: 'manual',
        message: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Cadastro de Médico</h1>
        <p className="text-slate-600">Crie sua conta profissional</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" placeholder="Dr. João Silva" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="crm_uf">UF do CRM</Label>
              <div className="relative">
                <select
                  id="crm_uf"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  {...register('crm_uf')}
                >
                  <option value="">Selecione o estado</option>
                  {BRAZIL_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              {errors.crm_uf && <p className="text-xs text-red-500">{errors.crm_uf.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" placeholder="(11) 98765-4321" {...register('phone')} />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <PasswordInput
                id="password"
                placeholder="Mínimo 8 caracteres"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crm">CRM</Label>
              <Input id="crm" placeholder="12345" {...register('crm')} />
              {errors.crm && <p className="text-xs text-red-500">{errors.crm.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade</Label>
              <div className="relative">
                <select
                  id="specialty"
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none"
                  {...register('specialty')}
                >
                  <option value="">Selecione a especialidade</option>
                  {SPECIALTIES.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>
              {errors.specialty && <p className="text-xs text-red-500">{errors.specialty.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
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
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          disabled={loading}
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </Button>
      </form>

      {/* Already have account */}
      <div className="text-center space-y-3">
        <p className="text-sm text-slate-600">Já tem conta?</p>
        <Link href="/login/doctor" className="block">
          <Button variant="outline" className="w-full border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 text-purple-600">
            Fazer login
          </Button>
        </Link>
      </div>

      {/* Back Link */}
      <div className="text-center">
        <Link href="/" className="inline-flex items-center space-x-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Link>
      </div>
    </div>
  );
}

