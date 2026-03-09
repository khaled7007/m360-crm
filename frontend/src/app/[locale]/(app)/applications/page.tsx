"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { FileUpload } from "@/components/ui/FileUpload";
import { DocumentList } from "@/components/ui/DocumentList";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Organization {
  id: string;
  name_en: string;
  name_ar?: string;
}

interface Product {
  id: string;
  name: string;
  type?: string;
}

interface Application {
  id: string;
  reference_number: string;
  organization_id: string;
  product_id: string;
  requested_amount: number;
  requested_tenor_months: number;
  purpose: string;
  pipeline_stage?: string;
  status:
    | "draft"
    | "submitted"
    | "pre_approved"
    | "documents_collected"
    | "credit_assessment"
    | "committee_review"
    | "approved"
    | "rejected"
    | "disbursed";
  officer_id?: string;
  created_at: string;
  updated_at: string;
}

interface CreateApplicationInput {
  organization_id: string;
  product_id: string;
  requested_amount: number;
  requested_tenor_months: number;
  purpose: string;
  pipeline_stage: string;
}

export default function ApplicationsPage() {
  const t = useTranslations("applications");
  const tc = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedApplicationId, setExpandedApplicationId] = useState<
    string | null
  >(null);
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<CreateApplicationInput>({
    organization_id: "",
    product_id: "",
    requested_amount: 0,
    requested_tenor_months: 12,
    purpose: "",
    pipeline_stage: "new",
  });

  const { data: organizations } = useApiList<Organization>("/organizations");
  const { data: products } = useApiList<Product>("/products");
  const { data: applications, pagination, isLoading: isLoadingApplications, error: applicationsError, refetch: refetchApplications } = useApiList<Application>("/applications", { ...page, search: searchQuery || undefined });

  const { mutate: createApplication, isSubmitting: isCreating } =
    useApiMutation<CreateApplicationInput>(
      "/applications",
      "POST"
    );

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.organization_id.trim()) {
      toast.error(t("organizationRequired"));
      return;
    }

    if (!formData.product_id.trim()) {
      toast.error(t("productRequired"));
      return;
    }

    if (formData.requested_amount <= 0) {
      toast.error(t("amountError"));
      return;
    }

    if (formData.requested_tenor_months <= 0) {
      toast.error(t("tenorError"));
      return;
    }

    if (!formData.purpose.trim()) {
      toast.error(t("purposeRequired"));
      return;
    }

    try {
      await createApplication(formData);
      toast.success(t("createSuccess"));
      setIsModalOpen(false);
      setFormData({
        organization_id: "",
        product_id: "",
        requested_amount: 0,
        requested_tenor_months: 12,
        purpose: "",
        pipeline_stage: "new",
      });
      refetchApplications();
    } catch {
      toast.error(t("createError"));
    }
  };

  const columns: Column<Application>[] = [
    {
      key: "reference_number",
      header: t("referenceNumber"),
      render: (item) => (
        <span className="font-medium text-stone-900">
          {item.reference_number}
        </span>
      ),
    },
    {
      key: "requested_amount",
      header: tc("amount"),
      render: (item) => (
        <span className="font-semibold text-stone-900">
          {new Intl.NumberFormat("en-SA", {
            style: "currency",
            currency: "SAR",
          }).format(item.requested_amount)}
        </span>
      ),
    },
    {
      key: "requested_tenor_months",
      header: t("tenor"),
      render: (item) => (
        <span className="text-stone-700">{item.requested_tenor_months}</span>
      ),
    },
    {
      key: "status",
      header: tc("status"),
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "purpose",
      header: t("purpose"),
      render: (item) => (
        <span className="text-sm text-stone-700 line-clamp-1">
          {item.purpose}
        </span>
      ),
    },
    {
      key: "created_at",
      header: tc("date"),
      render: (item) => (
        <span className="text-sm text-stone-600">
          {new Date(item.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const handleRowClick = (application: Application) => {
    setExpandedApplicationId(
      expandedApplicationId === application.id ? null : application.id
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={t("title")}
          description={t("subtitle")}
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
        >
          <Plus size={20} />
          {t("newApp")}
        </button>
      </div>

      {isLoadingApplications && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {applicationsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button onClick={() => refetchApplications()} className="mt-2 text-sm text-teal-600 hover:underline">{tc("retry")}</button>
        </div>
      )}
      {!isLoadingApplications && !applicationsError && applications.length === 0 && (
        <div className="py-12 text-center text-stone-500">
          <p>{t("noApplications")}</p>
        </div>
      )}
      {!isLoadingApplications && !applicationsError && applications.length > 0 && (
        <div className="bg-white rounded-lg border border-stone-200">
          <DataTable
            columns={columns}
            data={applications}
            isLoading={isLoadingApplications}
            onRowClick={handleRowClick}
            searchable
            onSearch={(q) => { setSearchQuery(q); setPage((p) => ({ ...p, offset: 0 })); }}
          />
        </div>
      )}
      {pagination && (
        <PaginationControls
          total={pagination.total}
          limit={pagination.limit}
          offset={pagination.offset}
          onPageChange={(offset) => setPage((p) => ({ ...p, offset }))}
        />
      )}

      {expandedApplicationId && (
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          {applications.find((app) => app.id === expandedApplicationId) && (
            <ApplicationDetails
              application={applications.find(
                (app) => app.id === expandedApplicationId
              )!}
            />
          )}
        </div>
      )}

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("newApp")}
      >
        <form onSubmit={handleCreateApplication} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("organization")} *
              </label>
              <select
                value={formData.organization_id}
                onChange={(e) =>
                  setFormData({ ...formData, organization_id: e.target.value })
                }
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              >
                <option value="">{tc("selectOrganization")}</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("product")} *
              </label>
              <select
                value={formData.product_id}
                onChange={(e) =>
                  setFormData({ ...formData, product_id: e.target.value })
                }
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              >
                <option value="">{t("selectProduct")}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}{product.type ? ` (${product.type})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("requestedAmount")} (SAR) *
              </label>
              <input
                type="number"
                value={formData.requested_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requested_amount: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("tenor")} *
              </label>
              <input
                type="number"
                value={formData.requested_tenor_months}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requested_tenor_months: parseInt(e.target.value) || 12,
                  })
                }
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="12"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t("purpose")} *
            </label>
            <textarea
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder={t("purposePlaceholder")}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              مرحلة خط سير المبيعات
            </label>
            <select
              value={formData.pipeline_stage}
              onChange={(e) => setFormData({ ...formData, pipeline_stage: e.target.value })}
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="new">جديد</option>
              <option value="lead">عميل محتمل</option>
              <option value="interested">مهتم</option>
              <option value="deal">صفقة</option>
              <option value="reject">مرفوض</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isCreating ? t("creating") : t("newApp")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function ApplicationDetails({ application }: { application: Application }) {
  const t = useTranslations("applications");
  const tc = useTranslations("common");
  const [docRefreshKey, setDocRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">
        {application.reference_number}
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-stone-600">{t("organization")}</p>
          <p className="font-medium text-stone-900">
            {application.organization_id}
          </p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{t("product")}</p>
          <p className="font-medium text-stone-900">{application.product_id}</p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{tc("status")}</p>
          <StatusBadge status={application.status} />
        </div>

        <div>
          <p className="text-sm text-stone-600">{t("requestedAmount")}</p>
          <p className="font-semibold text-stone-900">
            {new Intl.NumberFormat("en-SA", {
              style: "currency",
              currency: "SAR",
            }).format(application.requested_amount)}
          </p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{t("tenor")}</p>
          <p className="font-medium text-stone-900">
            {application.requested_tenor_months} {tc("months")}
          </p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{t("loanOfficer")}</p>
          <p className="font-medium text-stone-900">
            {application.officer_id || tc("unassigned")}
          </p>
        </div>

        <div className="md:col-span-3">
          <p className="text-sm text-stone-600">{t("purpose")}</p>
          <p className="font-medium text-stone-900">{application.purpose}</p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{tc("date")}</p>
          <p className="font-medium text-stone-900">
            {new Date(application.created_at).toLocaleDateString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{tc("updatedDate")}</p>
          <p className="font-medium text-stone-900">
            {new Date(application.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Documents Section */}
      <div className="border-t border-stone-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-stone-900">{tc("documents")}</h4>
          <FileUpload
            entityType="application"
            entityId={application.id}
            onUploadComplete={() => setDocRefreshKey((k) => k + 1)}
          />
        </div>
        <DocumentList
          entityType="application"
          entityId={application.id}
          refreshKey={docRefreshKey}
        />
      </div>
    </div>
  );
}
