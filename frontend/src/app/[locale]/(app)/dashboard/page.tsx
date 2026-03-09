"use client";

import { useAuth } from "@/lib/auth-context";
import { useApiGet } from "@/lib/use-api";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  Target,
  Building2,
  FileText,
  Landmark,
  TrendingUp,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";

const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });

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

const PIPELINE_COLORS = [
  "#a8a29e", // draft - stone
  "#0d9488", // submitted - teal
  "#14b8a6", // pre_approved - teal lighter
  "#6366f1", // docs collected - indigo
  "#f59e0b", // credit assessment - amber
  "#8b5cf6", // committee review - violet
  "#22c55e", // approved - green
  "#ef4444", // rejected - red
  "#059669", // disbursed - emerald
];

const PIE_COLORS = ["#0d9488", "#f59e0b", "#ef4444", "#dc2626"];

export default function DashboardPage() {
  const { user } = useAuth();
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { data: dashStats, isLoading: isLoadingStats } = useApiGet<DashboardStats>("/reports/dashboard");
  const { data: pipeline, isLoading: isLoadingPipeline } = useApiGet<PipelineStats>("/reports/pipeline");

  const stats = [
    { label: t("activeLeads"), value: isLoadingStats ? "..." : String(dashStats?.total_leads ?? 0), icon: Target, color: "text-teal-600 bg-teal-50", border: "border-l-teal-500" },
    { label: t("totalApplications"), value: isLoadingStats ? "..." : String(dashStats?.total_applications ?? 0), icon: FileText, color: "text-amber-600 bg-amber-50", border: "" },
    { label: t("activeFacilities"), value: isLoadingStats ? "..." : String(dashStats?.total_facilities ?? 0), icon: Landmark, color: "text-emerald-600 bg-emerald-50", border: "" },
    { label: t("totalDisbursed"), value: isLoadingStats ? "..." : new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", notation: "compact" }).format(dashStats?.total_disbursed ?? 0), icon: Building2, color: "text-violet-600 bg-violet-50", border: "" },
  ];

  const pipelineData = pipeline ? [
    { name: t("stages.draft"), value: pipeline.draft },
    { name: t("stages.submitted"), value: pipeline.submitted },
    { name: t("stages.preApproved"), value: pipeline.pre_approved },
    { name: t("stages.docsCollected"), value: pipeline.documents_collected },
    { name: t("stages.creditAssessment"), value: pipeline.credit_assessment },
    { name: t("stages.committeeReview"), value: pipeline.committee_review },
    { name: t("stages.approved"), value: pipeline.approved },
    { name: t("stages.rejected"), value: pipeline.rejected },
    { name: t("stages.disbursed"), value: pipeline.disbursed },
  ] : [];

  const parData = dashStats ? [
    { name: t("portfolio.current"), value: Math.max((dashStats.total_outstanding ?? 0) - (dashStats.par30 ?? 0), 0) },
    { name: t("portfolio.par30"), value: dashStats.par30 ?? 0 },
    { name: t("portfolio.par60"), value: dashStats.par60 ?? 0 },
    { name: t("portfolio.par90"), value: dashStats.par90 ?? 0 },
  ].filter(d => d.value > 0) : [];

  const quickActions = [
    { label: t("newLead"), href: `/${locale}/leads`, icon: Target },
    { label: t("newApplication"), href: `/${locale}/applications`, icon: FileText },
    { label: t("viewReports"), href: `/${locale}/reports`, icon: TrendingUp },
    { label: t("manageUsers"), href: `/${locale}/users`, icon: Users },
  ];

  return (
    <div>
      <PageHeader
        title={`${t("welcomeBack")}, ${user?.name_en}`}
        description={t("subtitle")}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`bg-white rounded-lg border border-stone-200 p-4 flex items-center gap-4 hover-lift animate-fade-in-up opacity-0 ${stat.border ? `border-l-4 ${stat.border}` : ""}`}
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: "forwards" }}
          >
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-3xl font-bold text-stone-900 tracking-tight">
                {stat.value}
              </p>
              <p className="text-sm text-stone-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Pipeline Chart (3/5) */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-stone-200 p-5 animate-fade-in-up opacity-0" style={{ animationDelay: "250ms", animationFillMode: "forwards" }}>
          <h2 className="text-base font-semibold text-stone-900 mb-4">
            {t("pipeline")}
          </h2>
          {isLoadingPipeline ? (
            <div className="flex items-center justify-center h-64 text-stone-400">
              <div className="animate-spin h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full" />
            </div>
          ) : pipelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={pipelineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#78716c" }}
                  axisLine={{ stroke: "#e7e5e4" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#78716c" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1c1917",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fafaf9",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pipelineData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIPELINE_COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
              {t("noPipelineData")}
            </div>
          )}
        </div>

        {/* Right Column (2/5) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-stone-200 p-5 animate-fade-in-up opacity-0" style={{ animationDelay: "300ms", animationFillMode: "forwards" }}>
            <h2 className="text-base font-semibold text-stone-900 mb-4">
              {t("quickActions")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:border-teal-300 hover:bg-teal-50 transition-colors group"
                >
                  <action.icon size={18} className="text-teal-600" />
                  <span className="text-sm font-medium text-stone-700 group-hover:text-teal-700">
                    {action.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Portfolio Quality Donut */}
          <div className="bg-white rounded-lg border border-stone-200 p-5 animate-fade-in-up opacity-0" style={{ animationDelay: "350ms", animationFillMode: "forwards" }}>
            <h2 className="text-base font-semibold text-stone-900 mb-4">
              {t("portfolioQuality")}
            </h2>
            {isLoadingStats ? (
              <div className="flex items-center justify-center h-48 text-stone-400">
                <div className="animate-spin h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full" />
              </div>
            ) : parData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie
                      data={parData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {parData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR", notation: "compact" }).format(Number(value))}
                      contentStyle={{
                        backgroundColor: "#1c1917",
                        border: "none",
                        borderRadius: "8px",
                        color: "#fafaf9",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {parData.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-stone-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-stone-400 text-sm">
                {t("noPortfolioData")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
