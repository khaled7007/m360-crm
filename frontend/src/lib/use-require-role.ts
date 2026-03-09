"use client";

import { useAuth } from "./auth-context";

export function useRequireRole(...roles: string[]) {
  const { user } = useAuth();
  const hasAccess = !!user && roles.includes(user.role);
  return { hasAccess, user };
}
