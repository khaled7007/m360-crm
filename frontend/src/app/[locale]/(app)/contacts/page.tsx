"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface Organization {
  id: string;
  name_en: string;
  name_ar?: string;
}

interface Contact {
  id: string;
  organization_id: string;
  name_en: string;
  name_ar?: string;
  phone?: string;
  email?: string;
  role?: string;
  is_guarantor: boolean;
  created_at: string;
}

interface ContactForm {
  organization_id?: string;
  name_en?: string;
  name_ar?: string;
  phone?: string;
  email?: string;
  role?: string;
  is_guarantor: boolean;
}

const emptyForm: ContactForm = { is_guarantor: false };

export default function ContactsPage() {
  const t = useTranslations("contacts");
  const tc = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<ContactForm>(emptyForm);
  const [editItem, setEditItem] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState<ContactForm>(emptyForm);
  const [deleteItem, setDeleteItem] = useState<Contact | null>(null);
  const [convertItem, setConvertItem] = useState<Contact | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const { data: organizations } = useApiList<Organization>("/organizations");
  const { data: contacts, pagination, isLoading, error: contactsError, refetch } =
    useApiList<Contact>("/contacts", { ...page, search: searchQuery || undefined });

  const { mutate: createContact, isSubmitting } =
    useApiMutation<ContactForm, Contact>("/contacts", "POST");
  const { mutate: updateContact, isSubmitting: isUpdating } =
    useApiMutation<ContactForm, Contact>(`/contacts/${editItem?.id}`, "PUT");
  const { mutate: deleteContact, isSubmitting: isDeleting } =
    useApiMutation<object, void>(`/contacts/${deleteItem?.id}`, "DELETE");
  const { mutate: createOrg } =
    useApiMutation<Record<string, unknown>, Organization>("/organizations", "POST");

  const openEdit = (item: Contact) => {
    setEditItem(item);
    setEditForm({
      organization_id: item.organization_id,
      name_en: item.name_en,
      phone: item.phone,
      email: item.email,
      role: item.role,
      is_guarantor: item.is_guarantor,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContact({ ...formData, name_ar: formData.name_en });
      toast.success(t("createSuccess"));
      setIsModalOpen(false);
      setFormData(emptyForm);
      refetch();
    } catch {
      toast.error(t("createError"));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateContact({ ...editForm, name_ar: editForm.name_en });
      toast.success("تم التعديل بنجاح");
      setEditItem(null);
      setEditForm(emptyForm);
      refetch();
    } catch {
      toast.error("فشل التعديل");
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteContact({});
      toast.success("تم الحذف بنجاح");
      setDeleteItem(null);
      refetch();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const handleConvert = async () => {
    if (!convertItem) return;
    setIsConverting(true);
    try {
      await createOrg({
        name_en: convertItem.name_en,
        name_ar: convertItem.name_ar || convertItem.name_en,
        cr_number: "",
        phone: convertItem.phone || "",
        email: convertItem.email || "",
      });
      toast.success("تم تحويل جهة الاتصال إلى طالب تمويل بنجاح");
      setConvertItem(null);
    } catch {
      toast.error("فشل التحويل");
    } finally {
      setIsConverting(false);
    }
  };

  const columns: Column<Contact>[] = [
    {
      key: "name_en",
      header: tc("name"),
      render: (item) => <p className="font-medium">{item.name_en}</p>,
    },
    { key: "phone", header: tc("phone") },
    { key: "email", header: tc("email") },
    { key: "role",  header: t("role") },
    {
      key: "actions" as keyof Contact,
      header: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setConvertItem(item); }}
            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded transition"
            title="تحويل لطالب تمويل"
          >
            <Building2 size={14} />
          </button>
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

  const formFields = (
    form: ContactForm,
    onChange: (field: keyof ContactForm, value: string | boolean) => void
  ) => (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">الاسم</label>
        <input
          type="text"
          value={form.name_en || ""}
          onChange={(e) => onChange("name_en", e.target.value)}
          className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
          placeholder="محمد الأحمد"
        />
      </div>

      {/* Organization */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">{t("organization")}</label>
        <select
          value={form.organization_id || ""}
          onChange={(e) => onChange("organization_id", e.target.value)}
          className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">{tc("selectOrganization")}</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>{org.name_en}</option>
          ))}
        </select>
      </div>

      {/* Phone + Email */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">{tc("phone")}</label>
          <input
            type="tel"
            value={form.phone || ""}
            onChange={(e) => onChange("phone", e.target.value)}
            className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
            placeholder="+966 5X XXX XXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">{tc("email")}</label>
          <input
            type="email"
            value={form.email || ""}
            onChange={(e) => onChange("email", e.target.value)}
            className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
            placeholder="info@company.com"
          />
        </div>
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">{t("role")}</label>
        <input
          type="text"
          value={form.role || ""}
          onChange={(e) => onChange("role", e.target.value)}
          className="w-full px-3 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-right"
          placeholder="مدير، شريك، ..."
        />
      </div>

      {/* Guarantor */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_guarantor || false}
            onChange={(e) => onChange("is_guarantor", e.target.checked)}
            className="w-4 h-4 text-teal-600 border-stone-300 rounded focus:ring-teal-500"
          />
          <span className="text-sm text-stone-700">{t("guarantor")}</span>
        </label>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={20} />
            {t("newContact")}
          </button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {contactsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button onClick={() => refetch()} className="mt-2 text-sm text-teal-600 hover:underline">{tc("retry")}</button>
        </div>
      )}
      {!isLoading && !contactsError && contacts.length === 0 && (
        <div className="py-12 text-center text-stone-500"><p>{t("noContacts")}</p></div>
      )}
      {!isLoading && !contactsError && contacts.length > 0 && (
        <DataTable<Contact>
          columns={columns}
          data={contacts}
          isLoading={isLoading}
          emptyMessage={t("emptyTable")}
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

      {/* Create Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => { setIsModalOpen(false); setFormData(emptyForm); }}
        title={t("newContact")}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formFields(formData, (field, value) =>
            setFormData((prev) => ({ ...prev, [field]: value }))
          )}
          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button type="button" onClick={() => { setIsModalOpen(false); setFormData(emptyForm); }}
              className="px-5 py-2.5 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">
              {tc("cancel")}
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50">
              {isSubmitting ? t("creating") : t("newContact")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editItem}
        onClose={() => { setEditItem(null); setEditForm(emptyForm); }}
        title="تعديل جهة الاتصال"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-5">
          {formFields(editForm, (field, value) =>
            setEditForm((prev) => ({ ...prev, [field]: value }))
          )}
          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button type="button" onClick={() => { setEditItem(null); setEditForm(emptyForm); }}
              className="px-5 py-2.5 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">
              {tc("cancel")}
            </button>
            <button type="submit" disabled={isUpdating}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50">
              {isUpdating ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert to Organization Modal */}
      <Modal
        open={!!convertItem}
        onClose={() => setConvertItem(null)}
        title="تحويل لطالب تمويل"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            سيتم إنشاء طالب تمويل جديد باسم <strong>{convertItem?.name_en}</strong>. يمكنك إضافة بيانات إضافية لاحقاً.
          </p>
          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button type="button" onClick={() => setConvertItem(null)}
              className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">
              {tc("cancel")}
            </button>
            <button type="button" onClick={handleConvert} disabled={isConverting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2">
              <Building2 size={14} />
              {isConverting ? "جارٍ التحويل..." : "تحويل"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="حذف" size="sm">
        <div className="space-y-4">
          <p className="text-stone-700">هل أنت متأكد من حذف هذا العنصر؟</p>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setDeleteItem(null)}
              className="px-4 py-2 text-sm text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">
              {tc("cancel")}
            </button>
            <button type="button" onClick={handleDeleteConfirm} disabled={isDeleting}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">
              {isDeleting ? "..." : "حذف"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
