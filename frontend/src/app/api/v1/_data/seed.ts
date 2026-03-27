// ─── Seed data for the mock API (used when BACKEND_URL is not set) ───────────

export const ADMIN_EMAIL = "ceo@tharaco.sa";
export const ADMIN_PASSWORD = "Thara@2026";
export const MOCK_TOKEN = "mock-jwt-token-clientscycle";
export const MOCK_REFRESH = "mock-refresh-token-clientscycle";

// ── Users ──────────────────────────────────────────────────────────────────
export const USERS = [
  // ── Super Admins ──
  { id: "u-001", email: "ceo@tharaco.sa",             name_en: "CEO",                  name_ar: "الرئيس التنفيذي",       role: "super_admin",        is_active: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  { id: "u-002", email: "Kalghamdi@tharaco.sa",       name_en: "K. Al-Ghamdi",         name_ar: "الغامدي",               role: "super_admin",        is_active: true, created_at: "2025-01-01T00:00:00Z", updated_at: "2025-01-01T00:00:00Z" },
  // ── إدارة الائتمان ──
  { id: "u-003", email: "aanazi@tharaco.sa",           name_en: "Abdulmajeed Al-Anazi", name_ar: "عبدالمجيد العنزي",     role: "credit_manager",     is_active: true, created_at: "2025-01-02T00:00:00Z", updated_at: "2025-01-02T00:00:00Z" },
  { id: "u-004", email: "falshalwi@tharaco.sa",        name_en: "Faisal Al-Shalawi",    name_ar: "فيصل الشلوي",          role: "credit_officer",     is_active: true, created_at: "2025-01-03T00:00:00Z", updated_at: "2025-01-03T00:00:00Z" },
  // ── إدارة العمليات ──
  { id: "u-005", email: "malshussaini@tharaco.sa",     name_en: "Mashaael",             name_ar: "مشاعل",                role: "operations_manager", is_active: true, created_at: "2025-01-04T00:00:00Z", updated_at: "2025-01-04T00:00:00Z" },
  // ── إدارة المبيعات ──
  { id: "u-006", email: "malenezi@tharaco.sa",         name_en: "Mansour Al-Enezi",     name_ar: "منصور العنزي",         role: "sales_manager",      is_active: true, created_at: "2025-01-05T00:00:00Z", updated_at: "2025-01-05T00:00:00Z" },
  // ── إدارة العناية بالعميل ──
  { id: "u-007", email: "ralbidah@tharaco.sa",         name_en: "Ruba Al-Bidah",        name_ar: "ربى",                  role: "care_manager",       is_active: true, created_at: "2025-01-06T00:00:00Z", updated_at: "2025-01-06T00:00:00Z" },
];

export const ADMIN_USER = USERS[0];

// ── Organizations ──────────────────────────────────────────────────────────
export const ORGANIZATIONS = [
  { id: "org-001", name_en: "Riyadh Development Co.",          name_ar: "شركة الرياض للتطوير العقاري",     cr_number: "1010123456", cr_verified: true,  tax_id: "310000000100003", industry: "Real Estate",      legal_structure: "LLC",    city: "Riyadh",  phone: "+966112345678", email: "info@riyadhdev.sa",       website: "riyadhdev.sa",        assigned_officer_id: "u-003", created_at: "2025-02-01T00:00:00Z", updated_at: "2025-02-01T00:00:00Z" },
  { id: "org-002", name_en: "Al-Omari Contracting Group",      name_ar: "مجموعة العمري للمقاولات",          cr_number: "2050234567", cr_verified: true,  tax_id: "310000000200003", industry: "Construction",     legal_structure: "JSC",    city: "Jeddah",  phone: "+966122345678", email: "info@omari-group.sa",     website: "omari-group.sa",      assigned_officer_id: "u-003", created_at: "2025-02-05T00:00:00Z", updated_at: "2025-02-05T00:00:00Z" },
  { id: "org-003", name_en: "Al-Tamimi Trading & Import",      name_ar: "التميمي للتجارة والاستيراد",       cr_number: "1110345678", cr_verified: true,  tax_id: "310000000300003", industry: "Trading",          legal_structure: "LLC",    city: "Riyadh",  phone: "+966113456789", email: "info@tamimi-trade.com",   website: "tamimi-trade.com",    assigned_officer_id: "u-003", created_at: "2025-02-10T00:00:00Z", updated_at: "2025-02-10T00:00:00Z" },
  { id: "org-004", name_en: "Al-Qahtani Industrial Projects",  name_ar: "القحطاني للمشاريع الصناعية",       cr_number: "2050456789", cr_verified: true,  tax_id: "310000000400003", industry: "Manufacturing",    legal_structure: "JSC",    city: "Dammam",  phone: "+966134567890", email: "info@qahtani-ind.sa",     website: "qahtani-ind.sa",      assigned_officer_id: "u-002", created_at: "2025-02-15T00:00:00Z", updated_at: "2025-02-15T00:00:00Z" },
  { id: "org-005", name_en: "Al-Harbi Investment & Dev.",      name_ar: "الحربي للاستثمار والتطوير",        cr_number: "1010567890", cr_verified: false, tax_id: null,              industry: "Investment",       legal_structure: "LLC",    city: "Riyadh",  phone: "+966115678901", email: "info@harbi-invest.sa",    website: null,                  assigned_officer_id: "u-003", created_at: "2025-03-01T00:00:00Z", updated_at: "2025-03-01T00:00:00Z" },
];

// ── Contacts ───────────────────────────────────────────────────────────────
export const CONTACTS = [
  { id: "c-001", organization_id: "org-001", name_en: "Mohammed Al-Ahmad",   name_ar: "محمد الأحمد",     national_id: "1012345678", role: "CEO",           phone: "+966501234567", email: "m.ahmad@riyadhdev.sa",   nafath_verified: true,  simah_score: 720, is_guarantor: false, created_at: "2025-02-02T00:00:00Z", updated_at: "2025-02-02T00:00:00Z" },
  { id: "c-002", organization_id: "org-001", name_en: "Fatima Al-Omari",     name_ar: "فاطمة العمري",    national_id: "1023456789", role: "CFO",           phone: "+966552345678", email: "f.omari@riyadhdev.sa",   nafath_verified: true,  simah_score: 690, is_guarantor: true,  created_at: "2025-02-02T00:00:00Z", updated_at: "2025-02-02T00:00:00Z" },
  { id: "c-003", organization_id: "org-002", name_en: "Abdullah Al-Tamimi",  name_ar: "عبدالله التميمي", national_id: "1034567890", role: "CEO",           phone: "+966543456789", email: "a.tamimi@omari-group.sa",nafath_verified: true,  simah_score: 750, is_guarantor: false, created_at: "2025-02-06T00:00:00Z", updated_at: "2025-02-06T00:00:00Z" },
  { id: "c-004", organization_id: "org-003", name_en: "Hind Al-Shammari",    name_ar: "هند الشمري",      national_id: "1045678901", role: "Owner",         phone: "+966564567890", email: "h.shammari@tamimi-trade.com", nafath_verified: false, simah_score: 610, is_guarantor: false, created_at: "2025-02-11T00:00:00Z", updated_at: "2025-02-11T00:00:00Z" },
  { id: "c-005", organization_id: "org-004", name_en: "Sultan Al-Qahtani",   name_ar: "سلطان القحطاني",  national_id: "1056789012", role: "Chairman",      phone: "+966505678901", email: "sultan@qahtani-ind.sa",  nafath_verified: true,  simah_score: 800, is_guarantor: false, created_at: "2025-02-16T00:00:00Z", updated_at: "2025-02-16T00:00:00Z" },
  { id: "c-006", organization_id: "org-004", name_en: "Dana Al-Ajami",       name_ar: "دانة العجمي",     national_id: "1067890123", role: "Director",      phone: "+966556789012", email: "dana@qahtani-ind.sa",    nafath_verified: true,  simah_score: 770, is_guarantor: true,  created_at: "2025-02-16T00:00:00Z", updated_at: "2025-02-16T00:00:00Z" },
  { id: "c-007", organization_id: "org-005", name_en: "Maryam Al-Harbi",     name_ar: "مريم الحربي",     national_id: "1078901234", role: "CEO",           phone: "+966568901234", email: "maryam@harbi-invest.sa", nafath_verified: false, simah_score: 680, is_guarantor: false, created_at: "2025-03-02T00:00:00Z", updated_at: "2025-03-02T00:00:00Z" },
  { id: "c-008", organization_id: "org-002", name_en: "Turki Al-Maliki",     name_ar: "تركي المالكي",    national_id: "1089012345", role: "Partner",       phone: "+966509012345", email: "turki@omari-group.sa",   nafath_verified: true,  simah_score: 730, is_guarantor: true,  created_at: "2025-02-07T00:00:00Z", updated_at: "2025-02-07T00:00:00Z" },
];

// ── Products ───────────────────────────────────────────────────────────────
export const PRODUCTS = [
  { id: "prod-001", name_en: "SME Murabaha Financing",       name_ar: "تمويل المرابحة للمنشآت الصغيرة",     type: "murabaha", min_amount: 100000,   max_amount: 2000000,  min_tenor_months: 12, max_tenor_months: 60,  profit_rate: 4.5,  admin_fee_pct: 1.0, payment_frequency: "monthly", eligibility_criteria: {}, required_documents: {}, is_active: true,  created_at: "2025-01-10T00:00:00Z", updated_at: "2025-01-10T00:00:00Z" },
  { id: "prod-002", name_en: "Commercial Murabaha Financing", name_ar: "تمويل المرابحة التجاري",              type: "murabaha", min_amount: 500000,   max_amount: 10000000, min_tenor_months: 12, max_tenor_months: 84,  profit_rate: 3.9,  admin_fee_pct: 0.75, payment_frequency: "monthly", eligibility_criteria: {}, required_documents: {}, is_active: true, created_at: "2025-01-10T00:00:00Z", updated_at: "2025-01-10T00:00:00Z" },
];

// ── Leads ──────────────────────────────────────────────────────────────────
export const LEADS = [
  { id: "l-001", organization_id: "org-001", contact_name: "محمد الأحمد",    company_name: "شركة الرياض للتطوير العقاري",     contact_phone: "+966501234567", contact_email: "m.ahmad@riyadhdev.sa",   source: "referral",   status: "qualified",   estimated_amount: 850000,  notes: "عميل مميز ذو ملاءة مالية عالية",            assigned_officer_id: "u-003", created_at: "2026-01-15T00:00:00Z", updated_at: "2026-02-20T00:00:00Z" },
  { id: "l-002", organization_id: "org-002", contact_name: "فاطمة العمري",    company_name: "مجموعة العمري للمقاولات",          contact_phone: "+966552345678", contact_email: "fatima@omari-group.sa",  source: "website",    status: "contacted",   estimated_amount: 320000,  notes: "تطلب مزيداً من المعلومات",                   assigned_officer_id: "u-003", created_at: "2026-01-20T00:00:00Z", updated_at: "2026-02-25T00:00:00Z" },
  { id: "l-003", organization_id: "org-003", contact_name: "عبدالله التميمي", company_name: "التميمي للتجارة والاستيراد",       contact_phone: "+966543456789", contact_email: "a.tamimi@tamimi-trade.com", source: "cold_call",  status: "new",         estimated_amount: 500000,  notes: "تم التواصل الأولي",                          assigned_officer_id: "u-003", created_at: "2026-02-01T00:00:00Z", updated_at: "2026-02-28T00:00:00Z" },
  { id: "l-004", organization_id: null,      contact_name: "هند الشمري",      company_name: "الشمري للخدمات اللوجستية",         contact_phone: "+966564567890", contact_email: "hind@shamri.sa",         source: "event",      status: "new",         estimated_amount: 175000,  notes: "",                                           assigned_officer_id: "u-003", created_at: "2026-02-10T00:00:00Z", updated_at: "2026-03-01T00:00:00Z" },
  { id: "l-005", organization_id: "org-004", contact_name: "سلطان القحطاني",  company_name: "القحطاني للمشاريع الصناعية",       contact_phone: "+966505678901", contact_email: "sultan@qahtani-ind.sa",  source: "referral",   status: "converted",   estimated_amount: 1200000, notes: "تم تحويله لطلب تمويل",                       assigned_officer_id: "u-002", created_at: "2025-12-01T00:00:00Z", updated_at: "2026-01-10T00:00:00Z" },
  { id: "l-006", organization_id: null,      contact_name: "رنا الدوسري",     company_name: "الدوسري للتكنولوجيا",               contact_phone: "+966556789012", contact_email: "rana@dosari-tech.sa",    source: "website",    status: "unqualified", estimated_amount: 95000,   notes: "لا تستوفي شروط التأهيل",                    assigned_officer_id: "u-003", created_at: "2026-01-05T00:00:00Z", updated_at: "2026-01-25T00:00:00Z" },
  { id: "l-007", organization_id: "org-005", contact_name: "مريم الحربي",     company_name: "الحربي للاستثمار والتطوير",        contact_phone: "+966568901234", contact_email: "maryam@harbi-invest.sa", source: "referral",   status: "qualified",   estimated_amount: 680000,  notes: "إحالة من سلطان القحطاني",                   assigned_officer_id: "u-003", created_at: "2026-02-15T00:00:00Z", updated_at: "2026-03-05T00:00:00Z" },
  { id: "l-008", organization_id: null,      contact_name: "تركي المالكي",    company_name: "المالكي للمواد الغذائية",          contact_phone: "+966509012345", contact_email: "turki@maliki-food.sa",   source: "website",    status: "contacted",   estimated_amount: 260000,  notes: "اتصل من خلال الموقع الإلكتروني",            assigned_officer_id: "u-003", created_at: "2026-02-20T00:00:00Z", updated_at: "2026-03-07T00:00:00Z" },
];

// ── Applications ───────────────────────────────────────────────────────────
export const APPLICATIONS = [
  { id: "app-001", reference_number: "APP-2026-001", organization_id: "org-004", product_id: "prod-002", requested_amount: 1200000, approved_amount: 1200000, tenor_months: 36, profit_rate: 3.9,  purpose: "توسعة المنشأة الصناعية وشراء معدات جديدة",   status: "disbursed",          assigned_officer_id: "u-002", credit_analyst_id: "u-004", compliance_officer_id: "u-001", pre_approval_date: "2026-01-15T00:00:00Z", approval_date: "2026-02-01T00:00:00Z", rejection_reason: null, created_at: "2026-01-05T00:00:00Z", updated_at: "2026-02-10T00:00:00Z" },
  { id: "app-002", reference_number: "APP-2026-002", organization_id: "org-001", product_id: "prod-001", requested_amount: 850000,  approved_amount: 850000,  tenor_months: 48, profit_rate: 4.5,  purpose: "تمويل مشروع تطوير عقاري في شمال الرياض",     status: "approved",           assigned_officer_id: "u-003", credit_analyst_id: "u-004", compliance_officer_id: "u-001", pre_approval_date: "2026-02-10T00:00:00Z", approval_date: "2026-02-28T00:00:00Z", rejection_reason: null, created_at: "2026-01-20T00:00:00Z", updated_at: "2026-03-01T00:00:00Z" },
  { id: "app-003", reference_number: "APP-2026-003", organization_id: "org-002", product_id: "prod-001", requested_amount: 320000,  approved_amount: null,    tenor_months: 24, profit_rate: null, purpose: "تغطية متطلبات رأس المال العامل",              status: "committee_review",   assigned_officer_id: "u-003", credit_analyst_id: "u-004", compliance_officer_id: null, pre_approval_date: "2026-02-20T00:00:00Z", approval_date: null,                   rejection_reason: null, created_at: "2026-02-01T00:00:00Z", updated_at: "2026-03-05T00:00:00Z" },
  { id: "app-004", reference_number: "APP-2026-004", organization_id: "org-005", product_id: "prod-001", requested_amount: 680000,  approved_amount: null,    tenor_months: 36, profit_rate: null, purpose: "تمويل محفظة استثمارية عقارية",                status: "credit_assessment",  assigned_officer_id: "u-003", credit_analyst_id: "u-004", compliance_officer_id: null, pre_approval_date: "2026-03-01T00:00:00Z", approval_date: null,                   rejection_reason: null, created_at: "2026-02-15T00:00:00Z", updated_at: "2026-03-06T00:00:00Z" },
  { id: "app-005", reference_number: "APP-2026-005", organization_id: "org-003", product_id: "prod-001", requested_amount: 500000,  approved_amount: null,    tenor_months: 30, profit_rate: null, purpose: "تمويل واردات وتجهيزات مستودع",                status: "submitted",          assigned_officer_id: "u-003", credit_analyst_id: null,    compliance_officer_id: null, pre_approval_date: null,                   approval_date: null,                   rejection_reason: null, created_at: "2026-03-01T00:00:00Z", updated_at: "2026-03-03T00:00:00Z" },
  { id: "app-006", reference_number: "APP-2026-006", organization_id: "org-002", product_id: "prod-002", requested_amount: 2500000, approved_amount: null,    tenor_months: 60, profit_rate: null, purpose: "مشروع تطوير سكني متكامل",                     status: "rejected",           assigned_officer_id: "u-003", credit_analyst_id: "u-004", compliance_officer_id: "u-001", pre_approval_date: null,                   approval_date: null,                   rejection_reason: "نسبة الدين إلى الدخل تتجاوز الحد المسموح به", created_at: "2025-12-15T00:00:00Z", updated_at: "2026-01-20T00:00:00Z" },
];

// ── Facilities ─────────────────────────────────────────────────────────────
export const FACILITIES = [
  { id: "fac-001", reference_number: "FAC-2026-001", application_id: "app-001", organization_id: "org-004", product_id: "prod-002", principal_amount: 1200000, profit_amount: 140400,  total_amount: 1340400,  outstanding_balance: 1006800, profit_rate: 3.9,  tenor_months: 36, payment_frequency: "monthly", disbursement_date: "2026-02-10T00:00:00Z", maturity_date: "2029-02-10T00:00:00Z", status: "active",  delinquency: "current",  assigned_officer_id: "u-002", created_at: "2026-02-10T00:00:00Z", updated_at: "2026-03-01T00:00:00Z" },
  { id: "fac-002", reference_number: "FAC-2025-012", application_id: "app-001", organization_id: "org-003", product_id: "prod-001", principal_amount: 500000,  profit_amount: 90000,   total_amount: 590000,   outstanding_balance: 480000,  profit_rate: 4.5,  tenor_months: 48, payment_frequency: "monthly", disbursement_date: "2025-07-01T00:00:00Z", maturity_date: "2029-07-01T00:00:00Z", status: "active",  delinquency: "par_30",   assigned_officer_id: "u-003", created_at: "2025-07-01T00:00:00Z", updated_at: "2026-03-01T00:00:00Z" },
  { id: "fac-003", reference_number: "FAC-2025-008", application_id: "app-001", organization_id: "org-001", product_id: "prod-001", principal_amount: 750000,  profit_amount: 135000,  total_amount: 885000,   outstanding_balance: 0,       profit_rate: 4.5,  tenor_months: 36, payment_frequency: "monthly", disbursement_date: "2022-03-01T00:00:00Z", maturity_date: "2025-03-01T00:00:00Z", status: "closed",  delinquency: "current",  assigned_officer_id: "u-003", created_at: "2022-03-01T00:00:00Z", updated_at: "2025-03-05T00:00:00Z" },
];

// ── Committee packages ─────────────────────────────────────────────────────
export const COMMITTEE_PACKAGES = [
  { id: "com-001", application_id: "app-003", credit_assessment_id: "ca-001", prepared_by: "u-004", risk_score: 68, recommendation: "يوصى بالموافقة مع اشتراط ضمانات إضافية", financial_analysis: { revenue: 2500000, net_profit: 400000, dscr: 1.8 }, status: "pending",  decision: "pending",  decision_date: null,                   conditions: null, votes_for: 2, votes_against: 0, quorum_required: 3, votes: [ { id: "v-001", package_id: "com-001", voter_id: "u-001", decision: "approve",                   comments: "الملف جيد",                  voted_at: "2026-03-05T09:00:00Z" }, { id: "v-002", package_id: "com-001", voter_id: "u-002", decision: "approve_with_conditions", comments: "يشترط ضمان إضافي",           voted_at: "2026-03-05T10:00:00Z" } ], created_at: "2026-03-04T00:00:00Z", updated_at: "2026-03-05T00:00:00Z" },
  { id: "com-002", application_id: "app-006", credit_assessment_id: "ca-002", prepared_by: "u-004", risk_score: 82, recommendation: "يُنصح بالرفض بسبب ارتفاع نسبة المديونية",  financial_analysis: { revenue: 8000000, net_profit: 600000, dscr: 1.1 }, status: "rejected", decision: "rejected", decision_date: "2026-01-18T00:00:00Z", conditions: null, votes_for: 0, votes_against: 3, quorum_required: 3, votes: [ { id: "v-003", package_id: "com-002", voter_id: "u-001", decision: "reject",                    comments: "نسبة المديونية مرتفعة جداً", voted_at: "2026-01-18T08:00:00Z" }, { id: "v-004", package_id: "com-002", voter_id: "u-002", decision: "reject",                    comments: "لا يستوفي معايير DSCR",      voted_at: "2026-01-18T09:00:00Z" }, { id: "v-005", package_id: "com-002", voter_id: "u-004", decision: "reject",                    comments: "مخاطر عالية",                voted_at: "2026-01-18T10:00:00Z" } ], created_at: "2026-01-15T00:00:00Z", updated_at: "2026-01-18T00:00:00Z" },
];

// ── Collections ────────────────────────────────────────────────────────────
export const COLLECTION_ACTIONS = [
  { id: "ca-001", facility_id: "fac-002", officer_id: "u-005", action_type: "phone_call",  description: "تواصلنا مع العميل وأكد السداد خلال أسبوع", next_action_date: "2026-03-14T00:00:00Z", created_at: "2026-03-07T09:00:00Z" },
  { id: "ca-002", facility_id: "fac-002", officer_id: "u-005", action_type: "sms_reminder", description: null, next_action_date: "2026-03-10T00:00:00Z", created_at: "2026-03-05T00:00:00Z" },
];

// ── Credit Assessments ─────────────────────────────────────────────────────
export const CREDIT_ASSESSMENTS = [
  {
    id: "ca-001", organization_id: "org-004", organization_name: "القحطاني للمشاريع الصناعية",
    project_name: "مشروع القحطاني الصناعي", application_id: "app-001", created_by: "u-004",
    business_activity: "manufacturing", entity_type: "jsc", entity_location: "major_city",
    years_in_business: "10_plus", income_diversification: "high",
    audited_financials: true, total_revenue: 8000000, operating_cash_flow: 1200000,
    current_liabilities: 2000000, net_profit: 600000, operating_profit: 900000,
    finance_costs: 150000, total_assets: 12000000, current_assets: 4000000,
    credit_record: "clean", payment_behavior: "excellent", payment_delays: "none",
    num_delays: "0", delay_ratio: "0", financing_default: "none",
    num_defaults: "0", default_ratio: "0", bounced_checks: "none", lawsuits: "none",
    project_location: "major_city", has_project_plan: true, has_insurance: true,
    project_type: "expansion", engineering_firm_class: "first", feasibility_study_quality: "high",
    project_net_profit: 2000000, project_total_cost: 5000000, previous_projects_count: "5_plus",
    property_location: "major_city", property_type: "commercial", property_usage: "collateral",
    appraisal_1: 3500000, appraisal_2: 3200000, financing_amount: 1200000,
    status: "approved", notes: "عميل ممتاز بتاريخ ائتماني نظيف",
    created_at: "2026-01-20T00:00:00Z", updated_at: "2026-01-25T00:00:00Z",
    score: {
      id: "sc-001", assessment_id: "ca-001", scorecard_version: "RE-CREDIT-2.0",
      total_score: 87.5, risk_grade: "AA", recommendation: "يوصى بالموافقة بشدة",
      scored_at: "2026-01-22T00:00:00Z",
      factors: [
        { id: "sf-001", credit_score_id: "sc-001", category: "Company Information", factor_name: "Business Activity", raw_score: 4, weight: 1.0, weighted_score: 1.0 },
        { id: "sf-002", credit_score_id: "sc-001", category: "Financial Statements", factor_name: "Audited Financials", raw_score: 5, weight: 4.0, weighted_score: 4.0 },
        { id: "sf-003", credit_score_id: "sc-001", category: "Credit History", factor_name: "Credit Record", raw_score: 5, weight: 4.0, weighted_score: 4.0 },
        { id: "sf-004", credit_score_id: "sc-001", category: "Project Feasibility", factor_name: "Feasibility Study Quality", raw_score: 5, weight: 10.0, weighted_score: 10.0 },
        { id: "sf-005", credit_score_id: "sc-001", category: "Collateral", factor_name: "LTV Ratio", raw_score: 4, weight: 1.0, weighted_score: 1.0 },
      ],
    },
  },
  {
    id: "ca-002", organization_id: "org-001", organization_name: "شركة الرياض للتطوير العقاري",
    project_name: "مشروع نور للتطوير العقاري", application_id: "app-002", created_by: "u-004",
    business_activity: "real_estate", entity_type: "llc", entity_location: "major_city",
    years_in_business: "5_to_10", income_diversification: "medium",
    audited_financials: true, total_revenue: 5000000, operating_cash_flow: 800000,
    current_liabilities: 1500000, net_profit: 400000, operating_profit: 600000,
    finance_costs: 120000, total_assets: 9000000, current_assets: 2500000,
    credit_record: "clean", payment_behavior: "good", payment_delays: "rare",
    num_delays: "1", delay_ratio: "low", financing_default: "none",
    num_defaults: "0", default_ratio: "0", bounced_checks: "none", lawsuits: "none",
    project_location: "major_city", has_project_plan: true, has_insurance: true,
    project_type: "new_development", engineering_firm_class: "first", feasibility_study_quality: "medium",
    project_net_profit: 1200000, project_total_cost: 3000000, previous_projects_count: "3_to_5",
    property_location: "major_city", property_type: "residential", property_usage: "collateral",
    appraisal_1: 2500000, appraisal_2: 2300000, financing_amount: 850000,
    status: "scored", notes: null,
    created_at: "2026-02-10T00:00:00Z", updated_at: "2026-02-15T00:00:00Z",
    score: {
      id: "sc-002", assessment_id: "ca-002", scorecard_version: "RE-CREDIT-2.0",
      total_score: 72.0, risk_grade: "A", recommendation: "يوصى بالموافقة مع متابعة دورية",
      scored_at: "2026-02-12T00:00:00Z",
      factors: [
        { id: "sf-006", credit_score_id: "sc-002", category: "Company Information", factor_name: "Business Activity", raw_score: 5, weight: 1.0, weighted_score: 1.0 },
        { id: "sf-007", credit_score_id: "sc-002", category: "Financial Statements", factor_name: "Audited Financials", raw_score: 4, weight: 4.0, weighted_score: 3.2 },
        { id: "sf-008", credit_score_id: "sc-002", category: "Credit History", factor_name: "Credit Record", raw_score: 4, weight: 4.0, weighted_score: 3.2 },
        { id: "sf-009", credit_score_id: "sc-002", category: "Project Feasibility", factor_name: "Feasibility Study Quality", raw_score: 3, weight: 10.0, weighted_score: 7.5 },
        { id: "sf-010", credit_score_id: "sc-002", category: "Collateral", factor_name: "LTV Ratio", raw_score: 4, weight: 1.0, weighted_score: 1.0 },
      ],
    },
  },
  {
    id: "ca-003", organization_id: "org-005", organization_name: "الحربي للاستثمار والتطوير",
    project_name: "مشروع الأفق التجاري", application_id: "app-004", created_by: "u-004",
    business_activity: "investment", entity_type: "llc", entity_location: "major_city",
    years_in_business: "3_to_5", income_diversification: "low",
    audited_financials: false, total_revenue: 2000000, operating_cash_flow: 300000,
    current_liabilities: 800000, net_profit: 150000, operating_profit: 250000,
    finance_costs: 80000, total_assets: 4000000, current_assets: 1000000,
    credit_record: "some_delays", payment_behavior: "average", payment_delays: "occasional",
    num_delays: "3", delay_ratio: "medium", financing_default: "none",
    num_defaults: "0", default_ratio: "0", bounced_checks: "none", lawsuits: "none",
    project_location: "secondary_city", has_project_plan: true, has_insurance: false,
    project_type: "new_development", engineering_firm_class: "second", feasibility_study_quality: "low",
    project_net_profit: 500000, project_total_cost: 2000000, previous_projects_count: "1_to_2",
    property_location: "secondary_city", property_type: "residential", property_usage: "collateral",
    appraisal_1: 1800000, appraisal_2: 1600000, financing_amount: 680000,
    status: "draft", notes: "بانتظار استكمال الوثائق",
    created_at: "2026-03-05T00:00:00Z", updated_at: "2026-03-07T00:00:00Z",
    score: null,
  },
];

// ── Notifications ──────────────────────────────────────────────────────────
export const NOTIFICATIONS = [
  { id: "n-001", user_id: "u-001", title: "طلب جديد بانتظار المراجعة",     body: "تم تقديم الطلب APP-2026-005 من شركة التميمي للمراجعة", type: "application_submitted", entity_type: "application", entity_id: "app-005", is_read: false, created_at: "2026-03-03T08:00:00Z" },
  { id: "n-002", user_id: "u-001", title: "اجتماع اللجنة غداً",             body: "تذكير: اجتماع لجنة الائتمان غداً الساعة 10 صباحاً",  type: "committee_meeting",    entity_type: "committee",    entity_id: "com-001", is_read: false, created_at: "2026-03-06T12:00:00Z" },
  { id: "n-003", user_id: "u-001", title: "تمت الموافقة على الطلب",          body: "تمت الموافقة على الطلب APP-2026-002 بمبلغ ٨٥٠,٠٠٠ ر.س", type: "application_approved", entity_type: "application", entity_id: "app-002", is_read: false, created_at: "2026-02-28T10:00:00Z" },
  { id: "n-004", user_id: "u-001", title: "تنبيه تأخر السداد",              body: "التسهيل FAC-2025-012 متأخر عن موعد السداد 30 يوماً",  type: "overdue_alert",        entity_type: "facility",     entity_id: "fac-002", is_read: true,  created_at: "2026-03-01T00:00:00Z" },
  { id: "n-005", user_id: "u-001", title: "عميل محتمل جديد",                body: "تم إضافة عميل محتمل جديد: تركي المالكي",             type: "new_lead",             entity_type: "lead",         entity_id: "l-008", is_read: true,  created_at: "2026-02-20T09:00:00Z" },
  { id: "n-006", user_id: "u-001", title: "تم رفض الطلب",                   body: "تم رفض الطلب APP-2026-006 من مجموعة العمري",          type: "application_rejected", entity_type: "application", entity_id: "app-006", is_read: true,  created_at: "2026-01-20T14:00:00Z" },
  { id: "n-007", user_id: "u-001", title: "صرف التمويل بنجاح",              body: "تم صرف تمويل القحطاني بمبلغ ١,٢٠٠,٠٠٠ ر.س",          type: "facility_disbursed",   entity_type: "facility",     entity_id: "fac-001", is_read: true,  created_at: "2026-02-10T11:00:00Z" },
  { id: "n-008", user_id: "u-001", title: "تحديث بيانات المنظمة",           body: "تم تحديث بيانات شركة الرياض للتطوير",                 type: "org_updated",          entity_type: "organization", entity_id: "org-001", is_read: true,  created_at: "2026-02-01T08:00:00Z" },
];
