# M360 Gap Closure Design

**Date**: 2026-03-06
**Scope**: Close all identified gaps across frontend and backend

## Approach: Foundation-First (8 Phases)

Each phase builds on the previous. No phase starts until its dependencies are solid.

---

## Phase 1 - Fix What's Broken

### 1a. Reporting Column Bugs
Fix `backend/internal/reporting/repository.go` SQL queries:
- `delinquency_days` -> use `delinquency_status` enum with CASE statement for PAR calculation
- `disbursed_amount` -> `principal_amount`
- `outstanding_amount` -> `outstanding_balance`

### 1b. Validation Enforcement
- Add `c.Validate()` calls to handlers: organization, lead, product, application
- Add `validate` struct tags to all request models missing them

**Files**: ~6 backend files, no frontend changes

---

## Phase 2 - Core Usability

### 2a. Dashboard Connection
- Wire dashboard to `GET /api/v1/reports/dashboard` and `/pipeline`
- Replace hardcoded dashes with real stats

### 2b. Pagination
- New `PaginationControls` component in `components/ui/`
- Wire into all list pages with `limit`/`offset` params
- "Showing X-Y of Z" with prev/next buttons

### 2c. Search & Filtering
- Add debounced search bar to `DataTable`
- Pass `?search=` to backend (already supported on orgs, apps)
- Status filter dropdowns on leads, applications, facilities
- Client-side filtering where backend lacks support

### 2d. Column Sorting
- Sortable column headers in `DataTable` (click to toggle asc/desc)
- Client-side sorting initially
- Arrow icon indicator on sorted column

**Files**: ~8 frontend files, 1 new component

---

## Phase 3 - Arabic/RTL

- Wire `useTranslations()` into all 14 pages + sidebar + app shell
- Expand `en.json` and `ar.json` to ~200+ keys
- `dir="rtl"` conditional on `<html>` based on locale
- Tailwind RTL utilities (`rtl:` prefix) for layout flipping
- Language switcher component in sidebar/header

**Files**: All frontend page files, message JSON files, layout components

---

## Phase 4 - Security

- **Rate limiting**: Echo middleware on `/auth/login` (5 attempts/min per IP)
- **Token refresh**: `POST /auth/refresh` endpoint, refresh token in httpOnly cookie
- **Password reset**: `POST /auth/forgot-password` and `/reset-password` (mock email initially)
- **Role guards**: `useRequireRole()` hook, protect frontend routes per role
- **Document access control**: Verify user access to entity before serving document

**Files**: Backend auth package, frontend auth context, middleware

---

## Phase 5 - Missing UI

- **File upload**: `FileUpload` component with multipart POST to `/api/v1/documents`
- Wire into application detail and organization detail pages
- Show uploaded documents list with download/delete
- **Frontend role guards**: Wrap sensitive pages with role check

**Files**: New FileUpload component, application/organization pages

---

## Phase 6 - Business Logic

- **Application prerequisites**: Validate conditions before status transitions (docs uploaded before credit assessment, committee package before committee review)
- **Notification delivery**: Email service interface with mock SMTP sender; trigger on status changes
- **Collection automation**: Goroutine ticker to check overdue facilities daily, auto-create reminders
- **Audit hooks**: Echo middleware to auto-log activity entries on all mutations

**Files**: Backend application, notification, collection, activity packages

---

## Phase 7 - Integrations

- Replace hardcoded mock data with structured mock services returning varied/realistic data
- Add error handling, timeout, retry logic in integration client interface
- Integration status tracking (last checked, success/failure) per entity
- Design for easy swap to real APIs (HTTP client injection)

**Files**: Backend integration package

---

## Phase 8 - Polish

- **Test coverage**: Handler tests for untested endpoints, integration tests with test DB
- **API documentation**: OpenAPI spec generation from Echo routes + struct tags
- **Real-time**: WebSocket endpoint for notifications (polling fallback)

**Files**: Test files across all packages, new docs

---

## Dependencies

```
Phase 1 (bugs) -> Phase 2 (usability) -> Phase 3 (Arabic)
Phase 1 (bugs) -> Phase 4 (security) -> Phase 5 (UI)
Phase 4 (security) -> Phase 6 (business logic) -> Phase 7 (integrations)
Phase 6 (business logic) -> Phase 8 (polish)
```

Phase 3 and Phase 4 can run in parallel after Phase 2.
Phase 5 can start after Phase 4.
Phase 7 and Phase 8 are independent of Phase 3.
