"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { Plus, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth-context";

const CREATE_ROLES = ["super_admin","admin","sales_manager","operations_manager","care_manager","credit_manager","credit_officer"];
const CONVERT_ROLES = ["super_admin","admin","sales_manager"];

interface Lead {
  id: string;
  organization_id?: string;
  contact_name: string;
  company_name: string;
  phone: string;
  email: string;
  source: "website" | "social_media" | "referral" | "cold_call" | "event" | "partner";
  status: "new" | "contacted" | "qualified" | "unqualified" | "converted";
  estimated_amount: number;
  notes: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

interface CreateLeadInput {
  contact_name: string;
  company_name: string;
  phone: string;
  email: string;
  source: Lead["source"];
  status?: Lead["status"];
  estimated_amount: number;
  notes?: string;
  assigned_to?: string;
  organization_id?: string;
}

const EMPTY_FORM: CreateLeadInput = {
  contact_name: "",
  company_name: "",
  phone: "",
  email: "",
  source: "website",
  status: "new",
  estimated_amount: 0,
  notes: "",
};

export default function LeadsPage() {
  const t = useTranslations("leads");
  const tc = useTranslations("common");
  const { user, token } = useAuth();
  const canCreate = CREATE_ROLES.includes(user?.role || "");
  const canConvert = CONVERT_ROLES.includes(user?.role || "");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<CreateLeadInput>(EMPTY_FORM);
  const [isConverting, setIsConverting] = useState(false);

  const { data: leads, pagination, isLoading: isLoadingLeads, error: leadsError, refetch: refetchLeads } =
    useApiList<Lead>("/leads", { ...page, search: searchQuery || undefined });

  const { mutate: createLead, isSubmitting: isCreating } = useApiMutation("/leads", "POST");
  const { mutate: updateLead } = useApiMutation<Partial<Lead>>(`/leads/${convertLead?.id}`, "PUT");

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLead(formData);
      toast.success(t("createSuccess"));
      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      refetchLeads();
    } catch {
      toast.error(t("createError"));
    }
  };

  const handleConvert = async () => {
    if (!convertLead || !token) return;
    setIsConverting(true);
    try {
      // Create org from lead data
      await fetch("/api/v1/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name_en: convertLead.company_name || convertLead.contact_name,
          name_ar: convertLead.company_name || convertLead.contact_name,
          phone: convertLead.phone,
          email: convertLead.email,
        }),
      });
      // Mark lead as converted
      await updateLead({ status: "converted" });
      toast.success(t("convertSuccess"));
      setConvertLead(null);
      refetchLeads();
    } catch {
      toast.error(t("convertError"));
    } finally {
      setIsConverting(false);
    }
  };

  const sourceLabel = (source: Lead["source"]) => {
    const map: Record<Lead["source"], string> = {
      website: t("sources.website"),
      social_media: t("sources.social_media"),
      referral: t("sources.referral"),
      cold_call: t("sources.cold_call"),
      event: t("sources.event"),
      partner: t("sources.partner"),
    };
    return map[source] ?? source;
  };

  const columns: Column<Lead>[] = [
    {
      key: "contact_name",
      header: t("contactName"),
      render: (item) => <span className="font-medium">{item.contact_name}</span>,
    },
    {
      key: "company_name",
      header: t("companyName"),
    },
    {
      key: "source",
      header: t("source"),
      render: (item) => (
        <span className="text-sm px-2 py-1 bg-teal-100 text-teal-700 rounded">
          {sourceLabel(item.source)}
        </span>
      ),
    },
    {
      key: "status",
      header: tc("status"),
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "estimated_amount",
      header: t("estimatedAmount"),
      render: (item) => (
        <span className="font-semibold">
          {new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(item.estimated_amount || 0)}
        </span>
      ),
    },
    {
      key: "created_at",
      header: tc("date"),
      render: (item) => (
        <span className="text-sm text-stone-600">{new Date(item.created_at).toLocaleDateString()}</span>
      ),
    },
    ...(canConvert ? [{
      key: "actions" as keyof Lead,
      header: "",
      render: (item: Lead) => (
        item.status !== "converted" ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConvertLead(item); }}
            className="flex items-center gap-1 px-3 py-1 text-xs border border-teal-400 text-teal-700 rounded hover:bg-teal-50 transition"
            title={t("convertToOrg")}
          >
            <Building2 size={13} />
            {t("convertToOrg")}
          </button>
        ) : (
          <span className="text-xs text-stone-400 px-2">{t("statuses.converted")}</span>
        )
      ),
    }] : []),
  ];

  const handleRowClick = (lead: Lead) => {
    setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title={t("title")} description={t("subtitle")} />
        {canCreate && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            <Plus size={20} />
            {t("newLead")}
          </button>
        )}
      </div>

      {isLoadingLeads && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {leadsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button onClick={() => refetchLeads()} className="mt-2 text-sm text-teal-600 hover:underline">{t("retry")}</button>
        </div>
      )}
      {!isLoadingLeads && !leadsError && leads.length === 0 && (
        <div className="py-12 text-center text-stone-500">
          <p>{t("noLeads")}</p>
        </div>
      )}
      {!isLoadingLeads && !leadsError && leads.length > 0 && (
        <DataTable
          columns={columns}
          data={leads}
          isLoading={isLoadingLeads}
          onRowClick={handleRowClick}
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

      {expandedLeadId && (
        <div className="bg-white rounded-lg border border-stone-200 p-6">
          {leads.find((lead) => lead.id === expandedLeadId) && (
            <LeadDetails lead={leads.find((lead) => lead.id === expandedLeadId)!} sourceLabel={sourceLabel} />
          )}
        </div>
      )}

      {/* Create Lead Modal */}
      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={t("createTitle")}>
        <form onSubmit={handleCreateLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">{t("contactName")}</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="اسم جهة الاتصال"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">{t("companyName")}</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="اسم الشركة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">{tc("email")}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="example@domain.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">{tc("phone")}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="+966 50 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">{t("source")}</label>
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as Lead["source"] })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="website">{t("sources.website")}</option>
                <option value="social_media">{t("sources.social_media")}</option>
                <option value="cold_call">{t("sources.cold_call")}</option>
                <option value="event">{t("sources.event")}</option>
                <option value="partner">{t("sources.partner")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">{tc("status")}</label>
              <select
                value={formData.status || "new"}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Lead["status"] })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="new">{t("statuses.new")}</option>
                <option value="contacted">{t("statuses.contacted")}</option>
                <option value="qualified">{t("statuses.qualified")}</option>
                <option value="unqualified">{t("statuses.unqualified")}</option>
                <option value="converted">{t("statuses.converted")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">{t("estimatedAmount")} (SAR)</label>
              <input
                type="number"
                value={formData.estimated_amount}
                onChange={(e) => setFormData({ ...formData, estimated_amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">{t("notes")}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="ملاحظات إضافية..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">
              {tc("cancel")}
            </button>
            <button type="submit" disabled={isCreating} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50">
              {isCreating ? t("creating") : t("newLead")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert Confirmation Modal */}
      <Modal
        open={!!convertLead}
        onClose={() => setConvertLead(null)}
        title={t("convertToOrg")}
        size="sm"
      >
        {convertLead && (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              سيتم إنشاء طالب تمويل جديد باسم <span className="font-semibold text-stone-800">{convertLead.company_name || convertLead.contact_name}</span> وتغيير حالة العميل المحتمل إلى &quot;محوّل&quot;.
            </p>
            <div className="bg-stone-50 rounded-lg p-3 text-sm space-y-1">
              {convertLead.phone && <div><span className="text-stone-500">الهاتف: </span>{convertLead.phone}</div>}
              {convertLead.email && <div><span className="text-stone-500">البريد: </span>{convertLead.email}</div>}
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-stone-200">
              <button onClick={() => setConvertLead(null)} className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">
                {tc("cancel")}
              </button>
              <button
                onClick={handleConvert}
                disabled={isConverting}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
              >
                <Building2 size={16} />
                {isConverting ? "جارٍ التحويل..." : t("convertToOrg")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function LeadDetails({ lead, sourceLabel }: { lead: Lead; sourceLabel: (s: Lead["source"]) => string }) {
  const t = useTranslations("leads");
  const tc = useTranslations("common");
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{lead.contact_name}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-stone-600">{t("companyName")}</p>
          <p className="font-medium">{lead.company_name}</p>
        </div>
        <div>
          <p className="text-sm text-stone-600">{tc("email")}</p>
          <p className="font-medium">{lead.email}</p>
        </div>
        <div>
          <p className="text-sm text-stone-600">{tc("phone")}</p>
          <p className="font-medium">{lead.phone}</p>
        </div>
        <div>
          <p className="text-sm text-stone-600">{t("source")}</p>
          <p className="font-medium">{sourceLabel(lead.source)}</p>
        </div>
        <div>
          <p className="text-sm text-stone-600">{tc("status")}</p>
          <StatusBadge status={lead.status} />
        </div>
        <div>
          <p className="text-sm text-stone-600">{t("estimatedAmount")}</p>
          <p className="font-medium">
            {new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(lead.estimated_amount)}
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="text-sm text-stone-600">{t("notes")}</p>
          <p className="font-medium">{lead.notes || "—"}</p>
        </div>
        <div>
          <p className="text-sm text-stone-600">{tc("date")}</p>
          <p className="font-medium">{new Date(lead.created_at).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-sm text-stone-600">{tc("lastUpdated")}</p>
          <p className="font-medium">{new Date(lead.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
