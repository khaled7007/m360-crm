# Docker Compose Full-Stack Dev Environment

## Goal
Single `docker-compose up` starts Postgres, Redis, Go backend (with hot reload), and Next.js frontend.

## Services

| Service | Image/Build | Port | Hot Reload |
|---------|------------|------|------------|
| postgres | postgres:16-alpine | 5432 | N/A |
| redis | redis:7-alpine | 6379 | N/A |
| backend | Dockerfile.dev (Air) | 8080 | Yes (Air) |
| frontend | Dockerfile.dev (next dev) | 3000 | Yes (HMR) |

## Backend startup (dev mode)
1. Wait for Postgres health check
2. Run migrations automatically
3. Seed admin/officer users (idempotent)
4. Start API server via Air

## Frontend
- `NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1`
- Volume-mount `src/` for HMR
- Depends on backend being healthy

## Files to create/modify
- `backend/Dockerfile.dev` — Air-based dev image
- `backend/.air.toml` — Air config
- `frontend/Dockerfile.dev` — Next.js dev image
- `docker-compose.yml` — Add backend + frontend services
- `backend/cmd/server/main.go` — Auto-migrate + seed in dev mode

## Verification
- `docker-compose up` succeeds
- Login at localhost:3000 with admin@m360.sa / admin123!
- Leads page shows empty list (no errors)
- Create a lead via UI, verify it appears
