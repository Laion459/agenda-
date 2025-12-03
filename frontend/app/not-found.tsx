'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft, Search, FileQuestion, AlertCircle, LogIn, UserPlus, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TYPOGRAPHY, COLORS, SPACING, ELEVATION } from '@/constants/design-tokens';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth-store';

export default function NotFound() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!user;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl w-full">
        <div className="text-center space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Link href="/" className="inline-block">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-200 hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Agenda+"
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Número 404 e título */}
          <div className="space-y-4">
            <div className="relative inline-block">
              <h1 className={clsx(
                "text-7xl sm:text-8xl lg:text-9xl font-bold",
                "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent",
                "drop-shadow-sm"
              )}>
                404
              </h1>
              <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center animate-bounce-in">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className={clsx(
                TYPOGRAPHY.heading.h2,
                COLORS.text.primary,
                "text-2xl sm:text-3xl"
              )}>
                Página não encontrada
              </h2>
              <p className={clsx(
                TYPOGRAPHY.body.base,
                COLORS.text.secondary,
                "max-w-lg mx-auto text-base sm:text-lg"
              )}>
                A página que você está procurando não existe, foi movida ou o endereço está incorreto.
              </p>
            </div>
          </div>

          {/* Ilustração */}
          <div className="flex justify-center py-4">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-full blur-3xl animate-pulse-slow" />
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center shadow-xl border-4 border-blue-200 dark:border-blue-800 transition-transform duration-300 hover:scale-105">
                  <FileQuestion className="w-20 h-20 sm:w-24 sm:h-24 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Ações principais */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 pt-6">
            <Link href="/" className="flex-1 sm:flex-none">
              <Button size="lg" className="w-full sm:w-auto min-w-[200px]">
                <Home className="h-5 w-5 mr-2" />
                Voltar para o início
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto min-w-[200px]"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </div>

          {/* Links úteis */}
          <div className="pt-8 mt-8 border-t border-slate-200 dark:border-slate-700">
            <p className={clsx(
              TYPOGRAPHY.body.small,
              COLORS.text.secondary,
              "mb-4 font-medium"
            )}>
              {isAuthenticated ? 'Páginas úteis:' : 'Acesso rápido:'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                      "text-sm font-medium transition-all duration-200",
                      "text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400",
                      "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                      "border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                    )}
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/appointments"
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                      "text-sm font-medium transition-all duration-200",
                      "text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400",
                      "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                      "border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                    )}
                  >
                    <Search className="h-4 w-4" />
                    Consultas
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                      "text-sm font-medium transition-all duration-200",
                      "text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400",
                      "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                      "border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    Fazer login
                  </Link>
                  <Link
                    href="/register/patient"
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                      "text-sm font-medium transition-all duration-200",
                      "text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400",
                      "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                      "border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                    )}
                  >
                    <UserPlus className="h-4 w-4" />
                    Criar conta
                  </Link>
                  <Link
                    href="/register/doctor"
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2.5 rounded-lg",
                      "text-sm font-medium transition-all duration-200",
                      "text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400",
                      "hover:bg-blue-50 dark:hover:bg-blue-900/20",
                      "border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600"
                    )}
                  >
                    <Stethoscope className="h-4 w-4" />
                    Sou médico
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

