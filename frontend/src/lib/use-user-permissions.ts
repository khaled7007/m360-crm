"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-context";

interface PagePermission {
  page: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const FULL_ACCESS: PagePermission = { page: "", can_view: true, can_create: true, can_edit: true, can_delete: true };
const READ_ONLY: PagePermission  = { page: "", can_view: true, can_create: false, can_edit: false, can_delete: false };

// Default permissions by role (fallback when no override saved)
function defaultForRole(role: string, page: string): PagePermission {
  const base = { page, can_view: true, can_create: true, can_edit: true, can_delete: true };
  if (role === "viewer") return { ...READ_ONLY, page };
  if (role === "super_admin") return { ...FULL_ACCESS, page };
  if (role === "credit_officer") {
    if (["users", "products", "integrations"].includes(page)) return { ...base, can_create: false, can_edit: false, can_delete: false };
  }
  if (role === "sales_officer" || role === "sales_manager") {
    if (["credit-assessment", "committee", "facilities", "collections"].includes(page)) return { ...base, can_create: false, can_edit: false, can_delete: false };
  }
  if (role === "care_manager") {
    if (["credit-assessment", "committee"].includes(page)) return { ...base, can_create: false, can_edit: false, can_delete: false };
  }
  return base;
}

const permCache: Record<string, PagePermission[]> = {};

export function useUserPermissions(page: string): PagePermission {
  const { user, token } = useAuth();
  const [perms, setPerms] = useState<PagePermission[]>([]);

  useEffect(() => {
    if (!user || !token) return;
    if (user.role === "super_admin") return; // super_admin always full access

    const cacheKey = user.id;
    if (permCache[cacheKey]) {
      setPerms(permCache[cacheKey]);
      return;
    }

    fetch(`/api/v1/user-permissions/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data?.permissions) && data.permissions.length > 0) {
          permCache[cacheKey] = data.permissions;
          setPerms(data.permissions);
        }
      })
      .catch(() => {});
  }, [user, token]);

  if (!user) return { ...READ_ONLY, page };
  if (user.role === "super_admin") return { ...FULL_ACCESS, page };

  // Check saved overrides first
  const saved = perms.find(p => p.page === page);
  if (saved) return saved;

  // Fall back to role defaults
  return defaultForRole(user.role, page);
}
