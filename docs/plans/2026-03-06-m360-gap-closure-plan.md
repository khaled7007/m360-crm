# M360 Gap Closure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all identified gaps across M360 frontend and backend — bugs, usability, Arabic/RTL, security, file upload, business logic, integrations, and polish.

**Architecture:** Foundation-first approach in 8 phases. Each phase builds on the previous. Backend Go modular monolith (Echo v4, pgx v5) + Next.js 15 frontend with next-intl.

**Tech Stack:** Go 1.24, Echo v4, pgx v5, PostgreSQL 16, Next.js 15, React 19, TypeScript, Tailwind CSS v4, next-intl, zod

---

## Phase 1: Fix What's Broken

### Task 1.1: Fix Reporting PAR Query Column References

**Files:**
- Modify: `backend/internal/reporting/repository.go:60-95` (PAR queries)
- Reference: `backend/migrations/000001_init_schema.up.sql:42-49` (delinquency_status enum)

**Step 1: Read the current PAR queries**

The current code references `delinquency_days` (a non-existent numeric column). The actual column is `delinquency` which is an enum with values: `current`, `par_30`, `par_60`, `par_90`, `par_180`, `write_off`.

**Step 2: Fix PAR30 query (~line 66)**

Replace:
```sql
AND delinquency_days >= 30 AND delinquency_days < 60
```
With:
```sql
AND delinquency IN ('par_30', 'par_60', 'par_90', 'par_180', 'write_off')
```

**Step 3: Fix PAR60 query (~line 78)**

Replace:
```sql
AND delinquency_days >= 60 AND delinquency_days < 90
```
With:
```sql
AND delinquency IN ('par_60', 'par_90', 'par_180', 'write_off')
```

**Step 4: Fix PAR90 query (~line 90)**

Replace:
```sql
AND delinquency_days >= 90
```
With:
```sql
AND delinquency IN ('par_90', 'par_180', 'write_off')
```

**Step 5: Fix portfolio at risk CASE statement (~lines 209-213)**

Replace `delinquency_days` comparisons with enum checks:
```sql
CASE delinquency
  WHEN 'current' THEN 'current'
  WHEN 'par_30' THEN 'par_30'
  WHEN 'par_60' THEN 'par_60'
  WHEN 'par_90' THEN 'par_90'
  WHEN 'par_180' THEN 'par_180'
  WHEN 'write_off' THEN 'write_off'
END
```

**Step 6: Run tests**

Run: `cd backend && go build ./... && go test ./internal/reporting/...`
Expected: BUILD SUCCESS, tests pass (or no tests exist yet)

**Step 7: Commit**

```bash
git add backend/internal/reporting/repository.go
git commit -m "fix: use delinquency enum instead of non-existent delinquency_days column in PAR queries"
```

---

### Task 1.2: Fix Reporting Column Name References

**Files:**
- Modify: `backend/internal/reporting/repository.go:42,43,160,216`
- Reference: `backend/migrations/000002_full_schema.up.sql` (facilities table)

**Step 1: Fix disbursed_amount references**

Replace all `disbursed_amount` with `principal_amount` (lines ~42, ~160).

**Step 2: Fix outstanding_amount references**

Replace all `outstanding_amount` with `outstanding_balance` (lines ~43, ~216).

**Step 3: Build and test**

Run: `cd backend && go build ./... && go test ./internal/reporting/...`
Expected: BUILD SUCCESS

**Step 4: Commit**

```bash
git add backend/internal/reporting/repository.go
git commit -m "fix: correct column names in reporting queries (principal_amount, outstanding_balance)"
```

---

### Task 1.3: Add Validation to Organization Handler

**Files:**
- Modify: `backend/internal/organization/handler.go:30-34,89-92`
- Reference pattern: `backend/internal/collection/handler.go:37-44`

**Step 1: Add validation to Create method**

After the `c.Bind(&req)` block (~line 34), add:
```go
if err := c.Validate(&req); err != nil {
    return echo.NewHTTPError(http.StatusBadRequest, err.Error())
}
```

**Step 2: Add validation to Update method**

After the `c.Bind(&req)` block (~line 92), add the same validation call.

**Step 3: Build and test**

Run: `cd backend && go build ./... && go test ./internal/organization/...`

**Step 4: Commit**

```bash
git add backend/internal/organization/handler.go
git commit -m "fix: add request validation to organization handler"
```

---

### Task 1.4: Add Validation to Lead Handler

**Files:**
- Modify: `backend/internal/lead/handler.go:30-34,94-97`

**Step 1: Add validation after Bind in Create (~line 34) and Update (~line 97)**

Same pattern as Task 1.3.

**Step 2: Build and test**

Run: `cd backend && go build ./... && go test ./internal/lead/...`

