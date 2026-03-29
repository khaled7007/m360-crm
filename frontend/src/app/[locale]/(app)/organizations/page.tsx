"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { api } from "@/lib/api";
import { Plus, Search, Loader2, FileUp, Pencil, Trash2 } from "lucide-react";
import { FileUpload } from "@/components/ui/FileUpload";
import { DocumentList } from "@/components/ui/DocumentList";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";
import { useUserPermissions } from "@/lib/use-user-permissions";
import { OrgImportModal } from "@/components/organizations/OrgImportModal";

// ---------------------------------------------------------------------------
// Watheq Full Report types (mirrors backend WatheqFullReport)
// ---------------------------------------------------------------------------

interface WatheqActivity {
  id?: string;
  name?: string;
}

interface WatheqCRCapital {
  total?: number;
  currencyName?: string;
}

interface WatheqContactInfo {
  phone?: string;
  email?: string;
  fax?: string;
}

interface WatheqECommerce {
  url?: string;
  status?: string;
}

interface WatheqCRFullInfo {
  crNationalNumber?: string;
  crNumber?: string;
  name?: string;
  crCapital?: WatheqCRCapital;
  activities?: WatheqActivity[];
  contactInfo?: WatheqContactInfo;
  eCommerce?: WatheqECommerce;
}

interface WatheqCapital {
  currencyId?: string;
  currencyName?: string;
  total?: number;
}

interface WatheqNationalAddress {
  buildingNumber?: string;
  street?: string;
  district?: string;
  city?: string;
  postCode?: string;
  regionName?: string;
}

interface WatheqFullReport {
  cr_number: string;
  registration?: WatheqCRFullInfo;
  owners?: unknown[];
  managers?: unknown[];
  branches?: unknown[];
  capital?: WatheqCapital;
  addresses?: WatheqNationalAddress[];
  errors?: Record<string, string>;
}

interface Organization {
  id: string;
  name_en: string;
  name_ar: string;
  cr_number: string;
  vat_number?: string;
  industry: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  annual_revenue?: number;
  employee_count?: number;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name_en: string;
  name_ar?: string;
}

interface CreateOrganizationInput {
  name_en: string;
  name_ar: string;
  cr_number: string;
  product_id?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  vat_number?: string;
  industry?: string;
  website?: string;
  annual_revenue?: number;
  employee_count?: number;
}

