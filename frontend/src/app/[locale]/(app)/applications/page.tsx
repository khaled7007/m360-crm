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
import { Plus, Settings2, Pencil, BookOpen, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { StatusSettingsModal } from "@/components/ui/StatusSettingsModal";
import { useStatusConfig } from "@/lib/status-config-context";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const DOC_TYPES = [
  { key: "cr",                  label: "السجل التجاري" },
  { key: "bank_statement",      label: "كشف الحساب البنكي" },
  { key: "simah_personal",      label: "إقرار سمة الشخصي" },
  { key: "simah_company",       label: "إقرار سمة المنشأة" },
  { key: "financial_statements",label: "القوائم المالية" },
  { key: "other",               label: "ملفات أخرى" },
] as const;

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

interface AppFormInput {
  organization_id: string;
  product_id: string;
  requested_amount: number;
  requested_tenor_months: number;
  purpose: string;
  pipeline_stage: string;
  reference_number?: string;
}

const emptyForm: AppFormInput = {
  organization_id: "",
  product_id: "",
  requested_amount: 0,
  requested_tenor_months: 12,
  purpose: "",
  pipeline_stage: "new",
};

export default function ApplicationsPage() {
  const t = useTranslations("applications");
  const tc = useTranslations("common");
  const { token } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStatusSettingsOpen, setIsStatusSettingsOpen] = useState(false);
  const [expandedApplicationId, setExpandedApplicationId] = useState<string | null>(null);
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<AppFormInput>({ ...emptyForm });
  const [orgSearch, setOrgSearch] = useState("");
  const [docFiles, setDocFiles] = useState<Record<string, File | null>>({
    cr: null, bank_statement: null, simah_personal: null, simah_company: null, financial_statements: null, other: null,
  });
  const [isUploadingDocs, setIsUploadingDocs] = useState(false);

  const [editItem, setEditItem] = useState<Application | null>(null);
  const [editForm, setEditForm] = useState<AppFormInput>({ ...emptyForm });
  const [editOrgSearch, setEditOrgSearch] = useState("");

  const { data: organizations } = useApiList<Organization>("/organizations");
  const { data: products } = useApiList<Product>("/products");
  const {
    data: applications,
    pagination,
    isLoading: isLoadingApplications,
    error: applicationsError,
    refetch: refetchApplications,
  } = useApiList<Application>("/applications", {
    ...page,
    search: searchQuery || undefined,
  });

  const { mutate: createApplication, isSubmitting: isCreating } =
    useApiMutation<AppFormInput>("/applications", "POST");

  const { mutate: updateApplication, isSubmitting: isUpdating } =
    useApiMutation<AppFormInput>(
      `/applications/${editItem?.id}`,
      "PUT"
    );

  const filteredOrgs = organizations.filter((org) => {
    if (!orgSearch.trim()) return true;
    const q = orgSearch.toLowerCase();
    return (
      org.name_en.toLowerCase().includes(q) ||
      (org.name_ar || "").toLowerCase().includes(q)
    );
  });

  const filteredEditOrgs = organizations.filter((org) => {
    if (!editOrgSearch.trim()) return true;
    const q = editOrgSearch.toLowerCase();
    return (
      org.name_en.toLowerCase().includes(q) ||
      (org.name_ar || "").toLowerCase().includes(q)
    );
  });

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createApplication(formData) as { id: string } | undefined;
      const appId = (created as { id?: string } | undefined)?.id;

      // Upload documents if any were selected
      const filesToUpload = DOC_TYPES.filter((d) => docFiles[d.key]);
      if (appId && filesToUpload.length > 0 && token) {
        setIsUploadingDocs(true);
        await Promise.allSettled(
          filesToUpload.map(async (d) => {
            const file = docFiles[d.key]!;
            const fd = new FormData();
            fd.append("file", file);
            fd.append("entity_type", "application");
            fd.append("entity_id", appId);
            fd.append("name", `${d.label} — ${file.name}`);
            await fetch("/api/v1/documents", {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
              body: fd,
            });
          })
        );
        setIsUploadingDocs(false);
      }

      toast.success(t("createSuccess"));
      setIsModalOpen(false);
      setFormData({ ...emptyForm });
      setOrgSearch("");
      setDocFiles({ cr: null, bank_statement: null, simah_personal: null, simah_company: null, financial_statements: null, other: null });
      refetchApplications();
    } catch {
      toast.error(t("createError"));
    }
  };

  const handleEditApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateApplication(editForm);
      toast.success("تم تحديث الطلب بنجاح");
      setEditItem(null);
      setEditOrgSearch("");
      refetchApplications();
    } catch {
      toast.error("فشل تحديث الطلب");
    }
  };

  const handleSendToCredit = async (item: Application) => {
    try {
      const token = localStorage.getItem("m360_token") || "";
      await api("/credit-assessments", {
        method: "POST",
        body: { organization_id: item.organization_id, sent_from_application: true },
        token,
      });
      await api(`/applications/${item.id}`, {
        method: "PUT",
        body: { status: "credit_assessment" },
        token,
      });
      toast.success("تم الإرسال للائتمان بنجاح");
      refetchApplications();
    } catch {
      toast.error("فشل الإرسال للائتمان");
    }
  };

  const openEditModal = (item: Application) => {
    setEditItem(item);
    setEditForm({
      organization_id: item.organization_id || "",
      product_id: item.product_id || "",
      requested_amount: item.requested_amount || 0,
      requested_tenor_months: item.requested_tenor_months || 12,
      purpose: item.purpose || "",
      pipeline_stage: item.pipeline_stage || "new",
      reference_number: item.reference_number || "",
    });
    setEditOrgSearch("");
  };

  const columns: Column<Application>[] = [
    {
      key: "reference_number",
      header: t("referenceNumber"),
      render: (item) => (
        <span className="font-medium text-stone-900">{item.reference_number}</span>
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
        <span className="text-sm text-stone-700 line-clamp-1">{item.purpose}</span>
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
    {
      key: "actions" as keyof Application,
      header: "",
      render: (item) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {item.status !== "credit_assessment" && (
            <button
              onClick={() => handleSendToCredit(item)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-md hover:bg-teal-100 transition"
              title="إرسال للائتمان"
            >
              <BookOpen size={14} />
              <span>إرسال للائتمان</span>
            </button>
          )}
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-stone-500 hover:text-teal-600 hover:bg-teal-50 rounded-md transition"
            title="تعديل"
          >
            <Pencil size={15} />
          </button>
        </div>
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
        <PageHeader title={t("title")} description={t("subtitle")} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStatusSettingsOpen(true)}
            className="p-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50 transition"
            title="إعدادات الوسوم"
          >
            <Settings2 size={18} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <Plus size={20} />
            {t("newApp")}
          </button>
        </div>
      </div>

      {isLoadingApplications && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {applicationsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button
            onClick={() => refetchApplications()}
            className="mt-2 text-sm text-teal-600 hover:underline"
          >
            {tc("retry")}
          </button>
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
            onSearch={(q) => {
              setSearchQuery(q);
              setPage((p) => ({ ...p, offset: 0 }));
            }}
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
              application={
                applications.find((app) => app.id === expandedApplicationId)!
              }
              onStatusChanged={refetchApplications}
            />
          )}
        </div>
      )}

      {isStatusSettingsOpen && (
        <StatusSettingsModal onClose={() => setIsStatusSettingsOpen(false)} />
      )}

      {/* Create Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setOrgSearch("");
          setDocFiles({ cr: null, bank_statement: null, simah_personal: null, simah_company: null, financial_statements: null, other: null });
        }}
        title={t("newApp")}
        size="xl"
      >
        <form onSubmit={handleCreateApplication} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("organization")}
              </label>
              <input
                type="text"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="بحث عن منظمة..."
                className="w-full px-3 py-2 border border-stone-300 rounded-t-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <select
                value={formData.organization_id}
                onChange={(e) =>
                  setFormData({ ...formData, organization_id: e.target.value })
                }
                className="w-full rounded-b-lg border border-t-0 border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                size={4}
              >
                <option value="">{tc("selectOrganization")}</option>
                {filteredOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name_ar ? `${org.name_ar} — ` : ""}{org.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("product")}
              </label>
              <select
                value={formData.product_id}
                onChange={(e) =>
                  setFormData({ ...formData, product_id: e.target.value })
                }
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">{t("selectProduct")}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.type ? ` (${product.type})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("requestedAmount")} (SAR)
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
                {t("tenor")}
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
              {t("purpose")}
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
              onChange={(e) =>
                setFormData({ ...formData, pipeline_stage: e.target.value })
              }
              className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="new">جديد</option>
              <option value="lead">عميل محتمل</option>
              <option value="interested">مهتم</option>
              <option value="deal">صفقة</option>
              <option value="reject">مرفوض</option>
            </select>
          </div>

          {/* ── Document Uploads ── */}
          <div className="border-t border-stone-200 pt-4">
            <p className="text-sm font-semibold text-stone-700 mb-3">المستندات المطلوبة</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DOC_TYPES.map((d) => {
                const file = docFiles[d.key];
                return (
                  <label
                    key={d.key}
                    className={`flex items-center gap-3 border rounded-lg px-3 py-2.5 cursor-pointer transition ${
                      file
                        ? "border-teal-400 bg-teal-50"
                        : "border-dashed border-stone-300 hover:border-teal-400 hover:bg-stone-50"
                    }`}
                  >
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        setDocFiles((prev) => ({ ...prev, [d.key]: f }));
                      }}
                    />
                    {file ? (
                      <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
                    ) : (
                      <Upload size={18} className="text-stone-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-700">{d.label}</p>
                      {file && (
                        <p className="text-xs text-teal-600 truncate">{file.name}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-stone-400">مستندات اختيارية — يمكن رفعها الآن أو لاحقاً. PDF أو صورة أو Excel.</p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setOrgSearch("");
                setDocFiles({ cr: null, bank_statement: null, simah_personal: null, simah_company: null, financial_statements: null, other: null });
              }}
              className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isCreating || isUploadingDocs}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isUploadingDocs ? "جاري رفع المستندات..." : isCreating ? t("creating") : t("newApp")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editItem !== null}
        onClose={() => {
          setEditItem(null);
          setEditOrgSearch("");
        }}
        title="تعديل الطلب"
      >
        <form onSubmit={handleEditApplication} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              الرقم المرجعي
            </label>
            <input
              type="text"
              value={editForm.reference_number || ""}
              onChange={(e) => setEditForm({ ...editForm, reference_number: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent font-mono text-sm"
              placeholder="APP-2026-001"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("organization")}
              </label>
              <input
                type="text"
                value={editOrgSearch}
                onChange={(e) => setEditOrgSearch(e.target.value)}
                placeholder="بحث عن منظمة..."
                className="w-full px-3 py-2 border border-stone-300 rounded-t-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <select
                value={editForm.organization_id}
                onChange={(e) =>
                  setEditForm({ ...editForm, organization_id: e.target.value })
                }
                className="w-full rounded-b-lg border border-t-0 border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                size={4}
              >
                <option value="">{tc("selectOrganization")}</option>
                {filteredEditOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name_ar ? `${org.name_ar} — ` : ""}{org.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("product")}
              </label>
              <select
                value={editForm.product_id}
                onChange={(e) =>
                  setEditForm({ ...editForm, product_id: e.target.value })
                }
                className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">{t("selectProduct")}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.type ? ` (${product.type})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("requestedAmount")} (SAR)
              </label>
              <input
                type="number"
                value={editForm.requested_amount}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
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
                {t("tenor")}
              </label>
              <input
                type="number"
                value={editForm.requested_tenor_months}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
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
              {t("purpose")}
            </label>
            <textarea
              value={editForm.purpose}
              onChange={(e) =>
                setEditForm({ ...editForm, purpose: e.target.value })
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
              value={editForm.pipeline_stage}
              onChange={(e) =>
                setEditForm({ ...editForm, pipeline_stage: e.target.value })
              }
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
              onClick={() => {
                setEditItem(null);
                setEditOrgSearch("");
              }}
              className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isUpdating ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const APP_STATUSES = [
  "draft", "submitted", "pre_approved", "documents_collected",
  "credit_assessment", "committee_review", "approved", "rejected", "disbursed",
] as const;

function ApplicationDetails({ application, onStatusChanged }: { application: Application; onStatusChanged: () => void }) {
  const t = useTranslations("applications");
  const tc = useTranslations("common");
  const { statusConfig } = useStatusConfig();
  const [docRefreshKey, setDocRefreshKey] = useState(0);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === application.status) return;
    setIsChangingStatus(true);
    try {
      const token = localStorage.getItem("m360_token") || "";
      await api(`/applications/${application.id}`, {
        method: "PUT",
        body: { status: newStatus },
        token,
      });
      toast.success("تم تحديث الحالة");
      onStatusChanged();
    } catch {
      toast.error("فشل تحديث الحالة");
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{application.reference_number}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-500">تغيير الحالة:</span>
          <select
            value={application.status}
            disabled={isChangingStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50"
          >
            {APP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusConfig[s]?.label || s}
              </option>
            ))}
          </select>
          {isChangingStatus && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          )}
        </div>
      </div>

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

      {/* Org Financial Statements (read-only) */}
      {application.organization_id && (
        <div className="border-t border-stone-200 pt-4">
          <h4 className="text-sm font-semibold text-stone-900 mb-3">القوائم المالية لطالب التمويل</h4>
          <DocumentList
            entityType="organization"
            entityId={application.organization_id}
          />
        </div>
      )}
    </div>
  );
}
