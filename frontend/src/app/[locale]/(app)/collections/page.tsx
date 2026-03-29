"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiGet, useApiList, useApiMutation } from "@/lib/use-api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/ui/RoleGuard";

interface Facility {
  id: string;
  reference_number?: string;
  organization_name?: string;
}

// Overdue summary returned by GET /collections/overdue
interface OverdueSummary {
  total_overdue_count: number;
  total_overdue_amount: number;
  par_1_29_count: number;
  par_1_29_amount: number;
  par_30_count: number;
  par_30_amount: number;
  par_60_count: number;
  par_60_amount: number;
  par_90_count: number;
  par_90_amount: number;
}

// Collection action model
interface CollectionAction {
  id: string;
  facility_id: string;
  officer_id: string;
  action_type: "phone_call" | "site_visit" | "letter" | "legal_notice";
  description: string;
  next_action_date: string;
  created_at: string;
  [key: string]: unknown;
}

interface CreateCollectionInput {
  facility_id: string;
  action_type: "phone_call" | "site_visit" | "letter" | "legal_notice";
  description: string;
  next_action_date: string;
}

const sar = (amount: number) =>
  new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(amount);

// actionTypeLabels moved inside component to use translations

const defaultForm: CreateCollectionInput = {
  facility_id: "",
  action_type: "phone_call",
  description: "",
  next_action_date: "",
};

