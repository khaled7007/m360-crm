import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_EMAIL, ADMIN_PASSWORD, MOCK_TOKEN, MOCK_REFRESH, ADMIN_USER,
  USERS, ORGANIZATIONS, CONTACTS, PRODUCTS, LEADS, APPLICATIONS,
  FACILITIES, COMMITTEE_PACKAGES, COLLECTION_ACTIONS, NOTIFICATIONS,
} from "../_data/seed";

// ─── In-memory store (persists for the lifetime of the server process) ────
type AnyRecord = Record<string, unknown>;

function clone<T>(arr: T[]): T[] {
  return arr.map((item) => ({ ...(item as object) })) as T[];
}

let _initialized = false;
const store: {
  users: AnyRecord[];
  organizations: AnyRecord[];
  contacts: AnyRecord[];
  products: AnyRecord[];
  leads: AnyRecord[];
  applications: AnyRecord[];
  facilities: AnyRecord[];
  committee: AnyRecord[];
  collection_actions: AnyRecord[];
  notifications: AnyRecord[];
} = {
  users: [], organizations: [], contacts: [], products: [],
  leads: [], applications: [], facilities: [], committee: [],
  collection_actions: [], notifications: [],
};

function init() {
  if (_initialized) return;
  store.users              = clone(USERS);
  store.organizations      = clone(ORGANIZATIONS);
  store.contacts           = clone(CONTACTS);
  store.products           = clone(PRODUCTS);
  store.leads              = clone(LEADS);
  store.applications       = clone(APPLICATIONS);
  store.facilities         = clone(FACILITIES);
  store.committee          = clone(COMMITTEE_PACKAGES);
  store.collection_actions = clone(COLLECTION_ACTIONS);
  store.notifications      = clone(NOTIFICATIONS);
  _initialized = true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
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

  return {
    data: filtered.slice(offset, offset + limit),
    total: filtered.length,
    limit,
    offset,
  };
}
function requireAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") && auth.length > 7;
}

