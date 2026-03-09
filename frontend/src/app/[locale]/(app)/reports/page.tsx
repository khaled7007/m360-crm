"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { useApiGet } from "@/lib/use-api";
import {
  TrendingUp,
  Users,
  FileText,
  Banknote,
  AlertCircle,
} from "lucide-react";
import { RoleGuard } from "@/components/ui/RoleGuard";

interface DashboardStats {
  total_leads: number;
  total_applications: number;
  total_facilities: number;
  total_disbursed: number;
  total_outstanding: number;
  par30: number;
  par60: number;
  par90: number;
}

interface PipelineStats {
  draft: number;
  submitted: number;
  pre_approved: number;
  documents_collected: number;
  credit_assessment: number;
  committee_review: number;
  approved: number;
  rejected: number;
  disbursed: number;
}

interface OfficerPerformance extends Record<string, unknown> {
  officer_id: string;
  officer_name: string;
  lead_count: number;
  app_count: number;
  disbursed: number;
  conversion_rate: number;
}

const formatSAR = (value: number) =>
  new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);

const formatPct = (value: number) => `${(value * 100).toFixed(1)}%`;

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "blue" | "green" | "yellow" | "red";
  sub?: string;
}

function StatCard({ label, value, icon, accent = "blue", sub }: StatCardProps) {
  const accentColors = {
    blue: "bg-teal-50 text-teal-600",
    green: "bg-green-50 text-green-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-lg border border-stone-200 p-5 flex items-start gap-4">
      <div className={`p-2 rounded-lg ${accentColors[accent]}`}>{icon}</div>
      <div>
        <p className="text-sm text-stone-500">{label}</p>
        <p className="text-xl font-bold text-stone-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

interface PipelineRow extends Record<string, unknown> {
  stage: string;
  count: number;
  key: string;
}

// stageLabels moved inside component to use translations

const stageOrder: Array<keyof PipelineStats> = [
  "draft",
  "submitted",
  "pre_approved",
  "documents_collected",
  "credit_assessment",
  "committee_review",
  "approved",
  "rejected",
  "disbursed",
];

export default function ReportsPage() {
  const t = useTranslations("reports");

  const stageLabels: Record<string, string> = {
    draft: t("stageLabels.draft"),
    submitted: t("stageLabels.submitted"),
    pre_approved: t("stageLabels.pre_approved"),
    documents_collected: t("stageLabels.documents_collected"),
    credit_assessment: t("stageLabels.credit_assessment"),
    committee_review: t("stageLabels.committee_review"),
    approved: t("stageLabels.approved"),
    rejected: t("stageLabels.rejected"),
    disbursed: t("stageLabels.disbursed"),
  };

  const { data: dashboard, isLoading: loadingDash } =
    useApiGet<DashboardStats>("/reports/dashboard");

  const { data: pipeline, isLoading: loadingPipeline } =
    useApiGet<PipelineStats>("/reports/pipeline");

  const { data: officers, isLoading: loadingOfficers } =
    useApiGet<OfficerPerformance[]>("/reports/officers");

  const pipelineRows: PipelineRow[] = pipeline
    ? stageOrder.map((key) => ({
        key,
        stage: stageLabels[key] ?? key,
        count: pipeline[key] ?? 0,
      }))
    : [];

  const officerList: OfficerPerformance[] = Array.isArray(officers)
    ? officers
    : [];

  const totalPipeline = pipelineRows.reduce((sum, r) => sum + r.count, 0);

  const pipelineColumns: Column<PipelineRow>[] = [
    {
      key: "stage",
      header: t("stage"),
      render: (item) => (
        <span className="font-medium text-stone-800">{item.stage}</span>
      ),
    },
    {
      key: "count",
      header: t("applications"),
      render: (item) => (
        <span className="font-semibold text-stone-900">{item.count}</span>
      ),
    },
    {
      key: "pct",
      header: t("share"),
      render: (item) => {
        const pct = totalPipeline > 0 ? (item.count / totalPipeline) * 100 : 0;
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 max-w-[120px] h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-stone-500">{pct.toFixed(1)}%</span>
          </div>
        );
      },
    },
  ];

  const officerColumns: Column<OfficerPerformance>[] = [
    {
      key: "officer_name",
      header: t("officer"),
      render: (item) => (
        <span className="font-medium text-stone-800">{item.officer_name}</span>
      ),
    },
    {
      key: "lead_count",
      header: t("leads"),
      render: (item) => (
        <span className="text-stone-700">{item.lead_count}</span>
      ),
    },
    {
      key: "app_count",
      header: t("applications"),
      render: (item) => (
        <span className="text-stone-700">{item.app_count}</span>
      ),
    },
    {
      key: "disbursed",
      header: t("disbursedSar"),
      render: (item) => (
        <span className="font-semibold text-stone-900">
          {formatSAR(item.disbursed)}
        </span>
      ),
    },
    {
      key: "conversion_rate",
      header: t("conversionRate"),
      render: (item) => {
        const pct = item.conversion_rate * 100;
        const color =
          pct >= 50
            ? "text-green-700"
            : pct >= 25
            ? "text-yellow-700"
            : "text-red-700";
        return (
          <span className={`font-semibold ${color}`}>
            {formatPct(item.conversion_rate)}
          </span>
        );
      },
    },
  ];

  return (
    <RoleGuard roles={["admin", "manager"]}>
    <div className="space-y-8">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {/* Dashboard Stats */}
      <section>
        <h2 className="text-base font-semibold text-stone-700 mb-3">
          {t("title")}
        </h2>
        {loadingDash ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-stone-200 p-5 h-24 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label={t("totalLeads")}
              value={String(dashboard?.total_leads ?? 0)}
              icon={<Users size={20} />}
              accent="blue"
            />
            <StatCard
              label={t("totalApplications")}
              value={String(dashboard?.total_applications ?? 0)}
              icon={<FileText size={20} />}
              accent="blue"
            />
            <StatCard
              label={t("activeFacilities")}
              value={String(dashboard?.total_facilities ?? 0)}
              icon={<TrendingUp size={20} />}
              accent="green"
            />
            <StatCard
              label={t("totalDisbursed")}
              value={formatSAR(dashboard?.total_disbursed ?? 0)}
              icon={<Banknote size={20} />}
              accent="green"
            />
            <StatCard
              label={t("outstandingBalance")}
              value={formatSAR(dashboard?.total_outstanding ?? 0)}
              icon={<Banknote size={20} />}
              accent="blue"
            />
            <StatCard
              label={t("par30")}
              value={formatSAR(dashboard?.par30 ?? 0)}
              icon={<AlertCircle size={20} />}
              accent="yellow"
              sub={t("overdue30")}
            />
            <StatCard
              label={t("par60")}
              value={formatSAR(dashboard?.par60 ?? 0)}
              icon={<AlertCircle size={20} />}
              accent="red"
              sub={t("overdue60")}
            />
            <StatCard
              label={t("par90")}
              value={formatSAR(dashboard?.par90 ?? 0)}
              icon={<AlertCircle size={20} />}
              accent="red"
              sub={t("overdue90")}
            />
          </div>
        )}
      </section>

      {/* Pipeline Breakdown */}
      <section>
        <h2 className="text-base font-semibold text-stone-700 mb-3">
          {t("pipeline")}
        </h2>
        <DataTable<PipelineRow>
          columns={pipelineColumns}
          data={pipelineRows}
          isLoading={loadingPipeline}
          emptyMessage={t("noPipelineData")}
        />
      </section>

      {/* Officer Performance */}
      <section>
        <h2 className="text-base font-semibold text-stone-700 mb-3">
          {t("officers")}
        </h2>
        <DataTable<OfficerPerformance>
          columns={officerColumns}
          data={officerList}
          isLoading={loadingOfficers}
          emptyMessage={t("noOfficerData")}
        />
      </section>
    </div>
    </RoleGuard>
  );
}
