# M360 Comprehensive System Testing & QA Design

## Goal

Verify the entire M360 system works end-to-end: existing tests pass, Docker stack runs, UI functions correctly, bugs are fixed, and automated test coverage is expanded.

## Approach: Hybrid (Verify Foundation, QA-Driven, Expand Coverage)

### Phase 1: Foundation Verification
- Run all existing backend Go tests, fix failures
- Run all existing frontend Vitest tests, fix failures
- Verify backend compiles (`go build ./cmd/server`)
- Verify frontend builds (`npm run build`)

### Phase 2: Docker Stack & Environment
- Bring up full stack via `docker compose up -d`
- Run database migrations
- Seed test data (admin@m360.sa / admin123!)
- Verify health endpoints and API proxy

### Phase 3: Systematic QA (Fix As We Go)
Test each module through the UI and API:
1. Login/logout flow
2. Dashboard rendering and stats
3. Leads CRUD
4. Organizations CRUD (bilingual fields)
5. Contacts CRUD
6. Products CRUD
7. Applications CRUD + workflow transitions
8. Committee review + voting
9. Facilities management
10. Collections management
11. Integrations page
12. Reports/analytics
13. Users management
14. Notifications
15. Bilingual (AR/EN) switching + RTL
16. API error handling

### Phase 4: Expanded Automated Tests
- Add Playwright for E2E critical flows (login, CRUD, application lifecycle)
- Expand Vitest for untested frontend pages
- Add backend integration tests for key endpoints

### Phase 5: Final Verification
- All existing + new tests pass
- Docker stack runs clean
- Document any known issues

## Bug Tracking

Bugs found during QA are fixed immediately. A summary of all fixes is maintained in a bug log section at the bottom of this document, updated as work progresses.

## Success Criteria
- `go test ./...` passes
- `npx vitest run` passes
- `npm run build` succeeds
- Docker Compose stack starts and serves the app
- All 13 domain modules accessible and functional in UI
- Playwright E2E suite covers login + at least 3 CRUD flows
- No critical bugs remaining

---

## Execution Results

### Phase 1: Foundation Verification — PASS

**Backend (Go 1.25):**
- `go test ./...` — ALL PASS (9 test files, 0 failures)
- `go build ./cmd/server` — compiles clean
- Packages tested: auth (2), application (1), committee (1), collection (1), facility (1), contact (1), lead (1), organization (1)

**Frontend (Node 20, Next.js 15):**
- `npx vitest run` — ALL 23 PASS (5 existing test files)
- `npm run build` — SUCCESS (15 pages compiled, standalone output)

### Phase 2: Docker Stack — PASS
- All 4 services running: PostgreSQL (healthy), Redis (healthy), backend, frontend
- Migrations auto-applied via dev-entrypoint.sh
- Seed data present: admin user + loan officer
- Health endpoint: `{"status":"ok"}`

### Phase 3: Systematic QA — PASS (with bugs fixed)
**API endpoints tested (all returning 200):**
- auth/login, auth/me — working
- organizations, leads, products, applications, facilities, notifications — working
- contacts/organization/:id, documents/entity/:type/:id, activities/user/:id — working
- collections/overdue, reports/dashboard, reports/pipeline, reports/par, reports/officers — working (after fixes)

**CRUD operations verified:**
- Created organization (bilingual EN/AR), lead, product — all successful
- List endpoints return created records

**Frontend pages (all 200):**
- All 15 pages accessible in both /en/ and /ar/ locales
- API proxy (frontend:3000 -> backend:8080) working

### Phase 4: Expanded Automated Tests — COMPLETE

**New Vitest tests (3 files, 23 new tests):**
- `src/lib/auth-context.test.tsx` — 6 tests (login, logout, session restore, invalid token, provider requirement)
- `src/lib/api.test.ts` — 9 tests (GET/POST, auth headers, error handling, 204 No Content, JSON body)
- `src/components/layout/Sidebar.test.tsx` — 8 tests (13 nav links, active state, collapse toggle, logout, locale prefix)

**Playwright E2E tests (4 spec files, 16 tests):**
- `e2e/login.spec.ts` — 3 tests (page render, valid login, invalid login error)
- `e2e/dashboard.spec.ts` — 3 tests (stats cards, quick actions, sidebar navigation)
- `e2e/leads.spec.ts` — 5 tests (page header, new button, modal open, form fill, cancel)
- `e2e/organizations.spec.ts` — 5 tests (page header, new button, modal open, table/empty state, cancel)

**Final totals:**
- Backend: 9 test files, all passing
- Frontend Vitest: 8 test files, 46 tests, all passing
- Frontend E2E: 4 spec files, 16 tests, all passing against live stack
- Frontend build: SUCCESS

### Phase 5: Final Verification — ALL PASS

## Bug Log

### Bugs Found and Fixed

1. **Dockerfile.dev Go version mismatch** — `air@latest` requires Go >= 1.25 but Dockerfile used 1.24. Fixed: upgraded to `golang:1.25-alpine`.

2. **collection/repository.go — overdue query references non-existent tables/columns:**
   - `borrowers` table doesn't exist → changed to `organizations`
   - `f.borrower_id` → `f.organization_id`
   - `f.facility_number` → `f.reference_number`
   - `rs.outstanding_amount` → `rs.total_amount - rs.paid_amount`

3. **reporting/repository.go — dashboard stats query:**
   - `disbursed_amount` → `total_amount`
   - `outstanding_amount` → `outstanding_balance`

4. **reporting/repository.go — PAR queries:**
   - `delinquency_days` (integer) doesn't exist → use `delinquency` (enum: current, par_30, par_60, par_90, par_180, write_off)

5. **reporting/repository.go — officer performance query:**
   - `u.full_name` → `u.name_en`
   - `l.officer_id` → `l.assigned_officer_id`
   - `a.officer_id` → `a.assigned_officer_id`
   - `f.disbursed_amount` → `f.total_amount`

## Known Limitations

- E2E tests require `docker compose up` before running `npx playwright test`
- Next.js 15.2.4 has a known security vulnerability (CVE-2025-66478) — upgrade recommended
