"use client";

import { use, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApiList, useApiGet, useApiMutation } from "@/lib/use-api";
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
};

type FormData = typeof initialFormData;

function SelectField({ label, value, options, onChange }: {
  label: string; value: string;
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
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange }: {
  label: string; value: number; onChange: (v: number) => void;
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

function CheckboxField({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
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

export default function EditCreditAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("creditAssessment");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [loaded, setLoaded] = useState(false);

  const { data: existing, isLoading } = useApiGet<Record<string, unknown>>(`/credit-assessments/${id}`);
  const { data: allApps } = useApiList<{ organization_id: string; status: string }>("/applications", { limit: 500 });
  const { data: allOrgs } = useApiList<Organization>("/organizations", { limit: 200 });
  const sentOrgIds = new Set(
    allApps.filter((a) => a.status === "credit_assessment").map((a) => a.organization_id)
  );
  const orgs = allOrgs.filter((o) => sentOrgIds.has(o.id));
  const { mutate: update, isSubmitting } = useApiMutation<FormData>(`/credit-assessments/${id}`, "PUT");
  const { mutate: runScore } = useApiMutation<Record<string, never>>(`/credit-assessments/${id}/score`, "POST");

  useEffect(() => {
    if (existing && !loaded) {
      setForm({
        organization_id: (existing.organization_id as string) || "",
        project_name: (existing.project_name as string) || "",
        business_activity: (existing.business_activity as string) || "",
        entity_type: (existing.entity_type as string) || "",
        entity_location: (existing.entity_location as string) || "",
        years_in_business: (existing.years_in_business as string) || "",
        income_diversification: (existing.income_diversification as string) || "",
        audited_financials: Boolean(existing.audited_financials),
        total_revenue: Number(existing.total_revenue) || 0,
        operating_cash_flow: Number(existing.operating_cash_flow) || 0,
        current_liabilities: Number(existing.current_liabilities) || 0,
        net_profit: Number(existing.net_profit) || 0,
        operating_profit: Number(existing.operating_profit) || 0,
        finance_costs: Number(existing.finance_costs) || 0,
        total_assets: Number(existing.total_assets) || 0,
        current_assets: Number(existing.current_assets) || 0,
        credit_record: (existing.credit_record as string) || "",
        payment_behavior: (existing.payment_behavior as string) || "",
        payment_delays: (existing.payment_delays as string) || "",
        num_delays: (existing.num_delays as string) || "",
        delay_ratio: (existing.delay_ratio as string) || "",
        financing_default: (existing.financing_default as string) || "",
        num_defaults: (existing.num_defaults as string) || "",
        default_ratio: (existing.default_ratio as string) || "",
        bounced_checks: (existing.bounced_checks as string) || "",
        lawsuits: (existing.lawsuits as string) || "",
        project_location: (existing.project_location as string) || "",
        has_project_plan: Boolean(existing.has_project_plan),
        has_insurance: Boolean(existing.has_insurance),
        project_type: (existing.project_type as string) || "",
        engineering_firm_class: (existing.engineering_firm_class as string) || "",
        feasibility_study_quality: (existing.feasibility_study_quality as string) || "",
        project_net_profit: Number(existing.project_net_profit) || 0,
        project_total_cost: Number(existing.project_total_cost) || 0,
        previous_projects_count: (existing.previous_projects_count as string) || "",
        property_location: (existing.property_location as string) || "",
        property_type: (existing.property_type as string) || "",
        property_usage: (existing.property_usage as string) || "",
        appraisal_1: Number(existing.appraisal_1) || 0,
        appraisal_2: Number(existing.appraisal_2) || 0,
        financing_amount: Number(existing.financing_amount) || 0,
      });
      setLoaded(true);
    }
  }, [existing, loaded]);

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
      await update(form);
      // إعادة حساب التقييم تلقائياً إذا كان هناك تقييم سابق
      if (existing && (existing as Record<string, unknown>).score) {
        await runScore({} as Record<string, never>);
        toast.success("تم حفظ التعديلات وإعادة حساب التقييم");
      } else {
        toast.success(t("updateSuccess"));
      }
      router.push(`/${locale}/credit-assessment/${id}`);
    } catch {
      toast.error(t("updateError"));
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
                onChange={(e) => set("organization_id", e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label={t("fields.business_activity")} value={form.business_activity} options={opts("business_activity", ["construction", "real_estate", "other"])} onChange={(v) => set("business_activity", v)} />
              <SelectField label={t("fields.entity_type")} value={form.entity_type} options={opts("entity_type", ["public_jsc", "closed_jsc", "llc", "sole_proprietorship", "single_person", "holding"])} onChange={(v) => set("entity_type", v)} />
              <SelectField label={t("fields.entity_location")} value={form.entity_location} options={locationOpts} onChange={(v) => set("entity_location", v)} />
              <SelectField label={t("fields.years_in_business")} value={form.years_in_business} options={opts("years_in_business", ["more_than_10", "5_to_10", "2_to_5", "less_than_2"])} onChange={(v) => set("years_in_business", v)} />
              <SelectField label={t("fields.income_diversification")} value={form.income_diversification} options={opts("income_diversification", ["more_than_2", "2", "1", "0"])} onChange={(v) => set("income_diversification", v)} />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <CheckboxField label={t("fields.audited_financials")} checked={form.audited_financials} onChange={(v) => set("audited_financials", v)} />
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
              <h4 className="text-sm font-semibold text-stone-600 mb-2">{t("scoreBreakdown")}</h4>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label={t("fields.project_location")} value={form.project_location} options={locationOpts} onChange={(v) => set("project_location", v)} />
              <SelectField label={t("fields.project_type")} value={form.project_type} options={opts("project_type", ["commercial", "residential", "mixed"])} onChange={(v) => set("project_type", v)} />
              <SelectField label={t("fields.engineering_firm_class")} value={form.engineering_firm_class} options={opts("engineering_firm_class", ["class_1_2", "class_3_5", "unclassified", "none"])} onChange={(v) => set("engineering_firm_class", v)} />
              <SelectField label={t("fields.feasibility_study_quality")} value={form.feasibility_study_quality} options={opts("feasibility_study_quality", ["excellent", "average", "acceptable", "none"])} onChange={(v) => set("feasibility_study_quality", v)} />
              <SelectField label={t("fields.previous_projects_count")} value={form.previous_projects_count} options={opts("previous_projects_count", ["more_than_3", "1_to_3", "none"])} onChange={(v) => set("previous_projects_count", v)} />
            </div>
            <CheckboxField label={t("fields.has_project_plan")} checked={form.has_project_plan} onChange={(v) => set("has_project_plan", v)} />
            <CheckboxField label={t("fields.has_insurance")} checked={form.has_insurance} onChange={(v) => set("has_insurance", v)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberField label={t("fields.project_net_profit")} value={form.project_net_profit} onChange={(v) => set("project_net_profit", v)} />
              <NumberField label={t("fields.project_total_cost")} value={form.project_total_cost} onChange={(v) => set("project_total_cost", v)} />
            </div>
            <ComputedRatio label={t("computedRatios.project_profitability")} value={ratios.profitability} />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label={t("fields.property_location")} value={form.property_location} options={locationOpts} onChange={(v) => set("property_location", v)} />
              <SelectField label={t("fields.property_type")} value={form.property_type} options={opts("property_type", ["commercial_building", "residential_building", "residential_land", "commercial_land", "apartment", "raw_land", "agricultural_land", "other"])} onChange={(v) => set("property_type", v)} />
              <SelectField label={t("fields.property_usage")} value={form.property_usage} options={opts("property_usage", ["rented", "not_applicable", "owner_occupied", "investment"])} onChange={(v) => set("property_usage", v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberField label={t("fields.appraisal_1")} value={form.appraisal_1} onChange={(v) => set("appraisal_1", v)} />
              <NumberField label={t("fields.appraisal_2")} value={form.appraisal_2} onChange={(v) => set("appraisal_2", v)} />
              <NumberField label={t("fields.financing_amount")} value={form.financing_amount} onChange={(v) => set("financing_amount", v)} />
            </div>
            <div className="mt-4 border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <ComputedRatio label={t("computedRatios.appraisal_difference")} value={ratios.appraisalDiff} />
                <ComputedRatio label={t("computedRatios.ltv_ratio")} value={ratios.ltv} />
              </div>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/credit-assessment/${id}`}
          className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700"
        >
          <ArrowLeft size={16} />
          {t("backToList")}
        </Link>
        <PageHeader title={t("editTitle")} description={t("subtitle")} />
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(i)}
            className={`flex-1 text-center py-2 px-1 text-xs font-medium rounded-lg transition ${
              i === step ? "bg-teal-600 text-white" : i < step ? "bg-teal-100 text-teal-700" : "bg-stone-100 text-stone-500"
            }`}
          >
            <span className="hidden sm:inline">{t(`categories.${s}` as Parameters<typeof t>[0])}</span>
            <span className="sm:hidden">{i + 1}</span>
            <span className="block text-[10px] opacity-70">{t(`categoryWeights.${s}` as Parameters<typeof t>[0])}</span>
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
            {isSubmitting ? tc("saving") : t("saveChanges")}
          </button>
        )}
      </div>
    </div>
  );
}
