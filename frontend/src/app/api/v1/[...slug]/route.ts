import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import {
  ADMIN_EMAIL, ADMIN_PASSWORD, MOCK_TOKEN, MOCK_REFRESH, ADMIN_USER,
  USERS, ORGANIZATIONS, CONTACTS, PRODUCTS, LEADS, APPLICATIONS,
  FACILITIES, COMMITTEE_PACKAGES, COLLECTION_ACTIONS, NOTIFICATIONS,
  CREDIT_ASSESSMENTS,
} from "../_data/seed";

// ─── Redis client ──────────────────────────────────────────────────────────
const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? "",
  token: process.env.KV_REST_API_TOKEN ?? "",
});

const PREFIX = "m360";
const INIT_KEY = `${PREFIX}:initialized:v7`;

type AnyRecord = Record<string, unknown>;

// ─── Redis helpers ─────────────────────────────────────────────────────────
async function getCol(name: string): Promise<AnyRecord[]> {
  const data = await redis.get<AnyRecord[]>(`${PREFIX}:${name}`);
  return data ?? [];
}

async function setCol(name: string, data: AnyRecord[]): Promise<void> {
  await redis.set(`${PREFIX}:${name}`, data);
}

async function init() {
  const initialized = await redis.get(INIT_KEY);
  if (initialized) return;
  await Promise.all([
    redis.set(`${PREFIX}:users`,              USERS),
    redis.set(`${PREFIX}:organizations`,      ORGANIZATIONS),
    redis.set(`${PREFIX}:contacts`,           CONTACTS),
    redis.set(`${PREFIX}:products`,           PRODUCTS),
    redis.set(`${PREFIX}:leads`,              LEADS),
    redis.set(`${PREFIX}:applications`,       APPLICATIONS),
    redis.set(`${PREFIX}:facilities`,         FACILITIES),
    redis.set(`${PREFIX}:committee`,          COMMITTEE_PACKAGES),
    redis.set(`${PREFIX}:collection_actions`, COLLECTION_ACTIONS),
    redis.set(`${PREFIX}:notifications`,        NOTIFICATIONS),
    redis.set(`${PREFIX}:credit_assessments`,  CREDIT_ASSESSMENTS),
  ]);
  await redis.set(INIT_KEY, true);
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}
function err(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}
function uid() {
  return `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function now() {
  return new Date().toISOString();
}
function paginate(items: AnyRecord[], req: NextRequest) {
  const url = new URL(req.url);
  const limit  = Math.min(parseInt(url.searchParams.get("limit")  ?? "20"), 100);
  const offset = parseInt(url.searchParams.get("offset") ?? "0");
  const search = (url.searchParams.get("search") ?? "").toLowerCase();
  const filtered = search
    ? items.filter((i) => JSON.stringify(i).toLowerCase().includes(search))
    : items;
  return { data: filtered.slice(offset, offset + limit), total: filtered.length, limit, offset };
}
function requireAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") && auth.length > 7;
}

const RESOURCE_KEYS: Record<string, string> = {
  leads: "leads", organizations: "organizations", contacts: "contacts",
  products: "products", applications: "applications", facilities: "facilities",
  committee: "committee", packages: "committee", users: "users",
  "credit-assessments": "credit_assessments",
};

// ─── GET ───────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  await init();
  const { slug } = await context.params;
  const [r, id, action] = slug ?? [];

  if (!requireAuth(req) && !(r === "auth" && id === "me")) {
    return err("Unauthorized", 401);
  }

  // AUTH
  if (r === "auth" && id === "me") {
    if (!requireAuth(req)) return err("Unauthorized", 401);
    return ok(ADMIN_USER);
  }

  // REPORTS
  if (r === "reports") {
    const facilities = await getCol("facilities");
    const leads      = await getCol("leads");
    const applications = await getCol("applications");

    if (id === "dashboard") {
      const active = facilities.filter((f) => f.status === "active");
      return ok({
        total_leads: leads.length,
        total_applications: applications.length,
        total_facilities: active.length,
        total_disbursed:   active.reduce((s, f) => s + (f.principal_amount as number), 0),
        total_outstanding: active.reduce((s, f) => s + (f.outstanding_balance as number), 0),
        par_30: facilities.filter((f) => f.delinquency === "par_30").length,
        par_60: facilities.filter((f) => f.delinquency === "par_60").length,
        par_90: facilities.filter((f) => f.delinquency === "par_90").length,
      });
    }
    if (id === "pipeline") {
      const statuses = ["draft","submitted","pre_approved","documents_collected","credit_assessment","committee_review","approved","rejected","disbursed"];
      const counts: AnyRecord = {};
      statuses.forEach((s) => { counts[s] = applications.filter((a) => a.status === s).length; });
      return ok(counts);
    }
    if (id === "officers") {
      const users = await getCol("users");
      return ok(users.filter((u) => u.role === "loan_officer" || u.role === "manager").map((u) => ({
        officer_id: u.id, officer_name: u.name_en,
        lead_count: leads.filter((l) => l.assigned_officer_id === u.id).length,
        app_count:  applications.filter((a) => a.assigned_officer_id === u.id).length,
        disbursed:  facilities.filter((f) => f.assigned_officer_id === u.id).reduce((s, f) => s + (f.principal_amount as number), 0),
        conversion_rate: 0.65,
      })));
    }
  }

  // COLLECTIONS
  if (r === "collections") {
    const facilities        = await getCol("facilities");
    const organizations     = await getCol("organizations");
    const collection_actions = await getCol("collection_actions");

    if (!id) {
      const overdue = facilities
        .filter((f) => f.delinquency !== "current" && f.status === "active")
        .map((f) => {
          const org     = organizations.find((o) => o.id === f.organization_id);
          const actions = collection_actions.filter((a) => a.facility_id === f.id);
          const last    = [...actions].sort((a, b) =>
            new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
          )[0];
          const days = f.delinquency === "par_30" ? 32 : f.delinquency === "par_60" ? 65 : 95;
          return {
            id: f.id, facility_number: f.reference_number,
            borrower_name: (org?.name_ar ?? org?.name_en) as string,
            overdue_amount: Math.round((f.outstanding_balance as number) * 0.05),
            days_overdue: days,
            last_collection_date: last?.created_at ?? null,
            collection_count: actions.length,
          };
        });
      return ok({ total_overdue_facilities: overdue.length, overdue_facilities: overdue });
    }
    if (action === "actions") {
      const actions = collection_actions.filter((a) => a.facility_id === id);
      return ok({ data: actions, total: actions.length });
    }
  }

  // NOTIFICATIONS
  if (r === "notifications") {
    const notifications = await getCol("notifications");
    if (!id) {
      const p = paginate(notifications, req);
      return ok({ ...p, unread_count: notifications.filter((n) => !n.is_read).length });
    }
  }

  // INTEGRATIONS
  if (r === "integrations") {
    return ok({ services: [
      { id: "simah",  name: "SIMAH",  name_ar: "سمه",    status: "active",   last_check: now() },
      { id: "bayan",  name: "Bayan",  name_ar: "بيان",   status: "active",   last_check: now() },
      { id: "nafath", name: "Nafath", name_ar: "نفاذ",   status: "active",   last_check: now() },
      { id: "yaqeen", name: "Yaqeen", name_ar: "يقين",   status: "active",   last_check: now() },
      { id: "watheq", name: "Watheq", name_ar: "واثق",   status: "degraded", last_check: now() },
    ]});
  }
  if (r === "simah"  && id) return ok({ national_id: id, score: 720, report_date: now(), status: "clean" });
  if (r === "bayan"  && id) return ok({ cr_number: id, status: "active", registered_name: "شركة مسجلة", report_date: now() });
  if (r === "nafath" && id) return ok({ national_id: id, verified: true, name: "مواطن سعودي", verification_date: now() });
  if (r === "yaqeen" && id) return ok({ national_id: id, full_name: "اسم الشخص", nationality: "Saudi", verified: true });
  if (r === "watheq" && id) return ok({ cr_number: id, status: "active", name: "شركة مسجلة" });

  // GENERIC CRUD
  const colKey = RESOURCE_KEYS[r];
  if (!colKey) return err("Not found", 404);

  const collection = await getCol(colKey);
  if (!id) return ok(paginate(collection, req));

  const item = collection.find((i) => i.id === id);
  if (!item) return err("Not found", 404);
  return ok(item);
}

// ─── POST ──────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  await init();
  const { slug } = await context.params;
  const [r, id, action] = slug ?? [];

  // AUTH LOGIN
  if (r === "auth" && id === "login") {
    const body = await req.json().catch(() => ({})) as { email?: string; password?: string };
    if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
      return ok({ token: MOCK_TOKEN, refresh_token: MOCK_REFRESH, user: ADMIN_USER });
    }
    const users = await getCol("users");
    const demoUser = users.find((u) => u.email === body.email);
    if (demoUser && body.password === ADMIN_PASSWORD) {
      return ok({ token: MOCK_TOKEN, refresh_token: MOCK_REFRESH, user: demoUser });
    }
    return err("بيانات الدخول غير صحيحة", 401);
  }

  if (r === "auth" && id === "refresh") {
    return ok({ token: MOCK_TOKEN, refresh_token: MOCK_REFRESH, user: ADMIN_USER });
  }

  if (!requireAuth(req)) return err("Unauthorized", 401);

  // NOTIFICATIONS: mark read
  if (r === "notifications") {
    const notifications = await getCol("notifications");
    if (id === "read-all") {
      notifications.forEach((n) => { n.is_read = true; });
      await setCol("notifications", notifications);
      return ok({ message: "All notifications marked as read" });
    }
    if (action === "read") {
      const notif = notifications.find((n) => n.id === id);
      if (notif) notif.is_read = true;
      await setCol("notifications", notifications);
      return ok({ message: "ok" });
    }
  }

  // COLLECTION ACTIONS
  if (r === "collections" && action === "actions") {
    const body = await req.json().catch(() => ({})) as AnyRecord;
    const collection_actions = await getCol("collection_actions");
    const newAction = { id: uid(), facility_id: id, ...body, created_at: now() };
    collection_actions.push(newAction);
    await setCol("collection_actions", collection_actions);
    return ok(newAction, 201);
  }

  // COMMITTEE VOTE
  if ((r === "committee" || r === "packages") && action === "vote") {
    const body = await req.json().catch(() => ({})) as AnyRecord;
    const committee = await getCol("committee");
    const pkg = committee.find((c) => c.id === id) as AnyRecord & { votes: AnyRecord[]; votes_for: number; votes_against: number; quorum_required: number };
    if (!pkg) return err("Not found", 404);
    const vote = { id: uid(), package_id: id, voter_id: "u-001", ...body, voted_at: now() };
    if (!pkg.votes) pkg.votes = [];
    pkg.votes.push(vote);
    // update vote counts
    if (body.decision === "approve" || body.decision === "approve_with_conditions") {
      pkg.votes_for = (pkg.votes_for || 0) + 1;
    } else if (body.decision === "reject") {
      pkg.votes_against = (pkg.votes_against || 0) + 1;
    }
    // check quorum and update status
    const quorum = pkg.quorum_required || 3;
    if (pkg.votes_for >= quorum) pkg.status = "approved";
    else if (pkg.votes_against >= quorum) pkg.status = "rejected";
    pkg.updated_at = now();
    await setCol("committee", committee);
    return ok(vote, 201);
  }

  // CREDIT ASSESSMENT SCORE
  if (r === "credit-assessments" && id && action === "score") {
    const assessments = await getCol("credit_assessments");
    const a = assessments.find((x) => x.id === id) as AnyRecord;
    if (!a) return err("Not found", 404);

    // ── Scoring engine ────────────────────────────────────────────────
    // Each factor: raw_score 0-3, weight (sums to 1 across all factors)
    // Weights per category: company_info=20%, financial=35%, credit=25%, project=10%, collateral=10%
    const scoreFactors: AnyRecord[] = [];
    const fid = () => uid();

    // company_info (total weight = 0.20, 4 factors × 0.05)
    const yearsScore = a.years_in_business === "10_plus" ? 3 : a.years_in_business === "5_to_10" ? 2 : a.years_in_business === "3_to_5" ? 1 : 0;
    const entityScore = ["jsc","llc"].includes(String(a.entity_type)) ? 3 : ["sole"].includes(String(a.entity_type)) ? 1 : 2;
    const locationScore = a.entity_location === "major_city" ? 3 : a.entity_location === "secondary_city" ? 2 : 1;
    const incomeScore = a.income_diversification === "high" ? 3 : a.income_diversification === "medium" ? 2 : 1;
    scoreFactors.push(
      { id: fid(), category: "company_info", factor_name: "years_in_business",      raw_score: yearsScore,  weight: 0.05, weighted_score: yearsScore  * 0.05 / 3 },
      { id: fid(), category: "company_info", factor_name: "entity_type",            raw_score: entityScore, weight: 0.05, weighted_score: entityScore * 0.05 / 3 },
      { id: fid(), category: "company_info", factor_name: "entity_location",        raw_score: locationScore, weight: 0.05, weighted_score: locationScore * 0.05 / 3 },
      { id: fid(), category: "company_info", factor_name: "income_diversification", raw_score: incomeScore, weight: 0.05, weighted_score: incomeScore * 0.05 / 3 },
    );

    // financial_statements (total weight = 0.35, 5 factors)
    const revenue = Number(a.total_revenue) || 0;
    const ocf = Number(a.operating_cash_flow) || 0;
    const netProfit = Number(a.net_profit) || 0;
    const finAmount = Number(a.financing_amount) || 1;
    const dscr = ocf > 0 && finAmount > 0 ? ocf / (finAmount * 0.15) : 0;
    const margin = revenue > 0 ? netProfit / revenue : 0;
    const auditedScore = a.audited_financials ? 3 : 1;
    const revenueScore = revenue >= 5000000 ? 3 : revenue >= 2000000 ? 2 : revenue >= 500000 ? 1 : 0;
    const marginScore = margin >= 0.15 ? 3 : margin >= 0.08 ? 2 : margin >= 0.03 ? 1 : 0;
    const dscrScore = dscr >= 2 ? 3 : dscr >= 1.5 ? 2 : dscr >= 1.2 ? 1 : 0;
    const ocfScore = ocf > 0 ? (ocf >= 1000000 ? 3 : ocf >= 300000 ? 2 : 1) : 0;
    scoreFactors.push(
      { id: fid(), category: "financial_statements", factor_name: "audited_financials", raw_score: auditedScore, weight: 0.05, weighted_score: auditedScore * 0.05 / 3 },
      { id: fid(), category: "financial_statements", factor_name: "total_revenue",      raw_score: revenueScore, weight: 0.08, weighted_score: revenueScore * 0.08 / 3 },
      { id: fid(), category: "financial_statements", factor_name: "net_profit",         raw_score: marginScore,  weight: 0.08, weighted_score: marginScore  * 0.08 / 3 },
      { id: fid(), category: "financial_statements", factor_name: "operating_cash_flow",raw_score: ocfScore,     weight: 0.07, weighted_score: ocfScore     * 0.07 / 3 },
      { id: fid(), category: "financial_statements", factor_name: "dscr",               raw_score: dscrScore,    weight: 0.07, weighted_score: dscrScore    * 0.07 / 3 },
    );

    // credit_history (total weight = 0.25, 4 factors)
    const creditRecordScore = a.credit_record === "excellent" ? 3 : a.credit_record === "good" ? 2 : a.credit_record === "acceptable" ? 1 : 0;
    const payBehaviorScore  = a.payment_behavior === "excellent" ? 3 : a.payment_behavior === "satisfactory" ? 2 : a.payment_behavior === "delayed" ? 1 : 0;
    const defaultScore      = a.financing_default === "none" ? 3 : a.financing_default === "resolved" ? 1 : 0;
    const bouncedScore      = a.bounced_checks === "none" ? 3 : a.bounced_checks === "few" ? 1 : 0;
    scoreFactors.push(
      { id: fid(), category: "credit_history", factor_name: "credit_record",     raw_score: creditRecordScore, weight: 0.08, weighted_score: creditRecordScore * 0.08 / 3 },
      { id: fid(), category: "credit_history", factor_name: "payment_behavior",  raw_score: payBehaviorScore,  weight: 0.07, weighted_score: payBehaviorScore  * 0.07 / 3 },
      { id: fid(), category: "credit_history", factor_name: "financing_default", raw_score: defaultScore,      weight: 0.05, weighted_score: defaultScore      * 0.05 / 3 },
      { id: fid(), category: "credit_history", factor_name: "bounced_checks",    raw_score: bouncedScore,      weight: 0.05, weighted_score: bouncedScore      * 0.05 / 3 },
    );

    // project_feasibility (total weight = 0.10, 3 factors)
    const planScore    = a.has_project_plan ? 3 : 0;
    const feasScore    = a.feasibility_study_quality === "strong" ? 3 : a.feasibility_study_quality === "adequate" ? 2 : a.feasibility_study_quality === "weak" ? 1 : 0;
    const prevProjScore = a.previous_projects_count === "5_plus" ? 3 : a.previous_projects_count === "3_to_5" ? 2 : a.previous_projects_count === "1_to_3" ? 1 : 0;
    scoreFactors.push(
      { id: fid(), category: "project_feasibility", factor_name: "has_project_plan",         raw_score: planScore,     weight: 0.03, weighted_score: planScore     * 0.03 / 3 },
      { id: fid(), category: "project_feasibility", factor_name: "feasibility_study_quality", raw_score: feasScore,     weight: 0.04, weighted_score: feasScore     * 0.04 / 3 },
      { id: fid(), category: "project_feasibility", factor_name: "previous_projects_count",   raw_score: prevProjScore, weight: 0.03, weighted_score: prevProjScore * 0.03 / 3 },
    );

    // collateral (total weight = 0.10, 2 factors)
    const appraisal1 = Number(a.appraisal_1) || 0;
    const appraisal2 = Number(a.appraisal_2) || 0;
    const avgAppraisal = (appraisal1 + appraisal2) / 2;
    const ltvRatio = avgAppraisal > 0 && finAmount > 0 ? avgAppraisal / finAmount : 0;
    const ltvScore = ltvRatio >= 1.5 ? 3 : ltvRatio >= 1.2 ? 2 : ltvRatio >= 1.0 ? 1 : 0;
    const propTypeScore = ["commercial","industrial"].includes(String(a.property_type)) ? 3 : a.property_type === "residential" ? 2 : 1;
    scoreFactors.push(
      { id: fid(), category: "collateral", factor_name: "ltv_ratio",    raw_score: ltvScore,     weight: 0.05, weighted_score: ltvScore     * 0.05 / 3 },
      { id: fid(), category: "collateral", factor_name: "property_type", raw_score: propTypeScore, weight: 0.05, weighted_score: propTypeScore * 0.05 / 3 },
    );

    const totalScore = Math.round(scoreFactors.reduce((s, f) => s + (f.weighted_score as number), 0) * 1000) / 10;
    const grade = totalScore >= 90 ? "AA" : totalScore >= 80 ? "A" : totalScore >= 70 ? "BB" : totalScore >= 60 ? "B" : totalScore >= 50 ? "CC" : totalScore >= 40 ? "C" : "F";
    const recommendation = grade === "AA" ? "approve" : grade === "A" ? "approve" : grade === "BB" ? "approve_with_conditions" : grade === "B" ? "approve_with_conditions" : "decline";

    // ── Written report ─────────────────────────────────────────────────
    const weakFactors = scoreFactors.filter((f) => (f.raw_score as number) <= 1).map((f) => f.factor_name as string);
    const strongFactors = scoreFactors.filter((f) => (f.raw_score as number) === 3).map((f) => f.factor_name as string);
    const report = {
      summary: `حصل التقييم على درجة ${totalScore.toFixed(1)}% وتصنيف ${grade}. ${
        grade === "AA" || grade === "A" ? "المنشأة تتمتع بملاءة مالية ممتازة وسجل ائتماني نظيف." :
        grade === "BB" || grade === "B" ? "المنشأة مقبولة مع بعض المخاطر التي تستوجب اشتراطات." :
        "المنشأة تحمل مخاطر مرتفعة لا تستوفي معايير الموافقة."
      }`,
      strengths: strongFactors,
      weaknesses: weakFactors,
      dscr_note: `نسبة تغطية الدين المحسوبة: ${dscr.toFixed(2)}x (${dscr >= 1.5 ? "مقبولة" : "دون المعيار 1.5x"})`,
      ltv_note: ltvRatio > 0 ? `نسبة القيمة إلى التمويل (LTV): ${(ltvRatio * 100).toFixed(0)}% (${ltvRatio >= 1.2 ? "ضمان كافٍ" : "ضمان منخفض"})` : "لا تتوفر بيانات ضمان",
    };

    const score: AnyRecord = {
      id: uid(), assessment_id: id, scorecard_version: "RE-CREDIT-2.0",
      total_score: totalScore, risk_grade: grade, recommendation,
      scored_at: now(), factors: scoreFactors, report,
    };
    a.score = score;
    a.status = "scored";
    a.updated_at = now();
    await setCol("credit_assessments", assessments);
    return ok(score, 201);
  }

  // GENERIC CREATE
  const colKey = RESOURCE_KEYS[r];
  if (!colKey) return err("Not found", 404);

  const collection = await getCol(colKey);
  const body = await req.json().catch(() => ({})) as AnyRecord;
  const created: AnyRecord = { id: uid(), ...body, created_at: now(), updated_at: now() };

  if (r === "applications") {
    created.reference_number = `APP-${new Date().getFullYear()}-${String(collection.length + 1).padStart(3, "0")}`;
    if (!created.status) created.status = "draft";
  }
  if (r === "committee" || r === "packages") {
    if (!created.status) created.status = "pending";
    if (!created.votes) created.votes = [];
    if (created.votes_for === undefined) created.votes_for = 0;
    if (created.votes_against === undefined) created.votes_against = 0;
  }
  if (r === "facilities") {
    created.reference_number = `FAC-${new Date().getFullYear()}-${String(collection.length + 1).padStart(3, "0")}`;
  }

  collection.push(created);
  await setCol(colKey, collection);
  return ok(created, 201);
}

// ─── PUT ───────────────────────────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  await init();
  if (!requireAuth(req)) return err("Unauthorized", 401);
  const { slug } = await context.params;
  const [r, id, action] = slug ?? [];

  // Application status transition
  if (r === "applications" && id && action === "status") {
    const body = await req.json().catch(() => ({})) as AnyRecord;
    const applications = await getCol("applications");
    const app = applications.find((a) => a.id === id);
    if (!app) return err("Not found", 404);
    Object.assign(app, body, { updated_at: now() });
    await setCol("applications", applications);
    return ok(app);
  }

  const colKey = RESOURCE_KEYS[r];
  if (!colKey) return err("Not found", 404);

  const collection = await getCol(colKey);
  const item = collection.find((i) => i.id === id);
  if (!item) return err("Not found", 404);

  const body = await req.json().catch(() => ({})) as AnyRecord;
  Object.assign(item, body, { updated_at: now() });
  await setCol(colKey, collection);
  return ok(item);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  return PUT(req, context);
}

// ─── DELETE ────────────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  await init();
  if (!requireAuth(req)) return err("Unauthorized", 401);
  const { slug } = await context.params;
  const [r, id] = slug ?? [];

  const colKey = RESOURCE_KEYS[r];
  if (!colKey) return err("Not found", 404);

  const collection = await getCol(colKey);
  const idx = collection.findIndex((i) => i.id === id);
  if (idx === -1) return err("Not found", 404);
  collection.splice(idx, 1);
  await setCol(colKey, collection);
  return new NextResponse(null, { status: 204 });
}