**Step 3: Commit**

```bash
git add backend/internal/lead/handler.go
git commit -m "fix: add request validation to lead handler"
```

---

### Task 1.5: Add Validation to Product Handler

**Files:**
- Modify: `backend/internal/product/handler.go:28-32,61-69`

**Step 1: Add validation after Bind in Create (~line 32) and Update (~line 69)**

**Step 2: Build and test**

Run: `cd backend && go build ./... && go test ./internal/product/...`

**Step 3: Commit**

```bash
git add backend/internal/product/handler.go
git commit -m "fix: add request validation to product handler"
```

---

### Task 1.6: Add Validation to Application Handler

**Files:**
- Modify: `backend/internal/application/handler.go:29-33,77-80`

**Step 1: Add validation after Bind in Create (~line 33) and UpdateStatus (~line 80)**

**Step 2: Build and test**

Run: `cd backend && go build ./... && go test ./internal/application/...`

**Step 3: Commit**

```bash
git add backend/internal/application/handler.go
git commit -m "fix: add request validation to application handler"
```

---

## Phase 2: Core Usability

### Task 2.1: Enhance useApiList Hook with Pagination Support

**Files:**
- Modify: `frontend/src/lib/use-api.ts:7-32`

**Step 1: Update useApiList to accept query params**

```typescript
interface PaginationParams {
  limit?: number;
  offset?: number;
  search?: string;
  [key: string]: string | number | undefined;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export function useApiList<T>(path: string, params?: PaginationParams) {
  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<{ total: number; limit: number; offset: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (overrideParams?: PaginationParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = { ...params, ...overrideParams };
      const queryString = Object.entries(queryParams || {})
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join("&");
      const url = queryString ? `${path}?${queryString}` : path;
      const result = await api(url);
      if (result.data) {
        setData(result.data);
        if (result.pagination) setPagination(result.pagination);
      } else if (Array.isArray(result)) {
        setData(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setIsLoading(false);
    }
  }, [path, params]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, pagination, isLoading, error, refetch: fetchData };
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`

**Step 3: Commit**

```bash
git add frontend/src/lib/use-api.ts
git commit -m "feat: add pagination and query param support to useApiList hook"
```

---

### Task 2.2: Create PaginationControls Component

**Files:**
- Create: `frontend/src/components/ui/PaginationControls.tsx`

**Step 1: Create the component**

```tsx
"use client";

interface PaginationControlsProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (offset: number) => void;
}

export function PaginationControls({ total, limit, offset, onPageChange }: PaginationControlsProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const from = offset + 1;
  const to = Math.min(offset + limit, total);

  if (total <= limit) return null;

  return (
    <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{from}</span> to{" "}
        <span className="font-medium">{to}</span> of{" "}
        <span className="font-medium">{total}</span> results
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(offset - limit)}
          disabled={offset === 0}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="flex items-center px-3 text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(offset + limit)}
          disabled={offset + limit >= total}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`

**Step 3: Commit**

```bash
git add frontend/src/components/ui/PaginationControls.tsx
git commit -m "feat: add PaginationControls component"
```

---

### Task 2.3: Add Search and Sorting to DataTable

**Files:**
- Modify: `frontend/src/components/ui/DataTable.tsx`

**Step 1: Add search input and sortable headers**

Enhance DataTable to accept optional `onSearch` callback and `sortable` column flag. Add:
- Search input at top (debounced, 300ms)
- Clickable column headers with sort indicator arrows
- Client-side sorting state (column + direction)

```tsx
"use client";

import { useState, useMemo } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  searchable?: boolean;
  onSearch?: (query: string) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, isLoading, emptyMessage = "No data found", onRowClick, searchable, onSearch,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      onSearch?.(value);
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleSort = (key: string) => {
    if (sortCol === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  // ... rest of component using sortedData instead of data
  // Add search input before table if searchable
  // Add sort arrows to column headers for sortable columns
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`

**Step 3: Commit**

```bash
git add frontend/src/components/ui/DataTable.tsx
git commit -m "feat: add search and column sorting to DataTable"
```

---

### Task 2.4: Wire Dashboard to Real Data

**Files:**
- Modify: `frontend/src/app/[locale]/(app)/dashboard/page.tsx`

**Step 1: Replace hardcoded stats with API calls**

Add `useApiGet` calls to fetch from `/reports/dashboard` and `/reports/pipeline`. Replace the hardcoded `"—"` values with real data. Add loading states for each section.

```tsx
const { data: dashboardStats, isLoading: isLoadingStats } = useApiGet<{
  total_leads: number;
  total_applications: number;
  total_facilities: number;
  total_disbursed: number;
  total_outstanding: number;
}>("/reports/dashboard");

const { data: pipelineStats, isLoading: isLoadingPipeline } = useApiGet<{
  data: { status: string; count: number }[];
}>("/reports/pipeline");
```

