"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { api } from "@/lib/api";
import { Plus, Search, Loader2, FileUp } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { OrgImportModal } from "@/components/organizations/OrgImportModal";

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
}

interface Organization {
  id: string;
  name_en: string;
  name_ar: string;
  cr_number: string;
  vat_number: string;
  industry: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  contact_name?: string;
  created_at: string;
  updated_at: string;
}

interface CreateOrganizationInput {
  name_en: string;
  name_ar: string;
  cr_number: string;
  vat_number?: string;
  industry: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  contact_name?: string;
}

const emptyForm = (): CreateOrganizationInput => ({
  name_en: "",
  name_ar: "",
  cr_number: "",
  vat_number: "",
  industry: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  contact_name: "",
});

export default function OrganizationsPage() {
  const t = useTranslations("organizations");
  const tc = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [name, setName] = useState("");
  const [formData, setFormData] = useState<CreateOrganizationInput>(emptyForm());
  const [isLookingUp, setIsLookingUp] = useState(false);

  const { data: products } = useApiList<Product>("/products", { limit: 100 });

  const handleLookupCR = async () => {
    const crNumber = formData.cr_number.trim();
    if (!crNumber) return;
    setIsLookingUp(true);
    try {
      const token = localStorage.getItem("m360_token") || "";
      const report = await api<{ cr_number: string; registration?: { name?: string; contactInfo?: { phone?: string; email?: string } }; addresses?: { city?: string; buildingNumber?: string; street?: string; district?: string }[] }>(
        `/integrations/watheq/${crNumber}/full`,
        { token }
      );
      const updated: Partial<CreateOrganizationInput> = {};
      if (report.registration?.name) {
        setName(report.registration.name);
        updated.name_en = report.registration.name;
        updated.name_ar = report.registration.name;
      }
      if (report.addresses?.length) {
        const addr = report.addresses[0];
        if (addr.city) updated.city = addr.city;
        const parts = [addr.buildingNumber, addr.street, addr.district].filter(Boolean);
        if (parts.length) updated.address = parts.join(", ");
      }
      if (report.registration?.contactInfo?.phone) updated.phone = report.registration.contactInfo.phone;
      if (report.registration?.contactInfo?.email) updated.email = report.registration.contactInfo.email;
      setFormData((prev) => ({ ...prev, ...updated }));
      toast.success(t("lookupSuccess"));
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

  const { mutate: createOrganization, isSubmitting: isCreating } =
    useApiMutation("/organizations", "POST");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrganization({ ...formData, name_en: name, name_ar: name });
      toast.success(t("createSuccess"));
      setIsModalOpen(false);
      setName("");
      setFormData(emptyForm());
      refetchOrganizations();
    } catch {
      toast.error(t("createError"));
    }
  };

  const columns: Column<Organization>[] = [
    {
      key: "name_en",
      header: t("name"),
      render: (item) => <span className="font-medium">{item.name_ar || item.name_en}</span>,
    },
    {
      key: "cr_number",
      header: t("crNumber"),
      render: (item) => <span className="font-mono text-sm">{item.cr_number}</span>,
    },
    {
      key: "industry",
      header: t("requestedProduct"),
      render: (item) => <span>{item.industry}</span>,
    },
    {
      key: "contact_name",
      header: t("contactName"),
      render: (item) => <span className="text-stone-600">{item.contact_name || "—"}</span>,
    },
    {
      key: "city",
      header: t("city"),
      render: (item) => <span>{item.city}</span>,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={t("title")} description={t("subtitle")} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition"
          >
            <FileUp size={18} />
            استيراد Excel
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <Plus size={20} />
            {t("newOrg")}
          </button>
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
            onRowClick={(org) => setExpandedOrgId(expandedOrgId === org.id ? null : org.id)}
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
              organization={organizations.find((org) => org.id === expandedOrgId)!}
            />
          )}
        </div>
      )}

      <OrgImportModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={() => { setIsImportOpen(false); refetchOrganizations(); }}
      />

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={t("newOrg")}>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Single name field */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("name")} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="شركة الرياض للتطوير"
              />
            </div>

            {/* CR Number with Watheq lookup */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("crNumber")} *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.cr_number}
                  onChange={(e) => setFormData({ ...formData, cr_number: e.target.value })}
                  required
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="1234567890"
                />
                <button
                  type="button"
                  disabled={!formData.cr_number.trim() || isLookingUp}
                  onClick={handleLookupCR}
                  className="flex items-center gap-1.5 px-3 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isLookingUp ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  {isLookingUp ? t("lookupLoading") : t("lookupCR")}
                </button>
              </div>
            </div>

            {/* VAT number */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("taxId")}
              </label>
              <input
                type="text"
                value={formData.vat_number}
                onChange={(e) => setFormData({ ...formData, vat_number: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="300000000000003"
              />
            </div>

            {/* Requested product dropdown */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("requestedProduct")} *
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">--</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name_en}>
                    {p.name_ar || p.name_en}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("city")} *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Riyadh"
              />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {tc("address")} *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="123 Business Street, Riyadh 11543"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {tc("phone")} *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="+966 11 123 4567"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {tc("email")} *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="info@company.com"
              />
            </div>

            {/* Contact person name */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("contactName")}
              </label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="محمد الأحمد"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => { setIsModalOpen(false); setName(""); setFormData(emptyForm()); }}
              className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isCreating ? t("creating") : t("newOrg")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function OrganizationDetails({ organization }: { organization: Organization }) {
  const t = useTranslations("organizations");
  const tc = useTranslations("common");
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{organization.name_ar || organization.name_en}</h3>
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
          <p className="text-sm text-stone-600">{t("requestedProduct")}</p>
          <p className="font-medium">{organization.industry}</p>
        </div>
        <div>
          <p className="text-sm text-stone-600">{t("contactName")}</p>
          <p className="font-medium">{organization.contact_name || "—"}</p>
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
        <div>
          <p className="text-sm text-stone-600">{tc("date")}</p>
          <p className="font-medium">{new Date(organization.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
