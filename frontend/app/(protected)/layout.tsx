'use client';

import { useEffect } from "react";

import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { useAuthStore } from "@/store/auth-store";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

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
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out" 
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


