# M360 Comprehensive System Testing & QA Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Verify the entire M360 system works end-to-end — fix all test failures, spin up the stack, QA every module, fix bugs, and expand automated test coverage with Playwright E2E and additional Vitest tests.

**Architecture:** Go 1.25 modular monolith backend (Echo v4, pgx v5, PostgreSQL 16) with Next.js 15 frontend (React 19, TypeScript, Tailwind CSS 4, next-intl). Docker Compose for local dev. 13 domain modules, 7 RBAC roles, bilingual AR/EN.

**Tech Stack:** Go 1.25, Echo v4, pgx v5, Vitest 4, @testing-library/react, Playwright, Next.js 15, TypeScript, Docker Compose.

---

## Task 1: Run Existing Backend Tests & Fix Failures

**Files:**
- Test: `backend/internal/auth/service_test.go`
- Test: `backend/internal/auth/middleware_test.go`
- Test: `backend/internal/application/model_test.go`
- Test: `backend/internal/committee/service_test.go`
- Test: `backend/internal/collection/service_test.go`
- Test: `backend/internal/facility/service_test.go`
- Test: `backend/internal/contact/handler_test.go`
- Test: `backend/internal/lead/handler_test.go`
- Test: `backend/internal/organization/handler_test.go`

**Step 1: Run all backend tests**

```bash
cd /opt/code/M360/backend && go test ./... -v -count=1 2>&1
```

Expected: See which tests pass/fail. Note all failures.

**Step 2: Fix any failing tests**

Read each failing test file and the corresponding source file. Fix the root cause — could be missing interface methods, changed signatures, or broken test setup. Do NOT skip or delete tests.

**Step 3: Re-run tests to verify all pass**

```bash
cd /opt/code/M360/backend && go test ./... -v -count=1 2>&1
```

Expected: ALL PASS

**Step 4: Verify backend compiles**

```bash
cd /opt/code/M360/backend && go build ./cmd/server
```

Expected: No errors, binary produced.

**Step 5: Commit fixes**

```bash
cd /opt/code/M360
git add backend/
git commit -m "fix: resolve backend test failures"
```

---

## Task 2: Run Existing Frontend Tests & Fix Failures

**Files:**
- Test: `frontend/src/components/ui/Modal.test.tsx`
- Test: `frontend/src/components/ui/PageHeader.test.tsx`
- Test: `frontend/src/components/ui/DataTable.test.tsx`
- Test: `frontend/src/components/ui/StatusBadge.test.tsx`
- Test: `frontend/src/lib/use-api.test.tsx`
- Config: `frontend/vitest.config.ts`
- Config: `frontend/package.json`

**Step 1: Install dependencies**

```bash
cd /opt/code/M360/frontend && npm install
```

**Step 2: Run all frontend tests**

```bash
cd /opt/code/M360/frontend && npx vitest run 2>&1
```

Expected: See which tests pass/fail.

**Step 3: Fix any failing tests**

Read each failing test and its source component. Fix root causes — could be changed props, missing mocks, or import issues.

**Step 4: Verify frontend builds**

```bash
cd /opt/code/M360/frontend && npm run build 2>&1
```

Expected: Build succeeds with no errors.

**Step 5: Run lint**

```bash
cd /opt/code/M360/frontend && npm run lint 2>&1
```

Expected: No errors (warnings acceptable).

**Step 6: Commit fixes**

```bash
cd /opt/code/M360
git add frontend/
git commit -m "fix: resolve frontend test and build failures"
```

---

## Task 3: Spin Up Docker Compose Stack

**Files:**
- Config: `docker-compose.yml`
- Config: `backend/Dockerfile.dev`
- Config: `frontend/Dockerfile.dev`

**Step 1: Stop any existing containers**

```bash
cd /opt/code/M360 && docker compose down -v 2>&1
```

**Step 2: Build and start all services**

```bash
cd /opt/code/M360 && docker compose up -d --build 2>&1
```

Expected: postgres, redis, backend, frontend all start.

**Step 3: Wait for healthy services and check status**

```bash
sleep 15 && docker compose ps 2>&1
```

Expected: All services running/healthy.

**Step 4: Check backend logs for errors**

```bash
docker compose logs backend --tail 50 2>&1
```

Expected: Server started on port 8080, database connected.

**Step 5: Check frontend logs for errors**

```bash
docker compose logs frontend --tail 50 2>&1
```

Expected: Next.js dev server running on port 3000.