Replace stats array values:
```tsx
const stats = [
  { name: "Active Leads", value: isLoadingStats ? "..." : String(dashboardStats?.total_leads ?? 0) },
  // ... etc
];
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`

**Step 3: Commit**

```bash
git add frontend/src/app/[locale]/(app)/dashboard/page.tsx
git commit -m "feat: connect dashboard to real reporting endpoints"
```

---

### Task 2.5: Add Pagination to Leads Page

**Files:**
- Modify: `frontend/src/app/[locale]/(app)/leads/page.tsx`

**Step 1: Wire pagination into leads page**

Replace `useApiList<Lead>("/leads")` with pagination params:

```tsx
const [page, setPage] = useState({ limit: 20, offset: 0 });
const { data: leads, pagination, isLoading, refetch } = useApiList<Lead>("/leads", page);
```

Add `PaginationControls` below the DataTable:
```tsx
{pagination && (
  <PaginationControls
    total={pagination.total}
    limit={pagination.limit}
    offset={pagination.offset}
    onPageChange={(offset) => {
      setPage((prev) => ({ ...prev, offset }));
    }}
  />
)}
```

**Step 2: Add search**

Add search state and pass to DataTable + API:
```tsx
const [searchQuery, setSearchQuery] = useState("");
// In useApiList params: { ...page, search: searchQuery }
```

**Step 3: Verify build and commit**

```bash
git add frontend/src/app/[locale]/(app)/leads/page.tsx
git commit -m "feat: add pagination and search to leads page"
```

---

### Task 2.6: Add Pagination to Remaining List Pages

**Files:**
- Modify: `frontend/src/app/[locale]/(app)/organizations/page.tsx`
- Modify: `frontend/src/app/[locale]/(app)/contacts/page.tsx`
- Modify: `frontend/src/app/[locale]/(app)/applications/page.tsx`
- Modify: `frontend/src/app/[locale]/(app)/facilities/page.tsx`
- Modify: `frontend/src/app/[locale]/(app)/collections/page.tsx`
- Modify: `frontend/src/app/[locale]/(app)/users/page.tsx`

**Step 1: Apply same pagination pattern from Task 2.5 to each page**

For each page:
1. Add `useState` for page params (limit: 20, offset: 0)
2. Update `useApiList` to pass pagination params
3. Add `PaginationControls` below DataTable
4. Add search where backend supports it (organizations, applications)

**Step 2: Build and test each page**

Run: `cd frontend && npm run build`

**Step 3: Commit**

```bash
git add frontend/src/app/[locale]/(app)/
git commit -m "feat: add pagination and search to all list pages"
```

---

## Phase 3: Arabic/RTL

### Task 3.1: Expand Translation Message Files

**Files:**
- Modify: `frontend/src/i18n/messages/en.json`
- Modify: `frontend/src/i18n/messages/ar.json`

**Step 1: Expand en.json with all UI strings**

Add sections for every page and component. Structure:
```json
{
  "common": { "appName", "dashboard", "leads", "organizations", "contacts", "products", "applications", "committee", "facilities", "collections", "integrations", "reports", "users", "notifications", "save", "cancel", "delete", "edit", "create", "search", "loading", "noData", "showing", "to", "of", "results", "previous", "next", "page", "logout", "actions", "status", "name", "email", "phone", "date", "amount", "description", "type", "id" },
  "auth": { "email", "password", "loginTitle", "loginButton", "invalidCredentials", "forgotPassword" },
  "leads": { "title", "subtitle", "newLead", "contactName", "companyName", "source", "status", "estimatedAmount", "assignedTo", "phone", "email", "notes", "createTitle", "sources": {}, "statuses": {} },
  "organizations": { "title", "subtitle", "newOrg", "nameEn", "nameAr", "crNumber", "taxId", "industry", "city", "assignedOfficer" },
  "contacts": { "title", "subtitle", "newContact", "nameEn", "nameAr", "nationalId", "role", "guarantor", "signatory" },
  "products": { "title", "subtitle", "newProduct", "nameEn", "nameAr", "minAmount", "maxAmount", "profitRate", "adminFee", "tenor" },
  "applications": { "title", "subtitle", "newApp", "organization", "product", "requestedAmount", "tenor", "purpose", "statuses": {} },
  "committee": { "title", "subtitle", "newPackage", "quorum", "votes", "decision" },
  "facilities": { "title", "subtitle", "principalAmount", "profitAmount", "totalAmount", "outstandingBalance", "maturityDate", "schedule" },
  "collections": { "title", "subtitle", "newAction", "actionTypes": {}, "overdueSummary", "daysOverdue" },
  "reports": { "title", "subtitle", "pipeline", "officers", "par", "disbursed", "outstanding" },
  "integrations": { "title", "subtitle", "simah", "bayan", "nafath", "yaqeen", "watheq", "checkStatus" },
  "notifications": { "title", "subtitle", "markAllRead", "unreadCount" },
  "users": { "title", "subtitle", "newUser", "role", "roles": {} },
  "dashboard": { "title", "subtitle", "activeLeads", "totalApplications", "activeFacilities", "quickActions", "pipeline" }
}
```

