# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

M360 is an SME Lending CRM (Shariah-compliant Murabaha) for Saudi Arabia. Bilingual Arabic/English with RTL support.

## Build & Run Commands

### Backend (Go)
```bash
cd backend
go build ./cmd/server          # Build
go test ./...                  # All tests
go test ./internal/auth/...    # Single package test
go run ./cmd/server            # Run server (port 8080)
```

### Frontend (Next.js)
```bash
cd frontend
npm install                    # Install deps
npm run dev                    # Dev server with Turbopack
npm run build                  # Production build
npm run lint                   # ESLint
npm start                      # Start production server
```

### Full Stack (Docker Compose)
```bash
docker compose -f docker-compose.prod.yml up -d    # Production
docker compose -f docker-compose.yml up -d          # Development
```

## Architecture

### Backend — Modular Monolith (Go 1.25, Echo v4, pgx v5)

Entry point: `backend/cmd/server/main.go` — wires all domain packages.

Each domain under `backend/internal/` follows: **model → repository → service → handler**

Domain packages: `auth`, `organization`, `contact`, `lead`, `product`, `application`, `committee`, `facility`, `collection`, `activity`, `notification`, `integration`, `reporting`

Platform packages under `backend/internal/platform/`: `config`, `database`, `server`

API routes mount at `/api/v1` group.

Auth pattern:
```go
claims := auth.GetClaims(c)           // *auth.Claims from JWT
claims.UserID / claims.Email / claims.Role
auth.RequireRole(auth.RoleAdmin)      // middleware
```

7 roles: `admin`, `manager`, `loan_officer`, `credit_analyst`, `compliance_officer`, `collections_officer`, `data_entry`

Application workflow: Draft → Submitted → PreApproved → DocsCollected → CreditAssessment → CommitteeReview → Approved/Rejected → Disbursed

### Frontend — Next.js 15, React 19, TypeScript, Tailwind CSS v4, next-intl

App Router with locale prefix: `src/app/[locale]/`

- `(app)/` route group — authenticated pages with AppShell (sidebar + content)
- `login/` — outside route group (no sidebar)
- `components/ui/` — DataTable, Modal, PageHeader, StatusBadge
- `components/layout/` — Sidebar, AppShell
- `lib/api.ts` — typed fetch wrapper, base URL from `NEXT_PUBLIC_API_URL` or `/api/v1`
- `lib/use-api.ts` — hooks: useApiList, useApiGet, useApiMutation
- `lib/auth-context.tsx` — AuthProvider, useAuth hook, JWT in localStorage

### API Proxying

Frontend proxies API calls server-side via Next.js rewrites (`next.config.ts`):
`/api/:path*` → `http://backend:8080/api/:path*`

Nginx only proxies to frontend (port 3000). API traffic stays within Docker network.

### Production Infrastructure

- Alibaba Cloud Saudi (SCCC), ECS at `8.213.42.52`
- CI/CD: GitHub Actions → SCCC ACR → SSH deploy (`.github/workflows/deploy.yml`)
- Stack: PostgreSQL 16, Redis 7, Go backend, Next.js standalone, Nginx reverse proxy
- Frontend uses `output: "standalone"` for Docker deployment
- Migrations: `backend/migrations/` (2 files: init_schema, full_schema)
- Seed credentials: `admin@m360.sa` / `admin123!`

## Key Files

- `backend/cmd/server/main.go` — server entry, all domain wiring
- `backend/internal/auth/` — JWT auth, bcrypt passwords, role middleware
- `frontend/src/app/[locale]/(app)/` — all authenticated CRM pages
- `frontend/next.config.ts` — standalone output, API rewrites, next-intl plugin
- `docker-compose.prod.yml` — production compose with ACR images
- `nginx/nginx.conf` — frontend-only reverse proxy
- `.github/workflows/deploy.yml` — CI/CD pipeline