**Step 6: If services fail, read Dockerfiles and fix issues**

- Read: `backend/Dockerfile.dev`
- Read: `frontend/Dockerfile.dev`
- Read: `backend/scripts/dev-entrypoint.sh`
- Fix any build or startup errors.

**Step 7: Fix and commit if needed**

```bash
git add . && git commit -m "fix: docker compose dev stack issues"
```

---

## Task 4: Run Database Migrations & Seed Data

**Files:**
- Migration: `backend/migrations/000001_init_schema.up.sql`
- Migration: `backend/migrations/000002_full_schema.up.sql`
- Seed: `backend/cmd/seed/main.go`
- Migrate: `backend/cmd/migrate/main.go`

**Step 1: Check if migrations ran automatically**

```bash
docker compose exec backend sh -c "echo 'SELECT count(*) FROM users;' | psql 'postgres://m360:m360@postgres:5432/m360?sslmode=disable'" 2>&1
```

If error (table doesn't exist), run migrations manually.

**Step 2: Run migrations if needed**

```bash
docker compose exec backend go run ./cmd/migrate up 2>&1
```

Expected: Migrations applied successfully.

**Step 3: Seed test data**

```bash
docker compose exec backend go run ./cmd/seed 2>&1
```

Expected: Admin user (admin@m360.sa / admin123!) created, sample data seeded.

**Step 4: Verify seed data**

```bash
docker compose exec postgres psql -U m360 -d m360 -c "SELECT id, email, role FROM users LIMIT 10;" 2>&1
```

Expected: At least admin user visible.

---

## Task 5: QA — Health Check & API Endpoints

**Step 1: Test health endpoint**

```bash
curl -s http://localhost:8080/health 2>&1
```

Expected: 200 OK response.

**Step 2: Test auth login endpoint**

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@m360.sa","password":"admin123!"}' 2>&1
```

Expected: JSON response with `token` field.

**Step 3: Save token and test authenticated endpoint**

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@m360.sa","password":"admin123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -s http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN" 2>&1
```

Expected: User profile JSON with admin role.

**Step 4: Test each domain API endpoint**

Test GET on each domain (with auth token):
```bash
for endpoint in organizations contacts leads products applications documents committees facilities collections activities notifications reporting/summary; do
  echo "--- $endpoint ---"
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/$endpoint \
    -H "Authorization: Bearer $TOKEN"
  echo
done
```

Expected: All return 200 (or 200 with empty arrays).

**Step 5: Fix any failing endpoints**

Read the handler and service files for any failing endpoint. Fix the root cause. Common issues: missing DB tables, incorrect SQL queries, wrong route registration.

**Step 6: Commit fixes**

```bash
git add . && git commit -m "fix: backend API endpoint issues found during QA"
```

---

## Task 6: QA — Frontend Pages via Browser

**Step 1: Test frontend is accessible**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>&1
```

Expected: 200 or 307 redirect.

**Step 2: Test login page renders**

```bash
curl -s http://localhost:3000/en/login 2>&1 | head -50
```

Expected: HTML containing "Sign in to M360".

**Step 3: Test API proxy from frontend**

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@m360.sa","password":"admin123!"}' 2>&1
```

Expected: Same token response as direct backend call (proves Next.js rewrite proxy works).

**Step 4: Test each authenticated page route**

```bash
for page in dashboard leads organizations contacts products applications committee facilities collections integrations reports users notifications; do
  echo "--- /en/$page ---"
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/$page
  echo
done
```

Expected: All return 200. Client-side auth will handle redirection in browser.

**Step 5: Test Arabic locale pages**

```bash
for page in dashboard leads organizations; do
  echo "--- /ar/$page ---"
  curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ar/$page
  echo
done
```

Expected: All return 200.

**Step 6: Fix any routing or rendering issues found**

Read the page files for any failing routes. Common issues: missing imports, broken component references, i18n key errors.

**Step 7: Commit fixes**

```bash
git add . && git commit -m "fix: frontend page rendering issues found during QA"
```

---

## Task 7: QA — CRUD Operations via API

**Step 1: Create an organization**

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@m360.sa","password":"admin123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST http://localhost:8080/api/v1/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name_en": "Test Corp",
    "name_ar": "شركة اختبار",
    "cr_number": "1234567890",
    "industry": "Technology",
    "legal_structure": "LLC"
  }' 2>&1
