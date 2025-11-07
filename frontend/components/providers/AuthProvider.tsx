'use client';

import { ReactNode, useEffect } from "react";

import { useAuthStore } from "@/store/auth-store";

interface Props {
  children: ReactNode;
}

export function AuthProvider({ children }: Props) {
  const initialize = useAuthStore((state) => state.initialize);
  const initializing = useAuthStore((state) => state.initializing);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <span className="animate-pulse text-sm font-medium">Carregando…</span>
      </div>
    );
  }

  return <>{children}</>;
}


