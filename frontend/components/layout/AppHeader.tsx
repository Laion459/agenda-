'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Calendar, LogOut, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { logout as logoutRequest } from "@/services/auth-service";
import { fetchNotifications } from "@/services/notification-service";
import { useAuthStore } from "@/store/auth-store";

export function AppHeader() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(false);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // ignora erros ao encerrar sessão
    } finally {
      logout();
      // Redireciona para home se for admin, senão para login
      if (user?.role === 'ADMIN') {
        router.push("/");
      } else {
        router.push("/login");
      }
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
        className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white"
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

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
      <div className="flex items-center gap-3">
        {/* Menu Mobile */}
        <MobileMenu />
        
        {/* Logo */}
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 sm:gap-3 text-slate-900" 
          aria-label="Ir para o dashboard"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="text-base sm:text-lg font-bold tracking-tight block">Agenda+</span>
            {getRoleLabel() && (
              <span className="text-xs text-slate-600 block">{getRoleLabel()}</span>
            )}
          </div>
        </Link>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 sm:gap-3 text-sm text-slate-700">
        {/* Notificações - oculto em mobile muito pequeno */}
        <Link 
          href="/notifications" 
          className="relative hidden xs:block"
          aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
        >
          <Button 
            variant="ghost" 
            className="hidden sm:flex items-center gap-2"
            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
          >
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notificações</span>
          </Button>
          <Button 
            variant="ghost" 
            className="sm:hidden p-2"
            aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
          >
            <Bell className="h-5 w-5" />
          </Button>
          {unreadBadge}
        </Link>

        {/* Informações do usuário - oculto em mobile */}
        <div className="hidden md:block text-right">
          <p className="font-medium">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>

        {/* Botão Sair */}
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="flex items-center gap-2 p-2 sm:px-4"
          aria-label="Sair da conta"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sair</span>
        </Button>
      </div>
    </header>
  );
}

