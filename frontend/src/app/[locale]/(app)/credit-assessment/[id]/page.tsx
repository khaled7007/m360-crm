"use client";

import { use } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApiGet, useApiMutation } from "@/lib/use-api";
import { toast } from "sonner";
import { ArrowLeft, Play, Send } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { DocumentList } from "@/components/ui/DocumentList";

interface ScoringFactor {
  id: string;
  category: string;
  factor_name: string;
  raw_score: number;
  weight: number;
  weighted_score: number;
}

interface ScoreReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  dscr_note: string;
  ltv_note: string;
}

interface Score {
  id: string;
  total_score: number;
  risk_grade: string;
  recommendation: string;
  scorecard_version: string;
  scored_at: string;
  factors?: ScoringFactor[];
  report?: ScoreReport;
}

interface Assessment {
  id: string;
  organization_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  score?: Score | null;
  business_activity: string;
  entity_type: string;
  entity_location: string;
  years_in_business: string;
  income_diversification: string;
  audited_financials: boolean;
  total_revenue: number;
  operating_cash_flow: number;
  current_liabilities: number;
  net_profit: number;
  operating_profit: number;
  finance_costs: number;
  total_assets: number;
  current_assets: number;
  credit_record: string;
  payment_behavior: string;
  payment_delays: string;
  num_delays: string;
  delay_ratio: string;
  financing_default: string;
  num_defaults: string;
  default_ratio: string;
  bounced_checks: string;
  lawsuits: string;
  project_location: string;
  has_project_plan: boolean;
  has_insurance: boolean;
  project_type: string;
  engineering_firm_class: string;
  feasibility_study_quality: string;
  project_net_profit: number;
  project_total_cost: number;
  previous_projects_count: string;
  property_location: string;
  property_type: string;
  property_usage: string;
  appraisal_1: number;
  appraisal_2: number;
  financing_amount: number;
  application_id?: string;
}

const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
  AA: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  A: { bg: "bg-green-50", text: "text-green-800", border: "border-green-200" },
  BB: { bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-200" },
  B: { bg: "bg-yellow-50", text: "text-yellow-800", border: "border-yellow-200" },
  CC: { bg: "bg-orange-50", text: "text-orange-800", border: "border-orange-200" },
  C: { bg: "bg-red-50", text: "text-red-800", border: "border-red-200" },
  F: { bg: "bg-red-100", text: "text-red-900", border: "border-red-300" },
};

const categoryOrder = [
  "company_info",
  "financial_statements",
  "credit_history",
  "project_feasibility",
  "collateral",
];

