# M360 Phase 1: Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stand up the Go + Next.js project with authentication, RBAC, and the first domain slice (Organizations, Contacts, Leads) — a working vertical slice from database to UI.

**Architecture:** Go modular monolith (Echo v4) with PostgreSQL, Redis, and a Next.js 16 frontend. Each domain is a self-contained package under `internal/` with handler, service, repository, and model layers. JWT auth with 7-role RBAC. Arabic/English i18n with RTL.

**Tech Stack:** Go 1.24, Echo v4, pgx v5, golang-migrate, Next.js 16, React 19, TypeScript, Tailwind CSS 4, next-intl, PostgreSQL 16, Redis 7, Docker Compose.

**Design Doc:** `docs/plans/2026-03-03-m360-crm-design.md`

---

## Task 1: Go Backend Scaffolding

**Files:**
- Create: `backend/go.mod`
- Create: `backend/cmd/server/main.go`
- Create: `backend/internal/platform/config/config.go`
- Create: `backend/internal/platform/database/database.go`
- Create: `backend/internal/platform/server/server.go`
- Create: `backend/Dockerfile`
- Create: `backend/.env.example`

**Step 1: Initialize Go module**

```bash
cd backend
go mod init github.com/CamelLabSA/M360/backend
```

**Step 2: Create config loader**

Create `backend/internal/platform/config/config.go`:

```go
package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Port        int
	DatabaseURL string
	RedisURL    string
	JWTSecret   string
	Environment string
}

func Load() (*Config, error) {
	port, _ := strconv.Atoi(getEnv("PORT", "8080"))
	dbURL := getEnv("DATABASE_URL", "")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:   getEnv("JWT_SECRET", ""),
		Environment: getEnv("ENVIRONMENT", "development"),
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
```

**Step 3: Create database connection**

Create `backend/internal/platform/database/database.go`:

```go
package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Connect(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	return pool, nil
}
```

**Step 4: Create server setup**

Create `backend/internal/platform/server/server.go`:

```go
package server

import (
	"fmt"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/CamelLabSA/M360/backend/internal/platform/config"
)

func New(cfg *config.Config) *echo.Echo {
	e := echo.New()
	e.HideBanner = true

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())
	e.Use(middleware.RequestID())

	e.GET("/health", func(c echo.Context) error {
		return c.JSON(200, map[string]string{"status": "ok"})
	})

	return e
}

func Start(e *echo.Echo, cfg *config.Config) error {
	return e.Start(fmt.Sprintf(":%d", cfg.Port))
}
```

**Step 5: Create main entry point**

Create `backend/cmd/server/main.go`:

```go
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/CamelLabSA/M360/backend/internal/platform/config"
	"github.com/CamelLabSA/M360/backend/internal/platform/database"
	"github.com/CamelLabSA/M360/backend/internal/platform/server"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	_ = pool // will be injected into services

	e := server.New(cfg)

	go func() {
		if err := server.Start(e, cfg); err != nil {
			log.Printf("server stopped: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down...")
	if err := e.Close(); err != nil {
		log.Fatalf("server shutdown failed: %v", err)
	}
}
```

**Step 6: Create .env.example and Dockerfile**

Create `backend/.env.example`:

```
PORT=8080
DATABASE_URL=postgres://m360:m360@localhost:5432/m360?sslmode=disable
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-in-production
ENVIRONMENT=development
```

Create `backend/Dockerfile`:

```dockerfile
FROM golang:1.24-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /m360 ./cmd/server

FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata
COPY --from=builder /m360 /m360
EXPOSE 8080
CMD ["/m360"]
```

**Step 7: Install dependencies**

```bash
cd backend
go get github.com/labstack/echo/v4@latest
go get github.com/jackc/pgx/v5@latest
go mod tidy
```

**Step 8: Verify it compiles**

```bash
cd backend && go build ./...
```
Expected: no errors

**Step 9: Commit**

```bash
git add backend/
git commit -m "feat: scaffold Go backend with Echo, pgx, config, and health endpoint"
```

---

## Task 2: Docker Compose + Database

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/migrations/000001_init_schema.up.sql`
- Create: `backend/migrations/000001_init_schema.down.sql`
- Create: `Makefile`

**Step 1: Create Docker Compose**

Create `docker-compose.yml` at project root:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: m360
      POSTGRES_PASSWORD: m360
      POSTGRES_DB: m360
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

**Step 2: Create initial migration — extensions and enums**

Create `backend/migrations/000001_init_schema.up.sql`:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM (
    'admin',
    'manager',
    'loan_officer',
    'credit_analyst',
    'compliance_officer',
    'collections_officer',
    'data_entry'
);

CREATE TYPE lead_status AS ENUM (
    'new',
    'contacted',
    'qualified',
    'unqualified',
    'converted'
);

CREATE TYPE application_status AS ENUM (
    'draft',
    'submitted',
    'pre_approved',
    'documents_collected',
    'credit_assessment',
    'committee_review',
    'approved',
    'rejected',
    'disbursed'
);

CREATE TYPE facility_status AS ENUM (
    'active',
    'closed',
    'defaulted',
    'restructured'
);

CREATE TYPE delinquency_status AS ENUM (
    'current',
    'par_30',
    'par_60',
    'par_90',
    'par_180',
    'write_off'
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'loan_officer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations (SME borrowers)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL DEFAULT '',
    cr_number VARCHAR(20) UNIQUE,
    cr_verified BOOLEAN NOT NULL DEFAULT false,
    tax_id VARCHAR(20),
    industry VARCHAR(100),
    legal_structure VARCHAR(100),
    founding_date DATE,
    address_en TEXT,
    address_ar TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    assigned_officer_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts (people linked to organizations)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL DEFAULT '',
    national_id VARCHAR(20),
    role VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    nafath_verified BOOLEAN NOT NULL DEFAULT false,
    simah_score INTEGER,
    is_guarantor BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    company_name VARCHAR(255),
    source VARCHAR(50) NOT NULL DEFAULT 'walk_in',
    status lead_status NOT NULL DEFAULT 'new',
    estimated_amount DECIMAL(15,2),
    notes TEXT,
    assigned_officer_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_cr_number ON organizations(cr_number);
CREATE INDEX idx_organizations_assigned_officer ON organizations(assigned_officer_id);
CREATE INDEX idx_contacts_organization ON contacts(organization_id);
CREATE INDEX idx_contacts_national_id ON contacts(national_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_officer ON leads(assigned_officer_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

Create `backend/migrations/000001_init_schema.down.sql`:

```sql
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS contacts;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS delinquency_status;
DROP TYPE IF EXISTS facility_status;
DROP TYPE IF EXISTS application_status;
DROP TYPE IF EXISTS lead_status;
DROP TYPE IF EXISTS user_role;
```

**Step 3: Create Makefile**

Create `Makefile` at project root:

```makefile
.PHONY: up down migrate-up migrate-down run test

up:
	docker compose up -d

down:
	docker compose down