```

Expected: 201 with created organization JSON including `id`.

**Step 2: Create a contact linked to the organization**

Use the org ID from step 1:

```bash
curl -s -X POST http://localhost:8080/api/v1/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "<ORG_ID>",
    "name_en": "John Doe",
    "name_ar": "جون دو",
    "role": "owner",
    "email": "john@testcorp.com",
    "phone": "+966501234567"
  }' 2>&1
```

Expected: 201 with created contact.

**Step 3: Create a lead**

```bash
curl -s -X POST http://localhost:8080/api/v1/leads \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "<ORG_ID>",
    "source": "referral",
    "estimated_amount": 500000,
    "notes": "Test lead for QA"
  }' 2>&1
```

Expected: 201 with created lead.

**Step 4: Create a product template**

```bash
curl -s -X POST http://localhost:8080/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name_en": "SME Murabaha",
    "name_ar": "مرابحة المنشآت الصغيرة",
    "min_amount": 100000,
    "max_amount": 5000000,
    "min_tenor_months": 12,
    "max_tenor_months": 60,
    "profit_rate": 8.5
  }' 2>&1
```

Expected: 201 with created product.

**Step 5: Create an application**

```bash
curl -s -X POST http://localhost:8080/api/v1/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "<ORG_ID>",
    "product_id": "<PRODUCT_ID>",
    "requested_amount": 500000,
    "requested_tenor_months": 36,
    "purpose": "Working capital"
  }' 2>&1
