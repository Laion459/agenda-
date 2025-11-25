'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

import { clsx } from "clsx";
import {
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  NotebookText,
  ShieldCheck,
  Bell,
  UserCog,
  Users,
  ScrollText,
  BarChart3,
} from "lucide-react";

import { useAuthStore } from "@/store/auth-store";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export function AppSidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  const links: SidebarLink[] = [];

  // Menu unificado baseado no papel do usuário
  if (user?.role === "ADMIN") {
    // Admin tem menu completo unificado
    links.push(
      { href: "/admin", label: "Resumo", icon: LayoutDashboard },
      { href: "/admin/doctors", label: "Médicos", icon: UserCog },
      { href: "/admin/patients", label: "Pacientes", icon: Users },
      { href: "/admin/users", label: "Usuários", icon: Users },
      { href: "/admin/health-insurances", label: "Convênios", icon: ShieldCheck },
      { href: "/admin/reports", label: "Relatórios", icon: BarChart3 },
      { href: "/admin/audit", label: "Auditoria", icon: ScrollText },
      { href: "/appointments", label: "Consultas", icon: CalendarDays },
      { href: "/notifications", label: "Notificações", icon: Bell },
      { href: "/profile", label: "Meu perfil", icon: NotebookText },
    );
  } else if (user?.role === "DOCTOR") {
    // Menu para médico
    links.push(
      { href: "/doctor/dashboard", label: "Visão geral", icon: LayoutDashboard },
      { href: "/doctor/schedules", label: "Minhas agendas", icon: CalendarClock },
      { href: "/appointments", label: "Consultas", icon: CalendarDays },
      { href: "/notifications", label: "Notificações", icon: Bell },
      { href: "/profile", label: "Meu perfil", icon: NotebookText },
    );
  } else {
    // Menu para paciente
    links.push(
      { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
      { href: "/appointments", label: "Consultas", icon: CalendarDays },
      { href: "/doctors", label: "Médicos", icon: CalendarCheck },
      { href: "/patient/observations", label: "Histórico clínico", icon: NotebookText },
      { href: "/notifications", label: "Notificações", icon: Bell },
      { href: "/profile", label: "Meu perfil", icon: NotebookText },
    );
  }

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-700 lg:flex">
      <nav className="flex flex-col gap-1 p-4">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || 
            (link.href !== "/admin" && link.href !== "/dashboard" && link.href !== "/doctor/dashboard" && 
             pathname?.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                active
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-500"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