migrate-up:
	cd backend && go run -tags migrate cmd/migrate/main.go up

migrate-down:
	cd backend && go run -tags migrate cmd/migrate/main.go down

run:
	cd backend && go run ./cmd/server

test:
	cd backend && go test ./... -v

seed:
	cd backend && go run ./cmd/seed
```

**Step 4: Create migration runner**

Create `backend/cmd/migrate/main.go`:

```go
package main

import (
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://m360:m360@localhost:5432/m360?sslmode=disable"
	}

	m, err := migrate.New("file://migrations", dbURL)
	if err != nil {
		log.Fatalf("failed to create migrate instance: %v", err)
	}
	defer m.Close()

	cmd := "up"
	if len(os.Args) > 1 {
		cmd = os.Args[1]
	}

	switch cmd {
	case "up":
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("migration up failed: %v", err)
		}
		fmt.Println("migrations applied successfully")
	case "down":
		if err := m.Down(); err != nil && err != migrate.ErrNoChange {
			log.Fatalf("migration down failed: %v", err)
		}
		fmt.Println("migrations rolled back successfully")
	default:
		log.Fatalf("unknown command: %s (use 'up' or 'down')", cmd)
	}
}
```

**Step 5: Install migration dependency**

```bash
cd backend && go get github.com/golang-migrate/migrate/v4@latest
go get github.com/golang-migrate/migrate/v4/database/postgres
go get github.com/golang-migrate/migrate/v4/source/file
go mod tidy
```

**Step 6: Start services and run migrations**

```bash
docker compose up -d
sleep 3
cd backend && DATABASE_URL="postgres://m360:m360@localhost:5432/m360?sslmode=disable" go run ./cmd/migrate up
```
Expected: "migrations applied successfully"

**Step 7: Verify tables exist**

```bash
docker compose exec postgres psql -U m360 -c "\dt"
```
Expected: lists users, organizations, contacts, leads tables

**Step 8: Commit**

```bash
git add docker-compose.yml Makefile backend/migrations/ backend/cmd/migrate/
git commit -m "feat: add Docker Compose, PostgreSQL migrations, and Makefile"
```

---

## Task 3: Authentication — JWT + RBAC

**Files:**
- Create: `backend/internal/auth/model.go`
- Create: `backend/internal/auth/repository.go`
- Create: `backend/internal/auth/service.go`
- Create: `backend/internal/auth/handler.go`
- Create: `backend/internal/auth/middleware.go`
- Create: `backend/internal/auth/service_test.go`

**Step 1: Write auth models**

Create `backend/internal/auth/model.go`:

```go
package auth

