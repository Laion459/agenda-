'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Menu, Calendar, Bell, User, Stethoscope, Users, FileText, TrendingUp, ScrollText, ShieldCheck, LayoutDashboard, CalendarClock, CalendarCheck, NotebookText } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // Fechar menu ao mudar de rota
  useEffect(() => {
    setIsOpen(false);
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

  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard },
      { href: '/appointments', label: 'Consultas', icon: Calendar },
      { href: '/notifications', label: 'Notificações', icon: Bell },
      { href: '/profile', label: 'Meu perfil', icon: NotebookText },
    ];

    if (user?.role === 'PATIENT') {
      baseItems.push({ href: '/doctors', label: 'Médicos', icon: CalendarCheck });
      baseItems.push({ href: '/patient/observations', label: 'Histórico clínico', icon: NotebookText });
    }

    if (user?.role === 'DOCTOR') {
      baseItems.push({ href: '/doctor/schedules', label: 'Minhas agendas', icon: CalendarClock });
    }

    if (user?.role === 'ADMIN') {
      return [
        { href: '/admin', label: 'Resumo', icon: Calendar },
        { href: '/admin/doctors', label: 'Médicos', icon: Stethoscope },
        { href: '/admin/patients', label: 'Pacientes', icon: Users },
        { href: '/admin/users', label: 'Todos os usuários', icon: Users },
        { href: '/admin/health-insurances', label: 'Convênios', icon: ShieldCheck },
        { href: '/admin/reports', label: 'Relatórios', icon: TrendingUp },
        { href: '/admin/audit', label: 'Auditoria', icon: ScrollText },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Botão do menu hambúrguer */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
        aria-label="Abrir menu de navegação"
        aria-expanded={isOpen}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Menu lateral */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out md:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Menu de navegação"
        role="navigation"
      >
        <div className="flex flex-col h-full">
          {/* Header do menu */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-900">Agenda+</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Fechar menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Lista de navegação */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && pathname?.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer do menu */}
          <div className="p-4 border-t border-slate-200">
            <div className="text-sm text-slate-600 mb-2">
              <p className="font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

