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
  KeyRound,
  Archive,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { LucideIcon } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
  { key: "archive", href: "/archive", icon: Archive },
];

export function Sidebar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common");
  const tu = useTranslations("users");
  const { user, token, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: "", next: "", confirm: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const pwdRef = useRef(false);

  const handleChangePassword = async () => {
    if (!pwdForm.next || pwdForm.next.length < 6) { toast.error("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"); return; }
    if (pwdForm.next !== pwdForm.confirm) { toast.error("كلمة المرور الجديدة وتأكيدها غير متطابقتين"); return; }
    if (pwdRef.current) return;
    pwdRef.current = true;
    setPwdSaving(true);
    try {
      await api("/auth/change-password", { method: "POST", body: { current_password: pwdForm.current, new_password: pwdForm.next }, token: token ?? "" });
      toast.success("تم تغيير كلمة المرور بنجاح");
      setShowPwdModal(false);
      setPwdForm({ current: "", next: "", confirm: "" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "كلمة المرور الحالية غير صحيحة");
    } finally {
      setPwdSaving(false);
      pwdRef.current = false;
    }
  };

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
          onClick={() => setShowPwdModal(true)}
          className="flex items-center gap-2 text-sm text-stone-400 hover:text-white w-full px-1 mb-1"
          title="تغيير كلمة المرور"
        >
          <KeyRound size={16} />
          {(!collapsed || mobileOpen) && <span>تغيير كلمة المرور</span>}
        </button>
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

      {/* Change Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-lg font-bold text-stone-900 mb-4">تغيير كلمة المرور</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">كلمة المرور الحالية</label>
                <input type="password" value={pwdForm.current} onChange={(e) => setPwdForm((p) => ({ ...p, current: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">كلمة المرور الجديدة</label>
                <input type="password" value={pwdForm.next} onChange={(e) => setPwdForm((p) => ({ ...p, next: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">تأكيد كلمة المرور</label>
                <input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm((p) => ({ ...p, confirm: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowPwdModal(false); setPwdForm({ current: "", next: "", confirm: "" }); }}
                  className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50">إلغاء</button>
                <button type="button" onClick={handleChangePassword} disabled={pwdSaving}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
                  {pwdSaving ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