import (
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleAdmin              Role = "admin"
	RoleManager            Role = "manager"
	RoleLoanOfficer        Role = "loan_officer"
	RoleCreditAnalyst      Role = "credit_analyst"
	RoleComplianceOfficer  Role = "compliance_officer"
	RoleCollectionsOfficer Role = "collections_officer"
	RoleDataEntry          Role = "data_entry"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	NameEN       string    `json:"name_en"`
	NameAR       string    `json:"name_ar"`
	Role         Role      `json:"role"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateUserRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	NameEN   string `json:"name_en" validate:"required"`
	NameAR   string `json:"name_ar"`
	Role     Role   `json:"role" validate:"required"`
}

type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Role   Role      `json:"role"`
}
```

**Step 2: Write auth repository**

Create `backend/internal/auth/repository.go`:

```go
package auth

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, u *User) error {
	query := `
		INSERT INTO users (id, email, password_hash, name_en, name_ar, role, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := r.db.Exec(ctx, query, u.ID, u.Email, u.PasswordHash, u.NameEN, u.NameAR, u.Role, u.IsActive)
	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}
	return nil
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, email, password_hash, name_en, name_ar, role, is_active, created_at, updated_at
		FROM users WHERE email = $1`

	var u User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.NameEN, &u.NameAR, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &u, nil
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	query := `
		SELECT id, email, password_hash, name_en, name_ar, role, is_active, created_at, updated_at
		FROM users WHERE id = $1`

	var u User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.NameEN, &u.NameAR, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &u, nil
}
```

**Step 3: Write auth service with tests**

Create `backend/internal/auth/service_test.go`:

```go
package auth

import (
	"testing"

	"github.com/google/uuid"
)

func TestHashAndVerifyPassword(t *testing.T) {
	svc := &Service{jwtSecret: "test-secret"}

	hash, err := svc.hashPassword("mypassword123")
	if err != nil {
		t.Fatalf("hashPassword failed: %v", err)
	}

	if !svc.verifyPassword(hash, "mypassword123") {
		t.Fatal("verifyPassword should return true for correct password")
	}

	if svc.verifyPassword(hash, "wrongpassword") {
		t.Fatal("verifyPassword should return false for wrong password")
	}
}

func TestGenerateAndParseToken(t *testing.T) {
	svc := &Service{jwtSecret: "test-secret-key-at-least-32-chars!!"}

	userID := uuid.New()
	token, err := svc.generateToken(userID, "test@example.com", RoleLoanOfficer)
	if err != nil {
		t.Fatalf("generateToken failed: %v", err)
	}

	claims, err := svc.ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken failed: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected userID %s, got %s", userID, claims.UserID)
	}
	if claims.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", claims.Email)
	}
	if claims.Role != RoleLoanOfficer {
		t.Errorf("expected role loan_officer, got %s", claims.Role)
	}
}

func TestParseTokenInvalid(t *testing.T) {
	svc := &Service{jwtSecret: "test-secret-key-at-least-32-chars!!"}

	_, err := svc.ParseToken("invalid-token")
	if err == nil {
		t.Fatal("ParseToken should fail for invalid token")
	}
}
```

**Step 4: Run tests to verify they fail**

```bash
cd backend && go test ./internal/auth/ -v
```
Expected: FAIL (Service not implemented yet)

**Step 5: Write auth service**

Create `backend/internal/auth/service.go`:

```go
package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo      *Repository
	jwtSecret string
}

func NewService(repo *Repository, jwtSecret string) *Service {
	return &Service{repo: repo, jwtSecret: jwtSecret}
}

func (s *Service) Register(ctx context.Context, req CreateUserRequest) (*User, error) {
	hash, err := s.hashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := &User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: hash,
		NameEN:       req.NameEN,
		NameAR:       req.NameAR,
		Role:         req.Role,
		IsActive:     true,
	}

	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	if !user.IsActive {
		return nil, fmt.Errorf("account is disabled")
	}

	if !s.verifyPassword(user.PasswordHash, req.Password) {
		return nil, fmt.Errorf("invalid credentials")
	}

	token, err := s.generateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	return &LoginResponse{Token: token, User: *user}, nil
}

func (s *Service) ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	userID, err := uuid.Parse(mapClaims["user_id"].(string))
	if err != nil {
		return nil, fmt.Errorf("parse user_id: %w", err)
	}

	return &Claims{
		UserID: userID,
		Email:  mapClaims["email"].(string),
		Role:   Role(mapClaims["role"].(string)),
	}, nil
}

func (s *Service) hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func (s *Service) verifyPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func (s *Service) generateToken(userID uuid.UUID, email string, role Role) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID.String(),
		"email":   email,
		"role":    string(role),
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
```

**Step 6: Install dependencies and run tests**

```bash
cd backend
go get github.com/golang-jwt/jwt/v5@latest
go get github.com/google/uuid@latest
go get golang.org/x/crypto@latest
go mod tidy
go test ./internal/auth/ -v
```
Expected: PASS (all 3 tests)

**Step 7: Write auth middleware**

Create `backend/internal/auth/middleware.go`:

```go
package auth

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

type contextKey string

const UserContextKey contextKey = "user"

func JWTMiddleware(svc *Service) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			header := c.Request().Header.Get("Authorization")
			if header == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing authorization header")
			}

			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization format")
			}

			claims, err := svc.ParseToken(parts[1])
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}

			c.Set(string(UserContextKey), claims)
			return next(c)
		}
	}
}

func RequireRole(roles ...Role) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			claims, ok := c.Get(string(UserContextKey)).(*Claims)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "not authenticated")
			}

			for _, r := range roles {
				if claims.Role == r {
					return next(c)
				}
			}

			return echo.NewHTTPError(http.StatusForbidden, "insufficient permissions")
		}
	}
}

func GetClaims(c echo.Context) *Claims {
	claims, _ := c.Get(string(UserContextKey)).(*Claims)
	return claims
}
```

**Step 8: Write auth handler**

Create `backend/internal/auth/handler.go`:

```go
package auth

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(e *echo.Group) {
	e.POST("/auth/login", h.Login)
	e.POST("/auth/register", h.CreateUser)
	e.GET("/auth/me", h.Me, JWTMiddleware(h.svc))
}

func (h *Handler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	resp, err := h.svc.Login(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	return c.JSON(http.StatusOK, resp)
}

func (h *Handler) CreateUser(c echo.Context) error {
	var req CreateUserRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	user, err := h.svc.Register(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, user)
}

func (h *Handler) Me(c echo.Context) error {
	claims := GetClaims(c)
	if claims == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "not authenticated")
	}

	user, err := h.svc.repo.GetByID(c.Request().Context(), claims.UserID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "user not found")
	}

	return c.JSON(http.StatusOK, user)
}
```

**Step 9: Wire auth into main.go**

Update `backend/cmd/server/main.go` — replace the `_ = pool` line and add auth setup:

```go
// After pool creation, before server.New():
authRepo := auth.NewRepository(pool)
authSvc := auth.NewService(authRepo, cfg.JWTSecret)
authHandler := auth.NewHandler(authSvc)

e := server.New(cfg)

api := e.Group("/api/v1")
authHandler.Register(api)
```

Add import: `"github.com/CamelLabSA/M360/backend/internal/auth"`

**Step 10: Run tests and verify compilation**

```bash
cd backend && go test ./... -v && go build ./...
```
Expected: PASS, no build errors

**Step 11: Commit**

```bash
git add backend/internal/auth/ backend/cmd/server/main.go
git commit -m "feat: add JWT authentication with RBAC middleware and user management"
```

---

## Task 4: Organization CRUD

**Files:**
- Create: `backend/internal/organization/model.go`
- Create: `backend/internal/organization/repository.go`
- Create: `backend/internal/organization/service.go`
- Create: `backend/internal/organization/handler.go`
- Create: `backend/internal/organization/service_test.go`

**Step 1: Write organization model**

Create `backend/internal/organization/model.go`:

```go
package organization

import (
	"time"

	"github.com/google/uuid"
)

type Organization struct {
	ID               uuid.UUID  `json:"id"`
	NameEN           string     `json:"name_en"`
	NameAR           string     `json:"name_ar"`
	CRNumber         *string    `json:"cr_number"`
	CRVerified       bool       `json:"cr_verified"`
	TaxID            *string    `json:"tax_id"`
	Industry         *string    `json:"industry"`
	LegalStructure   *string    `json:"legal_structure"`
	FoundingDate     *time.Time `json:"founding_date"`
	AddressEN        *string    `json:"address_en"`
	AddressAR        *string    `json:"address_ar"`
	City             *string    `json:"city"`
	Phone            *string    `json:"phone"`
	Email            *string    `json:"email"`
	Website          *string    `json:"website"`
	AssignedOfficerID *uuid.UUID `json:"assigned_officer_id"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type CreateRequest struct {
	NameEN         string  `json:"name_en" validate:"required"`
	NameAR         string  `json:"name_ar"`
	CRNumber       *string `json:"cr_number"`
	TaxID          *string `json:"tax_id"`
	Industry       *string `json:"industry"`
	LegalStructure *string `json:"legal_structure"`
	AddressEN      *string `json:"address_en"`
	AddressAR      *string `json:"address_ar"`
	City           *string `json:"city"`
	Phone          *string `json:"phone"`
	Email          *string `json:"email"`
	Website        *string `json:"website"`
}

type UpdateRequest struct {
	NameEN         *string `json:"name_en"`
	NameAR         *string `json:"name_ar"`
	CRNumber       *string `json:"cr_number"`
	TaxID          *string `json:"tax_id"`
	Industry       *string `json:"industry"`
	LegalStructure *string `json:"legal_structure"`
	AddressEN      *string `json:"address_en"`
	AddressAR      *string `json:"address_ar"`
	City           *string `json:"city"`
	Phone          *string `json:"phone"`
	Email          *string `json:"email"`
	Website        *string `json:"website"`
}

type ListParams struct {
	Search          string
	AssignedOfficer *uuid.UUID
	Limit           int
	Offset          int
}
```

**Step 2: Write organization repository**

Create `backend/internal/organization/repository.go`:

```go
package organization

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, o *Organization) error {
	query := `
		INSERT INTO organizations (id, name_en, name_ar, cr_number, tax_id, industry, legal_structure,
			address_en, address_ar, city, phone, email, website, assigned_officer_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		o.ID, o.NameEN, o.NameAR, o.CRNumber, o.TaxID, o.Industry, o.LegalStructure,
		o.AddressEN, o.AddressAR, o.City, o.Phone, o.Email, o.Website, o.AssignedOfficerID,
	).Scan(&o.CreatedAt, &o.UpdatedAt)
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Organization, error) {
	query := `
		SELECT id, name_en, name_ar, cr_number, cr_verified, tax_id, industry, legal_structure,
			founding_date, address_en, address_ar, city, phone, email, website, assigned_officer_id,
			created_at, updated_at
		FROM organizations WHERE id = $1`

	var o Organization
	err := r.db.QueryRow(ctx, query, id).Scan(
		&o.ID, &o.NameEN, &o.NameAR, &o.CRNumber, &o.CRVerified, &o.TaxID, &o.Industry,
		&o.LegalStructure, &o.FoundingDate, &o.AddressEN, &o.AddressAR, &o.City, &o.Phone,
		&o.Email, &o.Website, &o.AssignedOfficerID, &o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get organization: %w", err)
	}
	return &o, nil
}

func (r *Repository) List(ctx context.Context, params ListParams) ([]Organization, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if params.Search != "" {
		where = append(where, fmt.Sprintf("(name_en ILIKE $%d OR name_ar ILIKE $%d OR cr_number ILIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	if params.AssignedOfficer != nil {
		where = append(where, fmt.Sprintf("assigned_officer_id = $%d", argIdx))
		args = append(args, *params.AssignedOfficer)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM organizations WHERE %s", whereClause)
	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count organizations: %w", err)
	}

	if params.Limit == 0 {
		params.Limit = 20
	}

	query := fmt.Sprintf(`
		SELECT id, name_en, name_ar, cr_number, cr_verified, tax_id, industry, legal_structure,
			founding_date, address_en, address_ar, city, phone, email, website, assigned_officer_id,
			created_at, updated_at
		FROM organizations WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)

	args = append(args, params.Limit, params.Offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list organizations: %w", err)
	}
	defer rows.Close()

	var orgs []Organization
	for rows.Next() {
		var o Organization
		if err := rows.Scan(
			&o.ID, &o.NameEN, &o.NameAR, &o.CRNumber, &o.CRVerified, &o.TaxID, &o.Industry,
			&o.LegalStructure, &o.FoundingDate, &o.AddressEN, &o.AddressAR, &o.City, &o.Phone,
			&o.Email, &o.Website, &o.AssignedOfficerID, &o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan organization: %w", err)
		}
		orgs = append(orgs, o)
	}

	return orgs, total, nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Organization, error) {
	sets := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.NameEN != nil {
		sets = append(sets, fmt.Sprintf("name_en = $%d", argIdx))
		args = append(args, *req.NameEN)
		argIdx++
	}
	if req.NameAR != nil {
		sets = append(sets, fmt.Sprintf("name_ar = $%d", argIdx))
		args = append(args, *req.NameAR)
		argIdx++
	}
	if req.CRNumber != nil {
		sets = append(sets, fmt.Sprintf("cr_number = $%d", argIdx))
		args = append(args, *req.CRNumber)
		argIdx++
	}
	if req.TaxID != nil {
		sets = append(sets, fmt.Sprintf("tax_id = $%d", argIdx))
		args = append(args, *req.TaxID)
		argIdx++
	}
	if req.Industry != nil {
		sets = append(sets, fmt.Sprintf("industry = $%d", argIdx))
		args = append(args, *req.Industry)
		argIdx++
	}
	if req.LegalStructure != nil {
		sets = append(sets, fmt.Sprintf("legal_structure = $%d", argIdx))
		args = append(args, *req.LegalStructure)
		argIdx++
	}
	if req.AddressEN != nil {
		sets = append(sets, fmt.Sprintf("address_en = $%d", argIdx))
		args = append(args, *req.AddressEN)
		argIdx++
	}
	if req.AddressAR != nil {
		sets = append(sets, fmt.Sprintf("address_ar = $%d", argIdx))
		args = append(args, *req.AddressAR)
		argIdx++
	}
	if req.City != nil {
		sets = append(sets, fmt.Sprintf("city = $%d", argIdx))
		args = append(args, *req.City)
		argIdx++
	}
	if req.Phone != nil {
		sets = append(sets, fmt.Sprintf("phone = $%d", argIdx))
		args = append(args, *req.Phone)
		argIdx++
	}
	if req.Email != nil {
		sets = append(sets, fmt.Sprintf("email = $%d", argIdx))
		args = append(args, *req.Email)
		argIdx++
	}
	if req.Website != nil {
		sets = append(sets, fmt.Sprintf("website = $%d", argIdx))
		args = append(args, *req.Website)
		argIdx++
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, "updated_at = NOW()")
	setClause := strings.Join(sets, ", ")

	query := fmt.Sprintf("UPDATE organizations SET %s WHERE id = $%d", setClause, argIdx)
	args = append(args, id)

	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("update organization: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM organizations WHERE id = $1", id)
	return err
}
```

**Step 3: Write organization service**

Create `backend/internal/organization/service.go`:

```go
package organization

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req CreateRequest, officerID uuid.UUID) (*Organization, error) {
	org := &Organization{
		ID:                uuid.New(),
		NameEN:            req.NameEN,
		NameAR:            req.NameAR,
		CRNumber:          req.CRNumber,
		TaxID:             req.TaxID,
		Industry:          req.Industry,
		LegalStructure:    req.LegalStructure,
		AddressEN:         req.AddressEN,
		AddressAR:         req.AddressAR,
		City:              req.City,
		Phone:             req.Phone,
		Email:             req.Email,
		Website:           req.Website,
		AssignedOfficerID: &officerID,
	}

	if err := s.repo.Create(ctx, org); err != nil {
		return nil, fmt.Errorf("create organization: %w", err)
	}

	return org, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Organization, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, params ListParams) ([]Organization, int, error) {
	return s.repo.List(ctx, params)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Organization, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
```

**Step 4: Write organization handler**

Create `backend/internal/organization/handler.go`:

```go
package organization

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/CamelLabSA/M360/backend/internal/auth"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(g *echo.Group, authMiddleware echo.MiddlewareFunc) {
	orgs := g.Group("/organizations", authMiddleware)
	orgs.POST("", h.Create)
	orgs.GET("", h.List)
	orgs.GET("/:id", h.GetByID)
	orgs.PUT("/:id", h.Update)
	orgs.DELETE("/:id", h.Delete, auth.RequireRole(auth.RoleAdmin, auth.RoleManager))
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	claims := auth.GetClaims(c)
	org, err := h.svc.Create(c.Request().Context(), req, claims.UserID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, org)
}

