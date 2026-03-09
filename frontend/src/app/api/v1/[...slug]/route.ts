import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import {
  ADMIN_EMAIL, ADMIN_PASSWORD, MOCK_TOKEN, MOCK_REFRESH, ADMIN_USER,
  USERS, ORGANIZATIONS, CONTACTS, PRODUCTS, LEADS, APPLICATIONS,
  FACILITIES, COMMITTEE_PACKAGES, COLLECTION_ACTIONS, NOTIFICATIONS,
} from "../_data/seed";

// ─── Redis client ──────────────────────────────────────────────────────────
const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? "",
  token: process.env.KV_REST_API_TOKEN ?? "",
});

const PREFIX = "m360";
const INIT_KEY = `${PREFIX}:initialized`;

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
    redis.set(`${PREFIX}:notifications`,      NOTIFICATIONS),
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
  committee: "committee", users: "users",
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
  if (r === "committee" && action === "vote") {
    const body = await req.json().catch(() => ({})) as AnyRecord;
    const committee = await getCol("committee");
    const pkg = committee.find((c) => c.id === id) as AnyRecord & { votes: AnyRecord[] };
    if (!pkg) return err("Not found", 404);
    const vote = { id: uid(), package_id: id, voter_id: "u-001", ...body, voted_at: now() };
    if (!pkg.votes) pkg.votes = [];
    pkg.votes.push(vote);
    pkg.updated_at = now();
    await setCol("committee", committee);
    return ok(vote, 201);
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