```

Expected: 201 with application in "draft" status.

**Step 6: Test list endpoints return created data**

```bash
curl -s http://localhost:8080/api/v1/organizations -H "Authorization: Bearer $TOKEN" 2>&1
curl -s http://localhost:8080/api/v1/leads -H "Authorization: Bearer $TOKEN" 2>&1
curl -s http://localhost:8080/api/v1/applications -H "Authorization: Bearer $TOKEN" 2>&1
```

Expected: Each returns array containing the created record.

**Step 7: Fix any CRUD failures**

Read the handler, service, and repository files for any failing CRUD operation. Fix issues — common problems: wrong SQL column names, missing required fields, incorrect JSON tags.

**Step 8: Commit fixes**

```bash
git add . && git commit -m "fix: CRUD operation issues found during QA"
```

---

## Task 8: Install Playwright & Create E2E Test Infrastructure

**Files:**
- Create: `frontend/playwright.config.ts`
- Create: `frontend/e2e/auth.setup.ts`
- Create: `frontend/e2e/login.spec.ts`
- Modify: `frontend/package.json`

**Step 1: Install Playwright**

```bash
cd /opt/code/M360/frontend && npm install -D @playwright/test && npx playwright install chromium
```

**Step 2: Create Playwright config**

Create `frontend/playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: undefined, // assumes docker compose is already running
});
```

**Step 3: Create auth setup helper**

Create `frontend/e2e/helpers.ts`:

```typescript
import { Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  await page.goto("/en/login");
  await page.fill('input[id="email"]', "admin@m360.sa");
  await page.fill('input[id="password"]', "admin123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard");
}
```

**Step 4: Commit infrastructure**

```bash
cd /opt/code/M360
git add frontend/playwright.config.ts frontend/e2e/
git commit -m "feat: add Playwright E2E test infrastructure"
```

---

## Task 9: E2E Test — Login Flow

**Files:**
- Create: `frontend/e2e/login.spec.ts`

**Step 1: Write the login E2E test**

Create `frontend/e2e/login.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("shows login page", async ({ page }) => {
    await page.goto("/en/login");
    await expect(page.locator("h1")).toContainText("Sign in to M360");
  });

  test("logs in with valid credentials", async ({ page }) => {
    await page.goto("/en/login");
    await page.fill('input[id="email"]', "admin@m360.sa");
    await page.fill('input[id="password"]', "admin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
    await expect(page.locator("text=Welcome back")).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/en/login");
    await page.fill('input[id="email"]', "wrong@test.com");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid email or password")).toBeVisible();
  });
});
```

**Step 2: Run E2E tests (Docker stack must be up)**

```bash
cd /opt/code/M360/frontend && npx playwright test e2e/login.spec.ts 2>&1
```

Expected: All 3 tests pass.

**Step 3: Fix any failures**

If login redirect doesn't work, check `auth-context.tsx` and the login page. If page doesn't render, check Next.js dev server logs.

**Step 4: Commit**

```bash
cd /opt/code/M360
git add frontend/e2e/login.spec.ts
git commit -m "test: add E2E login flow tests"
```

---

## Task 10: E2E Test — Dashboard & Navigation

**Files:**
- Create: `frontend/e2e/dashboard.spec.ts`

**Step 1: Write dashboard E2E test**

Create `frontend/e2e/dashboard.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("displays stats cards", async ({ page }) => {
    await expect(page.locator("text=Active Leads")).toBeVisible();
    await expect(page.locator("text=Organizations")).toBeVisible();
    await expect(page.locator("text=Applications")).toBeVisible();
    await expect(page.locator("text=Active Facilities")).toBeVisible();
  });

  test("displays quick actions", async ({ page }) => {
    await expect(page.locator("text=New Lead")).toBeVisible();
    await expect(page.locator("text=New Application")).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.click("text=Leads");
    await page.waitForURL("**/leads");

    await page.click("text=Organizations");
    await page.waitForURL("**/organizations");

    await page.click("text=Applications");
    await page.waitForURL("**/applications");
  });
});
```

**Step 2: Run test**

```bash
cd /opt/code/M360/frontend && npx playwright test e2e/dashboard.spec.ts 2>&1
```

Expected: All pass.

**Step 3: Commit**

```bash
cd /opt/code/M360
git add frontend/e2e/dashboard.spec.ts
git commit -m "test: add E2E dashboard and navigation tests"
```

---

## Task 11: E2E Test — Leads CRUD

**Files:**
- Create: `frontend/e2e/leads.spec.ts`
- Read: `frontend/src/app/[locale]/(app)/leads/page.tsx`

**Step 1: Read the leads page to understand the UI**

Read `frontend/src/app/[locale]/(app)/leads/page.tsx` to understand form fields, button labels, table structure.

**Step 2: Write leads CRUD E2E test**

Create `frontend/e2e/leads.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Leads CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.click("text=Leads");
    await page.waitForURL("**/leads");
  });

  test("displays leads page", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("can create a new lead", async ({ page }) => {
    // Look for create/add button — adapt selectors based on actual page
    const addButton = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create"), a:has-text("Add"), a:has-text("New")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      // Fill form fields based on actual page structure
      // This will need adaptation based on the actual form
      await page.waitForTimeout(1000);
    }
  });

  test("displays leads in table", async ({ page }) => {
    // Verify table or list renders
    await page.waitForTimeout(2000);
    const table = page.locator("table");
    if (await table.isVisible()) {
      await expect(table).toBeVisible();
    }
  });
});
```

Note: The exact selectors will need adjustment based on the actual leads page UI. Read the page file first and update selectors accordingly.

**Step 3: Run test**

```bash
cd /opt/code/M360/frontend && npx playwright test e2e/leads.spec.ts 2>&1
```

**Step 4: Fix any failures and adapt selectors**

**Step 5: Commit**

```bash
cd /opt/code/M360
git add frontend/e2e/leads.spec.ts
git commit -m "test: add E2E leads CRUD tests"
```

---

## Task 12: E2E Test — Organizations CRUD

**Files:**
- Create: `frontend/e2e/organizations.spec.ts`
- Read: `frontend/src/app/[locale]/(app)/organizations/page.tsx`

**Step 1: Read the organizations page**

Read `frontend/src/app/[locale]/(app)/organizations/page.tsx` to understand the UI.

**Step 2: Write organizations E2E test**

Create `frontend/e2e/organizations.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers";