export default function CreditAssessmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("creditAssessment");
  const tc = useTranslations("common");
  const locale = useLocale();

  const { data: assessment, isLoading, refetch } = useApiGet<Assessment>(
    `/credit-assessments/${id}`
  );

  const [sendOpen, setSendOpen] = useState(false);
  const [quorum, setQuorum] = useState(3);

  const { mutate: runScore, isSubmitting: isScoring } = useApiMutation<Record<string, never>>(
    `/credit-assessments/${id}/score`,
    "POST"
  );

  const { mutate: createPackage, isSubmitting: isSending } = useApiMutation<Record<string, unknown>>(
    "/packages",
    "POST"
  );

  const handleScore = async () => {
    try {
      await runScore({});
      toast.success(t("scoringSuccess"));
      refetch();
    } catch {
      toast.error(t("scoringError"));
    }
  };

  const handleSendToCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPackage({
        credit_assessment_id: id,
        application_id: assessment?.application_id || id,
        quorum_required: quorum,
      });
      toast.success(t("sentToCommittee"));
      setSendOpen(false);
    } catch {
      toast.error(t("sendError"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-20 text-stone-500">
        {t("loadError")}
      </div>
    );
  }

  const score = assessment.score;
  const gc = score ? gradeColors[score.risk_grade] || gradeColors.F : null;

  const factorsByCategory: Record<string, ScoringFactor[]> = {};
  if (score?.factors) {
    for (const f of score.factors) {
      if (!factorsByCategory[f.category]) factorsByCategory[f.category] = [];
      factorsByCategory[f.category].push(f);
    }
  }

  const categoryTotals = categoryOrder.map((cat) => {
    const factors = factorsByCategory[cat] || [];
    const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
    const totalWeighted = factors.reduce((s, f) => s + f.weighted_score, 0);
    const maxWeighted = totalWeight;
    const pct = maxWeighted > 0 ? (totalWeighted / maxWeighted) * 100 : 0;
    return { category: cat, pct: pct.toFixed(1), weighted: (totalWeighted * 100).toFixed(2), maxWeight: (maxWeighted * 100).toFixed(0) };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/${locale}/credit-assessment`}
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
          >
            <ArrowLeft size={16} />
            {t("backToList")}
          </Link>
          <PageHeader
            title={t("title")}
            description={`ID: ${assessment.id.slice(0, 8)}...`}
          />
        </div>
        <div className="flex items-center gap-3">
          {!score && (
            <button
              onClick={handleScore}
              disabled={isScoring}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              <Play size={16} />
              {isScoring ? t("scoring") : t("runScoring")}
            </button>
          )}
          {score && (
            <button
              onClick={() => setSendOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Send size={16} />
              {t("sendToCommittee")}
            </button>
          )}
        </div>
      </div>

      {score && gc && (
        <div className={`rounded-xl border-2 ${gc.border} ${gc.bg} p-6`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-start">
              <p className="text-sm font-medium text-stone-500 mb-1">{t("score")}</p>
              <p className={`text-5xl font-bold ${gc.text}`}>{score.total_score}%</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-stone-500 mb-1">{t("grade")}</p>
              <p className={`text-4xl font-black ${gc.text}`}>{score.risk_grade}</p>
              <p className={`text-sm ${gc.text} mt-1`}>
                {t(`grades.${score.risk_grade}` as Parameters<typeof t>[0])}
              </p>
            </div>
            <div className="text-center md:text-end">
              <p className="text-sm font-medium text-stone-500 mb-1">{t("recommendation")}</p>
              <p className={`text-lg font-semibold ${gc.text}`}>
                {t(`recommendations.${score.recommendation}` as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {score.scorecard_version} &middot;{" "}
                {new Date(score.scored_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {score?.report && (
        <div className="bg-white rounded-lg border border-stone-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold">{t("scoringReport")}</h3>
          <p className="text-stone-700 leading-relaxed">{score.report.summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-stone-50 rounded-lg p-4 text-sm text-stone-600 space-y-1">
              <p className="font-medium text-stone-800 mb-2">📊 {t("keyMetrics")}</p>
              <p>{score.report.dscr_note}</p>
              <p>{score.report.ltv_note}</p>
            </div>
            {score.report.strengths.length > 0 && (
              <div className="bg-emerald-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-emerald-800 mb-2">✅ {t("strengths")}</p>
                <ul className="space-y-1">
                  {score.report.strengths.map((f) => (
                    <li key={f} className="text-emerald-700">
                      • {t(`fields.${f}` as Parameters<typeof t>[0]) || f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {score.report.weaknesses.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-red-800 mb-2">⚠️ {t("weaknesses")}</p>
                <ul className="space-y-1">
                  {score.report.weaknesses.map((f) => (
                    <li key={f} className="text-red-700">
                      • {t(`fields.${f}` as Parameters<typeof t>[0]) || f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {score && (
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <h3 className="text-lg font-semibold mb-4">{t("categoryScores")}</h3>
          <div className="space-y-3">
            {categoryTotals.map((ct) => (
              <div key={ct.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">
                    {t(`categories.${ct.category}` as Parameters<typeof t>[0])}
                  </span>
                  <span className="text-sm text-stone-600">
                    {ct.weighted}% / {ct.maxWeight}% ({ct.pct}%)
                  </span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${Math.min(parseFloat(ct.pct), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {score && score.factors && score.factors.length > 0 && (
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          <h3 className="text-lg font-semibold mb-4">{t("factorDetails")}</h3>
          {categoryOrder.map((cat) => {
            const factors = factorsByCategory[cat];
            if (!factors || factors.length === 0) return null;
            return (
              <div key={cat} className="mb-6 last:mb-0">
                <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  {t(`categories.${cat}` as Parameters<typeof t>[0])}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500">
                        <th className="text-start py-2 pe-4">{tc("name")}</th>
                        <th className="text-center py-2 px-2">Raw (0-3)</th>
                        <th className="text-center py-2 px-2">{tc("total")} %</th>
                        <th className="text-end py-2 ps-2">{t("score")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factors.map((f) => (
                        <tr key={f.id} className="border-b border-stone-100">
                          <td className="py-1.5 pe-4">
                            {t(`fields.${f.factor_name}` as Parameters<typeof t>[0]) || f.factor_name}
                          </td>
                          <td className="text-center py-1.5 px-2">
                            <span
                              className={`inline-block w-6 h-6 rounded-full text-xs font-bold leading-6 text-center ${
                                f.raw_score === 3
                                  ? "bg-emerald-100 text-emerald-700"
                                  : f.raw_score === 2
                                  ? "bg-yellow-100 text-yellow-700"
                                  : f.raw_score === 1
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {f.raw_score}
                            </span>
                          </td>
                          <td className="text-center py-1.5 px-2 text-stone-500">
                            {(f.weight * 100).toFixed(1)}%
                          </td>
                          <td className="text-end py-1.5 ps-2 font-semibold">
                            {(f.weighted_score * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!score && (
        <div className="bg-stone-50 rounded-lg border border-stone-200 p-8 text-center">
          <p className="text-stone-500 text-lg">{t("notScored")}</p>
          <p className="text-stone-400 text-sm mt-1">
            {t("subtitle")}
          </p>
        </div>
      )}

      {/* Org Financial Statements */}
      <div className="bg-white rounded-lg border border-stone-200 p-6">
        <h3 className="text-lg font-semibold mb-4">القوائم المالية لطالب التمويل</h3>
        <DocumentList
          entityType="organization"
          entityId={assessment.organization_id}
        />
      </div>

      {/* Send to Committee Modal */}
      <Modal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        title={t("sendToCommittee")}
        size="sm"
      >
        <form onSubmit={handleSendToCommittee} className="space-y-4">
          <div className="bg-stone-50 rounded-lg p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">{t("grade")}</span>
              <span className={`font-bold ${gc?.text}`}>{score?.risk_grade} — {score ? t(`grades.${score.risk_grade}` as Parameters<typeof t>[0]) : ""}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{t("score")}</span>
              <span className="font-semibold">{score?.total_score}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{t("recommendation")}</span>
              <span className="font-medium">{score ? t(`recommendations.${score.recommendation}` as Parameters<typeof t>[0]) : ""}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              النصاب المطلوب للموافقة
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={quorum}
              onChange={(e) => setQuorum(parseInt(e.target.value, 10) || 3)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-stone-500">عدد أصوات الموافقة اللازمة لإقرار الطلب</p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setSendOpen(false)}
              className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={14} />
              {isSending ? tc("submitting") : t("sendToCommittee")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
