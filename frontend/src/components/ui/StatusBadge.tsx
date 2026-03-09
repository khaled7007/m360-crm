"use client";

import { useTranslations } from "next-intl";

const statusColors: Record<string, string> = {
  // Lead statuses
  new: "bg-teal-100 text-teal-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-green-100 text-green-700",
  unqualified: "bg-red-100 text-red-700",
  converted: "bg-purple-100 text-purple-700",

  // Application statuses
  draft: "bg-stone-100 text-stone-700",
  submitted: "bg-teal-100 text-teal-700",
  pre_approved: "bg-cyan-100 text-cyan-700",
  documents_collected: "bg-indigo-100 text-indigo-700",
  credit_assessment: "bg-orange-100 text-orange-700",
  committee_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  disbursed: "bg-emerald-100 text-emerald-700",

  // Facility statuses
  active: "bg-green-100 text-green-700",
  closed: "bg-stone-100 text-stone-700",
  defaulted: "bg-red-100 text-red-700",

  // Delinquency
  current: "bg-green-100 text-green-700",
  par_1_29: "bg-yellow-100 text-yellow-700",
  par_30: "bg-orange-100 text-orange-700",
  par_60: "bg-red-100 text-red-700",
  par_90: "bg-red-200 text-red-800",

  // Committee
  pending: "bg-yellow-100 text-yellow-700",
  approve: "bg-green-100 text-green-700",
  reject: "bg-red-100 text-red-700",
  defer: "bg-stone-100 text-stone-700",

  // Generic
  true: "bg-green-100 text-green-700",
  false: "bg-red-100 text-red-700",
};

export function StatusBadge({ status }: { status: string }) {
  const tc = useTranslations("common");
  const color = statusColors[status] || "bg-stone-100 text-stone-700";

  let label: string;
  if (status === "true") {
    label = tc("yes");
  } else if (status === "false") {
    label = tc("no");
  } else {
    label = status.replace(/_/g, " ");
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${color}`}
    >
      {label}
    </span>
  );
}