// ─── Route dispatcher ─────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  init();
  const { slug } = await context.params;
  const [r, id, action] = slug ?? [];

  if (!requireAuth(req) && !(r === "auth" && id === "me")) {
    return err("Unauthorized", 401);
  }

  // ── AUTH ────────────────────────────────────────────────────────────────
  if (r === "auth" && id === "me") {
    if (!requireAuth(req)) return err("Unauthorized", 401);
    return ok(ADMIN_USER);
  }

  // ── REPORTS ─────────────────────────────────────────────────────────────
  if (r === "reports") {
    if (id === "dashboard") {
      const active = store.facilities.filter((f) => f.status === "active");
      const disbursed = active.reduce((s, f) => s + (f.principal_amount as number), 0);
      const outstanding = active.reduce((s, f) => s + (f.outstanding_balance as number), 0);
      return ok({
        total_leads: store.leads.length,
        total_applications: store.applications.length,
        total_facilities: active.length,
        total_disbursed: disbursed,
        total_outstanding: outstanding,
        par_30: store.facilities.filter((f) => f.delinquency === "par_30").length,
        par_60: store.facilities.filter((f) => f.delinquency === "par_60").length,
        par_90: store.facilities.filter((f) => f.delinquency === "par_90").length,
      });
    }
    if (id === "pipeline") {
      const counts: AnyRecord = {};
      const statuses = ["draft","submitted","pre_approved","documents_collected","credit_assessment","committee_review","approved","rejected","disbursed"];
      statuses.forEach((s) => { counts[s] = store.applications.filter((a) => a.status === s).length; });
      return ok(counts);
    }
    if (id === "officers") {
      return ok(store.users.filter((u) => u.role === "loan_officer" || u.role === "manager").map((u) => ({
        officer_id: u.id, officer_name: u.name_en,
        lead_count: store.leads.filter((l) => l.assigned_officer_id === u.id).length,
        app_count: store.applications.filter((a) => a.assigned_officer_id === u.id).length,
        disbursed: store.facilities.filter((f) => f.assigned_officer_id === u.id).reduce((s, f) => s + (f.principal_amount as number), 0),
        conversion_rate: 0.65,
      })));
    }
  }

  // ── COLLECTIONS ─────────────────────────────────────────────────────────
  if (r === "collections") {
    if (!id) {
      const overdue = store.facilities
        .filter((f) => f.delinquency !== "current" && f.status === "active")
        .map((f) => {
          const org = store.organizations.find((o) => o.id === f.organization_id);
          const actions = store.collection_actions.filter((a) => a.facility_id === f.id);
          const last = actions.sort((a, b) =>
            new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
          )[0];
          const days = f.delinquency === "par_30" ? 32 : f.delinquency === "par_60" ? 65 : 95;
          return {
            id: f.id,
            facility_number: f.reference_number,
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
      const actions = store.collection_actions.filter((a) => a.facility_id === id);
      return ok({ data: actions, total: actions.length });
    }
  }

  // ── NOTIFICATIONS ────────────────────────────────────────────────────────
  if (r === "notifications") {
    const userNotifs = store.notifications;
    if (!id) {
      const p = paginate(userNotifs, req);
      return ok({ ...p, unread_count: userNotifs.filter((n) => !n.is_read).length });
    }
  }

  // ── INTEGRATIONS ────────────────────────────────────────────────────────
  if (r === "integrations") {
    return ok({
      services: [
        { id: "simah",  name: "SIMAH",   name_ar: "سمه",     status: "active",   last_check: now() },
        { id: "bayan",  name: "Bayan",   name_ar: "بيان",    status: "active",   last_check: now() },
        { id: "nafath", name: "Nafath",  name_ar: "نفاذ",    status: "active",   last_check: now() },
        { id: "yaqeen", name: "Yaqeen",  name_ar: "يقين",    status: "active",   last_check: now() },
        { id: "watheq", name: "Watheq",  name_ar: "واثق",    status: "degraded", last_check: now() },
      ],
    });
  }
  if (r === "simah"  && id) return ok({ national_id: id, score: 720, report_date: now(), status: "clean" });
  if (r === "bayan"  && id) return ok({ cr_number: id, status: "active", registered_name: "شركة مسجلة", report_date: now() });
  if (r === "nafath" && id) return ok({ national_id: id, verified: true, name: "مواطن سعودي", verification_date: now() });
  if (r === "yaqeen" && id) return ok({ national_id: id, full_name: "اسم الشخص", nationality: "Saudi", verified: true });
  if (r === "watheq" && id) return ok({ cr_number: id, status: "active", name: "شركة مسجلة" });

  // ── GENERIC CRUD (list / get-by-id) ─────────────────────────────────────
  const resourceMap: Record<string, AnyRecord[]> = {
    leads: store.leads, organizations: store.organizations, contacts: store.contacts,
    products: store.products, applications: store.applications, facilities: store.facilities,
    committee: store.committee, users: store.users,
  };
  const collection = resourceMap[r];
  if (!collection) return err("Not found", 404);

  if (!id) return ok(paginate(collection, req));

  const item = collection.find((i) => i.id === id);
  if (!item) return err("Not found", 404);
  return ok(item);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  init();
  const { slug } = await context.params;
  const [r, id, action] = slug ?? [];

  // ── AUTH LOGIN ──────────────────────────────────────────────────────────
  if (r === "auth" && id === "login") {
    const body = await req.json().catch(() => ({})) as { email?: string; password?: string };
    if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASSWORD) {
      return ok({ token: MOCK_TOKEN, refresh_token: MOCK_REFRESH, user: ADMIN_USER });
    }
    // Accept any @m360.sa email with the demo password for demo purposes
    const demoUser = store.users.find((u) => u.email === body.email);
    if (demoUser && body.password === ADMIN_PASSWORD) {
      return ok({ token: MOCK_TOKEN, refresh_token: MOCK_REFRESH, user: demoUser });
    }
    return err("بيانات الدخول غير صحيحة", 401);
  }

  if (r === "auth" && id === "refresh") {
    return ok({ token: MOCK_TOKEN, refresh_token: MOCK_REFRESH, user: ADMIN_USER });
  }

  if (!requireAuth(req)) return err("Unauthorized", 401);

  // ── NOTIFICATIONS: mark read ─────────────────────────────────────────────
  if (r === "notifications") {
    if (id === "read-all") {
      store.notifications.forEach((n) => { n.is_read = true; });
      return ok({ message: "All notifications marked as read" });
    }
    if (action === "read") {
      const notif = store.notifications.find((n) => n.id === id);
      if (notif) notif.is_read = true;
      return ok({ message: "ok" });
    }
  }

  // ── COLLECTION ACTIONS ───────────────────────────────────────────────────
  if (r === "collections" && action === "actions") {
    const body = await req.json().catch(() => ({})) as AnyRecord;
    const newAction = { id: uid(), facility_id: id, ...body, created_at: now() };
    store.collection_actions.push(newAction);
    return ok(newAction, 201);
  }

  // ── COMMITTEE VOTE ────────────────────────────────────────────────────────
  if (r === "committee" && action === "vote") {
    const body = await req.json().catch(() => ({})) as AnyRecord;
    const pkg = store.committee.find((c) => c.id === id) as AnyRecord & { votes: AnyRecord[] };
    if (!pkg) return err("Not found", 404);
    const vote = { id: uid(), package_id: id, voter_id: "u-001", ...body, voted_at: now() };
    if (!pkg.votes) pkg.votes = [];
    pkg.votes.push(vote);
    pkg.updated_at = now();
    return ok(vote, 201);
  }

  // ── GENERIC CREATE ────────────────────────────────────────────────────────
  const resourceMap: Record<string, AnyRecord[]> = {
    leads: store.leads, organizations: store.organizations, contacts: store.contacts,
    products: store.products, applications: store.applications, facilities: store.facilities,
    committee: store.committee, users: store.users,
  };
  const collection = resourceMap[r];
  if (!collection) return err("Not found", 404);

  const body = await req.json().catch(() => ({})) as AnyRecord;
  const created: AnyRecord = { id: uid(), ...body, created_at: now(), updated_at: now() };

  // Auto-generate reference numbers
  if (r === "applications") {
    created.reference_number = `APP-${new Date().getFullYear()}-${String(collection.length + 1).padStart(3, "0")}`;
    if (!created.status) created.status = "draft";
  }
  if (r === "facilities") {
    created.reference_number = `FAC-${new Date().getFullYear()}-${String(collection.length + 1).padStart(3, "0")}`;
  }

  collection.push(created);
  return ok(created, 201);
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  init();
  if (!requireAuth(req)) return err("Unauthorized", 401);
  const { slug } = await context.params;
  const [r, id, action] = slug ?? [];

  // Application status transition
  if (r === "applications" && id && action === "status") {
    const body = await req.json().catch(() => ({})) as AnyRecord;
    const app = store.applications.find((a) => a.id === id);
    if (!app) return err("Not found", 404);
    Object.assign(app, body, { updated_at: now() });
    return ok(app);
  }

  const resourceMap: Record<string, AnyRecord[]> = {
    leads: store.leads, organizations: store.organizations, contacts: store.contacts,
    products: store.products, applications: store.applications, facilities: store.facilities,
    committee: store.committee, users: store.users,
  };
  const collection = resourceMap[r];
  if (!collection) return err("Not found", 404);

  const item = collection.find((i) => i.id === id);
  if (!item) return err("Not found", 404);

  const body = await req.json().catch(() => ({})) as AnyRecord;
  Object.assign(item, body, { updated_at: now() });
  return ok(item);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  return PUT(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  init();
  if (!requireAuth(req)) return err("Unauthorized", 401);
  const { slug } = await context.params;
  const [r, id] = slug ?? [];

  const resourceMap: Record<string, AnyRecord[]> = {
    leads: store.leads, organizations: store.organizations, contacts: store.contacts,
    products: store.products, applications: store.applications, facilities: store.facilities,
    users: store.users,
  };
  const collection = resourceMap[r];
  if (!collection) return err("Not found", 404);

  const idx = collection.findIndex((i) => i.id === id);
  if (idx === -1) return err("Not found", 404);
  collection.splice(idx, 1);
  return new NextResponse(null, { status: 204 });
}