test.describe("Organizations CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.click("text=Organizations");
    await page.waitForURL("**/organizations");
  });

  test("displays organizations page", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("shows organization list or empty state", async ({ page }) => {
    await page.waitForTimeout(2000);
    // Either table with data or empty state message
    const hasTable = await page.locator("table").isVisible();
    const hasEmpty = await page.locator("text=No").isVisible();
    expect(hasTable || hasEmpty).toBeTruthy();
  });
});
```

**Step 3: Run and fix**

```bash
cd /opt/code/M360/frontend && npx playwright test e2e/organizations.spec.ts 2>&1
```

**Step 4: Commit**

```bash
cd /opt/code/M360
git add frontend/e2e/organizations.spec.ts
git commit -m "test: add E2E organizations tests"
```

---

## Task 13: Expand Frontend Vitest — Auth Context

**Files:**
- Create: `frontend/src/lib/auth-context.test.tsx`
- Read: `frontend/src/lib/auth-context.tsx`

**Step 1: Read the auth context**

Read `frontend/src/lib/auth-context.tsx` to understand the provider and hook API.

**Step 2: Write auth context tests**

Create `frontend/src/lib/auth-context.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth-context";
import React from "react";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("starts with null user and no token", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it("login stores token and fetches user", async () => {
    const fakeToken = "jwt-token-123";
    const fakeUser = { id: "1", email: "admin@m360.sa", name_en: "Admin", role: "admin" };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ token: fakeToken }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fakeUser),
      });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("admin@m360.sa", "admin123!");
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith("m360_token", fakeToken);
  });

  it("logout clears token and user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("m360_token");
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});
```

**Step 3: Run test**

```bash
cd /opt/code/M360/frontend && npx vitest run src/lib/auth-context.test.tsx 2>&1
```

**Step 4: Fix any failures**

**Step 5: Commit**

```bash
cd /opt/code/M360
git add frontend/src/lib/auth-context.test.tsx
git commit -m "test: add auth context unit tests"
```

---

## Task 14: Expand Frontend Vitest — API Utility

**Files:**
- Create: `frontend/src/lib/api.test.ts`
- Read: `frontend/src/lib/api.ts`

**Step 1: Write api utility tests**

Create `frontend/src/lib/api.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "./api";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("makes GET request by default", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
    });

    const result = await api("/test");
    expect(result).toEqual({ data: "test" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/test"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("includes auth token in headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await api("/test", { token: "my-token" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer my-token",
        }),
      })
    );
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ message: "Invalid token" }),
    });

    await expect(api("/test")).rejects.toThrow("Invalid token");
  });

  it("handles 204 No Content", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await api("/test", { method: "DELETE" });
    expect(result).toBeUndefined();
  });

  it("sends JSON body for POST", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: "1" }),
    });

    await api("/test", { method: "POST", body: { name: "test" } });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      })
    );
  });
});
```

**Step 2: Run test**

```bash
cd /opt/code/M360/frontend && npx vitest run src/lib/api.test.ts 2>&1
```

**Step 3: Fix and commit**

```bash
cd /opt/code/M360
git add frontend/src/lib/api.test.ts
git commit -m "test: add api utility unit tests"
```

---

## Task 15: Expand Frontend Vitest — Sidebar Component

**Files:**
- Create: `frontend/src/components/layout/Sidebar.test.tsx`
- Read: `frontend/src/components/layout/Sidebar.tsx`

**Step 1: Read Sidebar component**

Read `frontend/src/components/layout/Sidebar.tsx` to understand props, menu items, structure.

**Step 2: Write Sidebar tests**

Create tests that verify:
- All 13 navigation links render
- User info displays
- Collapse toggle works
- Logout button calls logout

Exact test code depends on Sidebar implementation — read first, then write tests matching the actual component API.

**Step 3: Run and fix**

```bash
cd /opt/code/M360/frontend && npx vitest run src/components/layout/Sidebar.test.tsx 2>&1
```

**Step 4: Commit**

```bash
cd /opt/code/M360
git add frontend/src/components/layout/Sidebar.test.tsx
git commit -m "test: add Sidebar component tests"
```

---

## Task 16: Final Verification Pass

**Step 1: Run ALL backend tests**

```bash
cd /opt/code/M360/backend && go test ./... -v -count=1 2>&1
```

Expected: ALL PASS.

**Step 2: Run ALL frontend unit tests**

```bash
cd /opt/code/M360/frontend && npx vitest run 2>&1
```

Expected: ALL PASS.

**Step 3: Run ALL E2E tests (Docker stack must be up)**

```bash
cd /opt/code/M360/frontend && npx playwright test 2>&1
```

Expected: ALL PASS.

**Step 4: Verify frontend build**

```bash
cd /opt/code/M360/frontend && npm run build 2>&1
```

Expected: Build succeeds.

**Step 5: Verify Docker stack health**

```bash
cd /opt/code/M360 && docker compose ps && echo "---" && curl -s http://localhost:8080/health && echo "---" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/en/login
```

Expected: All services healthy, health 200, login page 200.

**Step 6: Update bug log in design doc**

Edit `docs/plans/2026-03-06-comprehensive-testing-design.md` — add summary of all bugs found and fixed during this process.

**Step 7: Final commit**

```bash
cd /opt/code/M360
git add .
git commit -m "docs: update testing design doc with bug log and results"
```
