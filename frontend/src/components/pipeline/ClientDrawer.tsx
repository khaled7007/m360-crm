"use client";

import { useState, useEffect } from "react";
import { Client } from "./stageConfig";
import { usePipelineConfig } from "./pipeline-config-context";
import { X } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);

interface ClientDrawerProps {
  client: Client;
  onClose: () => void;
  onUpdate: (client: Client) => void;
}

export function ClientDrawer({ client, onClose, onUpdate }: ClientDrawerProps) {
  const { config: { stages, statusConfig } } = usePipelineConfig();
  const [notes, setNotes] = useState(client.notes ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(client.notes ?? "");
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  const stage = stages.find((s) => s.id === client.stage);
  const statusCfg = statusConfig[client.status] ?? statusConfig["cold"] ?? { label: client.status, color: "#6B7280", bg: "#F3F4F6" };

  const handleSave = () => {
    onUpdate({ ...client, notes });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-start justify-between flex-shrink-0"
          style={{ backgroundColor: stage?.headerBg ?? "#6B7280" }}
        >
          <div className="text-white flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{client.name}</h2>
            <p className="text-sm opacity-80 truncate mt-0.5">{client.company}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors mt-0.5 mr-3 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Badges */}
          <div className="flex gap-2 flex-wrap">
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: stage?.headerBg }}
            >
              {stage?.label}
            </span>
            <span
              className="px-3 py-1 rounded-full text-sm font-semibold"
              style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
            >
              {statusCfg.label}
            </span>
          </div>

          {/* Deal value */}
          <div className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">قيمة الصفقة</div>
            <div className="text-3xl font-bold text-gray-800">{fmt(client.value)}</div>
          </div>

          {/* Fields */}
          <div className="space-y-2.5">
            <Field label="المسؤول" value={client.assignee} />
            <Field label="الجوال" value={client.phone} dir="ltr" />
            <Field label="البريد الإلكتروني" value={client.email} dir="ltr" />
            <Field label="آخر تحديث" value={client.updatedAt} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent leading-relaxed"
              placeholder="أضف ملاحظاتك هنا..."
            />
            <button
              onClick={handleSave}
              className={[
                "mt-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-teal-600 hover:bg-teal-700 text-white",
              ].join(" ")}
            >
              {saved ? "✓ تم الحفظ" : "حفظ الملاحظات"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  dir,
}: {
  label: string;
  value?: string;
  dir?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm font-medium text-gray-800 truncate" dir={dir}>
          {value || "—"}
        </div>
      </div>
    </div>
  );
}
