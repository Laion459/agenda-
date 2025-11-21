'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Stethoscope, User, Shield, Calendar } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex">
      {/* Painel Esquerdo - Informações */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 p-12 flex-col">
        {/* Logo e Título */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">Agenda+</h1>
          </div>

          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            Bem-vindo ao seu sistema de agendamento clínico
          </h2>
          
          <p className="text-xl text-white/95 leading-relaxed">
            Gerencie consultas, organize sua agenda e ofereça o melhor atendimento aos seus pacientes de forma simples e eficiente.
          </p>
        </div>

        {/* Imagem do Médico */}
        <div className="flex-1 flex items-end">
          <Image
            src="/img/login.jpeg"
            alt="Médico com estetoscópio"
            width={600}
            height={800}
            className="w-full h-auto object-contain max-h-[70vh]"
            priority
          />
        </div>
      </div>

      {/* Painel Direito - Acesso */}
      <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Agenda+</h1>
          </div>

          {/* Título de Acesso */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">
              Escolha como deseja acessar
            </h3>
            <p className="text-slate-600">Selecione o tipo de acesso para continuar</p>
          </div>

          {/* Botões de Acesso */}
          <div className="space-y-4 mb-8">
            {/* Botão Médico - Roxo sólido */}
            <Link href="/login/doctor" className="block">
              <Button
                className="w-full h-auto p-6 bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-4 justify-start shadow-md"
              >
                <Stethoscope className="h-6 w-6 flex-shrink-0 text-white" />
                <div className="text-left">
                  <div className="font-bold text-lg">Sou Médico</div>
                  <div className="text-sm font-normal text-white/90">
                    Gerenciar consultas e agenda
                  </div>
                </div>
              </Button>
            </Link>

            {/* Botão Paciente - Branco com borda roxa clara */}
            <Link href="/login/patient" className="block">
              <Button
                variant="outline"
                className="w-full h-auto p-6 border-2 border-purple-200 bg-white hover:bg-purple-50 hover:border-purple-300 flex items-center space-x-4 justify-start"
              >
                <User className="h-6 w-6 text-purple-400 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-lg text-slate-900">Sou Paciente</div>
                  <div className="text-sm font-normal text-slate-600">
                    Agendar e visualizar consultas
                  </div>
                </div>
              </Button>
            </Link>
          </div>

              {/* Link de Cadastro */}
              <div className="text-center mb-6">
                <p className="text-slate-600 inline mr-2">Primeira vez aqui?</p>
                <span className="text-purple-600 font-semibold">
                  <Link href="/register/doctor" className="hover:underline">Médico</Link>
                  {' ou '}
                  <Link href="/register/patient" className="hover:underline">Paciente</Link>
                </span>
              </div>

          {/* Área Administrativa */}
          <div className="flex justify-center mb-10">
            <Link href="/admin/login" className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors">
              <Shield className="h-4 w-4" />
              <span className="text-sm">Área Administrativa</span>
            </Link>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">5.000+</div>
              <div className="text-sm text-slate-600">Médicos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">50.000+</div>
              <div className="text-sm text-slate-600">Pacientes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 mb-1">98%</div>
              <div className="text-sm text-slate-600">Satisfação</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
