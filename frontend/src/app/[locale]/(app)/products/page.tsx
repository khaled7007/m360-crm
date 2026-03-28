"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { Plus, Pencil, Trash2, FileText, Building2, Info } from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

type ProductCategory = "contractor_invoices" | "real_estate";
type REProgram = "leadership" | "growth" | "expansion" | null;

interface Product {
  id: string;
  name_ar: string;
  product_category: ProductCategory;
  re_program: REProgram;
  max_amount: number | null;
  financing_pct: number | null;
  min_tenor_months: number | null;
  max_tenor_months: number | null;
  profit_rate: number | null;
  admin_fee_pct: number | null;
  collateral: string | null;
  sales_notes: string | null;
  credit_notes: string | null;
  is_active: boolean;
  created_at: string;
  [key: string]: unknown;
}

interface ProductForm {
  name_ar: string;
  product_category: ProductCategory;
  re_program: REProgram;
  max_amount: string;
  financing_pct: string;
  min_tenor_months: string;
  max_tenor_months: string;
  profit_rate: string;
  admin_fee_pct: string;
  collateral: string;
  sales_notes: string;
  credit_notes: string;
  is_active: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────

const RE_PROGRAMS: { value: NonNullable<REProgram>; label: string; hint: string }[] = [
  { value: "leadership", label: "برنامج الريادة",  hint: "حتى 10 مليون ريال" },
  { value: "growth",     label: "برنامج النمو",    hint: "حتى 20 مليون ريال" },
  { value: "expansion",  label: "برنامج التوسع",   hint: "حتى 70% من قيمة العقار" },
];

const PROGRAM_DEFAULTS: Record<NonNullable<REProgram>, Partial<ProductForm>> = {
  leadership: { max_amount: "10000000", financing_pct: "",  profit_rate: "4.5",  admin_fee_pct: "1.0",  min_tenor_months: "12", max_tenor_months: "60"  },
  growth:     { max_amount: "20000000", financing_pct: "",  profit_rate: "4.0",  admin_fee_pct: "0.75", min_tenor_months: "12", max_tenor_months: "84"  },
  expansion:  { max_amount: "",         financing_pct: "70", profit_rate: "3.75", admin_fee_pct: "0.5",  min_tenor_months: "12", max_tenor_months: "120" },
};

const EMPTY_FORM: ProductForm = {
  name_ar: "",
  product_category: "contractor_invoices",
  re_program: null,
  max_amount: "",
  financing_pct: "",
  min_tenor_months: "",
  max_tenor_months: "",
  profit_rate: "",
  admin_fee_pct: "",
  collateral: "",
  sales_notes: "",
  credit_notes: "",
  is_active: true,
};

// ── Helpers ────────────────────────────────────────────────────────────────

const sar = (v: number) =>
  new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(v);

function categoryLabel(cat: ProductCategory) {
  return cat === "contractor_invoices" ? "فواتير المقاولين" : "تطوير عقاري";
}
function programLabel(p: REProgram) {
  if (!p) return "—";
  return RE_PROGRAMS.find((r) => r.value === p)?.label ?? p;
}
function programHint(p: REProgram) {
  if (!p) return null;
  return RE_PROGRAMS.find((r) => r.value === p)?.hint ?? null;
}

function productToForm(item: Product): ProductForm {
  return {
    name_ar:           item.name_ar ?? "",
    product_category:  item.product_category,
    re_program:        item.re_program,
    max_amount:        item.max_amount != null ? String(item.max_amount) : "",
    financing_pct:     item.financing_pct != null ? String(item.financing_pct) : "",
    min_tenor_months:  item.min_tenor_months != null ? String(item.min_tenor_months) : "",
    max_tenor_months:  item.max_tenor_months != null ? String(item.max_tenor_months) : "",
    profit_rate:       item.profit_rate != null ? String(item.profit_rate) : "",
    admin_fee_pct:     item.admin_fee_pct != null ? String(item.admin_fee_pct) : "",
    collateral:        item.collateral ?? "",
    sales_notes:       item.sales_notes ?? "",
    credit_notes:      item.credit_notes ?? "",
    is_active:         item.is_active,
  };
}

function formToPayload(f: ProductForm) {
  return {
    name_ar:          f.name_ar || (f.product_category === "contractor_invoices" ? "تمويل فواتير المقاولين" : "تمويل التطوير العقاري"),
    product_category: f.product_category,
    re_program:       f.product_category === "real_estate" ? f.re_program : null,
    max_amount:       f.max_amount ? parseFloat(f.max_amount) : null,
    financing_pct:    f.financing_pct ? parseFloat(f.financing_pct) : null,
    min_tenor_months: f.min_tenor_months ? parseInt(f.min_tenor_months) : null,
    max_tenor_months: f.max_tenor_months ? parseInt(f.max_tenor_months) : null,
    profit_rate:      f.profit_rate ? parseFloat(f.profit_rate) : null,
    admin_fee_pct:    f.admin_fee_pct ? parseFloat(f.admin_fee_pct) : null,
    collateral:       f.collateral || null,
    sales_notes:      f.sales_notes || null,
    credit_notes:     f.credit_notes || null,
    is_active:        f.is_active,
  };
}

// ── Form Component ─────────────────────────────────────────────────────────

function ProductFormFields({
  form,
  onChange,
}: {
  form: ProductForm;
  onChange: (patch: Partial<ProductForm>) => void;
}) {
  const isRE = form.product_category === "real_estate";
  const isExpansion = form.re_program === "expansion";
  const hint = isRE ? programHint(form.re_program) : null;

  const inp = "w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent";

  function handleCategory(cat: ProductCategory) {
    onChange({
      product_category: cat,
      re_program: cat === "real_estate" ? "leadership" : null,
      ...(cat === "real_estate" ? PROGRAM_DEFAULTS.leadership : { max_amount: "", financing_pct: "", profit_rate: "", admin_fee_pct: "", min_tenor_months: "", max_tenor_months: "" }),
    });
  }

  function handleProgram(prog: NonNullable<REProgram>) {
    onChange({ re_program: prog, ...PROGRAM_DEFAULTS[prog] });
  }

  return (
    <div className="space-y-5">
      {/* Product type toggle */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">نوع المنتج</label>
        <div className="grid grid-cols-2 gap-2">
          {(["contractor_invoices", "real_estate"] as ProductCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategory(cat)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition ${
                form.product_category === cat
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
              }`}
            >
              {cat === "contractor_invoices" ? <FileText size={15} /> : <Building2 size={15} />}
              {categoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* RE Program */}
      {isRE && (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">البرنامج</label>
          <div className="grid grid-cols-3 gap-2">
            {RE_PROGRAMS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handleProgram(p.value)}
                className={`flex flex-col items-center px-2 py-2.5 rounded-lg border text-xs font-medium transition ${
                  form.re_program === p.value
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50"
                }`}
              >
                <span>{p.label}</span>
                <span className={`text-[10px] mt-0.5 ${form.re_program === p.value ? "text-teal-100" : "text-stone-400"}`}>{p.hint}</span>
              </button>
            ))}
          </div>
          {hint && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded px-2.5 py-1.5">
              <Info size={12} className="shrink-0" />
              <span>الحد الأقصى للتمويل: <strong>{hint}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Financing limits */}
      <div className="grid grid-cols-2 gap-3">
        {!isExpansion ? (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">الحد الأقصى للتمويل (ر.س)</label>
            <input type="number" min="0" placeholder="10000000" value={form.max_amount}
              onChange={(e) => onChange({ max_amount: e.target.value })} className={inp} />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">نسبة التمويل من قيمة العقار (%)</label>
            <input type="number" min="0" max="100" step="0.5" placeholder="70" value={form.financing_pct}
              onChange={(e) => onChange({ financing_pct: e.target.value })} className={inp} />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">هامش الربح (%)</label>
          <input type="number" min="0" step="0.01" placeholder="4.5" value={form.profit_rate}
            onChange={(e) => onChange({ profit_rate: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">مدة التمويل - أدنى (شهر)</label>
          <input type="number" min="1" placeholder="12" value={form.min_tenor_months}
            onChange={(e) => onChange({ min_tenor_months: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">مدة التمويل - أقصى (شهر)</label>
          <input type="number" min="1" placeholder="60" value={form.max_tenor_months}
            onChange={(e) => onChange({ max_tenor_months: e.target.value })} className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">رسوم الإدارة (%)</label>
          <input type="number" min="0" step="0.01" placeholder="1.0" value={form.admin_fee_pct}
            onChange={(e) => onChange({ admin_fee_pct: e.target.value })} className={inp} />
        </div>
      </div>

      {/* Collateral */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">الضمانات</label>
        <input type="text" placeholder="رهن العقار، ضمان شخصي، ..." value={form.collateral}
          onChange={(e) => onChange({ collateral: e.target.value })} className={inp} />
      </div>

      {/* Notes */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
            ملاحظة المبيعات
          </label>
          <textarea rows={3} placeholder="نقاط البيع، الشريحة المستهدفة..." value={form.sales_notes}
            onChange={(e) => onChange({ sales_notes: e.target.value })}
            className={`${inp} resize-none`} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            ملاحظة الائتمان
          </label>
          <textarea rows={3} placeholder="متطلبات التحليل، المعايير الخاصة..." value={form.credit_notes}
            onChange={(e) => onChange({ credit_notes: e.target.value })}
            className={`${inp} resize-none`} />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => onChange({ is_active: !form.is_active })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.is_active ? "bg-teal-600" : "bg-stone-300"}`}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-1"}`} />
        </button>
        <span className="text-sm text-stone-700">{form.is_active ? "المنتج نشط" : "المنتج معطّل"}</span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const tc = useTranslations("common");
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem]  = useState<Product | null>(null);
  const [deleteItem, setDeleteItem] = useState<Product | null>(null);
  const [createForm, setCreateForm] = useState<ProductForm>(EMPTY_FORM);
  const [editForm,   setEditForm]   = useState<ProductForm>(EMPTY_FORM);

  const { data: products, pagination, isLoading, error, refetch } =
    useApiList<Product>("/products", page);

  const { mutate: createProduct, isSubmitting: isCreating } =
    useApiMutation<object, Product>("/products", "POST");
  const { mutate: updateProduct, isSubmitting: isUpdating } =
    useApiMutation<object, Product>(`/products/${editItem?.id}`, "PUT");
  const { mutate: deleteProduct, isSubmitting: isDeleting } =
    useApiMutation<object, void>(`/products/${deleteItem?.id}`, "DELETE");

  const openEdit = (item: Product) => {
    setEditItem(item);
    setEditForm(productToForm(item));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct(formToPayload(createForm));
      toast.success("تم إضافة المنتج بنجاح");
      setIsCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      refetch();
    } catch { toast.error("فشل إضافة المنتج"); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProduct(formToPayload(editForm));
      toast.success("تم تعديل المنتج بنجاح");
      setEditItem(null);
      refetch();
    } catch { toast.error("فشل التعديل"); }
  };

  const handleDelete = async () => {
    try {
      await deleteProduct({});
      toast.success("تم حذف المنتج");
      setDeleteItem(null);
      refetch();
    } catch { toast.error("فشل الحذف"); }
  };

  const columns: Column<Product>[] = [
    {
      key: "name_ar",
      header: "المنتج",
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${item.product_category === "contractor_invoices" ? "bg-teal-100" : "bg-amber-100"}`}>
            {item.product_category === "contractor_invoices"
              ? <FileText size={14} className="text-teal-700" />
              : <Building2 size={14} className="text-amber-700" />}
          </div>
          <div>
            <p className="font-medium text-stone-900 text-sm">{item.name_ar}</p>
            {item.re_program && (
              <p className="text-xs text-stone-400">{programLabel(item.re_program)}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "product_category",
      header: "النوع",
      render: (item) => (
        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
          item.product_category === "contractor_invoices"
            ? "bg-teal-50 text-teal-700 border border-teal-200"
            : "bg-amber-50 text-amber-700 border border-amber-200"
        }`}>
          {categoryLabel(item.product_category)}
        </span>
      ),
    },
    {
      key: "max_amount",
      header: "الحد / النسبة",
      render: (item) => (
        item.financing_pct
          ? <span className="text-sm font-semibold text-stone-800">{item.financing_pct}% من قيمة العقار</span>
          : item.max_amount
            ? <span className="text-sm font-semibold text-stone-800">{sar(item.max_amount)}</span>
            : <span className="text-stone-400 text-sm">—</span>
      ),
    },
    {
      key: "profit_rate",
      header: "هامش الربح",
      render: (item) => (
        item.profit_rate != null
          ? <span className="text-sm font-medium">{item.profit_rate}%</span>
          : <span className="text-stone-400 text-sm">—</span>
      ),
    },
    {
      key: "max_tenor_months",
      header: "المدة",
      render: (item) => (
        item.min_tenor_months != null
          ? <span className="text-sm text-stone-600">{item.min_tenor_months} – {item.max_tenor_months} شهر</span>
          : <span className="text-stone-400 text-sm">—</span>
      ),
    },
    {
      key: "sales_notes",
      header: "ملاحظة المبيعات",
      render: (item) => (
        <p className="text-xs text-stone-500 max-w-[200px] truncate" title={item.sales_notes ?? ""}>
          {item.sales_notes || "—"}
        </p>
      ),
    },
    {
      key: "is_active",
      header: "الحالة",
      render: (item) => (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          item.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-stone-100 text-stone-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? "bg-green-500" : "bg-stone-400"}`} />
          {item.is_active ? "نشط" : "معطّل"}
        </span>
      ),
    },
    {
      key: "id",
      header: "",
      render: (item) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); openEdit(item); }}
            className="p-1.5 text-teal-600 hover:bg-teal-50 rounded transition">
            <Pencil size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteItem(item); }}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="المنتجات التمويلية"
        description="إدارة منتجات تمويل فواتير المقاولين والتطوير العقاري"
        action={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm font-medium"
          >
            <Plus size={16} />
            منتج جديد
          </button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">تعذّر تحميل المنتجات</p>
          <button onClick={() => refetch()} className="mt-2 text-sm text-teal-600 hover:underline">{tc("retry")}</button>
        </div>
      )}
      {!isLoading && !error && products.length === 0 && (
        <div className="py-12 text-center text-stone-500">لا توجد منتجات</div>
      )}
      {!isLoading && !error && products.length > 0 && (
        <DataTable columns={columns} data={products} isLoading={isLoading} />
      )}
      {pagination && (
        <PaginationControls
          total={pagination.total} limit={pagination.limit} offset={pagination.offset}
          onPageChange={(offset) => setPage((p) => ({ ...p, offset }))}
        />
      )}

      {/* Create Modal */}
      <Modal open={isCreateOpen} onClose={() => { setIsCreateOpen(false); setCreateForm(EMPTY_FORM); }}
        title="منتج جديد" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <ProductFormFields form={createForm} onChange={(p) => setCreateForm((f) => ({ ...f, ...p }))} />
          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button type="button" onClick={() => { setIsCreateOpen(false); setCreateForm(EMPTY_FORM); }}
              className="px-4 py-2 text-sm text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">
              {tc("cancel")}
            </button>
            <button type="submit" disabled={isCreating}
              className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50">
              {isCreating ? "جارٍ الحفظ..." : "حفظ المنتج"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="تعديل المنتج" size="lg">
        <form onSubmit={handleEdit} className="space-y-4">
          <ProductFormFields form={editForm} onChange={(p) => setEditForm((f) => ({ ...f, ...p }))} />
          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button type="button" onClick={() => setEditItem(null)}
              className="px-4 py-2 text-sm text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">
              {tc("cancel")}
            </button>
            <button type="submit" disabled={isUpdating}
              className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50">
              {isUpdating ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="حذف المنتج" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">
            سيتم حذف <span className="font-semibold">{deleteItem?.name_ar}</span>
            {deleteItem?.re_program && <span> — {programLabel(deleteItem.re_program)}</span>}
            . هل أنت متأكد؟
          </p>
          <div className="flex gap-3 justify-end pt-2 border-t border-stone-200">
            <button onClick={() => setDeleteItem(null)}
              className="px-4 py-2 text-sm text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">
              {tc("cancel")}
            </button>
            <button onClick={handleDelete} disabled={isDeleting}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">
              {isDeleting ? "جارٍ الحذف..." : "حذف"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
