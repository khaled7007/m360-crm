"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
  national_id?: string;
  phone?: string;
  email?: string;
  role?: string;
  is_guarantor: boolean;
  created_at: string;
}

interface CreateContactRequest {
  organization_id: string;
  name_en: string;
  name_ar?: string;
  national_id?: string;
  phone?: string;
  email?: string;
  role?: string;
  is_guarantor: boolean;
}

export default function ContactsPage() {
  const t = useTranslations("contacts");
  const tc = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<Partial<CreateContactRequest>>({
    is_guarantor: false,
  });

  const [editItem, setEditItem] = useState<Contact | null>(null);
  const [deleteItem, setDeleteItem] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateContactRequest>>({ is_guarantor: false });

  const { data: organizations } = useApiList<Organization>("/organizations");
  const { data: contacts, pagination, isLoading, error: contactsError, refetch } = useApiList<Contact>("/contacts", { ...page, search: searchQuery || undefined });
  const { mutate: createContact, isSubmitting } =
    useApiMutation<CreateContactRequest, Contact>("/contacts", "POST");
  const { mutate: updateContact, isSubmitting: isUpdating } =
    useApiMutation<CreateContactRequest, Contact>(`/contacts/${editItem?.id}`, "PUT");
  const { mutate: deleteContact, isSubmitting: isDeleting } =
    useApiMutation<object, void>(`/contacts/${deleteItem?.id}`, "DELETE");

  const openEdit = (item: Contact) => {
    setEditItem(item);
    setEditForm({
      organization_id: item.organization_id,
      name_en: item.name_en,
      name_ar: item.name_ar,
      national_id: item.national_id,
      phone: item.phone,
      email: item.email,
      role: item.role,
      is_guarantor: item.is_guarantor,
    });
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.organization_id ||
      !formData.name_en ||
      !formData.national_id ||
      !formData.phone ||
      !formData.email ||
      !formData.role
    ) {
      toast.error(tc("fillRequired"));
      return;
    }

    try {
      await createContact(formData as CreateContactRequest);
      toast.success(t("createSuccess"));
      setIsModalOpen(false);
      setFormData({ is_guarantor: false });
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("createError")
      );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateContact(editForm as CreateContactRequest);
      toast.success("تم التعديل بنجاح");
      setEditItem(null);
      setEditForm({ is_guarantor: false });
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

  const columns: Column<Contact>[] = [
    {
      key: "name_en",
      header: tc("name"),
      render: (item) => (
        <div>
          <p className="font-medium">{item.name_en}</p>
          {item.name_ar && <p className="text-xs text-stone-400" dir="rtl">{item.name_ar}</p>}
        </div>
      ),
    },
    {
      key: "national_id",
      header: t("nationalId"),
    },
    {
      key: "phone",
      header: tc("phone"),
    },
    {
      key: "email",
      header: tc("email"),
    },
    {
      key: "role",
      header: t("role"),
    },
    {
      key: "is_guarantor",
      header: t("guarantor"),
      render: (item) => <StatusBadge status={String(item.is_guarantor)} />,
    },
    {
      key: "actions" as keyof Contact,
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
        <div className="py-12 text-center text-stone-500">
          <p>{t("noContacts")}</p>
        </div>
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

      <Modal
        open={!!editItem}
        onClose={() => { setEditItem(null); setEditForm({ is_guarantor: false }); }}
        title="تعديل"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("nameEn")} *
              </label>
              <input
                type="text"
                name="name_en"
                value={editForm.name_en || ""}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Full name (English)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("nameAr")}
              </label>
              <input
                type="text"
                name="name_ar"
                value={editForm.name_ar || ""}
                onChange={handleEditInputChange}
                dir="rtl"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
                placeholder="الاسم الكامل (عربي)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t("organization")} *
            </label>
            <select
              name="organization_id"
              value={editForm.organization_id || ""}
              onChange={handleEditInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("nationalId")} *
              </label>
              <input
                type="text"
                name="national_id"
                value={editForm.national_id || ""}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Saudi National ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {tc("phone")} *
              </label>
              <input
                type="tel"
                name="phone"
                value={editForm.phone || ""}
                onChange={handleEditInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="+966..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {tc("email")} *
            </label>
            <input
              type="email"
              name="email"
              value={editForm.email || ""}
              onChange={handleEditInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t("role")} *
            </label>
            <input
              type="text"
              name="role"
              value={editForm.role || ""}
              onChange={handleEditInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. Director, Manager"
              required
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_guarantor"
                checked={editForm.is_guarantor || false}
                onChange={handleEditInputChange}
                className="w-4 h-4 text-teal-600 border-stone-300 rounded focus:ring-teal-500"
              />
              <span className="text-sm text-stone-700">{t("guarantor")}</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setEditItem(null); setEditForm({ is_guarantor: false }); }}
              className="flex-1 px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? "..." : "تعديل"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        title="حذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-stone-700">هل أنت متأكد من حذف هذا العنصر؟</p>
          <div className="flex gap-3 justify-end pt-2">
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
              {isDeleting ? "..." : "حذف"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
      setFormData({ is_guarantor: false });
        }}
        title={t("newContact")}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("nameEn")} *
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Full name (English)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("nameAr")}
              </label>
              <input
                type="text"
                name="name_ar"
                value={formData.name_ar || ""}
                onChange={handleInputChange}
                dir="rtl"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
                placeholder="الاسم الكامل (عربي)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t("organization")} *
            </label>
            <select
              name="organization_id"
              value={formData.organization_id || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("nationalId")} *
              </label>
              <input
                type="text"
                name="national_id"
                value={formData.national_id || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Saudi National ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {tc("phone")} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="+966..."
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {tc("email")} *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="user@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t("role")} *
            </label>
            <input
              type="text"
              name="role"
              value={formData.role || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="e.g. Director, Manager"
              required
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_guarantor"
                checked={formData.is_guarantor || false}
                onChange={handleInputChange}
                className="w-4 h-4 text-teal-600 border-stone-300 rounded focus:ring-teal-500"
              />
              <span className="text-sm text-stone-700">{t("guarantor")}</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
      setFormData({ is_guarantor: false });
              }}
              className="flex-1 px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t("creating") : t("newContact")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
