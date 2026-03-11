"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useApiList, useApiMutation, useApiGet } from "@/lib/use-api";
import { Plus, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/ui/RoleGuard";

interface CreditAssessmentRef {
  id: string;
  opportunity_number: string;
  organization_name: string;
}

interface CommitteePackage extends Record<string, unknown> {
  id: string;
  application_id: string;
  credit_assessment_id?: string;
  status: "pending" | "approved" | "rejected";
  quorum_required: number;
  votes_for: number;
  votes_against: number;
  created_at: string;
}

interface CreatePackageInput {
  application_id: string;
  credit_assessment_id: string;
  quorum_required: number;
}

interface VoteInput {
  decision: "approve" | "reject" | "defer";
  comments: string;
}

interface ScoringFactor {
  id: string;
  category: string;
  factor_name: string;
  raw_score: number;
  weight: number;
  weighted_score: number;
}

interface Score {
  id: string;
  total_score: number;
  risk_grade: string;
  recommendation: string;
  scorecard_version: string;
  scored_at: string;
  factors?: ScoringFactor[];
}

interface Assessment {
  id: string;
  status: string;
  created_at: string;
  business_activity: string;
  entity_type: string;
  total_revenue: number;
  operating_cash_flow: number;
  net_profit: number;
  financing_amount: number;
  score?: Score | null;
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

const categoryOrder = ["company_info", "financial_statements", "credit_history", "project_feasibility", "collateral"];

function AssessmentViewer({ assessmentId }: { assessmentId: string }) {
  const t = useTranslations("creditAssessment");
  const tc = useTranslations("common");
  const { data: assessment, isLoading } = useApiGet<Assessment>(`/credit-assessments/${assessmentId}`);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }
  if (!assessment) return <p className="text-center text-stone-500 py-8">{t("loadError")}</p>;

  const score = assessment.score;
  const gc = score ? (gradeColors[score.risk_grade] || gradeColors.F) : null;

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
    const pct = totalWeight > 0 ? (totalWeighted / totalWeight) * 100 : 0;
    return { category: cat, pct: pct.toFixed(1), weighted: (totalWeighted * 100).toFixed(2), maxWeight: (totalWeight * 100).toFixed(0) };
  });

  return (
    <div className="space-y-5">
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3 text-sm bg-stone-50 rounded-lg p-4">
        <div><span className="text-stone-500">{tc("status")}: </span><span className="font-medium">{assessment.status}</span></div>
        <div><span className="text-stone-500">{t("fields.financing_amount") || "مبلغ التمويل"}: </span><span className="font-medium">{assessment.financing_amount?.toLocaleString()} SAR</span></div>
        <div><span className="text-stone-500">{t("fields.total_revenue") || "الإيرادات"}: </span><span className="font-medium">{assessment.total_revenue?.toLocaleString()} SAR</span></div>
        <div><span className="text-stone-500">{t("fields.net_profit") || "صافي الربح"}: </span><span className="font-medium">{assessment.net_profit?.toLocaleString()} SAR</span></div>
      </div>

      {/* Score banner */}
      {score && gc && (
        <div className={`rounded-xl border-2 ${gc.border} ${gc.bg} p-5`}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-stone-500 mb-0.5">{t("score")}</p>
              <p className={`text-4xl font-bold ${gc.text}`}>{score.total_score}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-stone-500 mb-0.5">{t("grade")}</p>
              <p className={`text-3xl font-black ${gc.text}`}>{score.risk_grade}</p>
            </div>
            <div className="text-end">
              <p className="text-xs text-stone-500 mb-0.5">{t("recommendation")}</p>
              <p className={`text-base font-semibold ${gc.text}`}>
                {t(`recommendations.${score.recommendation}` as Parameters<typeof t>[0])}
              </p>
              <p className="text-xs text-stone-400 mt-0.5">{score.scorecard_version}</p>
            </div>
          </div>
        </div>
      )}

      {/* Category bars */}
      {score && (
        <div className="bg-white rounded-lg border border-stone-200 p-4">
          <h4 className="text-sm font-semibold mb-3">{t("categoryScores")}</h4>
          <div className="space-y-2">
            {categoryTotals.map((ct) => (
              <div key={ct.category}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium">{t(`categories.${ct.category}` as Parameters<typeof t>[0])}</span>
                  <span className="text-xs text-stone-500">{ct.weighted}% / {ct.maxWeight}%</span>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(parseFloat(ct.pct), 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Factor details */}
      {score?.factors && score.factors.length > 0 && (
        <div className="bg-white rounded-lg border border-stone-200 p-4">
          <h4 className="text-sm font-semibold mb-3">{t("factorDetails")}</h4>
          {categoryOrder.map((cat) => {
            const factors = factorsByCategory[cat];
            if (!factors?.length) return null;
            return (
              <div key={cat} className="mb-4 last:mb-0">
                <h5 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">
                  {t(`categories.${cat}` as Parameters<typeof t>[0])}
                </h5>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500">
                      <th className="text-start py-1 pe-3">{tc("name")}</th>
                      <th className="text-center py-1 px-2">Raw</th>
                      <th className="text-end py-1 ps-2">{t("score")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factors.map((f) => (
                      <tr key={f.id} className="border-b border-stone-100">
                        <td className="py-1 pe-3">{t(`fields.${f.factor_name}` as Parameters<typeof t>[0]) || f.factor_name}</td>
                        <td className="text-center py-1 px-2">
                          <span className={`inline-block w-5 h-5 rounded-full text-xs font-bold leading-5 text-center ${f.raw_score === 3 ? "bg-emerald-100 text-emerald-700" : f.raw_score === 2 ? "bg-yellow-100 text-yellow-700" : f.raw_score === 1 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700"}`}>
                            {f.raw_score}
                          </span>
                        </td>
                        <td className="text-end py-1 ps-2 font-semibold">{(f.weighted_score * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {!score && (
        <div className="bg-stone-50 rounded-lg border border-stone-200 p-6 text-center text-stone-500">
          {t("notScored")}
        </div>
      )}
    </div>
  );
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const truncateId = (id: string) => `${id.slice(0, 8)}…`;

export default function CommitteePage() {
  const t = useTranslations("committee");
  const tc = useTranslations("common");
  const [createOpen, setCreateOpen] = useState(false);
  const [voteOpen, setVoteOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CommitteePackage | null>(null);
  const [viewAssessmentId, setViewAssessmentId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<CreatePackageInput>({
    application_id: "",
    credit_assessment_id: "",
    quorum_required: 3,
  });

  const [voteForm, setVoteForm] = useState<VoteInput>({
    decision: "approve",
    comments: "",
  });

  const { data: creditAssessments } = useApiList<CreditAssessmentRef>("/credit-assessments");
  const {
    data: packages,
    isLoading,
    error: packagesError,
    refetch,
  } = useApiList<CommitteePackage>("/packages");

  const { mutate: createPackage, isSubmitting: isCreating } =
    useApiMutation<CreatePackageInput>("/packages", "POST");

  const { mutate: castVote, isSubmitting: isVoting } =
    useApiMutation<VoteInput>(
      selectedPackage ? `/packages/${selectedPackage.id}/vote` : "/packages",
      "POST"
    );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.credit_assessment_id.trim()) {
      toast.error(t("applicationIdRequired"));
      return;
    }
    if (createForm.quorum_required < 1) {
      toast.error(t("quorumMinimum"));
      return;
    }
    try {
      await createPackage(createForm);
      toast.success(t("createSuccess"));
      setCreateOpen(false);
      setCreateForm({ application_id: "", credit_assessment_id: "", quorum_required: 3 });
      refetch();
    } catch {
      toast.error(t("createError"));
    }
  };

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage) return;
    try {
      await castVote(voteForm);
      toast.success(t("voteSuccess"));
      setVoteOpen(false);
      setSelectedPackage(null);
      setVoteForm({ decision: "approve", comments: "" });
      refetch();
    } catch {
      toast.error(t("voteError"));
    }
  };

  const openVoteModal = (pkg: CommitteePackage) => {
    setSelectedPackage(pkg);
    setVoteForm({ decision: "approve", comments: "" });
    setVoteOpen(true);
  };

  const columns: Column<CommitteePackage>[] = [
    {
      key: "application_id",
      header: t("applicationId"),
      render: (item) => {
        const assessment = creditAssessments.find(
          (ca) => ca.id === item.credit_assessment_id
        );
        return (
          <span className="font-mono text-sm text-stone-700">
            {assessment?.opportunity_number || truncateId(item.application_id)}
          </span>
        );
      },
    },
    {
      key: "status",
      header: tc("status"),
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "votes_for",
      header: t("votesFor"),
      render: (item) => (
        <span className="font-semibold text-green-700">{item.votes_for}</span>
      ),
    },
    {
      key: "votes_against",
      header: t("votesAgainst"),
      render: (item) => (
        <span className="font-semibold text-red-700">{item.votes_against}</span>
      ),
    },
    {
      key: "quorum_required",
      header: t("quorumRequired"),
      render: (item) => (
        <span className="text-stone-700">{item.quorum_required}</span>
      ),
    },
    {
      key: "created_at",
      header: tc("date"),
      render: (item) => (
        <span className="text-sm text-stone-500">{formatDate(item.created_at)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.credit_assessment_id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewAssessmentId(item.credit_assessment_id!);
              }}
              className="flex items-center gap-1 px-3 py-1 text-xs border border-stone-300 text-stone-700 rounded hover:bg-stone-50 transition"
            >
              <Eye size={12} />
              عرض التقييم
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openVoteModal(item);
            }}
            disabled={item.status !== "pending"}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={12} />
            {t("vote")}
          </button>
        </div>
      ),
    },
  ];

  return (
    <RoleGuard roles={["admin", "manager", "credit_analyst"]}>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <Plus size={16} />
            {t("newPackage")}
          </button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {packagesError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button onClick={() => refetch()} className="mt-2 text-sm text-teal-600 hover:underline">{tc("retry")}</button>
        </div>
      )}
      {!isLoading && !packagesError && packages.length === 0 && (
        <div className="py-12 text-center text-stone-500">
          <p>{t("noPackages")}</p>
        </div>
      )}
      {!isLoading && !packagesError && packages.length > 0 && (
        <DataTable<CommitteePackage>
          columns={columns}
          data={packages}
          isLoading={isLoading}
          emptyMessage={t("noPackages")}
        />
      )}

      {/* Create Package Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t("newPackage")}
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t("application")} *
            </label>
            <select
              value={createForm.credit_assessment_id}
              onChange={(e) =>
                setCreateForm({ ...createForm, credit_assessment_id: e.target.value, application_id: e.target.value })
              }
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
            >
              <option value="">{t("enterApplicationUuid")}</option>
              {creditAssessments.map((ca) => (
                <option key={ca.id} value={ca.id}>
                  {ca.opportunity_number || ca.id} {ca.organization_name ? `— ${ca.organization_name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t("quorumRequired")}
            </label>
            <input
              type="number"
              min={1}
              value={createForm.quorum_required}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  quorum_required: parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-stone-500">
              {t("quorumHelp")}
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isCreating ? tc("creating") : t("createPackage")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Vote Modal */}
      <Modal
        open={voteOpen}
        onClose={() => {
          setVoteOpen(false);
          setSelectedPackage(null);
        }}
        title={t("decision")}
        size="md"
      >
        {selectedPackage && (
          <form onSubmit={handleVote} className="space-y-4">
            <div className="bg-stone-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">{t("application")}</span>
                <span className="font-mono font-medium">
                  {creditAssessments.find(ca => ca.id === selectedPackage.credit_assessment_id)?.opportunity_number || truncateId(selectedPackage.application_id)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t("currentVotes")}</span>
                <span>
                  <span className="text-green-700 font-semibold">
                    {selectedPackage.votes_for} {t("for")}
                  </span>
                  {" / "}
                  <span className="text-red-700 font-semibold">
                    {selectedPackage.votes_against} {t("against")}
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{t("quorumRequired")}</span>
                <span className="font-medium">{selectedPackage.quorum_required}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                {t("decision")} *
              </label>
              <div className="flex gap-3">
                {(["approve", "reject", "defer"] as const).map((d) => (
                  <label
                    key={d}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition text-sm font-medium ${
                      voteForm.decision === d
                        ? d === "approve"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : d === "reject"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-stone-400 bg-stone-100 text-stone-700"
                        : "border-stone-300 text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value={d}
                      checked={voteForm.decision === d}
                      onChange={() => setVoteForm({ ...voteForm, decision: d })}
                      className="sr-only"
                    />
                    {t(d)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("comments")}
              </label>
              <textarea
                value={voteForm.comments}
                onChange={(e) =>
                  setVoteForm({ ...voteForm, comments: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder={t("commentsPlaceholder")}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setVoteOpen(false);
                  setSelectedPackage(null);
                }}
                className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
              >
                {tc("cancel")}
              </button>
              <button
                type="submit"
                disabled={isVoting}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
              >
                {isVoting ? tc("submitting") : t("submitVote")}
              </button>
            </div>
          </form>
        )}
      </Modal>
      {/* Assessment Viewer Modal */}
      <Modal
        open={!!viewAssessmentId}
        onClose={() => setViewAssessmentId(null)}
        title="التقييم الائتماني"
        size="xl"
      >
        {viewAssessmentId && <AssessmentViewer assessmentId={viewAssessmentId} />}
      </Modal>
    </div>
    </RoleGuard>
  );
}