**Step 2: Create matching ar.json with Arabic translations**

Translate all keys. Key Arabic terms:
- Dashboard = لوحة التحكم
- Leads = العملاء المحتملون
- Organizations = المنظمات
- Applications = الطلبات
- Committee = اللجنة
- Facilities = التسهيلات
- Collections = التحصيلات
- Reports = التقارير

**Step 3: Commit**

```bash
git add frontend/src/i18n/messages/
git commit -m "feat: expand translation files with all UI strings (EN + AR)"
```

---

### Task 3.2: Wire Translations into Layout and Sidebar

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/components/layout/AppShell.tsx`

**Step 1: Add useTranslations to Sidebar**

```tsx
import { useTranslations } from "next-intl";

// Inside component:
const t = useTranslations("common");

// Replace hardcoded navigation labels:
const navigation = [
  { name: t("dashboard"), href: `/${locale}/dashboard`, icon: LayoutDashboard },
  { name: t("leads"), href: `/${locale}/leads`, icon: Users },
  // ... etc
];
```

**Step 2: Fix AppShell locale-aware redirect**

Replace hardcoded `"/en/login"` (line 15) with locale-aware path using `useLocale()`.

**Step 3: Build and commit**

```bash
git add frontend/src/components/layout/
git commit -m "feat: wire translations into sidebar and app shell"
```

---

### Task 3.3: Wire Translations into All Pages

**Files:**
- Modify: All 14 page files under `frontend/src/app/[locale]/(app)/`

**Step 1: For each page, add useTranslations and replace hardcoded strings**

Pattern for each page:
```tsx
import { useTranslations } from "next-intl";

export default function LeadsPage() {
  const t = useTranslations("leads");
  const tc = useTranslations("common");

  // Replace "Leads" with t("title")
  // Replace "Create Lead" with t("newLead")
  // Replace "Cancel" with tc("cancel")
  // etc.
}
```

Do this for all pages: dashboard, leads, organizations, contacts, products, applications, committee, facilities, collections, integrations, reports, users, notifications, login.

**Step 2: Build and verify**

Run: `cd frontend && npm run build`

**Step 3: Commit**

```bash
git add frontend/src/app/[locale]/
git commit -m "feat: wire useTranslations into all CRM pages"
```

---

### Task 3.4: Add Language Switcher and RTL Styling

**Files:**
- Create: `frontend/src/components/ui/LanguageSwitcher.tsx`
- Modify: `frontend/src/components/layout/Sidebar.tsx` (add switcher)
- Modify: `frontend/src/app/globals.css` (RTL utilities if needed)

**Step 1: Create LanguageSwitcher component**

```tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <button onClick={switchLocale} className="rounded-md border px-3 py-1.5 text-sm">
      {locale === "en" ? "العربية" : "English"}
    </button>
  );
}
```

**Step 2: Add RTL-aware Tailwind classes**

Review all pages for directional classes (ml-, mr-, pl-, pr-, text-left, text-right) and add RTL equivalents using `rtl:` prefix or logical properties (ms-, me-, ps-, pe-).

**Step 3: Add LanguageSwitcher to Sidebar**

Place above or near the logout button.

**Step 4: Build and commit**

```bash
git add frontend/src/components/ frontend/src/app/
git commit -m "feat: add language switcher and RTL layout support"
```

---

## Phase 4: Security

### Task 4.1: Add Rate Limiting to Login

**Files:**
- Modify: `backend/internal/platform/server/server.go:16-19`
- Modify: `backend/internal/auth/handler.go:18`

**Step 1: Add rate limiter middleware**

Use Echo's built-in rate limiter or a simple in-memory counter:

```go
import "golang.org/x/time/rate"
import "sync"

// In server.go or as separate middleware file
type IPRateLimiter struct {
    limiters map[string]*rate.Limiter
    mu       sync.RWMutex
    rate     rate.Limit
    burst    int
}

func NewIPRateLimiter(r rate.Limit, b int) *IPRateLimiter {
    return &IPRateLimiter{
        limiters: make(map[string]*rate.Limiter),
        rate:     r,
        burst:    b,
    }
}

