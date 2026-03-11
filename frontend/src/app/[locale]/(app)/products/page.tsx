"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name_en: string;
  name_ar: string;
  product_type: "murabaha";
  min_amount: number;
  max_amount: number;
  min_tenor_months: number;
  max_tenor_months: number;
  profit_rate: number;
  is_active: boolean;
  created_at: string;
  [key: string]: unknown;
}

interface CreateProductInput {
  name_en: string;
  name_ar: string;
  product_type: "murabaha";
  min_amount: number;
  max_amount: number;
  min_tenor_months: number;
  max_tenor_months: number;
  profit_rate: number;
  is_active: boolean;
}

const sar = (amount: number) =>
  new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(amount);

const defaultForm: CreateProductInput = {
  name_en: "",
  name_ar: "",
  product_type: "murabaha",
  min_amount: 0,
  max_amount: 0,
  min_tenor_months: 1,
  max_tenor_months: 60,
  profit_rate: 0,
  is_active: true,
};

export default function ProductsPage() {
  const t = useTranslations("products");
  const tc = useTranslations("common");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [formData, setFormData] = useState<CreateProductInput>(defaultForm);

  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteItem, setDeleteItem] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<CreateProductInput>(defaultForm);

  const { data: products, pagination, isLoading, error: productsError, refetch } = useApiList<Product>("/products", page);
  const { mutate: createProduct, isSubmitting } = useApiMutation<CreateProductInput, Product>(
    "/products",
    "POST"
  );
  const { mutate: updateProduct, isSubmitting: isUpdating } = useApiMutation<CreateProductInput, Product>(
    `/products/${editItem?.id}`,
    "PUT"
  );
  const { mutate: deleteProduct, isSubmitting: isDeleting } = useApiMutation<object, void>(
    `/products/${deleteItem?.id}`,
    "DELETE"
  );

  const openEdit = (item: Product) => {
    setEditItem(item);
    setEditForm({
      name_en: item.name_en,
      name_ar: item.name_ar,
      product_type: item.product_type,
      min_amount: item.min_amount,
      max_amount: item.max_amount,
      min_tenor_months: item.min_tenor_months,
      max_tenor_months: item.max_tenor_months,
      profit_rate: item.profit_rate,
      is_active: item.is_active,
    });
  };

  const columns: Column<Product>[] = [
    {
      key: "name_en",
      header: t("title"),
      render: (item) => (
        <div>
          <p className="font-medium text-stone-900">{item.name_en}</p>
          <p className="text-xs text-stone-400 mt-0.5 text-right" dir="rtl">
            {item.name_ar}
          </p>
        </div>
      ),
    },
    {
      key: "product_type",
      header: tc("type"),
      render: (item) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700 capitalize">
          {item.product_type}
        </span>
      ),
    },
    {
      key: "min_amount",
      header: t("minAmount"),
      render: (item) => (
        <span className="text-sm tabular-nums">{sar(item.min_amount)}</span>
      ),
    },
    {
      key: "max_amount",
      header: t("maxAmount"),
      render: (item) => (
        <span className="text-sm tabular-nums">{sar(item.max_amount)}</span>
      ),
    },
    {
      key: "profit_rate",
      header: t("profitRate"),
      render: (item) => (
        <span className="text-sm tabular-nums font-medium">
          {item.profit_rate.toFixed(2)}%
        </span>
      ),
    },
    {
      key: "min_tenor_months",
      header: t("tenor"),
      render: (item) => (
        <span className="text-sm text-stone-600">
          {item.min_tenor_months} – {item.max_tenor_months}
        </span>
      ),
    },
    {
      key: "is_active",
      header: tc("status"),
      render: (item) => (
        <StatusBadge status={item.is_active ? "true" : "false"} />
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

    if (!formData.name_en.trim()) {
      toast.error(t("nameEnRequired"));
      return;
    }
    if (!formData.name_ar.trim()) {
      toast.error(t("nameArRequired"));
      return;
    }
    if (formData.min_amount <= 0) {
      toast.error(t("minAmountError"));
      return;
    }
    if (formData.max_amount <= formData.min_amount) {
      toast.error(t("maxAmountError"));
      return;
    }
    if (formData.profit_rate <= 0) {
      toast.error(t("profitRateError"));
      return;
    }

    try {
      await createProduct(formData);
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
      await updateProduct(editForm);
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
      await deleteProduct({});
      toast.success("تم الحذف بنجاح");
      setDeleteItem(null);
      refetch();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const field = (
    label: string,
    children: React.ReactNode,
    required = false
  ) => (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inputClass =
    "w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent";

  return (
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
            {t("newProduct")}
          </button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {productsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button onClick={() => refetch()} className="mt-2 text-sm text-teal-600 hover:underline">{tc("retry")}</button>
        </div>
      )}
      {!isLoading && !productsError && products.length === 0 && (
        <div className="py-12 text-center text-stone-500">
          <p>{t("noProducts")}</p>
        </div>
      )}
      {!isLoading && !productsError && products.length > 0 && (
        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          emptyMessage={t("emptyTable")}
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
        onClose={() => { setEditItem(null); setEditForm(defaultForm); }}
        title="تعديل"
        size="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field(
              t("nameEn"),
              <input
                type="text"
                value={editForm.name_en}
                onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
                className={inputClass}
                placeholder="Murabaha SME Financing"
              />,
              true
            )}
            {field(
              t("nameAr"),
              <input
                type="text"
                value={editForm.name_ar}
                onChange={(e) => setEditForm({ ...editForm, name_ar: e.target.value })}
                className={inputClass}
                placeholder="تمويل المرابحة للشركات"
                dir="rtl"
              />,
              true
            )}
            {field(
              t("productType"),
              <select
                value={editForm.product_type}
                onChange={(e) => setEditForm({ ...editForm, product_type: e.target.value as "murabaha" })}
                className={inputClass}
              >
                <option value="murabaha">Murabaha</option>
              </select>
            )}
            {field(
              t("profitRate") + " (%)",
              <input
                type="number"
                step="0.01"
                min="0"
                value={editForm.profit_rate}
                onChange={(e) => setEditForm({ ...editForm, profit_rate: parseFloat(e.target.value) || 0 })}
                className={inputClass}
                placeholder="5.50"
              />,
              true
            )}
            {field(
              t("minAmount") + " (SAR)",
              <input
                type="number"
                min="0"
                value={editForm.min_amount}
                onChange={(e) => setEditForm({ ...editForm, min_amount: parseFloat(e.target.value) || 0 })}
                className={inputClass}
                placeholder="50000"
              />,
              true
            )}
            {field(
              t("maxAmount") + " (SAR)",
              <input
                type="number"
                min="0"
                value={editForm.max_amount}
                onChange={(e) => setEditForm({ ...editForm, max_amount: parseFloat(e.target.value) || 0 })}
                className={inputClass}
                placeholder="5000000"
              />,
              true
            )}
            {field(
              t("minTenor"),
              <input
                type="number"
                min="1"
                value={editForm.min_tenor_months}
                onChange={(e) => setEditForm({ ...editForm, min_tenor_months: parseInt(e.target.value) || 1 })}
                className={inputClass}
                placeholder="6"
              />
            )}
            {field(
              t("maxTenor"),
              <input
                type="number"
                min="1"
                value={editForm.max_tenor_months}
                onChange={(e) => setEditForm({ ...editForm, max_tenor_months: parseInt(e.target.value) || 1 })}
                className={inputClass}
                placeholder="60"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="edit_is_active"
              checked={editForm.is_active}
              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
              className="h-4 w-4 text-teal-600 border-stone-300 rounded"
            />
            <label htmlFor="edit_is_active" className="text-sm font-medium text-stone-700">
              {t("activeLabel")}
            </label>
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
          setFormData(defaultForm);
        }}
        title={t("newProduct")}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {field(
              t("nameEn"),
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) =>
                  setFormData({ ...formData, name_en: e.target.value })
                }
                className={inputClass}
                placeholder="Murabaha SME Financing"
              />,
              true
            )}
            {field(
              t("nameAr"),
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) =>
                  setFormData({ ...formData, name_ar: e.target.value })
                }
                className={inputClass}
                placeholder="تمويل المرابحة للشركات"
                dir="rtl"
              />,
              true
            )}
            {field(
              t("productType"),
              <select
                value={formData.product_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    product_type: e.target.value as "murabaha",
                  })
                }
                className={inputClass}
              >
                <option value="murabaha">Murabaha</option>
              </select>
            )}
            {field(
              t("profitRate") + " (%)",
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.profit_rate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    profit_rate: parseFloat(e.target.value) || 0,
                  })
                }
                className={inputClass}
                placeholder="5.50"
              />,
              true
            )}
            {field(
              t("minAmount") + " (SAR)",
              <input
                type="number"
                min="0"
                value={formData.min_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_amount: parseFloat(e.target.value) || 0,
                  })
                }
                className={inputClass}
                placeholder="50000"
              />,
              true
            )}
            {field(
              t("maxAmount") + " (SAR)",
              <input
                type="number"
                min="0"
                value={formData.max_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_amount: parseFloat(e.target.value) || 0,
                  })
                }
                className={inputClass}
                placeholder="5000000"
              />,
              true
            )}
            {field(
              t("minTenor"),
              <input
                type="number"
                min="1"
                value={formData.min_tenor_months}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    min_tenor_months: parseInt(e.target.value) || 1,
                  })
                }
                className={inputClass}
                placeholder="6"
              />
            )}
            {field(
              t("maxTenor"),
              <input
                type="number"
                min="1"
                value={formData.max_tenor_months}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    max_tenor_months: parseInt(e.target.value) || 1,
                  })
                }
                className={inputClass}
                placeholder="60"
              />
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 text-teal-600 border-stone-300 rounded"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-stone-700"
            >
              {t("activeLabel")}
            </label>
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
              {isSubmitting ? t("creating") : t("newProduct")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
