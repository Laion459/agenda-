'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
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
    } catch (error) {
      // ignora erros ao encerrar sessão
    } finally {
      logout();
    }
    router.push("/login");
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
      window.addEventListener("notifications:updated", handler);
    }

    void loadUnreadCount();

    return () => {
      mountedRef.current = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("notifications:updated", handler);
      }
    };
  }, []);

  const unreadBadge =
    unreadCount > 0 ? (
      <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
        {unreadCount > 99 ? "99+" : unreadCount}
      </span>
    ) : null;

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-slate-900">
        Agenda+
      </Link>
      <div className="flex items-center gap-3 text-sm text-slate-700">
        <Link href="/notifications" className="relative">
          <Button variant="ghost">Notificações</Button>
          {unreadBadge}
        </Link>
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


