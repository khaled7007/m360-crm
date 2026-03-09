"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Toaster } from "sonner";

/** Routes accessible without a backend/auth (state-only pages). */
const PUBLIC_PATHS = ["/pipeline"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  const isPublic = PUBLIC_PATHS.some((p) => pathname?.includes(p));

  useEffect(() => {
    if (!isLoading && !user && !isPublic) {
      router.push(`/${locale}/login`);
    }
  }, [user, isLoading, router, locale, isPublic]);

  if (isLoading && !isPublic) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user && !isPublic) return null;

  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  );
}
