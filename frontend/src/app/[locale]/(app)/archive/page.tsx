"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { Trash2, Archive, RotateCcw } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const ADMIN_ROLES = ["super_admin", "admin"];

interface ArchivedItem extends Record<string, unknown> {
  id: string;
  _type: "leads" | "organizations" | "contacts";
  _archived_at: string;
  name_ar?: string;
  name_en?: string;
  contact_name?: string;
  company_name?: string;
  email?: string;
  phone?: string;
}

const typeLabel: Record<string, string> = {
  leads: "عميل محتمل",
  organizations: "طالب تمويل",
  contacts: "جهة اتصال",
};

const typeColor: Record<string, string> = {
  leads: "bg-blue-100 text-blue-700",
  organizations: "bg-teal-100 text-teal-700",
  contacts: "bg-purple-100 text-purple-700",
};

export default function ArchivePage() {
  const { user, token } = useAuth();
  const canPurge = ADMIN_ROLES.includes(user?.role || "");
  const [purgeItem, setPurgeItem] = useState<ArchivedItem | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const { data: items, isLoading, error, refetch } = useApiList<ArchivedItem>("/archive");
  const { mutate: purge, isSubmitting: isPurging } = useApiMutation<object, void>(
    `/archive/${purgeItem?.id}`, "DELETE"
  );

  const handleRestore = async (item: ArchivedItem) => {
    setRestoring(item.id);
    try {
      await fetch(`/api/v1/archive/${item.id}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(`تم استرجاع "${displayName(item)}" بنجاح`);
      refetch();
    } catch {
      toast.error("فشل الاسترجاع");
    } finally {
      setRestoring(null);
    }
  };

  const displayName = (item: ArchivedItem) =>
    item.name_ar || item.name_en || item.company_name || item.contact_name || item.id;

  const handlePurge = async () => {
    try {
      await purge({});
      toast.success("تم الحذف النهائي");
      setPurgeItem(null);
      refetch();
    } catch {
      toast.error("فشل الحذف النهائي");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="الأرشيف" description="العناصر المحذوفة من العملاء المحتملين وطالبي التمويل وجهات الاتصال" />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {error && <p className="text-red-500 text-center py-8">فشل تحميل الأرشيف</p>}
      {!isLoading && !error && items.length === 0 && (
        <div className="py-16 text-center text-stone-400 flex flex-col items-center gap-3">
          <Archive size={40} className="text-stone-300" />
          <p>الأرشيف فارغ</p>
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[item._type] || "bg-stone-100 text-stone-600"}`}>
                  {typeLabel[item._type] || item._type}
                </span>
                <div>
                  <p className="font-medium text-sm text-stone-800">{displayName(item)}</p>
                  {(item.phone || item.email) && (
                    <p className="text-xs text-stone-400">{item.phone}{item.phone && item.email ? " · " : ""}{item.email}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-400">
                  {new Date(item._archived_at).toLocaleDateString("ar-SA")}
                </span>
                <button
                  onClick={() => handleRestore(item)}
                  disabled={restoring === item.id}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-teal-700 border border-teal-300 rounded hover:bg-teal-50 transition disabled:opacity-50"
                >
                  <RotateCcw size={13} />
                  {restoring === item.id ? "جارٍ..." : "استرجاع"}
                </button>
                {canPurge && (
                  <button
                    onClick={() => setPurgeItem(item)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 transition"
                  >
                    <Trash2 size={13} />
                    حذف نهائي
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!purgeItem} onClose={() => setPurgeItem(null)} title="حذف نهائي" size="sm">
        {purgeItem && (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              سيتم حذف <span className="font-semibold">{displayName(purgeItem)}</span> نهائياً ولا يمكن التراجع.
            </p>
            <div className="flex gap-3 justify-end pt-2 border-t border-stone-200">
              <button onClick={() => setPurgeItem(null)} className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">إلغاء</button>
              <button onClick={handlePurge} disabled={isPurging}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                <Trash2 size={15} />{isPurging ? "جارٍ..." : "حذف نهائي"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
