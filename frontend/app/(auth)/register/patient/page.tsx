'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { User, ArrowLeft, ChevronDown, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { registerPatient } from '@/services/auth-service';

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
      router.push('/login/patient');
    } catch (error: any) {
      setError('email', {
        type: 'manual',
        message: error?.response?.data?.message ?? 'Não foi possível cadastrar',
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
            <User className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Cadastro de Paciente</h1>
        <p className="text-slate-600">Crie sua conta para agendar consultas</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Two Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" placeholder="João da Silva" {...register('name')} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
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
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={loading}
        >
          {loading ? 'Criando conta...' : 'Criar Conta'}
        </Button>
      </form>

      {/* Already have account */}
      <div className="text-center space-y-3">
        <p className="text-sm text-slate-600">Já tem conta?</p>
        <Link href="/login/patient" className="block">
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

