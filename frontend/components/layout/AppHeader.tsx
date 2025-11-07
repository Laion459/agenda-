'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { logout as logoutRequest } from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";

export function AppHeader() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch (error) {
      // ignora erros ao encerrar sessão
    } finally {
      logout();
    }
    router.push("/login");
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-slate-900">
        Agenda+
      </Link>
      <div className="flex items-center gap-3 text-sm text-slate-700">
        <div className="text-right">
          <p className="font-medium">{user?.name}</p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Sair
        </Button>
      </div>
    </header>
  );
}


