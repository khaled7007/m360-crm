"use client";

import { useStatusConfig } from "@/lib/status-config-context";

// Fallback Tailwind classes for statuses not in the global config
const fallbackColors: Record<string, string> = {
  new: "bg-teal-100 text-teal-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-green-100 text-green-700",
  unqualified: "bg-red-100 text-red-700",
  converted: "bg-purple-100 text-purple-700",
  active: "bg-green-100 text-green-700",
  closed: "bg-stone-100 text-stone-700",
  defaulted: "bg-red-100 text-red-700",
  current: "bg-green-100 text-green-700",
  par_1_29: "bg-yellow-100 text-yellow-700",
  par_30: "bg-orange-100 text-orange-700",
  par_60: "bg-red-100 text-red-700",
  par_90: "bg-red-200 text-red-800",
  pending: "bg-yellow-100 text-yellow-700",
  approve: "bg-green-100 text-green-700",
  reject: "bg-red-100 text-red-700",
  defer: "bg-stone-100 text-stone-700",
  true: "bg-green-100 text-green-700",
  false: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string | undefined | null }) {
  const { statusConfig } = useStatusConfig();
  if (!status) return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-500">—</span>;
  const cfg = statusConfig[status];

  if (cfg) {
    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
        style={{ color: cfg.color, backgroundColor: cfg.bg }}
      >
        {cfg.label}
      </span>
    );
  }

  // Fallback for statuses not in config (leads, facilities, etc.)
  const cls = fallbackColors[status] || "bg-stone-100 text-stone-700";
  const label = status === "true" ? "نعم" : status === "false" ? "لا" : (status ?? "").replace(/_/g, " ");

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${cls}`}>
      {label}
    </span>
  );
}
