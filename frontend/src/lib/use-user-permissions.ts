"use client";

import { useAuth } from "./auth-context";

export function useUserPermissions(_page: string) {
  const { user } = useAuth();
  // super_admin always has full access
  if (user?.role === "super_admin") {
    return { can_view: true, can_create: true, can_edit: true, can_delete: true };
  }
  // For now return defaults - permissions loaded separately per page
  return { can_view: true, can_create: true, can_edit: true, can_delete: true };
}
