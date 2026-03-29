"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

interface Organization {
  id: string;
  name_en: string;
  name_ar: string;
}

const STEPS = [
  "company_info",
  "financial_statements",
  "credit_history",
  "project_feasibility",
  "collateral",
] as const;

const locationOptions = ["riyadh", "jeddah", "makkah", "dammam", "khobar", "other"];

const initialFormData = {
  organization_id: "",
  project_name: "",
  project_brief: "",
  business_activity: "",
  entity_type: "",
  entity_location: "",
  years_in_business: "",
  income_diversification: "",
  audited_financials: false,
  total_revenue: 0,
  operating_cash_flow: 0,
  current_liabilities: 0,
  net_profit: 0,
  operating_profit: 0,
  finance_costs: 0,
  total_assets: 0,
  current_assets: 0,
  credit_record: "",
  payment_behavior: "",
  payment_delays: "",
  num_delays: "",
  delay_ratio: "",
  financing_default: "",
  num_defaults: "",
  default_ratio: "",
  bounced_checks: "",
  lawsuits: "",
  project_location: "",
  has_project_plan: false,
  has_insurance: false,
  project_type: "",
  engineering_firm_class: "",
  feasibility_study_quality: "",
  project_net_profit: 0,
  project_total_cost: 0,
  previous_projects_count: "",
  property_location: "",
  property_type: "",
  property_usage: "",
  appraisal_1: 0,
  appraisal_2: 0,
  financing_amount: 0,
  murabaha_rate: 0,
  tenor_months: 0,
  repayment_mechanism: "monthly",
};

type FormData = typeof initialFormData;

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      >
        <option value="">--</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">{label}</label>
      <input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        placeholder="0"
      />
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
      />
      <span className="text-sm font-medium text-stone-700">{label}</span>
    </label>
  );
}

function ComputedRatio({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-50 rounded-lg px-3 py-2 flex items-center justify-between">
      <span className="text-sm text-stone-600">{label}</span>
      <span className="text-sm font-semibold text-teal-700">{value}</span>
    </div>
  );
}