export default function CollectionsPage() {
  const t = useTranslations("collections");
  const tc = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<CreateCollectionInput>(defaultForm);
  const [editItem, setEditItem] = useState<CollectionAction | null>(null);
  const [deleteItem, setDeleteItem] = useState<CollectionAction | null>(null);
  const [editForm, setEditForm] = useState<CreateCollectionInput>(defaultForm);

  const actionTypeLabels: Record<string, string> = {
    phone_call: t("actionTypeLabels.phone_call"),
    site_visit: t("actionTypeLabels.site_visit"),
    letter: t("actionTypeLabels.letter"),
    legal_notice: t("actionTypeLabels.legal_notice"),
  };

  const { data: facilities } = useApiList<Facility>("/facilities");
  const { data: overdue, isLoading: isLoadingOverdue } =
    useApiGet<OverdueSummary>("/collections/overdue");

  const { data: actions, pagination, isLoading: isLoadingActions, error: actionsError, refetch } =
    useApiList<CollectionAction>("/collections", { ...page, search: searchQuery || undefined });

  const { mutate: createAction, isSubmitting } =
    useApiMutation<CreateCollectionInput, CollectionAction>("/collections", "POST");

  const { mutate: updateAction, isSubmitting: isUpdating } =
    useApiMutation<CreateCollectionInput, CollectionAction>(
      `/collections/${editItem?.id}`,
      "PUT"
    );

  const { mutate: deleteAction, isSubmitting: isDeleting } =
    useApiMutation<Record<string, never>, void>(
      `/collections/${deleteItem?.id}`,
      "DELETE"
    );

  const openEdit = (item: CollectionAction) => {
    setEditItem(item);
    setEditForm({
      facility_id: item.facility_id,
      action_type: item.action_type,
      description: item.description,
      next_action_date: item.next_action_date
        ? item.next_action_date.slice(0, 10)
        : "",
    });
  };

  const columns: Column<CollectionAction>[] = [
    {
      key: "facility_id",
      header: t("facilityId"),
      render: (item) => (
        <span className="font-mono text-xs text-stone-600">{item.facility_id}</span>
      ),
    },
    {
      key: "action_type",
      header: t("actionType"),
      render: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-700">
          {actionTypeLabels[item.action_type] ?? item.action_type}
        </span>
      ),
    },
    {
      key: "description",
      header: t("description"),
      render: (item) => (
        <span className="text-sm text-stone-700 max-w-xs truncate block">
          {item.description || "—"}
        </span>
      ),
    },
    {
      key: "next_action_date",
      header: t("nextActionDate"),
      render: (item) => (
        <span className="text-sm text-stone-600">
          {item.next_action_date
            ? new Date(item.next_action_date).toLocaleDateString("en-SA")
            : "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: t("createdDate"),
      render: (item) => (
        <span className="text-sm text-stone-500">
          {new Date(item.created_at).toLocaleDateString("en-SA")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition"
          >
            <Pencil size={14} />
          </button>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.facility_id.trim()) {
      toast.error(t("facilityIdRequired"));
      return;
    }
    if (!formData.description.trim()) {
      toast.error(t("descriptionRequired"));
      return;
    }
    if (!formData.next_action_date) {
      toast.error(t("nextActionDateRequired"));
      return;
    }

    try {
      await createAction(formData);
      toast.success(t("createSuccess"));
      setIsModalOpen(false);
      setFormData(defaultForm);
      refetch();
    } catch {
      toast.error(t("createError"));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateAction(editForm);
      toast.success("تم التعديل بنجاح");
      setEditItem(null);
      setEditForm(defaultForm);
      refetch();
    } catch {
      toast.error("فشل التعديل");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteAction({});
      toast.success("تم الحذف بنجاح");
      setDeleteItem(null);
      refetch();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent";

  const fieldLabel = (label: string, required = false) => (
    <label className="block text-sm font-medium text-stone-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );

  return (
    <RoleGuard roles={["super_admin", "admin", "operations_manager", "operations_officer", "care_manager", "viewer"]}>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
          >
            <Plus size={16} />
            {t("newAction")}
          </button>
        }
      />

      {/* Overdue Summary */}
      <div className="bg-white rounded-lg border border-stone-200 p-5">
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-4">
          {t("overdueSummary")}
        </h2>
        {isLoadingOverdue ? (
          <div className="flex items-center gap-2 text-sm text-stone-400">
            <div className="animate-spin h-4 w-4 border-2 border-teal-600 border-t-transparent rounded-full" />
            {tc("loadingSummary")}
          </div>
        ) : overdue ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="md:col-span-1 bg-red-50 rounded-lg p-4 border border-red-100">
              <p className="text-xs text-red-500 font-medium uppercase tracking-wide">
                {t("totalOverdue")}
              </p>
              <p className="mt-1 text-lg font-bold text-red-700 tabular-nums">
                {sar(overdue.total_overdue_amount)}
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                {overdue.total_overdue_count} accounts
              </p>
            </div>

            {[
              {
                label: "PAR 1–29",
                status: "par_1_29",
                count: overdue.par_1_29_count,
                amount: overdue.par_1_29_amount,
              },
              {
                label: "PAR 30+",
                status: "par_30",
                count: overdue.par_30_count,
                amount: overdue.par_30_amount,
              },
              {
                label: "PAR 60+",
                status: "par_60",
                count: overdue.par_60_count,
                amount: overdue.par_60_amount,
              },
              {
                label: "PAR 90+",
                status: "par_90",
                count: overdue.par_90_count,
                amount: overdue.par_90_amount,
              },
            ].map((bucket) => (
              <div
                key={bucket.status}
                className="bg-white rounded-lg p-4 border border-stone-200"
              >
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={bucket.status} />
                </div>
                <p className="text-base font-semibold text-stone-900 tabular-nums">
                  {sar(bucket.amount)}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {bucket.count} {bucket.count === 1 ? "account" : "accounts"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400">{t("noOverdueData")}</p>
        )}
      </div>

      {/* Collection Actions Table */}
      <div>
        <h2 className="text-sm font-semibold text-stone-700 uppercase tracking-wide mb-3">
          {t("title")}
        </h2>
        {isLoadingActions && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          </div>
        )}
        {actionsError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-600">{t("loadError")}</p>
            <button onClick={() => refetch()} className="mt-2 text-sm text-teal-600 hover:underline">{tc("retry")}</button>
          </div>
        )}
        {!isLoadingActions && !actionsError && actions.length === 0 && (
          <div className="py-12 text-center text-stone-500">
            <p>{t("noActions")}</p>
          </div>
        )}
        {!isLoadingActions && !actionsError && actions.length > 0 && (
          <DataTable
            columns={columns}
            data={actions}
            isLoading={isLoadingActions}
            emptyMessage={t("noActions")}
            searchable
            onSearch={(q) => { setSearchQuery(q); setPage((p) => ({ ...p, offset: 0 })); }}
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
      </div>

      {/* Log Action Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData(defaultForm);
        }}
        title={t("newAction")}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            {fieldLabel(t("facilityId"), true)}
            <select
              value={formData.facility_id}
              onChange={(e) =>
                setFormData({ ...formData, facility_id: e.target.value })
              }
              className={inputClass}
              required
            >
              <option value="">{t("enterFacilityUuid")}</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.reference_number || facility.organization_name || facility.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            {fieldLabel(t("actionType"), true)}
            <select
              value={formData.action_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  action_type: e.target.value as CreateCollectionInput["action_type"],
                })
              }
              className={inputClass}
            >
              <option value="phone_call">{actionTypeLabels.phone_call}</option>
              <option value="site_visit">{actionTypeLabels.site_visit}</option>
              <option value="letter">{actionTypeLabels.letter}</option>
              <option value="legal_notice">{actionTypeLabels.legal_notice}</option>
            </select>
          </div>

          <div>
            {fieldLabel(t("description"), true)}
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className={inputClass}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div>
            {fieldLabel(t("nextActionDate"), true)}
            <input
              type="date"
              value={formData.next_action_date}
              onChange={(e) =>
                setFormData({ ...formData, next_action_date: e.target.value })
              }
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setFormData(defaultForm);
              }}
              className="px-4 py-2 text-sm text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isSubmitting ? tc("logging") : t("logAction")}
            </button>
          </div>
        </form>
      </Modal>
      {/* Edit Modal */}
      <Modal
        open={!!editItem}
        onClose={() => { setEditItem(null); setEditForm(defaultForm); }}
        title="تعديل"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            {fieldLabel(t("facilityId"), true)}
            <select
              value={editForm.facility_id}
              onChange={(e) => setEditForm({ ...editForm, facility_id: e.target.value })}
              className={inputClass}
              required
            >
              <option value="">{t("enterFacilityUuid")}</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.reference_number || facility.organization_name || facility.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            {fieldLabel(t("actionType"), true)}
            <select
              value={editForm.action_type}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  action_type: e.target.value as CreateCollectionInput["action_type"],
                })
              }
              className={inputClass}
            >
              <option value="phone_call">{actionTypeLabels.phone_call}</option>
              <option value="site_visit">{actionTypeLabels.site_visit}</option>
              <option value="letter">{actionTypeLabels.letter}</option>
              <option value="legal_notice">{actionTypeLabels.legal_notice}</option>
            </select>
          </div>

          <div>
            {fieldLabel(t("description"), true)}
            <textarea
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className={inputClass}
              placeholder={t("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          <div>
            {fieldLabel(t("nextActionDate"), true)}
            <input
              type="date"
              value={editForm.next_action_date}
              onChange={(e) => setEditForm({ ...editForm, next_action_date: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => { setEditItem(null); setEditForm(defaultForm); }}
              className="px-4 py-2 text-sm text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isUpdating ? tc("loading") : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </Modal>

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
    </RoleGuard>
  );
}