func (i *IPRateLimiter) GetLimiter(ip string) *rate.Limiter {
    i.mu.Lock()
    defer i.mu.Unlock()
    limiter, exists := i.limiters[ip]
    if !exists {
        limiter = rate.NewLimiter(i.rate, i.burst)
        i.limiters[ip] = limiter
    }
    return limiter
}

func RateLimitMiddleware(limiter *IPRateLimiter) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            ip := c.RealIP()
            if !limiter.GetLimiter(ip).Allow() {
                return echo.NewHTTPError(http.StatusTooManyRequests, "too many requests")
            }
            return next(c)
        }
    }
}
```

**Step 2: Apply to login endpoint**

In auth handler registration, wrap login with rate limiter (5 requests per minute):
```go
loginLimiter := NewIPRateLimiter(rate.Every(time.Minute/5), 5)
authGroup.POST("/login", h.Login, RateLimitMiddleware(loginLimiter))
```

**Step 3: Build and test**

Run: `cd backend && go build ./...`

**Step 4: Commit**

```bash
git add backend/internal/
git commit -m "feat: add IP-based rate limiting to login endpoint"
```

---

### Task 4.2: Add Token Refresh

**Files:**
- Modify: `backend/internal/auth/service.go`
- Modify: `backend/internal/auth/handler.go`
- Modify: `backend/internal/auth/model.go`
- Modify: `frontend/src/lib/auth-context.tsx`

**Step 1: Add refresh token generation to backend**

In `service.go`, add `GenerateRefreshToken()` that creates a longer-lived token (7 days) with a `refresh` type claim. Add `RefreshToken()` method that validates a refresh token and issues a new access token.

**Step 2: Add refresh endpoint**

In `handler.go`, add `POST /auth/refresh` that accepts refresh token in request body and returns new access + refresh tokens.

**Step 3: Update frontend auth context**

Store refresh token alongside access token. Add auto-refresh logic: when an API call returns 401, attempt token refresh before redirecting to login.

**Step 4: Build and commit**

```bash
git add backend/internal/auth/ frontend/src/lib/auth-context.tsx
git commit -m "feat: add token refresh mechanism"
```

---

### Task 4.3: Add Password Reset Flow

**Files:**
- Modify: `backend/internal/auth/service.go`
- Modify: `backend/internal/auth/handler.go`
- Modify: `backend/internal/auth/model.go`
- Create: `frontend/src/app/[locale]/forgot-password/page.tsx`
- Create: `frontend/src/app/[locale]/reset-password/page.tsx`

**Step 1: Add backend endpoints**

- `POST /auth/forgot-password` — accepts email, generates reset token (UUID), stores in DB with 1hr expiry, logs token to console (mock email)
- `POST /auth/reset-password` — accepts token + new password, validates token, updates password hash

Add `password_reset_token` and `password_reset_expires` columns to users table (new migration).

**Step 2: Create frontend pages**

- Forgot password page: email input form, calls API, shows success message
- Reset password page: reads token from URL, new password + confirm form, calls API

**Step 3: Build and commit**

```bash
git add backend/ frontend/
git commit -m "feat: add password reset flow (mock email delivery)"
```

---

### Task 4.4: Add Frontend Role Guards

**Files:**
- Create: `frontend/src/lib/use-require-role.ts`
- Modify: Pages that need role protection

**Step 1: Create useRequireRole hook**

```tsx
"use client";

import { useAuth } from "./auth-context";

export function useRequireRole(...roles: string[]) {
  const { user } = useAuth();
  const hasAccess = user && roles.includes(user.role);
  return { hasAccess, user };
}
```

**Step 2: Protect sensitive pages**

- Users page: admin only (already has guard, verify it uses the hook)
- Reports/PAR: manager, admin
- Committee: credit_analyst, manager, admin
- Collections: collections_officer, manager, admin

**Step 3: Build and commit**

```bash
git add frontend/src/lib/use-require-role.ts frontend/src/app/
git commit -m "feat: add role-based access guards to frontend pages"
```

---

### Task 4.5: Validate JWT Secret and Configure CORS

**Files:**
- Modify: `backend/internal/platform/config/config.go:28`
- Modify: `backend/internal/platform/server/server.go:18`

**Step 1: Require JWT_SECRET in production**

```go
if cfg.Environment == "production" && cfg.JWTSecret == "" {
    log.Fatal("JWT_SECRET must be set in production")
}
if cfg.JWTSecret == "" {
    cfg.JWTSecret = "dev-secret-do-not-use-in-production"
}
```

**Step 2: Configure CORS properly**

Replace default CORS with explicit config:
```go
e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
    AllowOrigins: []string{"http://localhost:3000", cfg.FrontendURL},
    AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete},
    AllowHeaders: []string{echo.HeaderContentType, echo.HeaderAuthorization},
}))
```

**Step 3: Build and commit**

```bash
git add backend/internal/platform/
git commit -m "feat: enforce JWT secret in production and configure CORS"
```

---

## Phase 5: Missing UI

### Task 5.1: Create FileUpload Component

**Files:**
- Create: `frontend/src/components/ui/FileUpload.tsx`

**Step 1: Create the component**

```tsx
"use client";

