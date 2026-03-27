"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";

interface ScoringFactor {
  id: string;
  category: string;
  factor_name: string;
  raw_score: number;
  weight: number;
  weighted_score: number;
}

interface ScoreReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  dscr_note: string;
  ltv_note: string;
}

interface Score {
  id: string;
  total_score: number;
  risk_grade: string;
  recommendation: string;
  scorecard_version: string;
  scored_at: string;
  factors?: ScoringFactor[];
  report?: ScoreReport;
}

interface Assessment {
  id: string;
  organization_id: string;
  project_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
  score?: Score | null;
  business_activity?: string;
  entity_type?: string;
  entity_location?: string;
  years_in_business?: string;
  income_diversification?: string;
  audited_financials?: boolean;
  total_revenue?: number;
  operating_cash_flow?: number;
  current_liabilities?: number;
  net_profit?: number;
  operating_profit?: number;
  finance_costs?: number;
  total_assets?: number;
  current_assets?: number;
  credit_record?: string;
  payment_behavior?: string;
  payment_delays?: string;
  num_delays?: string;
  financing_default?: string;
  bounced_checks?: string;
  lawsuits?: string;
  project_location?: string;
  has_project_plan?: boolean;
  has_insurance?: boolean;
  project_type?: string;
  engineering_firm_class?: string;
  feasibility_study_quality?: string;
  project_net_profit?: number;
  project_total_cost?: number;
  previous_projects_count?: string;
  property_location?: string;
  property_type?: string;
  property_usage?: string;
  appraisal_1?: number;
  appraisal_2?: number;
  financing_amount?: number;
}

interface Organization {
  id: string;
  name_ar?: string;
  name_en: string;
  cr_number?: string;
  city?: string;
  phone?: string;
}

const GRADE_LABEL: Record<string, string> = {
  AA: "ممتاز جداً", A: "ممتاز مقبول", BB: "جيد جداً",
  B: "جيد مقبول", CC: "مقبول محدود", C: "ضعيف", F: "غير مقبول",
};

const GRADE_COLOR: Record<string, string> = {
  AA: "#059669", A: "#16a34a", BB: "#65a30d",
  B: "#d97706", CC: "#ea580c", C: "#dc2626", F: "#991b1b",
};

const RECOMMENDATION_LABEL: Record<string, string> = {
  approve: "موافقة",
  approve_with_conditions: "موافقة بشروط",
  refer: "إحالة للمراجعة",
  refer_or_decline: "إحالة / رفض",
  decline: "رفض",
};

const CATEGORY_LABEL: Record<string, string> = {
  company_info: "معلومات المنشأة",
  financial_statements: "القوائم المالية",
  credit_history: "السجل الائتماني",
  project_feasibility: "جدوى مشروع التمويل",
  collateral: "الضمانات",
};

const FIELD_LABEL: Record<string, string> = {
  years_in_business: "سنوات النشاط",
  entity_type: "نوع المنشأة",
  entity_location: "موقع المنشأة",
  income_diversification: "تنوع الدخل",
  business_activity: "نشاط الأعمال",
  audited_financials: "القوائم المالية مدققة",
  total_revenue: "الإيرادات السنوية (ر.س)",
  operating_cash_flow: "التدفقات النقدية التشغيلية (ر.س)",
  current_liabilities: "الالتزامات المتداولة (ر.س)",
  net_profit: "صافي الربح (ر.س)",
  operating_profit: "الربح التشغيلي (ر.س)",
  finance_costs: "تكاليف التمويل (ر.س)",
  total_assets: "إجمالي الأصول (ر.س)",
  current_assets: "الأصول المتداولة (ر.س)",
  credit_record: "السجل الائتماني للمنشأة",
  payment_behavior: "سلوك الدفع في الماضي",
  payment_delays: "تأخر في السداد",
  num_delays: "عدد التأخيرات",
  financing_default: "تعثر في تمويل",
  bounced_checks: "الشيكات المرتجعة",
  lawsuits: "دعاوى قانونية",
  project_location: "موقع المشروع",
  has_project_plan: "مخطط المشروع",
  has_insurance: "التأمين على المشروع",
  project_type: "نوع المشروع",
  engineering_firm_class: "تصنيف شركة الهندسة",
  feasibility_study_quality: "جودة دراسة الجدوى",
  project_net_profit: "صافي ربح المشروع (ر.س)",
  project_total_cost: "التكلفة الإجمالية للمشروع (ر.س)",
  previous_projects_count: "عدد المشاريع السابقة",
  property_location: "موقع العقار",
  property_type: "نوع العقار",
  property_usage: "استخدام العقار",
  appraisal_1: "التقييم الأول (ر.س)",
  appraisal_2: "التقييم الثاني (ر.س)",
  financing_amount: "مبلغ التمويل (ر.س)",
};