func (h *Handler) GetByID(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	org, err := h.svc.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "organization not found")
	}

	return c.JSON(http.StatusOK, org)
}

func (h *Handler) List(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))
	if limit == 0 {
		limit = 20
	}

	params := ListParams{
		Search: c.QueryParam("search"),
		Limit:  limit,
		Offset: offset,
	}

	orgs, total, err := h.svc.List(c.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":  orgs,
		"total": total,
	})
}

func (h *Handler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	org, err := h.svc.Update(c.Request().Context(), id, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, org)
}

func (h *Handler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	if err := h.svc.Delete(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}
```

**Step 5: Wire organization into main.go**

Add to `backend/cmd/server/main.go` after auth handler setup:

```go
orgRepo := organization.NewRepository(pool)
orgSvc := organization.NewService(orgRepo)
orgHandler := organization.NewHandler(orgSvc)
orgHandler.Register(api, auth.JWTMiddleware(authSvc))
```

Add import: `"github.com/CamelLabSA/M360/backend/internal/organization"`

**Step 6: Verify compilation**

```bash
cd backend && go build ./...
```
Expected: no errors

**Step 7: Commit**

```bash
git add backend/internal/organization/ backend/cmd/server/main.go
git commit -m "feat: add Organization CRUD with search, pagination, and role-based delete"
```

---

## Task 5: Contact CRUD

**Files:**
- Create: `backend/internal/contact/model.go`
- Create: `backend/internal/contact/repository.go`
- Create: `backend/internal/contact/service.go`
- Create: `backend/internal/contact/handler.go`

**Step 1: Write contact model**

Create `backend/internal/contact/model.go`:

```go
package contact

import (
	"time"

	"github.com/google/uuid"
)

type Contact struct {
	ID             uuid.UUID `json:"id"`
	OrganizationID uuid.UUID `json:"organization_id"`
	NameEN         string    `json:"name_en"`
	NameAR         string    `json:"name_ar"`
	NationalID     *string   `json:"national_id"`
	Role           *string   `json:"role"`
	Phone          *string   `json:"phone"`
	Email          *string   `json:"email"`
	NafathVerified bool      `json:"nafath_verified"`
	SIMAHScore     *int      `json:"simah_score"`
	IsGuarantor    bool      `json:"is_guarantor"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type CreateRequest struct {
	OrganizationID uuid.UUID `json:"organization_id" validate:"required"`
	NameEN         string    `json:"name_en" validate:"required"`
	NameAR         string    `json:"name_ar"`
	NationalID     *string   `json:"national_id"`
	Role           *string   `json:"role"`
	Phone          *string   `json:"phone"`
	Email          *string   `json:"email"`
	IsGuarantor    bool      `json:"is_guarantor"`
}

type UpdateRequest struct {
	NameEN      *string `json:"name_en"`
	NameAR      *string `json:"name_ar"`
	NationalID  *string `json:"national_id"`
	Role        *string `json:"role"`
	Phone       *string `json:"phone"`
	Email       *string `json:"email"`
	IsGuarantor *bool   `json:"is_guarantor"`
}
```

**Step 2: Write contact repository**

Create `backend/internal/contact/repository.go`:

```go
package contact

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, c *Contact) error {
	query := `
		INSERT INTO contacts (id, organization_id, name_en, name_ar, national_id, role, phone, email, is_guarantor)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		c.ID, c.OrganizationID, c.NameEN, c.NameAR, c.NationalID, c.Role, c.Phone, c.Email, c.IsGuarantor,
	).Scan(&c.CreatedAt, &c.UpdatedAt)
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Contact, error) {
	query := `
		SELECT id, organization_id, name_en, name_ar, national_id, role, phone, email,
			nafath_verified, simah_score, is_guarantor, created_at, updated_at
		FROM contacts WHERE id = $1`

	var c Contact
	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.OrganizationID, &c.NameEN, &c.NameAR, &c.NationalID, &c.Role, &c.Phone, &c.Email,
		&c.NafathVerified, &c.SIMAHScore, &c.IsGuarantor, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get contact: %w", err)
	}
	return &c, nil
}