import { useState, useRef } from "react";
import { Upload, X, FileText } from "lucide-react";

interface FileUploadProps {
  entityType: string;
  entityId: string;
  onUploadComplete?: () => void;
}

export function FileUpload({ entityType, entityId, onUploadComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entity_type", entityType);
      formData.append("entity_id", entityId);
      formData.append("name", file.name);

      const token = localStorage.getItem("m360_token");
      const res = await fetch("/api/v1/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      onUploadComplete?.();
    } catch {
      // toast error
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }} />
      <button onClick={() => fileInputRef.current?.click()} disabled={isUploading}
        className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm hover:border-gray-400">
        <Upload className="h-4 w-4" />
        {isUploading ? "Uploading..." : "Upload Document"}
      </button>
    </div>
  );
}
```

**Step 2: Build and commit**

```bash
git add frontend/src/components/ui/FileUpload.tsx
git commit -m "feat: add FileUpload component for document uploads"
```

---

### Task 5.2: Create DocumentList Component and Wire into Pages

**Files:**
- Create: `frontend/src/components/ui/DocumentList.tsx`
- Modify: `frontend/src/app/[locale]/(app)/applications/page.tsx` (add to detail view)

**Step 1: Create DocumentList component**

Shows uploaded documents for an entity with download/delete actions.

**Step 2: Wire FileUpload + DocumentList into application detail view**

Add document section to the ApplicationDetails sub-component (after line ~320).

**Step 3: Build and commit**

```bash
git add frontend/src/components/ui/DocumentList.tsx frontend/src/app/[locale]/(app)/applications/page.tsx
git commit -m "feat: add document list and upload to application detail view"
```

---

### Task 5.3: Add File Size and Type Validation to Backend

**Files:**
- Modify: `backend/internal/document/handler.go:29-96`

**Step 1: Add validation in Upload handler**

After getting the file (line ~40), add:
```go
const maxFileSize = 10 << 20 // 10MB
if file.Size > maxFileSize {
    return echo.NewHTTPError(http.StatusBadRequest, "file too large (max 10MB)")
}

allowedTypes := map[string]bool{
    "application/pdf": true, "image/jpeg": true, "image/png": true,
    "application/msword": true, "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
    "application/vnd.ms-excel": true, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
}
if !allowedTypes[file.Header.Get("Content-Type")] {
    return echo.NewHTTPError(http.StatusBadRequest, "unsupported file type")
}
```

**Step 2: Build and commit**

```bash
git add backend/internal/document/handler.go
git commit -m "feat: add file size and MIME type validation to document uploads"
```

---

## Phase 6: Business Logic

### Task 6.1: Add Application Transition Prerequisites

**Files:**
- Modify: `backend/internal/application/service.go:38-47`
- Modify: `backend/internal/application/handler.go`

**Step 1: Add prerequisite checks before status transitions**

In `UpdateStatus()`, after `CanTransition()` check, add business rule validation:

```go
// Before credit_assessment: must have documents uploaded
if newStatus == StatusCreditAssessment {
    docs, _ := docRepo.ListByEntity(ctx, "application", app.ID)
    if len(docs) == 0 {
        return fmt.Errorf("documents must be uploaded before credit assessment")
    }
}

// Before committee_review: must have committee package
if newStatus == StatusCommitteeReview {
    pkg, _ := committeeRepo.GetByApplicationID(ctx, app.ID)
    if pkg == nil {
        return fmt.Errorf("committee package must be created before committee review")
    }
}
```

This requires injecting document and committee repositories into the application service.

**Step 2: Update service constructor in main.go**

Wire the additional dependencies.

**Step 3: Build and test**

Run: `cd backend && go build ./... && go test ./internal/application/...`

**Step 4: Commit**

```bash
git add backend/internal/application/ backend/cmd/server/main.go
git commit -m "feat: add business rule prerequisites to application status transitions"
```

---

### Task 6.2: Add Notification Triggers on Status Changes

**Files:**
- Modify: `backend/internal/application/service.go`
- Modify: `backend/internal/facility/service.go`

**Step 1: Inject notification service into application service**

After successful status update, send notification:

```go
// After successful status update
notifSvc.Send(ctx, notification.CreateRequest{
    UserID:     app.OfficerID,
    Title:      fmt.Sprintf("Application %s", newStatus),
    Body:       fmt.Sprintf("Application %s has been moved to %s", app.ReferenceNumber, newStatus),
    Type:       "status_change",
    EntityType: "application",
    EntityID:   app.ID,
})
```

**Step 2: Add payment due notifications in facility service**

After recording payment, if overdue, notify collections officer.

**Step 3: Build and commit**

```bash
git add backend/internal/application/ backend/internal/facility/ backend/cmd/server/main.go
git commit -m "feat: trigger notifications on application status changes and overdue payments"
```

---

### Task 6.3: Add Collection Automation (Daily Overdue Check)

**Files:**
- Create: `backend/internal/collection/scheduler.go`
- Modify: `backend/cmd/server/main.go`

**Step 1: Create scheduler**

```go
package collection