export default function OrganizationsPage() {
  const t = useTranslations("organizations");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const pagePerms = useUserPermissions("organizations");
  const canCreate = pagePerms.can_create;
  const canEdit   = pagePerms.can_edit;
  const canDelete = pagePerms.can_delete;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<CreateOrganizationInput>({
    name_en: "",
    name_ar: "",
    cr_number: "",
    product_id: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    contact_name: "",
  });

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [newOrgId, setNewOrgId] = useState<string | null>(null);
  const [newOrgDocRefreshKey, setNewOrgDocRefreshKey] = useState(0);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [editForm, setEditForm] = useState<CreateOrganizationInput | null>(null);
  const [editDocRefreshKey, setEditDocRefreshKey] = useState(0);
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);

  const handleLookupCR = async () => {
    const crNumber = formData.cr_number.trim();
    if (!crNumber) return;

    setIsLookingUp(true);
    try {
      const token = sessionStorage.getItem("m360_token") || "";
      const report = await api<WatheqFullReport>(
        `/integrations/watheq/${crNumber}/full`,
        { token }
      );

      const updated: Partial<CreateOrganizationInput> = {};

      if (report.registration?.name) {
        updated.name_en = report.registration.name;
        updated.name_ar = report.registration.name;
      }

      if (report.registration?.activities?.length) {
        updated.industry = report.registration.activities[0].name || "";
      }

      if (report.addresses?.length) {
        const addr = report.addresses[0];
        if (addr.city) updated.city = addr.city;
        const parts = [addr.buildingNumber, addr.street, addr.district].filter(Boolean);
        if (parts.length) updated.address = parts.join(", ");
      }

      const capital =
        report.registration?.crCapital?.total ?? report.capital?.total;
      if (capital) {
        updated.annual_revenue = capital;
      }

      if (report.registration?.contactInfo?.phone) {
        updated.phone = report.registration.contactInfo.phone;
      }
      if (report.registration?.contactInfo?.email) {
        updated.email = report.registration.contactInfo.email;
      }
      if (report.registration?.eCommerce?.url) {
        updated.website = report.registration.eCommerce.url;
      }

      setFormData((prev) => ({ ...prev, ...updated }));

      if (report.errors && Object.keys(report.errors).length > 0) {
        toast.warning(t("lookupPartial"));
      } else {
        toast.success(t("lookupSuccess"));
      }
    } catch {
      toast.error(t("lookupError"));
    } finally {
      setIsLookingUp(false);
    }
  };

  const {
    data: organizations,
    pagination,
    isLoading: isLoadingOrganizations,
    error: organizationsError,
    refetch: refetchOrganizations,
  } = useApiList<Organization>("/organizations", { ...page, search: searchQuery || undefined });

  const { data: products } = useApiList<Product>("/products");

  const { mutate: createOrganization, isSubmitting: isCreating } =
    useApiMutation<CreateOrganizationInput, Organization>("/organizations", "POST");
  const { mutate: updateOrganization, isSubmitting: isUpdating } =
    useApiMutation(editOrg ? `/organizations/${editOrg.id}` : "/organizations", "PUT");
  const { mutate: deleteOrganization, isSubmitting: isDeleting } =
    useApiMutation(deleteOrg ? `/organizations/${deleteOrg.id}` : "/organizations", "DELETE");

  const openEdit = (org: Organization) => {
    setEditOrg(org);
    setEditDocRefreshKey(0);
    setEditForm({
      name_en: org.name_en,
      name_ar: org.name_ar,
      cr_number: org.cr_number,
      city: org.city || "",
      address: org.address || "",
      phone: org.phone || "",
      email: org.email || "",
      contact_name: "",
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try {
      await updateOrganization(editForm);
      toast.success("تم التعديل بنجاح");
      setEditOrg(null);
      setEditForm(null);
      refetchOrganizations();
    } catch {
      toast.error("فشل التعديل");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrganization({});
      toast.success("تم الحذف بنجاح");
      setDeleteOrg(null);
      refetchOrganizations();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const resetCreateModal = () => {
    setIsModalOpen(false);
    setNewOrgId(null);
    setNewOrgDocRefreshKey(0);
    setFormData({
      name_en: "",
      name_ar: "",
      cr_number: "",
      product_id: "",
      city: "",
      address: "",
      phone: "",
      email: "",
      contact_name: "",
    });
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createOrganization(formData);
      toast.success(t("createSuccess"));
      refetchOrganizations();
      if (created?.id) {
        setNewOrgId(created.id);
      } else {
        resetCreateModal();
      }
    } catch {
      toast.error(t("createError"));
    }
  };

  const columns: Column<Organization>[] = [
    {
      key: "name_en",
      header: t("title"),
      render: (item) => (
        <span className="font-medium">{(item as Organization).name_en}</span>
      ),
    },
    {
      key: "cr_number",
      header: t("crNumber"),
      render: (item) => <span>{(item as Organization).cr_number}</span>,
    },
    {
      key: "industry",
      header: t("industry"),
      render: (item) => <span>{(item as Organization).industry}</span>,
    },
    {
      key: "city",
      header: t("city"),
      render: (item) => <span>{(item as Organization).city}</span>,
    },
    {
      key: "annual_revenue",
      header: tc("amount"),
      render: (item) => (
        <span className="font-semibold">
          {new Intl.NumberFormat("en-SA", {
            style: "currency",
            currency: "SAR",
            notation: "compact",
          }).format((item as Organization).annual_revenue || 0)}
        </span>
      ),
    },
    {
      key: "created_at",
      header: tc("date"),
      render: (item) => (
        <span className="text-sm text-stone-600">
          {new Date((item as Organization).created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(item as Organization); }}
              className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition"
            ><Pencil size={14} /></button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteOrg(item as Organization); }}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
            ><Trash2 size={14} /></button>
          )}
        </div>
      ),
    },
  ];

  const handleRowClick = (org: Organization) => {
    setExpandedOrgId(expandedOrgId === org.id ? null : org.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={t("title")}
          description={t("subtitle")}
        />
        <div className="flex items-center gap-2">
          {canCreate && (
            <button
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition"
            >
              <FileUp size={18} />
              استيراد Excel
            </button>
          )}
          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              <Plus size={20} />
              {t("newOrg")}
            </button>
          )}
        </div>
      </div>

      {isLoadingOrganizations && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {organizationsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button onClick={() => refetchOrganizations()} className="mt-2 text-sm text-teal-600 hover:underline">{tc("retry")}</button>
        </div>
      )}
      {!isLoadingOrganizations && !organizationsError && organizations.length === 0 && (
        <div className="py-12 text-center text-stone-500">
          <p>{t("noOrganizations")}</p>
        </div>
      )}
      {!isLoadingOrganizations && !organizationsError && organizations.length > 0 && (
        <div className="bg-white rounded-lg border border-stone-200">
          <DataTable
            columns={columns}
            data={organizations}
            isLoading={isLoadingOrganizations}
            onRowClick={handleRowClick}
            emptyMessage={t("emptyTable")}
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

      {expandedOrgId && (
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          {organizations.find((org) => org.id === expandedOrgId) && (
            <OrganizationDetails
              organization={organizations.find(
                (org) => org.id === expandedOrgId
              )!}
            />
          )}
        </div>
      )}

      <OrgImportModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={() => { setIsImportOpen(false); refetchOrganizations(); }}
      />

      <Modal
        open={isModalOpen}
        onClose={resetCreateModal}
        title="طالب تمويل جديد"
        size="xl"
      >
        {newOrgId ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold shrink-0">✓</div>
              <div>
                <p className="font-semibold text-emerald-800">تم إنشاء طالب التمويل بنجاح</p>
                <p className="text-sm text-emerald-600">يمكنك الآن إرفاق القوائم المالية</p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-stone-900">القوائم المالية</h4>
                <FileUpload
                  entityType="organization"
                  entityId={newOrgId}
                  onUploadComplete={() => setNewOrgDocRefreshKey((k) => k + 1)}
                />
              </div>
              <DocumentList
                entityType="organization"
                entityId={newOrgId}
                refreshKey={newOrgDocRefreshKey}
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={resetCreateModal}
                className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleCreateOrganization} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">الاسم</label>
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value, name_ar: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
              placeholder="شركة الرياض للتطوير"
            />
          </div>

          {/* CR Number + Product */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">رقم السجل التجاري</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.cr_number}
                  onChange={(e) => setFormData({ ...formData, cr_number: e.target.value })}
                  className="flex-1 px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                  placeholder="1234567890"
                />
                <button
                  type="button"
                  disabled={!formData.cr_number.trim() || isLookingUp}
                  onClick={handleLookupCR}
                  className="flex items-center gap-1.5 px-3 py-2.5 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isLookingUp ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                  بحث
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">المنتج المطلوب</label>
              <select
                value={formData.product_id || ""}
                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">--</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name_ar || p.name_en}</option>
                ))}
              </select>
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">المدينة</label>
            <input
              type="text"
              value={formData.city || ""}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
              placeholder="Riyadh"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">العنوان</label>
            <input
              type="text"
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
              placeholder="Business Street, Riyadh 11543 123"
            />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">الهاتف</label>
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                placeholder="+966 11 123 4567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                placeholder="info@company.com"
              />
            </div>
          </div>

          {/* Contact Name */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">اسم الشخص المسؤول</label>
            <input
              type="text"
              value={formData.contact_name || ""}
              onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
              placeholder="محمد الأحمد"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={resetCreateModal}
              className="px-5 py-2.5 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isCreating ? t("creating") : "طالب تمويل جديد"}
            </button>
          </div>
        </form>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editOrg} onClose={() => { setEditOrg(null); setEditForm(null); }} title="تعديل طالب التمويل" size="xl">
        {editForm && editOrg && (
          <form onSubmit={handleEdit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">الاسم</label>
              <input
                type="text"
                value={editForm.name_en}
                onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value, name_ar: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                placeholder="شركة الرياض للتطوير"
              />
            </div>

            {/* CR Number + Product */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">رقم السجل التجاري</label>
                <input
                  type="text"
                  value={editForm.cr_number}
                  onChange={(e) => setEditForm({ ...editForm, cr_number: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                  placeholder="1234567890"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">المنتج المطلوب</label>
                <select
                  value={editForm.product_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, product_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">--</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name_ar || p.name_en}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">المدينة</label>
              <input
                type="text"
                value={editForm.city || ""}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                placeholder="Riyadh"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">العنوان</label>
              <input
                type="text"
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                placeholder="Business Street, Riyadh"
              />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">الهاتف</label>
                <input
                  type="tel"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                  placeholder="+966 11 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1.5">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                  placeholder="info@company.com"
                />
              </div>
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">اسم الشخص المسؤول</label>
              <input
                type="text"
                value={editForm.contact_name || ""}
                onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
                placeholder="محمد الأحمد"
              />
            </div>

            {/* Financial Statements */}
            <div className="border-t border-stone-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-stone-900">القوائم المالية</h4>
                <FileUpload
                  entityType="organization"
                  entityId={editOrg.id}
                  onUploadComplete={() => setEditDocRefreshKey((k) => k + 1)}
                />
              </div>
              <DocumentList
                entityType="organization"
                entityId={editOrg.id}
                refreshKey={editDocRefreshKey}
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
              <button type="button" onClick={() => { setEditOrg(null); setEditForm(null); }} className="px-5 py-2.5 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">{tc("cancel")}</button>
              <button type="submit" disabled={isUpdating} className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50">{isUpdating ? "جارٍ الحفظ..." : "حفظ التعديلات"}</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteOrg} onClose={() => setDeleteOrg(null)} title="تأكيد الحذف" size="sm">
        <p className="text-stone-700 mb-6">هل أنت متأكد من حذف <strong>{deleteOrg?.name_ar || deleteOrg?.name_en}</strong>؟ لا يمكن التراجع عن هذا الإجراء.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteOrg(null)} className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">{tc("cancel")}</button>
          <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">{isDeleting ? "جارٍ الحذف..." : "حذف"}</button>
        </div>
      </Modal>
    </div>
  );
}

function OrganizationDetails({ organization }: { organization: Organization }) {
  const t = useTranslations("organizations");
  const tc = useTranslations("common");
  const [docRefreshKey, setDocRefreshKey] = useState(0);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{organization.name_en}</h3>
          <p className="text-sm text-stone-500 mt-1">{organization.name_ar}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-stone-600">{t("crNumber")}</p>
          <p className="font-medium">{organization.cr_number}</p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{t("taxId")}</p>
          <p className="font-medium">{organization.vat_number || "—"}</p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{t("industry")}</p>
          <p className="font-medium">{organization.industry}</p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{t("city")}</p>
          <p className="font-medium">{organization.city}</p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{tc("phone")}</p>
          <p className="font-medium">{organization.phone}</p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{tc("email")}</p>
          <p className="font-medium">{organization.email}</p>
        </div>

        <div className="md:col-span-3">
          <p className="text-sm text-stone-600">{tc("address")}</p>
          <p className="font-medium">{organization.address}</p>
        </div>

        {organization.website && (
          <div className="md:col-span-3">
            <p className="text-sm text-stone-600">{tc("website")}</p>
            <a
              href={organization.website}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-teal-600 hover:text-teal-700"
            >
              {organization.website}
            </a>
          </div>
        )}

        <div>
          <p className="text-sm text-stone-600">{tc("amount")}</p>
          <p className="font-medium">
            {new Intl.NumberFormat("en-SA", {
              style: "currency",
              currency: "SAR",
            }).format(organization.annual_revenue || 0)}
          </p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{tc("employeeCount")}</p>
          <p className="font-medium">
            {organization.employee_count?.toLocaleString() || "—"}
          </p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{tc("date")}</p>
          <p className="font-medium">
            {new Date(organization.created_at).toLocaleDateString()}
          </p>
        </div>

        <div>
          <p className="text-sm text-stone-600">{tc("lastUpdated")}</p>
          <p className="font-medium">
            {new Date(organization.updated_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Financial Statements */}
      <div className="border-t border-stone-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-stone-900">القوائم المالية</h4>
          <FileUpload
            entityType="organization"
            entityId={organization.id}
            onUploadComplete={() => setDocRefreshKey((k) => k + 1)}
          />
        </div>
        <DocumentList
          entityType="organization"
          entityId={organization.id}
          refreshKey={docRefreshKey}
        />
      </div>
    </div>
  );
}
