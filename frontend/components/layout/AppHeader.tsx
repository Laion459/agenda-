'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Calendar, LogOut, Bell, Moon, Sun, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { logout as logoutRequest } from "@/services/auth-service";
import { fetchNotifications } from "@/services/notification-service";
import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { useDarkMode } from "@/hooks/use-dark-mode";

export function AppHeader() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(false);
  const { isDark, toggleDarkMode, mounted } = useDarkMode();

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // ignora erros ao encerrar sessão
    } finally {
      logout();
      // Redireciona para home
      router.push("/");
    }
  };

  useEffect(() => {
    async function loadUnreadCount() {
      if (!mountedRef.current) return;
      try {
        const response = await fetchNotifications({ per_page: 1 });
        if (mountedRef.current) {
          setUnreadCount(response.meta.unread_count ?? 0);
        }
      } catch {
        // ignora erros na contagem inicial
      }
    }

    const handler = (event: CustomEvent<number>) => {
      if (typeof event.detail === "number") {
        setUnreadCount(event.detail);
      }
    };

    mountedRef.current = true;

    if (typeof window !== "undefined") {
      window.addEventListener("notifications:updated", handler as EventListener);
    }

    void loadUnreadCount();

    return () => {
      mountedRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("notifications:updated", handler as EventListener);
      }
    };
  }, []);

  const unreadBadge =
    unreadCount > 0 ? (
      <span 
        className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white animate-pulse-slow shadow-lg"
        aria-label={`${unreadCount} notificações não lidas`}
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    ) : null;

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'DOCTOR':
        return 'Portal do Médico';
      case 'PATIENT':
        return 'Portal do Paciente';
      case 'ADMIN':
        return 'Área Administrativa';
      default:
        return '';
    }
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 px-4 sm:px-6 py-4 sticky top-0 z-20 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95">
      <div className="flex items-center gap-3">
        {/* Menu Mobile */}
        <div className="lg:hidden">
          <MobileMenu />
        </div>
        
        {/* Logo e Título */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 sm:gap-3 text-slate-900 dark:text-white transition-all duration-200 hover:opacity-80"
          aria-label="Ir para o dashboard"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden transition-transform duration-200 hover:scale-105">
            <Image
              src="/logo.png"
              alt="Agenda+"
              width={48}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="hidden sm:block">
            <span className="text-base sm:text-lg font-bold tracking-tight block">Agenda+</span>
            {getRoleLabel() && (
              <span className="text-xs text-slate-600 dark:text-slate-400 block">{getRoleLabel()}</span>
            )}
          </div>
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            onClick={toggleDarkMode}
            className="relative h-11 w-11 p-0 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-800 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg group overflow-hidden"
            aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
            title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          >
            <div className="relative w-full h-full flex items-center justify-center z-10">
              {isDark ? (
                <>
                  <Sun className="h-5 w-5 flex-shrink-0 text-amber-500 dark:text-amber-400 transition-all duration-500 group-hover:rotate-180 group-hover:scale-110 drop-shadow-sm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 flex-shrink-0 text-slate-700 dark:text-slate-300 transition-all duration-500 group-hover:scale-110 drop-shadow-sm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              )}
            </div>
          </Button>
        )}
        
        {/* Notificações */}
        <Link 
          href="/notifications" 
          className="relative"
          aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        >
          <Button 
            variant="ghost" 
            className="h-11 w-11 p-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
          >
            <Bell className="h-5 w-5 text-slate-700 dark:text-slate-300 flex-shrink-0" />
          </Button>
          {unreadBadge}
        </Link>

        {/* Avatar do usuário */}
        <Link
          href="/profile"
          className="hidden sm:flex items-center justify-center w-11 h-11 rounded-full bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all duration-200 hover:scale-110 active:scale-95 shadow-md hover:shadow-lg cursor-pointer border-2 border-blue-500 dark:border-blue-400"
          aria-label="Ir para o perfil"
          title="Editar perfil"
        >
          {getUserInitials()}
        </Link>

        {/* Botão Sair */}
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="h-11 w-11 p-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          aria-label="Sair da conta"
          title="Sair da conta"
        >
          <LogOut className="h-5 w-5 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200 flex-shrink-0" />
        </Button>
      </div>
    </header>
  );
}