const CATEGORY_ORDER = ["company_info", "financial_statements", "credit_history", "project_feasibility", "collateral"];

const fmt = (n?: number) =>
  n != null ? new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n) : "—";

function fieldDisplay(key: string, val: unknown): string {
  if (val == null || val === "") return "—";
  if (typeof val === "boolean") return val ? "نعم" : "لا";
  if (typeof val === "number") {
    if (["total_revenue","operating_cash_flow","current_liabilities","net_profit","operating_profit",
         "finance_costs","total_assets","current_assets","project_net_profit","project_total_cost",
         "appraisal_1","appraisal_2","financing_amount"].includes(key)) {
      return fmt(val);
    }
    return String(val);
  }
  return String(val);
}

export default function PrintCreditAssessmentPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = use(params);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("m360_token") || "";
    Promise.all([
      fetch(`/api/v1/credit-assessments/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([a]) => {
      setAssessment(a);
      if (a?.organization_id) {
        fetch(`/api/v1/organizations/${a.organization_id}`, { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((o) => setOrg(o))
          .catch(() => null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!loading && assessment) {
      setTimeout(() => window.print(), 600);
    }
  }, [loading, assessment]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "Tajawal, sans-serif" }}>
        <p style={{ color: "#315453", fontSize: 18 }}>جاري تحميل التقرير...</p>
      </div>
    );
  }

  if (!assessment) {
    return <div style={{ padding: 40, fontFamily: "Tajawal, sans-serif" }}>تعذّر تحميل بيانات التقييم.</div>;
  }

  const score = assessment.score;
  const gradeColor = score ? (GRADE_COLOR[score.risk_grade] || "#991b1b") : "#315453";

  const factorsByCategory: Record<string, ScoringFactor[]> = {};
  if (score?.factors) {
    for (const f of score.factors) {
      if (!factorsByCategory[f.category]) factorsByCategory[f.category] = [];
      factorsByCategory[f.category].push(f);
    }
  }

  const categoryTotals = CATEGORY_ORDER.map((cat) => {
    const factors = factorsByCategory[cat] || [];
    const totalWeighted = factors.reduce((s, f) => s + f.weighted_score, 0);
    const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
    const pct = totalWeight > 0 ? (totalWeighted / totalWeight) * 100 : 0;
    return { category: cat, pct: pct.toFixed(1), score: (totalWeighted * 100).toFixed(1), max: (totalWeight * 100).toFixed(0) };
  });

  const COMPANY_FIELDS = ["business_activity","entity_type","entity_location","years_in_business","income_diversification","audited_financials"];
  const FINANCIAL_FIELDS = ["total_revenue","operating_cash_flow","current_liabilities","net_profit","operating_profit","finance_costs","total_assets","current_assets"];
  const CREDIT_FIELDS = ["credit_record","payment_behavior","payment_delays","num_delays","financing_default","bounced_checks","lawsuits"];
  const PROJECT_FIELDS = ["project_location","project_type","has_project_plan","has_insurance","engineering_firm_class","feasibility_study_quality","project_net_profit","project_total_cost","previous_projects_count"];
  const COLLATERAL_FIELDS = ["property_location","property_type","property_usage","appraisal_1","appraisal_2","financing_amount"];

  const sectionFields: Record<string, string[]> = {
    company_info: COMPANY_FIELDS,
    financial_statements: FINANCIAL_FIELDS,
    credit_history: CREDIT_FIELDS,
    project_feasibility: PROJECT_FIELDS,
    collateral: COLLATERAL_FIELDS,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Tajawal', 'Arial', sans-serif;
          direction: rtl;
          background: #fff;
          color: #1a1a1a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 0;
          background: #fff;
        }

        /* ── Header ── */
        .header {
          background: linear-gradient(135deg, #1d3635 0%, #315453 50%, #547F82 100%);
          padding: 28px 36px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #fff;
        }
        .header-right { display: flex; align-items: center; gap: 16px; }
        .header-logo { width: 90px; height: auto; filter: brightness(0) invert(1); opacity: 0.92; }
        .header-divider { width: 1px; height: 48px; background: rgba(255,255,255,0.3); }
        .header-title { font-size: 20px; font-weight: 700; color: #fff; }
        .header-subtitle { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 3px; }
        .header-left { text-align: left; }
        .header-date { font-size: 11px; color: rgba(255,255,255,0.7); }
        .header-ref { font-size: 13px; font-weight: 600; color: #F4C57A; margin-top: 4px; }

        /* ── Org bar ── */
        .org-bar {
          background: #f8f7f5;
          border-bottom: 2px solid #315453;
          padding: 14px 36px;
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .org-label { font-size: 11px; color: #888; }
        .org-value { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-top: 2px; }
        .org-sep { width: 1px; height: 36px; background: #ddd; }

        /* ── Score card ── */
        .score-section { padding: 24px 36px; background: #fff; }
        .score-card {
          border: 2px solid;
          border-radius: 12px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .score-item { text-align: center; }
        .score-label { font-size: 11px; color: #666; margin-bottom: 6px; }
        .score-value-big { font-size: 42px; font-weight: 900; line-height: 1; }
        .score-grade { font-size: 34px; font-weight: 900; }
        .score-grade-sub { font-size: 12px; margin-top: 4px; font-weight: 600; }
        .score-rec { font-size: 18px; font-weight: 700; }
        .score-version { font-size: 10px; color: #888; margin-top: 6px; }
        .score-divider { width: 1px; height: 70px; background: #ddd; }

        /* ── Category bars ── */
        .categories-section { padding: 0 36px 20px; }
        .categories-title { font-size: 14px; font-weight: 700; color: #315453; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1.5px solid #e0e0e0; }
        .cat-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .cat-name { font-size: 11px; width: 130px; flex-shrink: 0; color: #444; }
        .cat-bar-wrap { flex: 1; height: 10px; background: #f0f0f0; border-radius: 5px; overflow: hidden; }
        .cat-bar { height: 100%; background: #315453; border-radius: 5px; }
        .cat-score { font-size: 11px; font-weight: 700; color: #315453; width: 80px; text-align: left; flex-shrink: 0; }

        /* ── Report box ── */
        .report-section { padding: 0 36px 20px; }
        .report-box { background: #f8f7f5; border-radius: 8px; border: 1px solid #e0e0e0; padding: 16px 20px; }
        .report-summary { font-size: 12px; color: #333; line-height: 1.8; margin-bottom: 12px; }
        .report-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .report-col { background: #fff; border-radius: 6px; padding: 12px; border: 1px solid #e8e8e8; }
        .report-col-title { font-size: 11px; font-weight: 700; margin-bottom: 6px; }
        .report-col-item { font-size: 11px; color: #555; margin-bottom: 3px; }
        .strengths-title { color: #059669; }
        .weaknesses-title { color: #dc2626; }
        .metrics-title { color: #315453; }

        /* ── Assessment data ── */
        .data-section { padding: 0 36px 24px; }
        .data-title { font-size: 14px; font-weight: 700; color: #315453; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1.5px solid #e0e0e0; }
        .data-category { margin-bottom: 16px; page-break-inside: avoid; }
        .data-cat-title {
          font-size: 12px; font-weight: 700;
          background: #315453; color: #fff;
          padding: 6px 12px; border-radius: 4px;
          margin-bottom: 8px; display: inline-block;
        }
        .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .data-item { display: flex; justify-content: space-between; align-items: center; padding: 5px 10px; background: #f8f7f5; border-radius: 4px; font-size: 11px; }
        .data-key { color: #555; }
        .data-val { font-weight: 600; color: #1a1a1a; }

        /* ── Factor table ── */
        .factors-section { padding: 0 36px 24px; page-break-before: always; }
        .factor-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .factor-table th { background: #315453; color: #fff; padding: 6px 10px; text-align: right; font-weight: 600; }
        .factor-table td { padding: 5px 10px; border-bottom: 1px solid #f0f0f0; }
        .factor-table tr:nth-child(even) td { background: #f8f7f5; }
        .factor-cat-row td { background: #9DBDBF !important; font-weight: 700; color: #1d3635; }
        .score-dot {
          display: inline-flex; align-items: center; justify-content: center;
          width: 20px; height: 20px; border-radius: 50%;
          font-size: 10px; font-weight: 700;
        }

        /* ── Footer ── */
        .footer {
          background: #1d3635;
          color: rgba(255,255,255,0.6);
          padding: 14px 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          margin-top: 8px;
        }
        .footer-brand { color: #F4C57A; font-weight: 700; font-size: 12px; }

        @media print {
          body { margin: 0; }
          .page { width: 100%; margin: 0; }
          .no-print { display: none !important; }
          @page { margin: 0; size: A4; }
        }
        @media screen {
          body { background: #e8e8e8; }
          .page { box-shadow: 0 4px 24px rgba(0,0,0,0.15); margin: 24px auto; }
        }
      `}</style>

      {/* Print button — hidden in print */}
      <div className="no-print" style={{ position: "fixed", top: 16, left: 16, zIndex: 999 }}>
        <button
          onClick={() => window.print()}
          style={{
            background: "#315453", color: "#fff", border: "none", borderRadius: 8,
            padding: "10px 20px", fontFamily: "Tajawal, sans-serif", fontSize: 14,
            fontWeight: 700, cursor: "pointer"
          }}
        >
          طباعة / حفظ PDF
        </button>
      </div>

      <div className="page">
        {/* ── Header ── */}
        <div className="header">
          <div className="header-right">
            <Image src="/dhara-logo.png" alt="ذرى" width={90} height={45} className="header-logo" style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }} />
            <div className="header-divider" />
            <div>
              <div className="header-title">تقرير التقييم الائتماني</div>
              <div className="header-subtitle">Credit Assessment Report</div>
            </div>
          </div>
          <div className="header-left">
            <div className="header-date">
              تاريخ التقرير: {new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" })}
            </div>
            <div className="header-ref">
              {assessment.project_name || `معرف التقييم: ${assessment.id.slice(0, 8)}`}
            </div>
            {score && (
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                {score.scorecard_version} · {new Date(score.scored_at).toLocaleDateString("ar-SA")}
              </div>
            )}
          </div>
        </div>

        {/* ── Org bar ── */}
        <div className="org-bar">
          <div>
            <div className="org-label">طالب التمويل</div>
            <div className="org-value">{org?.name_ar || org?.name_en || assessment.organization_id}</div>
          </div>
          {org?.cr_number && (
            <>
              <div className="org-sep" />
              <div>
                <div className="org-label">السجل التجاري</div>
                <div className="org-value">{org.cr_number}</div>
              </div>
            </>
          )}
          {org?.city && (
            <>
              <div className="org-sep" />
              <div>
                <div className="org-label">المدينة</div>
                <div className="org-value">{org.city}</div>
              </div>
            </>
          )}
          {org?.phone && (
            <>
              <div className="org-sep" />
              <div>
                <div className="org-label">الهاتف</div>
                <div className="org-value" style={{ direction: "ltr" }}>{org.phone}</div>
              </div>
            </>
          )}
        </div>

        {/* ── Score card ── */}
        {score ? (
          <div className="score-section">
            <div className="score-card" style={{ borderColor: gradeColor, background: gradeColor + "08" }}>
              <div className="score-item">
                <div className="score-label">النتيجة الإجمالية</div>
                <div className="score-value-big" style={{ color: gradeColor }}>{score.total_score}%</div>
              </div>
              <div className="score-divider" />
              <div className="score-item">
                <div className="score-label">التصنيف</div>
                <div className="score-grade" style={{ color: gradeColor }}>{score.risk_grade}</div>
                <div className="score-grade-sub" style={{ color: gradeColor }}>{GRADE_LABEL[score.risk_grade] || score.risk_grade}</div>
              </div>
              <div className="score-divider" />
              <div className="score-item">
                <div className="score-label">التوصية</div>
                <div className="score-rec" style={{ color: gradeColor }}>
                  {RECOMMENDATION_LABEL[score.recommendation] || score.recommendation}
                </div>
                <div className="score-version">{score.scorecard_version}</div>
              </div>
              {score.report && (
                <>
                  <div className="score-divider" />
                  <div style={{ flex: 1, fontSize: 11, color: "#444", lineHeight: 1.7, padding: "0 8px" }}>
                    <div style={{ fontWeight: 700, color: "#315453", marginBottom: 4, fontSize: 12 }}>ملخص التقرير</div>
                    {score.report.summary}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="score-section">
            <div style={{ background: "#fef9ee", border: "1px solid #fde68a", borderRadius: 8, padding: 16, textAlign: "center", fontSize: 13, color: "#92400e" }}>
              لم يتم تشغيل التقييم بعد
            </div>
          </div>
        )}

        {/* ── Category scores ── */}
        {score && (
          <div className="categories-section">
            <div className="categories-title">أداء المحاور</div>
            {categoryTotals.map((ct) => (
              <div key={ct.category} className="cat-row">
                <div className="cat-name">{CATEGORY_LABEL[ct.category]}</div>
                <div className="cat-bar-wrap">
                  <div className="cat-bar" style={{ width: `${Math.min(parseFloat(ct.pct), 100)}%`, background: gradeColor }} />
                </div>
                <div className="cat-score">{ct.score}% / {ct.max}%</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Report strengths/weaknesses ── */}
        {score?.report && (
          <div className="report-section">
            <div className="report-box">
              <div className="report-cols">
                <div>
                  <div style={{ fontSize: 11, color: "#315453", marginBottom: 4, fontWeight: 700 }}>📊 المؤشرات الرئيسية</div>
                  <div style={{ fontSize: 11, color: "#444", marginBottom: 3 }}>{score.report.dscr_note}</div>
                  <div style={{ fontSize: 11, color: "#444" }}>{score.report.ltv_note}</div>
                </div>
                {score.report.strengths.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, marginBottom: 4 }}>✅ نقاط القوة</div>
                    {score.report.strengths.map((f) => (
                      <div key={f} style={{ fontSize: 11, color: "#065f46", marginBottom: 2 }}>• {FIELD_LABEL[f] || f}</div>
                    ))}
                  </div>
                )}
                {score.report.weaknesses.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>⚠️ نقاط الضعف</div>
                    {score.report.weaknesses.map((f) => (
                      <div key={f} style={{ fontSize: 11, color: "#991b1b", marginBottom: 2 }}>• {FIELD_LABEL[f] || f}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Assessment data by category ── */}
        <div className="data-section">
          <div className="data-title">بيانات التقييم التفصيلية</div>
          {CATEGORY_ORDER.map((cat) => {
            const fields = sectionFields[cat] || [];
            const items = fields.filter((f) => {
              const val = (assessment as unknown as Record<string, unknown>)[f];
              return val != null && val !== "" && val !== 0;
            });
            if (items.length === 0) return null;
            return (
              <div key={cat} className="data-category">
                <div className="data-cat-title">{CATEGORY_LABEL[cat]}</div>
                <div className="data-grid">
                  {items.map((f) => (
                    <div key={f} className="data-item">
                      <span className="data-key">{FIELD_LABEL[f] || f}</span>
                      <span className="data-val">{fieldDisplay(f, (assessment as unknown as Record<string, unknown>)[f])}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Factor breakdown table ── */}
        {score?.factors && score.factors.length > 0 && (
          <div className="factors-section">
            <div className="data-title">تفاصيل عوامل التقييم</div>
            <table className="factor-table">
              <thead>
                <tr>
                  <th>العامل</th>
                  <th style={{ textAlign: "center", width: 70 }}>الدرجة (0-3)</th>
                  <th style={{ textAlign: "center", width: 80 }}>الوزن %</th>
                  <th style={{ textAlign: "center", width: 90 }}>النتيجة المرجحة</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORY_ORDER.map((cat) => {
                  const factors = factorsByCategory[cat];
                  if (!factors || factors.length === 0) return null;
                  return [
                    <tr key={`cat-${cat}`} className="factor-cat-row">
                      <td colSpan={4}>{CATEGORY_LABEL[cat]}</td>
                    </tr>,
                    ...factors.map((f) => (
                      <tr key={f.id}>
                        <td>{FIELD_LABEL[f.factor_name] || f.factor_name}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className="score-dot" style={{
                            background: f.raw_score === 3 ? "#d1fae5" : f.raw_score === 2 ? "#fef3c7" : f.raw_score === 1 ? "#ffedd5" : "#fee2e2",
                            color: f.raw_score === 3 ? "#065f46" : f.raw_score === 2 ? "#92400e" : f.raw_score === 1 ? "#9a3412" : "#991b1b",
                          }}>
                            {f.raw_score}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>{(f.weight * 100).toFixed(1)}%</td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{(f.weighted_score * 100).toFixed(2)}%</td>
                      </tr>
                    )),
                  ];
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="footer">
          <div>
            <div className="footer-brand">ذرى — للتمويل الجماعي بالدين</div>
            <div style={{ marginTop: 3 }}>هذا التقرير سري ومخصص للاستخدام الداخلي فقط</div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div>تاريخ الإصدار: {new Date().toLocaleDateString("ar-SA")}</div>
            {score && <div style={{ marginTop: 3 }}>إصدار نموذج التقييم: {score.scorecard_version}</div>}
          </div>
        </div>
      </div>
    </>
  );
}
