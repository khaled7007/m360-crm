"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface PrefRow {
  event: string;
  email: boolean;
  in_platform: boolean;
}

const EVENTS: { key: string; label: string }[] = [
  { key: "credit_assessment_created", label: "طلب تقييم ائتماني جديد" },
  { key: "credit_assessment_scored",  label: "اكتمل التقييم الائتماني" },
  { key: "committee_created",         label: "طلب تصويت جديد" },
  { key: "committee_decision",        label: "قرار اللجنة" },
  { key: "status_submitted",          label: "طلب جديد بانتظار المراجعة" },
  { key: "status_approved",           label: "تمت الموافقة على الطلب" },
  { key: "status_rejected",           label: "تم رفض الطلب" },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-10 h-6 rounded-full transition-colors focus:outline-none ${
        enabled ? "bg-teal-600" : "bg-stone-300"
      }`}
      aria-pressed={enabled}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          enabled ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0.5 rtl:-translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function NotificationPrefsModal({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState<PrefRow[]>(
    EVENTS.map((e) => ({ event: e.key, email: true, in_platform: true }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? sessionStorage.getItem("m360_token") ?? "" : "";
    api("/notification-prefs", { method: "GET", token })
      .then((data) => {
        const rows = data as PrefRow[];
        // Merge loaded prefs with defaults for any missing events
        const merged = EVENTS.map((e) => {
          const found = rows.find((r) => r.event === e.key);
          return found ?? { event: e.key, email: true, in_platform: true };
        });
        setPrefs(merged);
      })
      .catch(() => {
        // Keep defaults on error
      })
      .finally(() => setIsLoading(false));
  }, []);

  const toggle = (event: string, field: "email" | "in_platform") => {
    setPrefs((prev) =>
      prev.map((p) => (p.event === event ? { ...p, [field]: !p[field] } : p))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token =
        typeof window !== "undefined" ? sessionStorage.getItem("m360_token") ?? "" : "";
      await api("/notification-prefs", { method: "PUT", body: { prefs }, token });
      toast.success("تم حفظ إعدادات الإشعارات");
      onClose();
    } catch {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="إعدادات الإشعارات" size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        </div>
      ) : (
        <div dir="rtl" className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-right py-2 pr-2 font-medium text-stone-700 w-1/2">الحدث</th>
                  <th className="text-center py-2 font-medium text-stone-700 w-1/4">إشعار بالمنصة</th>
                  <th className="text-center py-2 font-medium text-stone-700 w-1/4">إشعار بالبريد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {EVENTS.map((e) => {
                  const pref = prefs.find((p) => p.event === e.key) ?? {
                    event: e.key,
                    email: true,
                    in_platform: true,
                  };
                  return (
                    <tr key={e.key} className="hover:bg-stone-50">
                      <td className="py-3 pr-2 text-stone-800">{e.label}</td>
                      <td className="py-3 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            enabled={pref.in_platform}
                            onToggle={() => toggle(e.key, "in_platform")}
                          />
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex justify-center">
                          <Toggle
                            enabled={pref.email}
                            onToggle={() => toggle(e.key, "email")}
                          />
                        </div>
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
