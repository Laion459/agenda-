'use client';

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { clsx } from "clsx";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isSidebarOpen = useSidebarStore((state) => state.isOpen);

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <AppSidebar />
        <main 
          id="main-content" 
          className={clsx(
            "flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out",
            isSidebarOpen ? "lg:ml-64" : "lg:ml-20" // Margem dinâmica: 256px quando aberto, 80px quando fechado
          )}
          tabIndex={-1}
        >
          <div className="space-y-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


