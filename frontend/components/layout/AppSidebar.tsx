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

  const links: SidebarLink[] = [
    { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
    { href: "/appointments", label: "Consultas", icon: CalendarDays },
    { href: "/notifications", label: "Notificações", icon: Bell },
  ];

  if (user?.role !== "DOCTOR") {
    links.push({ href: "/doctors", label: "Médicos", icon: CalendarCheck });
  }

  if (user?.role === "PATIENT") {
    links.push({ href: "/patient/observations", label: "Histórico clínico", icon: NotebookText });
  }

  if (user?.role === "ADMIN") {
    links.push(
      { href: "/admin/doctors", label: "Gerenciar médicos", icon: UserCog },
      { href: "/admin/patients", label: "Gerenciar pacientes", icon: Users },
      { href: "/admin/health-insurances", label: "Convênios", icon: ShieldCheck },
    );
  }

  if (user?.role === "DOCTOR") {
    links.push({ href: "/doctor/schedules", label: "Minhas agendas", icon: CalendarClock });
  }

  return (
    <aside className="hidden w-60 flex-col border-r border-slate-200 bg-white p-4 md:flex">
      <nav className="flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


