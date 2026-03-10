"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { Plus, CheckCircle2 } from "lucide-react";
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
  const [selectedPackage, setSelectedPackage] =
    useState<CommitteePackage | null>(null);

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
    </div>
    </RoleGuard>
  );
}
