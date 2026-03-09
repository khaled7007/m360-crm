"use client";

import { useState } from "react";
import { X, RotateCcw, Tag } from "lucide-react";
import { useStatusConfig, DEFAULT_STATUS_CONFIG } from "@/lib/status-config-context";

export function StatusSettingsModal({ onClose }: { onClose: () => void }) {
  const { statusConfig, updateStatus, reset } = useStatusConfig();

  const [draft, setDraft] = useState(() =>
    Object.entries(statusConfig).map(([key, v]) => ({ key, ...v }))
  );

  const handleSave = () => {
    draft.forEach((s) => updateStatus(s.key, { label: s.label, color: s.color, bg: s.bg }));
    onClose();
  };

  const handleReset = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Tag size={20} className="text-teal-600" />
            <h2 className="text-lg font-semibold text-stone-800">إعدادات وسوم الحالات</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-stone-100">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-xs text-stone-400 mb-4">
            التغييرات تنعكس فوراً في صفحة الطلبات وخط سير المبيعات.
          </p>
          <div className="space-y-2">
            {draft.map((s, i) => (
              <div key={s.key} className="flex items-center gap-3 bg-stone-50 rounded-lg px-4 py-3 border border-stone-100">
                {/* Live preview badge */}
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap shrink-0 w-36 text-center"
                  style={{ color: s.color, backgroundColor: s.bg }}
                >
                  {s.label || s.key}
                </span>

                {/* Label input */}
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-0.5 block">الاسم المعروض</label>
                  <input
                    type="text"
                    value={s.label}
                    onChange={(e) => {
                      const next = [...draft];
                      next[i] = { ...next[i], label: e.target.value };
                      setDraft(next);
                    }}
                    className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
                  />
                </div>

                {/* Text color */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <label className="text-xs text-stone-400">النص</label>
                  <input
                    type="color"
                    value={s.color}
                    onChange={(e) => {
                      const next = [...draft];
                      next[i] = { ...next[i], color: e.target.value };
                      setDraft(next);
                    }}
                    className="w-8 h-8 rounded cursor-pointer border border-stone-200"
                  />
                </div>

                {/* Background color */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <label className="text-xs text-stone-400">الخلفية</label>
                  <input
                    type="color"
                    value={s.bg}
                    onChange={(e) => {
                      const next = [...draft];
                      next[i] = { ...next[i], bg: e.target.value };
                      setDraft(next);
                    }}
                    className="w-8 h-8 rounded cursor-pointer border border-stone-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-600 transition"
          >
            <RotateCcw size={14} />
            إعادة تعيين الافتراضي
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition text-sm">
              إلغاء
            </button>
            <button onClick={handleSave} className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium">
              حفظ التغييرات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
