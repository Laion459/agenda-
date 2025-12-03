'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  X, 
  Menu, 
  Calendar, 
  Bell, 
  Stethoscope, 
  Users, 
  BarChart3, 
  ScrollText, 
  ShieldCheck, 
  LayoutDashboard, 
  CalendarClock, 
  CalendarCheck, 
  NotebookText,
  Shield,
  LogOut,
  UserCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { logout as logoutRequest } from '@/services/auth-service';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/design-tokens';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: number;
}

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  // Garantir que o componente está montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fechar menu ao mudar de rota
  useEffect(() => {
    if (isOpen) {
      handleClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Prevenir scroll do body quando menu está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsClosing(false);
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // ignora erros ao encerrar sessão
    } finally {
      logout();
      handleClose();
      router.push("/");
    }
  };

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
      { href: '/appointments', label: 'Consultas', icon: Calendar },
      { href: '/notifications', label: 'Notificações', icon: Bell },
      { href: '/profile', label: 'Meu perfil', icon: NotebookText },
    ];

    if (user?.role === 'PATIENT') {
      baseItems.splice(2, 0, { href: '/doctors', label: 'Médicos', icon: CalendarCheck });
      baseItems.push({ href: '/patient/observations', label: 'Histórico clínico', icon: NotebookText });
    }

    if (user?.role === 'DOCTOR') {
      baseItems.splice(2, 0, { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard });
      baseItems.splice(3, 0, { href: '/doctor/schedules', label: 'Minhas agendas', icon: CalendarClock });
    }

    if (user?.role === 'ADMIN') {
      return [
        { href: '/admin', label: 'Resumo', icon: LayoutDashboard },
        { href: '/admin/doctors', label: 'Médicos', icon: Stethoscope },
        { href: '/admin/patients', label: 'Pacientes', icon: Users },
        { href: '/admin/admins', label: 'Administradores', icon: Shield },
        { href: '/admin/users', label: 'Todos os usuários', icon: Users },
        { href: '/admin/health-insurances', label: 'Convênios', icon: ShieldCheck },
        { href: '/admin/reports', label: 'Relatórios', icon: BarChart3 },
        { href: '/admin/audit', label: 'Auditoria', icon: ScrollText },
        { href: '/appointments', label: 'Consultas', icon: Calendar },
        { href: '/notifications', label: 'Notificações', icon: Bell },
        { href: '/profile', label: 'Meu perfil', icon: NotebookText },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'Área Administrativa';
      case 'DOCTOR':
        return 'Portal do Médico';
      case 'PATIENT':
        return 'Portal do Paciente';
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

  const menuContent = mounted && isOpen ? (
    <>
      {/* Overlay com animação suave */}
      <div
        className={clsx(
          "fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] lg:hidden",
          "transition-all duration-300 ease-out",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Menu lateral */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-80 sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-[9999]',
          'transform transition-all duration-300 ease-out lg:hidden',
          'backdrop-blur-xl bg-white/98 dark:bg-slate-900/98',
          'border-r border-slate-200/50 dark:border-slate-700/50',
          isOpen && !isClosing
            ? 'translate-x-0 opacity-100'
            : '-translate-x-full opacity-0'
        )}
        aria-label="Menu de navegação"
        role="navigation"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header do menu */}
          <div className={clsx(
            "relative flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700",
            "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800",
            "shadow-sm"
          )}>
            {/* Decoração de fundo */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:from-blue-500/10 dark:via-indigo-500/10 dark:to-purple-500/10" />
            
            <div className="relative flex items-center gap-4 z-10">
              {/* Logo com gradiente */}
              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Image
                  src="/logo.png"
                  alt="Agenda+"
                  width={32}
                  height={32}
                  className="relative z-10 w-8 h-8 object-contain"
                  priority
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className={clsx(
                  TYPOGRAPHY.heading.h2,
                  "font-bold text-slate-900 dark:text-white truncate"
                )}>
                  Agenda+
                </h2>
                <p className={clsx(
                  TYPOGRAPHY.body.small,
                  "text-slate-600 dark:text-slate-400 truncate mt-0.5"
                )}>
                  {getRoleLabel()}
                </p>
              </div>
            </div>
            
            {/* Botão fechar */}
            <button
              onClick={handleClose}
              className={clsx(
                "relative h-11 w-11 p-0 rounded-xl border-2 border-slate-200 dark:border-slate-700",
                "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900",
                "hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-800",
                "transition-all duration-300 hover:scale-110 active:scale-95",
                "shadow-md hover:shadow-lg group overflow-hidden z-10",
                "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              )}
              aria-label="Fechar menu"
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <X className="h-5 w-5 text-slate-700 dark:text-slate-300 transition-all duration-300 group-hover:rotate-90 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-orange-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </button>
          </div>

          {/* Perfil do usuário */}
          <div className={clsx(
            "p-6 border-b border-slate-200 dark:border-slate-700",
            "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
          )}>
            <div className="flex items-center gap-4">
              {/* Avatar com gradiente */}
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 shadow-lg flex items-center justify-center text-white font-bold text-lg border-4 border-white dark:border-slate-800 ring-2 ring-blue-500/20">
                {getUserInitials()}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/50 to-indigo-500/50 animate-pulse" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className={clsx(
                  TYPOGRAPHY.body.base,
                  "font-semibold text-slate-900 dark:text-white truncate"
                )}>
                  {user?.name || 'Usuário'}
                </p>
                <p className={clsx(
                  TYPOGRAPHY.body.small,
                  "text-slate-600 dark:text-slate-400 capitalize truncate mt-0.5"
                )}>
                  {user?.role?.toLowerCase().replace('_', ' ') || ''}
                </p>
                <p className={clsx(
                  TYPOGRAPHY.body.tiny,
                  "text-slate-500 dark:text-slate-500 truncate mt-1"
                )}>
                  {user?.email || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de navegação */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            <ul className="space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && item.href !== '/dashboard' && item.href !== '/doctor/dashboard' && 
                   pathname?.startsWith(item.href));

                return (
                  <li 
                    key={item.href}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <Link
                      href={item.href}
                      className={clsx(
                        'group relative flex items-center gap-4 rounded-xl px-4 py-3.5',
                        'text-sm font-medium transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                        'overflow-hidden',
                        isActive
                          ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 text-blue-700 dark:text-blue-300 shadow-md border-l-4 border-blue-600 dark:border-blue-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:translate-x-1'
                      )}
                      onClick={handleClose}
                    >
                      {/* Efeito de fundo animado para item ativo */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 animate-pulse-slow" />
                      )}
                      
                      {/* Ícone com animação */}
                      <div className={clsx(
                        "relative z-10 flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-110"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110"
                      )}>
                        <Icon className="h-5 w-5 transition-transform duration-200" />
                      </div>
                      
                      {/* Label */}
                      <span className={clsx(
                        "relative z-10 flex-1 transition-all duration-200",
                        isActive && "font-semibold"
                      )}>
                        {item.label}
                      </span>
                      
                      {/* Badge (se houver) */}
                      {item.badge && item.badge > 0 && (
                        <span className={clsx(
                          "relative z-10 flex items-center justify-center min-w-[20px] h-5 px-2 rounded-full text-xs font-bold",
                          "bg-red-500 text-white shadow-md animate-pulse"
                        )}>
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                      
                      {/* Indicador de item ativo */}
                      {isActive && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 shadow-lg animate-pulse" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer do menu */}
          <div className={clsx(
            "p-4 border-t border-slate-200 dark:border-slate-700",
            "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900"
          )}>
            <button
              onClick={handleLogout}
              className={clsx(
                "w-full flex items-center justify-center gap-3 rounded-xl px-4 py-3.5",
                "text-sm font-medium transition-all duration-200",
                "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20",
                "text-red-700 dark:text-red-400",
                "hover:from-red-100 hover:to-orange-100 dark:hover:from-red-900/30 dark:hover:to-orange-900/30",
                "hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
                "border border-red-200 dark:border-red-800",
                "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
                "group"
              )}
            >
              <div className="relative w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:rotate-12">
                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="font-semibold">Sair da conta</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  ) : null;

  return (
    <>
      {/* Botão do menu hambúrguer */}
      <button
        onClick={handleOpen}
        className={clsx(
          "lg:hidden relative h-11 w-11 p-0 rounded-xl border-2 border-slate-200 dark:border-slate-700",
          "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900",
          "hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-700 dark:hover:to-slate-800",
          "transition-all duration-300 hover:scale-105 active:scale-95",
          "shadow-md hover:shadow-lg group overflow-hidden",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        )}
        aria-label="Abrir menu de navegação"
        aria-expanded={isOpen}
      >
        <div className="relative w-full h-full flex items-center justify-center z-10">
          <Menu className="h-5 w-5 text-slate-700 dark:text-slate-300 transition-all duration-300 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </button>

      {/* Renderizar menu e overlay em portal para garantir z-index correto */}
      {mounted && typeof window !== 'undefined' && createPortal(menuContent, document.body)}
    </>
  );
}
