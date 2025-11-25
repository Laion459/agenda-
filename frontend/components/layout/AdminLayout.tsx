'use client';

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Stethoscope, Users, FileText, TrendingUp, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/');
    toast.success('Logout realizado com sucesso');
  };

  const navItems = [
    { href: '/admin', label: 'Resumo', icon: Calendar },
    { href: '/admin/doctors', label: 'Médicos', icon: Stethoscope },
    { href: '/admin/patients', label: 'Pacientes', icon: Users },
    { href: '/admin/health-insurances', label: 'Convênios', icon: FileText },
    { href: '/admin/reports', label: 'Relatórios', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold">A+</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Agenda+ Admin</h1>
                <p className="text-sm text-gray-300">Painel Administrativo</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-100 border-b">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                    isActive
                      ? 'text-slate-900 bg-white border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

