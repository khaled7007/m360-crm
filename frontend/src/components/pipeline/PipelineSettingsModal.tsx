"use client";

import { useState } from "react";
import { X, RotateCcw, Settings2 } from "lucide-react";
import { usePipelineConfig } from "./pipeline-config-context";

export function PipelineSettingsModal({ onClose }: { onClose: () => void }) {
  const { config, updateStage, reset } = usePipelineConfig();

  const [stageDraft, setStageDraft] = useState(() =>
    config.stages.map((s) => ({ ...s }))
  );

  const handleSave = () => {
    stageDraft.forEach((s) => updateStage(s.id, { label: s.label, labelEn: s.labelEn, headerBg: s.headerBg }));
    onClose();
  };

  const handleReset = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col" dir="rtl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Settings2 size={20} className="text-teal-600" />
            <h2 className="text-lg font-semibold text-stone-800">إعدادات أعمدة خط سير المبيعات</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-stone-100">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-xs text-stone-400 mb-4">لتعديل أسماء وألوان الوسوم (الحالات)، استخدم إعدادات الطلبات.</p>
          <div className="space-y-2">
            {stageDraft.map((stage, i) => (
              <div key={stage.id} className="flex items-center gap-3 bg-stone-50 rounded-lg px-4 py-3 border border-stone-100">
                <label className="cursor-pointer" title="لون العمود">
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: stage.headerBg }} />
                  <input type="color" value={stage.headerBg} className="sr-only"
                    onChange={(e) => {
                      const next = [...stageDraft];
                      next[i] = { ...next[i], headerBg: e.target.value };
                      setStageDraft(next);
                    }}
                  />
                </label>
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-0.5 block">الاسم بالعربية</label>
                  <input type="text" value={stage.label}
                    onChange={(e) => {
                      const next = [...stageDraft];
                      next[i] = { ...next[i], label: e.target.value };
                      setStageDraft(next);
                    }}
                    className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-stone-400 mb-0.5 block">الاسم بالإنجليزية</label>
                  <input type="text" dir="ltr" value={stage.labelEn}
                    onChange={(e) => {
                      const next = [...stageDraft];
                      next[i] = { ...next[i], labelEn: e.target.value };
                      setStageDraft(next);
                    }}
                    className="w-full border border-stone-200 rounded-md px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-400 focus:border-transparent bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-stone-200">
          <button onClick={handleReset} className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-600 transition">
            <RotateCcw size={14} />
            إعادة تعيين الافتراضي
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition text-sm">إلغاء</button>
            <button onClick={handleSave} className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium">حفظ</button>
          </div>
        </div>
      </div>
    </div>
  );
}