func (r *Repository) ListByOrganization(ctx context.Context, orgID uuid.UUID) ([]Contact, error) {
	query := `
		SELECT id, organization_id, name_en, name_ar, national_id, role, phone, email,
			nafath_verified, simah_score, is_guarantor, created_at, updated_at
		FROM contacts WHERE organization_id = $1
		ORDER BY created_at ASC`

	rows, err := r.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, fmt.Errorf("list contacts: %w", err)
	}
	defer rows.Close()

	var contacts []Contact
	for rows.Next() {
		var c Contact
		if err := rows.Scan(
			&c.ID, &c.OrganizationID, &c.NameEN, &c.NameAR, &c.NationalID, &c.Role, &c.Phone, &c.Email,
			&c.NafathVerified, &c.SIMAHScore, &c.IsGuarantor, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan contact: %w", err)
		}
		contacts = append(contacts, c)
	}
	return contacts, nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Contact, error) {
	sets := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.NameEN != nil {
		sets = append(sets, fmt.Sprintf("name_en = $%d", argIdx))
		args = append(args, *req.NameEN)
		argIdx++
	}
	if req.NameAR != nil {
		sets = append(sets, fmt.Sprintf("name_ar = $%d", argIdx))
		args = append(args, *req.NameAR)
		argIdx++
	}
	if req.NationalID != nil {
		sets = append(sets, fmt.Sprintf("national_id = $%d", argIdx))
		args = append(args, *req.NationalID)
		argIdx++
	}
	if req.Role != nil {
		sets = append(sets, fmt.Sprintf("role = $%d", argIdx))
		args = append(args, *req.Role)
		argIdx++
	}
	if req.Phone != nil {
		sets = append(sets, fmt.Sprintf("phone = $%d", argIdx))
		args = append(args, *req.Phone)
		argIdx++
	}
	if req.Email != nil {
		sets = append(sets, fmt.Sprintf("email = $%d", argIdx))
		args = append(args, *req.Email)
		argIdx++
	}
	if req.IsGuarantor != nil {
		sets = append(sets, fmt.Sprintf("is_guarantor = $%d", argIdx))
		args = append(args, *req.IsGuarantor)
		argIdx++
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE contacts SET %s WHERE id = $%d", strings.Join(sets, ", "), argIdx)
	args = append(args, id)

	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("update contact: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM contacts WHERE id = $1", id)
	return err
}
```

**Step 3: Write contact service and handler**

Create `backend/internal/contact/service.go`:

```go
package contact

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req CreateRequest) (*Contact, error) {
	c := &Contact{
		ID:             uuid.New(),
		OrganizationID: req.OrganizationID,
		NameEN:         req.NameEN,
		NameAR:         req.NameAR,
		NationalID:     req.NationalID,
		Role:           req.Role,
		Phone:          req.Phone,
		Email:          req.Email,
		IsGuarantor:    req.IsGuarantor,
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return nil, fmt.Errorf("create contact: %w", err)
	}
	return c, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Contact, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) ListByOrganization(ctx context.Context, orgID uuid.UUID) ([]Contact, error) {
	return s.repo.ListByOrganization(ctx, orgID)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Contact, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
```

Create `backend/internal/contact/handler.go`:

```go
package contact

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/CamelLabSA/M360/backend/internal/auth"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(g *echo.Group, authMiddleware echo.MiddlewareFunc) {
	contacts := g.Group("/contacts", authMiddleware)
	contacts.POST("", h.Create)
	contacts.GET("/:id", h.GetByID)
	contacts.GET("/organization/:org_id", h.ListByOrganization)
	contacts.PUT("/:id", h.Update)
	contacts.DELETE("/:id", h.Delete, auth.RequireRole(auth.RoleAdmin, auth.RoleManager))
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	contact, err := h.svc.Create(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, contact)
}

func (h *Handler) GetByID(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	contact, err := h.svc.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "contact not found")
	}

	return c.JSON(http.StatusOK, contact)
}

