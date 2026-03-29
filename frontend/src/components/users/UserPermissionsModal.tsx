"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface PermRow {
  page: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface UserProp {
  id: string;
  name_ar: string;
  email: string;
  role: string;
}

const PAGES: { key: string; label: string }[] = [
  { key: "leads",            label: "العملاء المحتملون" },
  { key: "organizations",    label: "طالبو التمويل" },
  { key: "contacts",         label: "جهات الاتصال" },
  { key: "applications",     label: "الطلبات" },
  { key: "credit-assessment",label: "التقييم الائتماني" },
  { key: "committee",        label: "اللجنة" },
  { key: "facilities",       label: "التسهيلات" },
  { key: "collections",      label: "التحصيل" },
  { key: "pipeline",         label: "خط المبيعات" },
  { key: "reports",          label: "التقارير" },
  { key: "users",            label: "المستخدمون" },
  { key: "integrations",     label: "التكاملات" },
  { key: "products",         label: "المنتجات" },
  { key: "archive",          label: "الأرشيف" },
];

const DEFAULT_PERM = { can_view: true, can_create: true, can_edit: true, can_delete: true };

export function UserPermissionsModal({
  user,
  onClose,
}: {
  user: UserProp;
  onClose: () => void;
}) {
  const [perms, setPerms] = useState<PermRow[]>(
    PAGES.map((p) => ({ page: p.key, ...DEFAULT_PERM }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? sessionStorage.getItem("m360_token") ?? "" : "";
    api(`/user-permissions/${user.id}`, { method: "GET", token })
      .then((data) => {
        const rows = data as PermRow[];
        const merged = PAGES.map((p) => {
          const found = rows.find((r) => r.page === p.key);
          return found ?? { page: p.key, ...DEFAULT_PERM };
        });
        setPerms(merged);
      })
      .catch(() => {
        // Keep defaults on error
      })
      .finally(() => setIsLoading(false));
  }, [user.id]);

  const toggle = (page: string, field: keyof Omit<PermRow, "page">) => {
    setPerms((prev) =>
      prev.map((p) => (p.page === page ? { ...p, [field]: !p[field] } : p))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token =
        typeof window !== "undefined" ? sessionStorage.getItem("m360_token") ?? "" : "";
      await api(`/user-permissions/${user.id}`, {
        method: "PUT",
        body: { permissions: perms },
        token,
      });
      toast.success("تم حفظ الصلاحيات");
      onClose();
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const checkboxCls = "w-4 h-4 rounded border-stone-300 text-teal-600 cursor-pointer accent-teal-600";

  return (
    <Modal open onClose={onClose} title={`صلاحيات: ${user.name_ar}`} size="xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
      ) : (
        <div dir="rtl" className="space-y-4">
          <p className="text-sm text-stone-500">{user.email} — {user.role}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="text-right py-2 pr-3 font-medium text-stone-700">اسم الصفحة</th>
                  <th className="text-center py-2 font-medium text-stone-700 w-20">عرض</th>
                  <th className="text-center py-2 font-medium text-stone-700 w-20">إنشاء</th>
                  <th className="text-center py-2 font-medium text-stone-700 w-20">تعديل</th>
                  <th className="text-center py-2 font-medium text-stone-700 w-20">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {PAGES.map((p) => {
                  const perm = perms.find((r) => r.page === p.key) ?? {
                    page: p.key,
                    ...DEFAULT_PERM,
                  };
                  return (
                    <tr key={p.key} className="hover:bg-stone-50">
                      <td className="py-2.5 pr-3 text-stone-800">{p.label}</td>
                      <td className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_view}
                          onChange={() => toggle(p.key, "can_view")}
                          className={checkboxCls}
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_create}
                          onChange={() => toggle(p.key, "can_create")}
                          className={checkboxCls}
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_edit}
                          onChange={() => toggle(p.key, "can_edit")}
                          className={checkboxCls}
                        />
                      </td>
                      <td className="py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_delete}
                          onChange={() => toggle(p.key, "can_delete")}
                          className={checkboxCls}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