export default function NewCreditAssessmentPage() {
  const t = useTranslations("creditAssessment");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [productCategory, setProductCategory] = useState<string>("");

  const { data: allApps } = useApiList<{ organization_id: string; status: string; product_id: string; requested_amount: number; tenor_months: number }>("/applications", { limit: 500 });
  const { data: allProducts } = useApiList<{ id: string; product_category: string }>("/products", { limit: 100 });
  const { data: allOrgs } = useApiList<Organization>("/organizations", { limit: 200 });
  const sentApps = allApps.filter((a) => a.status === "credit_assessment");
  const sentOrgIds = new Set(sentApps.map((a) => a.organization_id));
  const orgs = allOrgs.filter((o) => sentOrgIds.has(o.id));
  const { mutate: create, isSubmitting } = useApiMutation<FormData>("/credit-assessments", "POST");

  const isContractorInvoices = productCategory === "contractor_invoices";

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const ratios = useMemo(() => {
    const safe = (n: number, d: number) => (d > 0 ? ((n / d) * 100).toFixed(1) + "%" : "N/A");
    const safeRatio = (n: number, d: number) => (d > 0 ? (n / d).toFixed(2) : "N/A");
    return {
      ocf: safe(form.operating_cash_flow, form.current_liabilities),
      npm: safe(form.net_profit, form.total_revenue),
      opm: safe(form.operating_profit, form.total_revenue),
      icr: safeRatio(form.operating_profit, form.finance_costs),
      roa: safe(form.net_profit, form.total_assets),
      cr: safeRatio(form.current_assets, form.current_liabilities),
      profitability: safe(form.project_net_profit, form.project_total_cost),
      appraisalDiff:
        form.appraisal_1 > 0 && form.appraisal_2 > 0
          ? ((Math.abs(form.appraisal_1 - form.appraisal_2) / Math.min(form.appraisal_1, form.appraisal_2)) * 100).toFixed(1) + "%"
          : "N/A",
      ltv:
        form.appraisal_1 > 0 && form.appraisal_2 > 0
          ? ((form.financing_amount / Math.min(form.appraisal_1, form.appraisal_2)) * 100).toFixed(1) + "%"
          : "N/A",
    };
  }, [form]);

  const opts = (key: string, entries: string[]) =>
    entries.map((v) => ({
      value: v,
      label: t(`options.${key}.${v}` as Parameters<typeof t>[0]),
    }));

  const locationOpts = locationOptions.map((v) => ({
    value: v,
    label: t(`options.location.${v}` as Parameters<typeof t>[0]),
  }));

  const handleSubmit = async () => {
    if (!form.organization_id) {
      toast.error(t("organizationRequired"));
      return;
    }
    try {
      await create(form as FormData);
      toast.success(t("createSuccess"));
      router.push(`/${locale}/credit-assessment`);
    } catch {
      toast.error(t("createError"));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("organization")} *
              </label>
              <select
                value={form.organization_id}
                onChange={(e) => {
                  const orgId = e.target.value;
                  set("organization_id", orgId);
                  const linkedApp = sentApps.find((a) => a.organization_id === orgId);
                  if (linkedApp) {
                    const product = allProducts.find((p) => p.id === linkedApp.product_id);
                    setProductCategory(product?.product_category || "");
                    if (!form.financing_amount) set("financing_amount", linkedApp.requested_amount || 0);
                    if (!form.tenor_months) set("tenor_months", linkedApp.tenor_months || 0);
                  }
                }}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">{t("selectOrganization")}</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {locale === "ar" ? org.name_ar || org.name_en : org.name_en}
                  </option>
                ))}
              </select>
            </div>
            {productCategory && (
              <div className={`text-xs font-medium px-3 py-2 rounded-lg ${isContractorInvoices ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-teal-50 text-teal-800 border border-teal-200"}`}>
                نوع المنتج: {isContractorInvoices ? "تمويل فواتير المقاولين" : "تمويل التطوير العقاري"}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("fields.project_name")}
              </label>
              <input
                type="text"
                value={form.project_name}
                onChange={(e) => set("project_name", e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder={t("fields.project_name")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">نبذة عن المشروع (إدارة الائتمان)</label>
              <textarea
                value={form.project_brief}
                onChange={(e) => set("project_brief", e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                placeholder="اكتب نبذة مختصرة عن المشروع وأهدافه وأبرز مميزاته..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label={t("fields.business_activity")}
                value={form.business_activity}
                options={opts("business_activity", ["construction", "real_estate", "other"])}
                onChange={(v) => set("business_activity", v)}
              />
              <SelectField
                label={t("fields.entity_type")}
                value={form.entity_type}
                options={opts("entity_type", ["public_jsc", "closed_jsc", "llc", "sole_proprietorship", "single_person", "holding"])}
                onChange={(v) => set("entity_type", v)}
              />
              <SelectField
                label={t("fields.entity_location")}
                value={form.entity_location}
                options={locationOpts}
                onChange={(v) => set("entity_location", v)}
              />
              <SelectField
                label={t("fields.years_in_business")}
                value={form.years_in_business}
                options={opts("years_in_business", ["more_than_10", "5_to_10", "2_to_5", "less_than_2"])}
                onChange={(v) => set("years_in_business", v)}
              />
              <SelectField
                label={t("fields.income_diversification")}
                value={form.income_diversification}
                options={opts("income_diversification", ["more_than_2", "2", "1", "0"])}
                onChange={(v) => set("income_diversification", v)}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <CheckboxField
              label={t("fields.audited_financials")}
              checked={form.audited_financials}
              onChange={(v) => set("audited_financials", v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberField label={t("fields.total_revenue")} value={form.total_revenue} onChange={(v) => set("total_revenue", v)} />
              <NumberField label={t("fields.operating_cash_flow")} value={form.operating_cash_flow} onChange={(v) => set("operating_cash_flow", v)} />
              <NumberField label={t("fields.current_liabilities")} value={form.current_liabilities} onChange={(v) => set("current_liabilities", v)} />
              <NumberField label={t("fields.net_profit")} value={form.net_profit} onChange={(v) => set("net_profit", v)} />
              <NumberField label={t("fields.operating_profit")} value={form.operating_profit} onChange={(v) => set("operating_profit", v)} />
              <NumberField label={t("fields.finance_costs")} value={form.finance_costs} onChange={(v) => set("finance_costs", v)} />
              <NumberField label={t("fields.total_assets")} value={form.total_assets} onChange={(v) => set("total_assets", v)} />
              <NumberField label={t("fields.current_assets")} value={form.current_assets} onChange={(v) => set("current_assets", v)} />
            </div>
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-semibold text-stone-600 mb-2">
                {t("scoreBreakdown")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ComputedRatio label={t("computedRatios.ocf_ratio")} value={ratios.ocf} />
                <ComputedRatio label={t("computedRatios.net_profit_margin")} value={ratios.npm} />
                <ComputedRatio label={t("computedRatios.operating_profit_margin")} value={ratios.opm} />
                <ComputedRatio label={t("computedRatios.interest_coverage_ratio")} value={ratios.icr} />
                <ComputedRatio label={t("computedRatios.return_on_assets")} value={ratios.roa} />
                <ComputedRatio label={t("computedRatios.current_ratio")} value={ratios.cr} />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label={t("fields.credit_record")} value={form.credit_record} options={opts("credit_record", ["excellent", "not_applicable", "satisfactory", "poor"])} onChange={(v) => set("credit_record", v)} />
            <SelectField label={t("fields.payment_behavior")} value={form.payment_behavior} options={opts("payment_behavior", ["excellent", "satisfactory", "poor", "none"])} onChange={(v) => set("payment_behavior", v)} />
            <SelectField label={t("fields.payment_delays")} value={form.payment_delays} options={opts("payment_delays", ["none", "30_to_60", "60_to_90", "more_than_90"])} onChange={(v) => set("payment_delays", v)} />
            <SelectField label={t("fields.num_delays")} value={form.num_delays} options={opts("num_delays", ["none", "1", "up_to_3", "more_than_3"])} onChange={(v) => set("num_delays", v)} />
            <SelectField label={t("fields.delay_ratio")} value={form.delay_ratio} options={opts("delay_ratio", ["0", "up_to_20", "more_than_20"])} onChange={(v) => set("delay_ratio", v)} />
            <SelectField label={t("fields.financing_default")} value={form.financing_default} options={opts("financing_default", ["none", "settled", "active"])} onChange={(v) => set("financing_default", v)} />
            <SelectField label={t("fields.num_defaults")} value={form.num_defaults} options={opts("num_defaults", ["none", "1", "more_than_1"])} onChange={(v) => set("num_defaults", v)} />
            <SelectField label={t("fields.default_ratio")} value={form.default_ratio} options={opts("default_ratio", ["0", "up_to_20", "more_than_20"])} onChange={(v) => set("default_ratio", v)} />
            <SelectField label={t("fields.bounced_checks")} value={form.bounced_checks} options={opts("bounced_checks", ["none", "settled", "active"])} onChange={(v) => set("bounced_checks", v)} />
            <SelectField label={t("fields.lawsuits")} value={form.lawsuits} options={opts("lawsuits", ["none", "settled", "active"])} onChange={(v) => set("lawsuits", v)} />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {isContractorInvoices && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                تمويل فواتير المقاولين — يُقيَّم المشروع بناءً على جودة العقد وسجل المقاول
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label={t("fields.project_location")} value={form.project_location} options={locationOpts} onChange={(v) => set("project_location", v)} />
              {!isContractorInvoices && (
                <SelectField label={t("fields.project_type")} value={form.project_type} options={opts("project_type", ["commercial", "residential", "mixed"])} onChange={(v) => set("project_type", v)} />
              )}
              <SelectField label={isContractorInvoices ? "درجة تصنيف المقاول" : t("fields.engineering_firm_class")} value={form.engineering_firm_class} options={opts("engineering_firm_class", ["class_1_2", "class_3_5", "unclassified", "none"])} onChange={(v) => set("engineering_firm_class", v)} />
              <SelectField label={isContractorInvoices ? "جودة العقد والمستندات" : t("fields.feasibility_study_quality")} value={form.feasibility_study_quality} options={opts("feasibility_study_quality", ["excellent", "average", "acceptable", "none"])} onChange={(v) => set("feasibility_study_quality", v)} />
              <SelectField label={isContractorInvoices ? "عدد المشاريع السابقة للمقاول" : t("fields.previous_projects_count")} value={form.previous_projects_count} options={opts("previous_projects_count", ["more_than_3", "1_to_3", "none"])} onChange={(v) => set("previous_projects_count", v)} />
            </div>
            <CheckboxField label={isContractorInvoices ? "يوجد عقد موقع ومعتمد" : t("fields.has_project_plan")} checked={form.has_project_plan} onChange={(v) => set("has_project_plan", v)} />
            <CheckboxField label={t("fields.has_insurance")} checked={form.has_insurance} onChange={(v) => set("has_insurance", v)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberField label={isContractorInvoices ? "قيمة الفاتورة / الدفعة (ر.س)" : t("fields.project_net_profit")} value={form.project_net_profit} onChange={(v) => set("project_net_profit", v)} />
              <NumberField label={isContractorInvoices ? "إجمالي قيمة العقد (ر.س)" : t("fields.project_total_cost")} value={form.project_total_cost} onChange={(v) => set("project_total_cost", v)} />
            </div>
            <ComputedRatio label={isContractorInvoices ? "نسبة الفاتورة من العقد" : t("computedRatios.project_profitability")} value={ratios.profitability} />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            {isContractorInvoices ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
                تمويل فواتير المقاولين لا يتطلب تقييم عقاري — الضمان هو الفاتورة المعتمدة والعقد
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField label={t("fields.property_location")} value={form.property_location} options={locationOpts} onChange={(v) => set("property_location", v)} />
                  <SelectField label={t("fields.property_type")} value={form.property_type} options={opts("property_type", ["commercial_building", "residential_building", "residential_land", "commercial_land", "apartment", "raw_land", "agricultural_land", "other"])} onChange={(v) => set("property_type", v)} />
                  <SelectField label={t("fields.property_usage")} value={form.property_usage} options={opts("property_usage", ["rented", "not_applicable", "owner_occupied", "investment"])} onChange={(v) => set("property_usage", v)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberField label={t("fields.appraisal_1")} value={form.appraisal_1} onChange={(v) => set("appraisal_1", v)} />
                  <NumberField label={t("fields.appraisal_2")} value={form.appraisal_2} onChange={(v) => set("appraisal_2", v)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <ComputedRatio label={t("computedRatios.appraisal_difference")} value={ratios.appraisalDiff} />
                  <ComputedRatio label={t("computedRatios.ltv_ratio")} value={ratios.ltv} />
                </div>
              </>
            )}
            {/* ── شروط التمويل ── */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-semibold text-teal-700">شروط التمويل (المرابحة)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField label={t("fields.financing_amount")} value={form.financing_amount} onChange={(v) => set("financing_amount", v)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">مدة التمويل (أشهر)</label>
                  <input type="number" value={form.tenor_months || ""} onChange={(e) => set("tenor_months", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="36" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">نسبة المرابحة السنوية (%)</label>
                  <input type="number" value={form.murabaha_rate || ""} onChange={(e) => set("murabaha_rate", parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="4.5" step="0.1" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">آلية السداد</label>
                  <select value={form.repayment_mechanism} onChange={(e) => set("repayment_mechanism", e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent">
                    <option value="monthly">شهري</option>
                    <option value="quarterly">ربع سنوي</option>
                    <option value="semi_annual">نصف سنوي</option>
                    <option value="annual">سنوي</option>
                    <option value="balloon">دفعة واحدة نهائية</option>
                  </select>
                </div>
              </div>
              {form.financing_amount > 0 && form.murabaha_rate > 0 && form.tenor_months > 0 && (() => {
                const periodsPerYear: Record<string, number> = { monthly: 12, quarterly: 4, semi_annual: 2, annual: 1, balloon: 1 };
                const ppy = periodsPerYear[form.repayment_mechanism] || 12;
                const numPayments = form.repayment_mechanism === "balloon" ? 1 : Math.round(form.tenor_months / (12 / ppy));
                const totalProfit = form.financing_amount * (form.murabaha_rate / 100) * (form.tenor_months / 12);
                const installment = (form.financing_amount + totalProfit) / numPayments;
                return (
                  <div className="bg-stone-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-xs text-stone-500">إجمالي الربح</p><p className="text-sm font-bold text-teal-700 mt-1">{totalProfit.toLocaleString("ar-SA", { maximumFractionDigits: 0 })} ر.س</p></div>
                    <div><p className="text-xs text-stone-500">إجمالي التمويل</p><p className="text-sm font-bold text-stone-800 mt-1">{(form.financing_amount + totalProfit).toLocaleString("ar-SA", { maximumFractionDigits: 0 })} ر.س</p></div>
                    <div><p className="text-xs text-stone-500">قيمة القسط</p><p className="text-sm font-bold text-indigo-700 mt-1">{installment.toLocaleString("ar-SA", { maximumFractionDigits: 0 })} ر.س</p></div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader title={t("createTitle")} description={t("subtitle")} />

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 text-center py-2 px-1 text-xs font-medium rounded-lg transition ${
              i === step
                ? "bg-teal-600 text-white"
                : i < step
                ? "bg-teal-100 text-teal-700"
                : "bg-stone-100 text-stone-500"
            }`}
          >
            <span className="hidden sm:inline">
              {t(`categories.${s}` as Parameters<typeof t>[0])}
            </span>
            <span className="sm:hidden">{i + 1}</span>
            <span className="block text-[10px] opacity-70">
              {t(`categoryWeights.${s}` as Parameters<typeof t>[0])}
            </span>
          </button>
        ))}
      </div>

      {/* Form content */}
      <div className="bg-white rounded-lg border border-stone-200 p-6">
        <h3 className="text-lg font-semibold mb-4">
          {t(`categories.${STEPS[step]}` as Parameters<typeof t>[0])}
          <span className="text-sm font-normal text-stone-500 ms-2">
            ({t(`categoryWeights.${STEPS[step]}` as Parameters<typeof t>[0])} {tc("total")})
          </span>
        </h3>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={16} />
          {t("prevStep")}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            {t("nextStep")}
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
          >
            <Check size={16} />
            {isSubmitting ? tc("creating") : t("submitAssessment")}
          </button>
        )}
      </div>
    </div>
  );
}
