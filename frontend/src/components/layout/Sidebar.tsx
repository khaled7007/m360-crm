"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/use-notifications";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCircle,
  Target,
  Package,
  FileText,
  Landmark,
  HandCoins,
  Bell,
  BarChart3,
  Globe,
  Shield,
  ShieldCheck,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { LucideIcon } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";

interface NavItem {
  key: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "leads", href: "/leads", icon: Target },
  { key: "organizations", href: "/organizations", icon: Building2 },
  { key: "contacts", href: "/contacts", icon: UserCircle },
  { key: "products", href: "/products", icon: Package },
  { key: "applications", href: "/applications", icon: FileText },
  { key: "committee", href: "/committee", icon: Shield },
  { key: "credit_assessment", href: "/credit-assessment", icon: ShieldCheck },
  { key: "facilities", href: "/facilities", icon: Landmark },
  { key: "collections", href: "/collections", icon: HandCoins },
  { key: "integrations", href: "/integrations", icon: Globe },
  { key: "reports", href: "/reports", icon: BarChart3 },
  { key: "users", href: "/users", icon: Users },
  { key: "pipeline", href: "/pipeline", icon: LayoutGrid },
  { key: "notifications", href: "/notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common");
  const tu = useTranslations("users");
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-stone-700">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight">{t("appName")}</span>
        )}
        <button
          onClick={() => { if (mobileOpen) closeMobile(); else setCollapsed(!collapsed); }}
          className={`${collapsed && !mobileOpen ? "mx-auto" : "ms-auto"} p-1 rounded hover:bg-stone-700 hidden lg:block`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
        <button
          onClick={closeMobile}
          className="ms-auto p-1 rounded hover:bg-stone-700 lg:hidden"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label="Main navigation">
        {navItems.map((item) => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = pathname.startsWith(fullHref);
          const label = t(item.key);

          return (
            <Link
              key={item.href}
              href={fullHref}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors ${
                isActive
                  ? "bg-teal-600 text-white"
                  : "text-stone-300 hover:bg-stone-800 hover:text-white"
              }`}
              title={collapsed && !mobileOpen ? label : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {(!collapsed || mobileOpen) && <span className="flex-1">{label}</span>}
              {item.key === "notifications" && unreadCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-medium text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-stone-700 p-3">
        {(!collapsed || mobileOpen) && user && (
          <div className="mb-2">
            <p className="text-sm font-medium truncate">{user.name_en}</p>
            <p className="text-xs text-stone-400 truncate">{tu(`roleLabels.${user.role}` as Parameters<typeof tu>[0])}</p>
          </div>
        )}
        <div className="mb-2">
          <LanguageSwitcher collapsed={collapsed && !mobileOpen} />
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-stone-400 hover:text-white w-full px-1"
          title={t("logout")}
        >
          <LogOut size={16} />
          {(!collapsed || mobileOpen) && <span>{t("logout")}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-40 p-2 rounded-md bg-stone-900 text-white lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-stone-900 text-white flex flex-col transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-60"
        } h-screen bg-stone-900 text-white flex-col transition-all duration-200 flex-shrink-0 hidden lg:flex`}
        role="navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