import (
    "context"
    "log"
    "time"
)

func StartOverdueChecker(svc *Service, interval time.Duration) {
    ticker := time.NewTicker(interval)
    go func() {
        for range ticker.C {
            ctx := context.Background()
            summary, err := svc.GetOverdueSummary(ctx)
            if err != nil {
                log.Printf("overdue check failed: %v", err)
                continue
            }
            for _, facility := range summary.Facilities {
                if facility.DaysOverdue > 30 && facility.CollectionCount == 0 {
                    svc.Create(ctx, CreateRequest{
                        FacilityID:  facility.FacilityID,
                        ActionType:  "sms_reminder",
                        Description: "Auto-generated: facility overdue > 30 days",
                    }, uuid.Nil) // system user
                }
            }
        }
    }()
}
```

**Step 2: Start scheduler in main.go**

```go
collection.StartOverdueChecker(collectionSvc, 24*time.Hour)
```

**Step 3: Build and commit**

```bash
git add backend/internal/collection/scheduler.go backend/cmd/server/main.go
git commit -m "feat: add daily overdue facility checker with auto-collection actions"
```

---

### Task 6.4: Add Audit Trail Middleware

**Files:**
- Create: `backend/internal/activity/middleware.go`
- Modify: `backend/cmd/server/main.go`

**Step 1: Create Echo middleware that logs mutations**

```go
package activity

import (
    "github.com/labstack/echo/v4"
)

