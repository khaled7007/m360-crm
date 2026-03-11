"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { Modal } from "@/components/ui/Modal";
import { Plus, Building2, TrendingUp, ShieldCheck, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface Organization {
  id: string;
  name_en: string;
  name_ar: string;
}

interface CreditAssessment {
  id: string;
  organization_id: string;
  organization_name?: string;
  status: string;
  created_at: string;
  score?: {
    total_score: number;
    risk_grade: string;
    recommendation: string;
  } | null;
}

const gradeColors: Record<string, string> = {
  AA: "bg-emerald-100 text-emerald-800 border-emerald-200",
  A: "bg-green-100 text-green-800 border-green-200",
  BB: "bg-lime-100 text-lime-800 border-lime-200",
  B: "bg-yellow-100 text-yellow-800 border-yellow-200",
  CC: "bg-orange-100 text-orange-800 border-orange-200",
  C: "bg-red-100 text-red-800 border-red-200",
  F: "bg-red-200 text-red-900 border-red-300",
};

const statusConfig: Record<string, { bg: string; dot: string }> = {
  scored: { bg: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  draft: { bg: "bg-stone-50 text-stone-600", dot: "bg-stone-400" },
  approved: { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  referred: { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  declined: { bg: "bg-red-50 text-red-700", dot: "bg-red-500" },
};

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600";
  return (
    <div className={`flex items-center gap-1.5 font-bold text-base ${color}`}>
      <TrendingUp size={16} />
      {score.toFixed(1)}%
    </div>
  );
}

export default function CreditAssessmentListPage() {
  const t = useTranslations("creditAssessment");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [deleteItem, setDeleteItem] = useState<CreditAssessment | null>(null);

  const {
    data: assessments,
    pagination,
    isLoading,
    error,
    refetch,
  } = useApiList<CreditAssessment>("/credit-assessments", page);

  const { data: orgs } = useApiList<Organization>("/organizations", { limit: 200 });

  const { mutate: deleteAssessment, isSubmitting: isDeleting } =
    useApiMutation<Record<string, never>, void>(
      `/credit-assessments/${deleteItem?.id}`,
      "DELETE"
    );

  const handleDeleteConfirm = async () => {
    try {
      await deleteAssessment({});
      toast.success("تم الحذف بنجاح");
      setDeleteItem(null);
      refetch();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const orgMap = useMemo(() => {
    const map = new Map<string, Organization>();
    orgs.forEach((o) => map.set(o.id, o));
    return map;
  }, [orgs]);

  const getOrgName = (item: CreditAssessment) => {
    if (item.organization_name) return item.organization_name;
    const org = orgMap.get(item.organization_id);
    if (!org) return null;
    return locale === "ar" ? (org.name_ar || org.name_en) : (org.name_en || org.name_ar);
  };

  const columns: Column<CreditAssessment>[] = [
    {
      key: "organization",
      header: t("organization"),
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 shrink-0">
            <Building2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-stone-900 truncate">
              {getOrgName(item) || t("unknownOrg")}
            </p>
            <p className="text-xs text-stone-400 font-mono">{item.id.slice(0, 8)}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: tc("status"),
      render: (item) => {
        const cfg = statusConfig[item.status] || statusConfig.draft;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {t(`statuses.${item.status}` as Parameters<typeof t>[0], { defaultValue: item.status })}
          </span>
        );
      },
    },
    {
      key: "score",
      header: t("score"),
      render: (item) =>
        item.score ? (
          <ScoreCircle score={item.score.total_score} />
        ) : (
          <span className="text-stone-400 text-sm">{t("notScored")}</span>
        ),
    },
    {
      key: "grade",
      header: t("grade"),
      render: (item) =>
        item.score ? (
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold ${
              gradeColors[item.score.risk_grade] || "bg-stone-100 border-stone-200"
            }`}
          >
            <ShieldCheck size={13} />
            {item.score.risk_grade}
          </span>
        ) : (
          <span className="text-stone-300">—</span>
        ),
    },
    {
      key: "recommendation",
      header: t("recommendation"),
      render: (item) =>
        item.score?.recommendation ? (
          <span className="text-sm font-medium text-stone-700">
            {t(`recommendations.${item.score.recommendation}` as Parameters<typeof t>[0])}
          </span>
        ) : (
          <span className="text-stone-300">—</span>
        ),
    },
    {
      key: "created_at",
      header: tc("date"),
      render: (item) => (
        <span className="text-sm text-stone-500">
          {new Date(item.created_at).toLocaleDateString("ar-SA", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/${locale}/credit-assessment/${item.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-stone-500 hover:bg-stone-100 rounded transition"
          >
            <Pencil size={14} />
          </Link>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteItem(item); }}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <Link
          href={`/${locale}/credit-assessment/new`}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition shadow-sm"
        >
          <Plus size={20} />
          {t("newAssessment")}
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm text-teal-600 hover:underline"
          >
            {tc("retry")}
          </button>
        </div>
      )}
      {!isLoading && !error && assessments.length === 0 && (
        <div className="py-12 text-center text-stone-500">
          <p>{t("noAssessments")}</p>
        </div>
      )}
      {!isLoading && !error && assessments.length > 0 && (
        <DataTable
          columns={columns}
          data={assessments}
          isLoading={isLoading}
          onRowClick={(a) => {
            window.location.href = `/${locale}/credit-assessment/${a.id}`;
          }}
        />
      )}
      {pagination && (
        <PaginationControls
          total={pagination.total}
          limit={pagination.limit}
          offset={pagination.offset}
          onPageChange={(offset) => setPage((p) => ({ ...p, offset }))}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">هل أنت متأكد من حذف هذا العنصر؟</p>
          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setDeleteItem(null)}
              className="px-4 py-2 text-sm text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
            >
              {tc("cancel")}
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {isDeleting ? tc("loading") : "حذف"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