func (h *Handler) ListByOrganization(c echo.Context) error {
	orgID, err := uuid.Parse(c.Param("org_id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid organization id")
	}

	contacts, err := h.svc.ListByOrganization(c.Request().Context(), orgID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": contacts,
	})
}

func (h *Handler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	contact, err := h.svc.Update(c.Request().Context(), id, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, contact)
}

func (h *Handler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	if err := h.svc.Delete(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}
```

**Step 4: Wire contact into main.go**

Add after organization handler setup:

```go
contactRepo := contact.NewRepository(pool)
contactSvc := contact.NewService(contactRepo)
contactHandler := contact.NewHandler(contactSvc)
contactHandler.Register(api, auth.JWTMiddleware(authSvc))
```

Add import: `"github.com/CamelLabSA/M360/backend/internal/contact"`

**Step 5: Verify compilation**

```bash
cd backend && go build ./...
```
Expected: no errors

**Step 6: Commit**

```bash
git add backend/internal/contact/ backend/cmd/server/main.go
git commit -m "feat: add Contact CRUD linked to organizations with guarantor support"
```

---

## Task 6: Lead Management CRUD

**Files:**
- Create: `backend/internal/lead/model.go`
- Create: `backend/internal/lead/repository.go`
- Create: `backend/internal/lead/service.go`
- Create: `backend/internal/lead/handler.go`

**Step 1: Write lead model**

Create `backend/internal/lead/model.go`:

```go
package lead

import (
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusNew         Status = "new"
	StatusContacted   Status = "contacted"
	StatusQualified   Status = "qualified"
	StatusUnqualified Status = "unqualified"
	StatusConverted   Status = "converted"
)

type Lead struct {
	ID               uuid.UUID  `json:"id"`
	OrganizationID   *uuid.UUID `json:"organization_id"`
	ContactName      string     `json:"contact_name"`
	ContactPhone     *string    `json:"contact_phone"`
	ContactEmail     *string    `json:"contact_email"`
	CompanyName      *string    `json:"company_name"`
	Source           string     `json:"source"`
	Status           Status     `json:"status"`
	EstimatedAmount  *float64   `json:"estimated_amount"`
	Notes            *string    `json:"notes"`
	AssignedOfficerID *uuid.UUID `json:"assigned_officer_id"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type CreateRequest struct {
	ContactName     string   `json:"contact_name" validate:"required"`
	ContactPhone    *string  `json:"contact_phone"`
	ContactEmail    *string  `json:"contact_email"`
	CompanyName     *string  `json:"company_name"`
	Source          string   `json:"source" validate:"required"`
	EstimatedAmount *float64 `json:"estimated_amount"`
	Notes           *string  `json:"notes"`
}

type UpdateRequest struct {
	ContactName     *string    `json:"contact_name"`
	ContactPhone    *string    `json:"contact_phone"`
	ContactEmail    *string    `json:"contact_email"`
	CompanyName     *string    `json:"company_name"`
	Source          *string    `json:"source"`
	Status          *Status    `json:"status"`
	EstimatedAmount *float64   `json:"estimated_amount"`
	Notes           *string    `json:"notes"`
	OrganizationID  *uuid.UUID `json:"organization_id"`
}

type ListParams struct {
	Status          *Status
	AssignedOfficer *uuid.UUID
	Search          string
	Limit           int
	Offset          int
}
```

**Step 2: Write lead repository**

Create `backend/internal/lead/repository.go`:

```go
package lead

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, l *Lead) error {
	query := `
		INSERT INTO leads (id, organization_id, contact_name, contact_phone, contact_email,
			company_name, source, status, estimated_amount, notes, assigned_officer_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		l.ID, l.OrganizationID, l.ContactName, l.ContactPhone, l.ContactEmail,
		l.CompanyName, l.Source, l.Status, l.EstimatedAmount, l.Notes, l.AssignedOfficerID,
	).Scan(&l.CreatedAt, &l.UpdatedAt)
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Lead, error) {
	query := `
		SELECT id, organization_id, contact_name, contact_phone, contact_email, company_name,
			source, status, estimated_amount, notes, assigned_officer_id, created_at, updated_at
		FROM leads WHERE id = $1`

	var l Lead
	err := r.db.QueryRow(ctx, query, id).Scan(
		&l.ID, &l.OrganizationID, &l.ContactName, &l.ContactPhone, &l.ContactEmail, &l.CompanyName,
		&l.Source, &l.Status, &l.EstimatedAmount, &l.Notes, &l.AssignedOfficerID, &l.CreatedAt, &l.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get lead: %w", err)
	}
	return &l, nil
}

func (r *Repository) List(ctx context.Context, params ListParams) ([]Lead, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if params.Status != nil {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *params.Status)
		argIdx++
	}

	if params.AssignedOfficer != nil {
		where = append(where, fmt.Sprintf("assigned_officer_id = $%d", argIdx))
		args = append(args, *params.AssignedOfficer)
		argIdx++
	}

	if params.Search != "" {
		where = append(where, fmt.Sprintf("(contact_name ILIKE $%d OR company_name ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM leads WHERE %s", whereClause)
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count leads: %w", err)
	}

	if params.Limit == 0 {
		params.Limit = 20
	}

	query := fmt.Sprintf(`
		SELECT id, organization_id, contact_name, contact_phone, contact_email, company_name,
			source, status, estimated_amount, notes, assigned_officer_id, created_at, updated_at
		FROM leads WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)
	args = append(args, params.Limit, params.Offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list leads: %w", err)
	}
	defer rows.Close()

	var leads []Lead
	for rows.Next() {
		var l Lead
		if err := rows.Scan(
			&l.ID, &l.OrganizationID, &l.ContactName, &l.ContactPhone, &l.ContactEmail, &l.CompanyName,
			&l.Source, &l.Status, &l.EstimatedAmount, &l.Notes, &l.AssignedOfficerID, &l.CreatedAt, &l.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan lead: %w", err)
		}
		leads = append(leads, l)
	}

	return leads, total, nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Lead, error) {
	sets := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.ContactName != nil {
		sets = append(sets, fmt.Sprintf("contact_name = $%d", argIdx))
		args = append(args, *req.ContactName)
		argIdx++
	}
	if req.ContactPhone != nil {
		sets = append(sets, fmt.Sprintf("contact_phone = $%d", argIdx))
		args = append(args, *req.ContactPhone)
		argIdx++
	}
	if req.ContactEmail != nil {
		sets = append(sets, fmt.Sprintf("contact_email = $%d", argIdx))
		args = append(args, *req.ContactEmail)
		argIdx++
	}
	if req.CompanyName != nil {
		sets = append(sets, fmt.Sprintf("company_name = $%d", argIdx))
		args = append(args, *req.CompanyName)
		argIdx++
	}
	if req.Source != nil {
		sets = append(sets, fmt.Sprintf("source = $%d", argIdx))
		args = append(args, *req.Source)
		argIdx++
	}
	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}
	if req.EstimatedAmount != nil {
		sets = append(sets, fmt.Sprintf("estimated_amount = $%d", argIdx))
		args = append(args, *req.EstimatedAmount)
		argIdx++
	}
	if req.Notes != nil {
		sets = append(sets, fmt.Sprintf("notes = $%d", argIdx))
		args = append(args, *req.Notes)
		argIdx++
	}
	if req.OrganizationID != nil {
		sets = append(sets, fmt.Sprintf("organization_id = $%d", argIdx))
		args = append(args, *req.OrganizationID)
		argIdx++
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE leads SET %s WHERE id = $%d", strings.Join(sets, ", "), argIdx)
	args = append(args, id)

	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("update lead: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM leads WHERE id = $1", id)
	return err
}
```

**Step 3: Write lead service and handler**

Create `backend/internal/lead/service.go`:

```go
package lead

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req CreateRequest, officerID uuid.UUID) (*Lead, error) {
	l := &Lead{
		ID:                uuid.New(),
		ContactName:       req.ContactName,
		ContactPhone:      req.ContactPhone,
		ContactEmail:      req.ContactEmail,
		CompanyName:       req.CompanyName,
		Source:            req.Source,
		Status:            StatusNew,
		EstimatedAmount:   req.EstimatedAmount,
		Notes:             req.Notes,
		AssignedOfficerID: &officerID,
	}

	if err := s.repo.Create(ctx, l); err != nil {
		return nil, fmt.Errorf("create lead: %w", err)
	}
	return l, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Lead, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, params ListParams) ([]Lead, int, error) {
	return s.repo.List(ctx, params)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Lead, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
```

Create `backend/internal/lead/handler.go`:

```go
package lead

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/CamelLabSA/M360/backend/internal/auth"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(g *echo.Group, authMiddleware echo.MiddlewareFunc) {
	leads := g.Group("/leads", authMiddleware)
	leads.POST("", h.Create, auth.RequireRole(auth.RoleAdmin, auth.RoleManager, auth.RoleLoanOfficer, auth.RoleDataEntry))
	leads.GET("", h.List)
	leads.GET("/:id", h.GetByID)
	leads.PUT("/:id", h.Update)
	leads.DELETE("/:id", h.Delete, auth.RequireRole(auth.RoleAdmin, auth.RoleManager))
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	claims := auth.GetClaims(c)
	lead, err := h.svc.Create(c.Request().Context(), req, claims.UserID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, lead)
}

func (h *Handler) GetByID(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	lead, err := h.svc.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "lead not found")
	}

	return c.JSON(http.StatusOK, lead)
}

func (h *Handler) List(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))
	if limit == 0 {
		limit = 20
	}

	params := ListParams{
		Search: c.QueryParam("search"),
		Limit:  limit,
		Offset: offset,
	}

	if s := c.QueryParam("status"); s != "" {
		status := Status(s)
		params.Status = &status
	}

	leads, total, err := h.svc.List(c.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":  leads,
		"total": total,
	})
}

func (h *Handler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	lead, err := h.svc.Update(c.Request().Context(), id, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, lead)
}

func (h *Handler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	if err := h.svc.Delete(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}
```

**Step 4: Wire lead into main.go**

Add after contact handler setup:

```go
leadRepo := lead.NewRepository(pool)
leadSvc := lead.NewService(leadRepo)
leadHandler := lead.NewHandler(leadSvc)
leadHandler.Register(api, auth.JWTMiddleware(authSvc))
```

Add import: `"github.com/CamelLabSA/M360/backend/internal/lead"`

**Step 5: Verify compilation**

```bash
cd backend && go build ./...
```
Expected: no errors

**Step 6: Commit**

```bash
git add backend/internal/lead/ backend/cmd/server/main.go
git commit -m "feat: add Lead CRUD with status tracking, search, and role-based access"
```

---

## Task 7: Seed Data + API Smoke Test

**Files:**
- Create: `backend/cmd/seed/main.go`

**Step 1: Create seed script**

Create `backend/cmd/seed/main.go`:

```go
package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://m360:m360@localhost:5432/m360?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("failed to connect: %v", err)
	}
	defer pool.Close()

	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123!"), bcrypt.DefaultCost)
	adminID := uuid.New()

	_, err = pool.Exec(ctx, `
		INSERT INTO users (id, email, password_hash, name_en, name_ar, role, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (email) DO NOTHING`,
		adminID, "admin@m360.sa", string(hash), "Admin User", "مدير النظام", "admin", true,
	)
	if err != nil {
		log.Fatalf("seed admin: %v", err)
	}

	officerHash, _ := bcrypt.GenerateFromPassword([]byte("officer123!"), bcrypt.DefaultCost)
	officerID := uuid.New()

	_, err = pool.Exec(ctx, `
		INSERT INTO users (id, email, password_hash, name_en, name_ar, role, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (email) DO NOTHING`,
		officerID, "officer@m360.sa", string(officerHash), "Ahmed Al-Rashid", "أحمد الراشد", "loan_officer", true,
	)
	if err != nil {
		log.Fatalf("seed officer: %v", err)
	}

	fmt.Println("seed data created successfully")
	fmt.Printf("admin:   admin@m360.sa / admin123!\n")
	fmt.Printf("officer: officer@m360.sa / officer123!\n")
}
```

**Step 2: Run seed**

```bash
cd backend && go run ./cmd/seed
```
Expected: "seed data created successfully"

**Step 3: Start server and smoke test**

```bash
cd backend && JWT_SECRET="dev-secret-key-at-least-32-characters!!" DATABASE_URL="postgres://m360:m360@localhost:5432/m360?sslmode=disable" go run ./cmd/server &
sleep 2
```

Test health:
```bash
curl -s http://localhost:8080/health | jq .
```
Expected: `{"status": "ok"}`

Test login:
```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@m360.sa","password":"admin123!"}' | jq .
```
Expected: JSON with token and user object

Test authenticated endpoint (use token from login response):
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@m360.sa","password":"admin123!"}' | jq -r '.token')
curl -s http://localhost:8080/api/v1/auth/me -H "Authorization: Bearer $TOKEN" | jq .
```
Expected: admin user object

**Step 4: Stop server and commit**

```bash
kill %1 2>/dev/null
git add backend/cmd/seed/
git commit -m "feat: add seed script with admin and loan officer test users"
```

---

## Task 8: Next.js Frontend Scaffolding

**Files:**
- Create: `frontend/` (via create-next-app)
- Modify: `frontend/package.json`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/i18n/`

**Step 1: Scaffold Next.js project**

```bash
cd /Users/matt/code/M360
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --no-import-alias --turbopack
```

**Step 2: Install dependencies**

```bash
cd frontend
npm install next-intl@latest
npm install @tanstack/react-query@latest
npm install lucide-react@latest
npm install clsx tailwind-merge
```

**Step 3: Create API client**

Create `frontend/src/lib/api.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
```

**Step 4: Create i18n messages**

Create `frontend/src/i18n/messages/en.json`:

```json
{
  "common": {
    "appName": "M360",
    "dashboard": "Dashboard",
    "leads": "Leads",
    "organizations": "Organizations",
    "contacts": "Contacts",
    "applications": "Applications",
    "facilities": "Facilities",
    "collections": "Collections",
    "settings": "Settings",
    "login": "Login",
    "logout": "Logout",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "loading": "Loading...",
    "noData": "No data found"
  },
  "auth": {
    "email": "Email",
    "password": "Password",
    "loginTitle": "Sign in to M360",
    "loginButton": "Sign In",
    "invalidCredentials": "Invalid email or password"
  },
  "leads": {
    "title": "Leads",
    "newLead": "New Lead",
    "contactName": "Contact Name",
    "companyName": "Company Name",
    "source": "Source",
    "status": "Status",
    "estimatedAmount": "Estimated Amount",
    "assignedTo": "Assigned To"
  }
}
```

Create `frontend/src/i18n/messages/ar.json`:

```json
{
  "common": {
    "appName": "M360",
    "dashboard": "لوحة التحكم",
    "leads": "العملاء المحتملون",
    "organizations": "المنظمات",
    "contacts": "جهات الاتصال",
    "applications": "الطلبات",
    "facilities": "التسهيلات",
    "collections": "التحصيل",
    "settings": "الإعدادات",
    "login": "تسجيل الدخول",
    "logout": "تسجيل الخروج",
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "create": "إنشاء",
    "search": "بحث",
    "loading": "جاري التحميل...",
    "noData": "لا توجد بيانات"
  },
  "auth": {
    "email": "البريد الإلكتروني",
    "password": "كلمة المرور",
    "loginTitle": "تسجيل الدخول إلى M360",
    "loginButton": "تسجيل الدخول",
    "invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة"
  },
  "leads": {
    "title": "العملاء المحتملون",
    "newLead": "عميل محتمل جديد",
    "contactName": "اسم جهة الاتصال",
    "companyName": "اسم الشركة",
    "source": "المصدر",
    "status": "الحالة",
    "estimatedAmount": "المبلغ المقدر",
    "assignedTo": "مسؤول عن"
  }
}
```

**Step 5: Create next-intl config**

Create `frontend/src/i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || "en";

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
```

Create `frontend/src/i18n/routing.ts`:

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
});
```

**Step 6: Create .env.local**

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

**Step 7: Verify it builds**

```bash
cd frontend && npm run build
```
Expected: Build succeeds

**Step 8: Commit**

```bash
cd /Users/matt/code/M360
git add frontend/
git commit -m "feat: scaffold Next.js frontend with i18n (AR/EN), API client, and Tailwind"
```

---

## Task 9: Login Page + Auth Context

**Files:**
- Create: `frontend/src/lib/auth-context.tsx`
- Create: `frontend/src/app/[locale]/login/page.tsx`
- Create: `frontend/src/app/[locale]/layout.tsx`
- Modify: `frontend/src/app/layout.tsx`

**Step 1: Create auth context**

Create `frontend/src/lib/auth-context.tsx`:

```tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "./api";

type User = {
  id: string;
  email: string;
  name_en: string;
  name_ar: string;
  role: string;
  is_active: boolean;
};

type AuthState = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("m360_token");
    if (stored) {
      setToken(stored);
      api<User>("/auth/me", { token: stored })
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("m360_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem("m360_token", res.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("m360_token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

**Step 2: Create login page**

Create `frontend/src/app/[locale]/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/en/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-8">Sign in to M360</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: Create locale layout**

Create `frontend/src/app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AuthProvider } from "@/lib/auth-context";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} lang={locale}>
      <NextIntlClientProvider messages={messages}>
        <AuthProvider>{children}</AuthProvider>
      </NextIntlClientProvider>
    </div>
  );
}
```

**Step 4: Create dashboard placeholder**

Create `frontend/src/app/[locale]/dashboard/page.tsx`:

```tsx
"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/en/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!user) return null;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">M360 Dashboard</h1>
        <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">
          Logout
        </button>
      </div>
      <p className="text-gray-600">Welcome, {user.name_en} ({user.role})</p>
    </div>
  );
}
```

**Step 5: Verify it builds**

```bash
cd frontend && npm run build
```
Expected: Build succeeds

**Step 6: Commit**

```bash
cd /Users/matt/code/M360
git add frontend/
git commit -m "feat: add login page, auth context, dashboard placeholder, and locale layout"
```

---

## Task 10: End-to-End Verification

**Step 1: Start all services**

```bash
docker compose up -d
cd backend && DATABASE_URL="postgres://m360:m360@localhost:5432/m360?sslmode=disable" go run ./cmd/migrate up
cd backend && DATABASE_URL="postgres://m360:m360@localhost:5432/m360?sslmode=disable" go run ./cmd/seed
```

**Step 2: Start backend**

```bash
cd backend && JWT_SECRET="dev-secret-key-at-least-32-characters!!" DATABASE_URL="postgres://m360:m360@localhost:5432/m360?sslmode=disable" go run ./cmd/server &
```

**Step 3: Start frontend**

```bash
cd frontend && npm run dev &
```

**Step 4: Test full flow via API**

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"admin@m360.sa","password":"admin123!"}' | jq -r '.token')

# Create organization
ORG_ID=$(curl -s -X POST http://localhost:8080/api/v1/organizations -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"name_en":"Acme Trading Co","name_ar":"شركة أكمي التجارية","cr_number":"1010123456","industry":"Retail","city":"Riyadh"}' | jq -r '.id')

# Create contact
curl -s -X POST http://localhost:8080/api/v1/contacts -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"organization_id\":\"$ORG_ID\",\"name_en\":\"Mohammed Al-Faisal\",\"name_ar\":\"محمد الفيصل\",\"role\":\"CEO\",\"phone\":\"+966501234567\"}" | jq .

# Create lead
curl -s -X POST http://localhost:8080/api/v1/leads -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"contact_name":"Mohammed Al-Faisal","company_name":"Acme Trading Co","source":"referral","estimated_amount":500000}' | jq .

# List leads
curl -s http://localhost:8080/api/v1/leads -H "Authorization: Bearer $TOKEN" | jq .
```
Expected: All return valid JSON with created resources

**Step 5: Stop services and commit any remaining changes**

```bash
kill %1 %2 2>/dev/null
```

---

## Summary

After completing all 10 tasks, you will have:

- **Go backend** with Echo v4, PostgreSQL, JWT auth, and 7-role RBAC
- **3 domain modules:** Organizations, Contacts, Leads — full CRUD with search/pagination
- **Database migrations** with proper schema, enums, and indexes
- **Next.js frontend** with i18n (AR/EN), auth context, login page, and dashboard
- **Docker Compose** for local development
- **Seed data** for testing

**Phase 2 will cover:** Application lifecycle, Murabaha product templates, document management, and Saudi integrations (SIMAH, Bayan, Nafath, Yaqeen, Watheq).