func AuditMiddleware(svc *Service) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            err := next(c)
            method := c.Request().Method
            if method == "POST" || method == "PUT" || method == "DELETE" {
                claims := auth.GetClaimsOptional(c)
                if claims != nil {
                    svc.Create(c.Request().Context(), CreateRequest{
                        EntityType:  "api",
                        EntityID:    uuid.Nil,
                        Action:      method,
                        Description: c.Request().URL.Path,
                    }, claims.UserID)
                }
            }
            return err
        }
    }
}
```

**Step 2: Apply to API group in main.go**

**Step 3: Build and commit**

```bash
git add backend/internal/activity/middleware.go backend/cmd/server/main.go
git commit -m "feat: add audit trail middleware for all API mutations"
```

---

## Phase 7: Integrations

### Task 7.1: Improve Mock Integration Services

**Files:**
- Modify: `backend/internal/integration/simah/simah.go`
- Modify: `backend/internal/integration/bayan/bayan.go`
- Modify: `backend/internal/integration/nafath/nafath.go`
- Modify: `backend/internal/integration/yaqeen/yaqeen.go`
- Modify: `backend/internal/integration/watheq/watheq.go`

**Step 1: Add varied/realistic mock data**

Instead of hardcoded single values, use deterministic variation based on input:

```go
func (c *Client) GetCreditReport(nationalID string) (*integration.CreditReport, error) {
    // Deterministic score based on last digit of national ID
    lastDigit := int(nationalID[len(nationalID)-1] - '0')
    score := 600 + (lastDigit * 30) // Range: 600-870

    return &integration.CreditReport{
        Score:        score,
        RiskLevel:    riskLevelFromScore(score),
        ActiveLoans:  lastDigit % 5,
        DefaultCount: lastDigit % 2,
        LastUpdated:  time.Now(),
    }, nil
}
```

Apply same pattern to all 5 services.

**Step 2: Add error handling interface**

Add timeout simulation and error cases for testing:
```go
// If national ID starts with "ERR", return error
if strings.HasPrefix(nationalID, "ERR") {
    return nil, fmt.Errorf("SIMAH service unavailable")
}
```

**Step 3: Build and commit**

```bash
git add backend/internal/integration/
git commit -m "feat: improve mock integration services with varied realistic data"
```

---

## Phase 8: Polish

### Task 8.1: Add Reporting Handler Tests

**Files:**
- Create: `backend/internal/reporting/service_test.go`

**Step 1: Write unit tests for any pure logic in reporting service**

Test dashboard stats aggregation, PAR calculation logic if any is done in Go (vs SQL).

**Step 2: Run tests**

Run: `cd backend && go test ./internal/reporting/... -v`

**Step 3: Commit**

```bash
git add backend/internal/reporting/
git commit -m "test: add reporting service tests"
```

---

### Task 8.2: Add Missing Handler Tests

**Files:**
- Create: `backend/internal/notification/handler_test.go`
- Create: `backend/internal/document/handler_test.go`
- Create: `backend/internal/activity/handler_test.go`

**Step 1: Write handler tests following existing patterns**

Reference: `backend/internal/contact/handler_test.go` for handler test structure.

Test key flows:
- Notification: list, mark read, count
- Document: upload validation (file size, MIME type)
- Activity: create, list by entity

**Step 2: Run all tests**

Run: `cd backend && go test ./... -v`

**Step 3: Commit**

```bash
git add backend/internal/
git commit -m "test: add handler tests for notification, document, and activity"
```

---

### Task 8.3: Add OpenAPI Specification

**Files:**
- Create: `backend/docs/openapi.yaml`

**Step 1: Write OpenAPI 3.0 spec documenting all endpoints**

Document all endpoints from `cmd/server/main.go` route registration:
- Auth (3 endpoints)
- Organizations (5 endpoints)
- Contacts (5 endpoints)
- Leads (5 endpoints)
- Products (4 endpoints)
- Applications (4 endpoints)
- Committee (4 endpoints)
- Facilities (5 endpoints)
- Collections (3 endpoints)
- Documents (4 endpoints)
- Activities (3 endpoints)
- Notifications (4 endpoints)
- Integrations (5 endpoints)
- Reports (4 endpoints)

Include request/response schemas based on model structs.

**Step 2: Commit**

```bash
git add backend/docs/openapi.yaml
git commit -m "docs: add OpenAPI 3.0 specification for all API endpoints"
```

---

### Task 8.4: Add WebSocket Notifications (Optional)

**Files:**
- Create: `backend/internal/notification/websocket.go`
- Modify: `backend/cmd/server/main.go`
- Modify: `frontend/src/lib/auth-context.tsx` or create `frontend/src/lib/use-notifications.ts`

**Step 1: Add WebSocket endpoint**

Use Echo's WebSocket support or gorilla/websocket:
```go
func (h *Handler) WebSocket(c echo.Context) error {
    // Upgrade to WebSocket
    // Authenticate via token query param
    // Push notifications in real-time
}
```

Register: `GET /ws/notifications`

**Step 2: Add frontend WebSocket hook**

Create `useNotifications()` hook that connects to WebSocket, falls back to polling.

**Step 3: Build and commit**

```bash
git add backend/internal/notification/ frontend/src/lib/
git commit -m "feat: add WebSocket endpoint for real-time notifications"
```

---

## Execution Order Summary

| Task | Phase | Description | Dependencies |
|------|-------|-------------|--------------|
| 1.1 | 1 | Fix PAR query columns | None |
| 1.2 | 1 | Fix disbursed/outstanding columns | None |
| 1.3 | 1 | Validate organization handler | None |
| 1.4 | 1 | Validate lead handler | None |
| 1.5 | 1 | Validate product handler | None |
| 1.6 | 1 | Validate application handler | None |
| 2.1 | 2 | useApiList pagination support | None |
| 2.2 | 2 | PaginationControls component | None |
| 2.3 | 2 | DataTable search + sorting | None |
| 2.4 | 2 | Dashboard real data | 1.1, 1.2 |
| 2.5 | 2 | Leads pagination | 2.1, 2.2 |
| 2.6 | 2 | All pages pagination | 2.1, 2.2 |
| 3.1 | 3 | Translation files | None |
| 3.2 | 3 | Sidebar/layout translations | 3.1 |
| 3.3 | 3 | All pages translations | 3.1 |
| 3.4 | 3 | Language switcher + RTL | 3.2 |
| 4.1 | 4 | Rate limiting | None |
| 4.2 | 4 | Token refresh | None |
| 4.3 | 4 | Password reset | None |
| 4.4 | 4 | Frontend role guards | None |
| 4.5 | 4 | JWT secret + CORS | None |
| 5.1 | 5 | FileUpload component | None |
| 5.2 | 5 | DocumentList + wire to pages | 5.1 |
| 5.3 | 5 | File validation backend | None |
| 6.1 | 6 | Application prerequisites | 5.2 |
| 6.2 | 6 | Notification triggers | None |
| 6.3 | 6 | Collection automation | None |
| 6.4 | 6 | Audit middleware | None |
| 7.1 | 7 | Improved mock integrations | None |
| 8.1 | 8 | Reporting tests | 1.1, 1.2 |
| 8.2 | 8 | Handler tests | All Phase 6 |
| 8.3 | 8 | OpenAPI spec | All phases |
| 8.4 | 8 | WebSocket notifications | 6.2 |
