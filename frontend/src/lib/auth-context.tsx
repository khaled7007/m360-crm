"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { api } from "./api";

type User = {
  id: string;
  email: string;
  name_en: string;
  name_ar: string;
  role: string;
  is_active: boolean;
};

type AuthState = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const locale = useLocale();

  const logout = useCallback(async () => {
    try { await fetch("/api/v1/auth/logout"); } catch { /* ignore */ }
    sessionStorage.removeItem("m360_token");
    sessionStorage.removeItem("m360_user");
    setToken(null);
    setUser(null);
    router.push(`/${locale}/login`);
  }, [router, locale]);

  const tryRefresh = useCallback(async (): Promise<string | null> => {
    const refreshToken = sessionStorage.getItem("m360_refresh_token");
    if (!refreshToken) return null;

    try {
      const res = await api<{ token: string; refresh_token: string; user: User }>(
        "/auth/refresh",
        { method: "POST", body: { refresh_token: refreshToken } }
      );
      setToken(res.token);
      setUser(res.user);
      sessionStorage.setItem("m360_token", res.token);
      sessionStorage.setItem("m360_refresh_token", res.refresh_token);
      return res.token;
    } catch {
      void logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    const stored = sessionStorage.getItem("m360_token");
    if (stored) {
      setToken(stored);
      api<User>("/auth/me", { token: stored })
        .then(setUser)
        .catch(async () => {
          const newToken = await tryRefresh();
          if (!newToken) {
            sessionStorage.removeItem("m360_token");
            setToken(null);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [tryRefresh]);

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string; refresh_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(res.token);
    setUser(res.user);
    sessionStorage.setItem("m360_token", res.token);
    sessionStorage.setItem("m360_refresh_token", res.refresh_token);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
