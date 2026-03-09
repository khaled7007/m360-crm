package lead

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/CamelLabSA/M360/backend/internal/auth"
)

type testValidator struct {
	validator *validator.Validate
}

func (tv *testValidator) Validate(i interface{}) error {
	return tv.validator.Struct(i)
}

func newTestEcho() *echo.Echo {
	e := echo.New()
	e.Validator = &testValidator{validator: validator.New()}
	return e
}

// mockLeadRepo satisfies the repository interface defined in service.go.
type mockLeadRepo struct {
	createFn       func(ctx context.Context, l *Lead) error
	getByIDFn      func(ctx context.Context, id uuid.UUID) (*Lead, error)
	listFn         func(ctx context.Context, params ListParams) ([]Lead, int, error)
	updateFn       func(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Lead, error)
	deleteFn       func(ctx context.Context, id uuid.UUID) error
}

func (m *mockLeadRepo) Create(ctx context.Context, l *Lead) error {
	if m.createFn != nil {
		return m.createFn(ctx, l)
	}
	return nil
}

func (m *mockLeadRepo) GetByID(ctx context.Context, id uuid.UUID) (*Lead, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	return nil, nil
}

func (m *mockLeadRepo) List(ctx context.Context, params ListParams) ([]Lead, int, error) {
	if m.listFn != nil {
		return m.listFn(ctx, params)
	}
	return nil, 0, nil
}

func (m *mockLeadRepo) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Lead, error) {
	if m.updateFn != nil {
		return m.updateFn(ctx, id, req)
	}
	return nil, nil
}

func (m *mockLeadRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	return nil
}

func newLeadHandler(repo repository) *Handler {
	svc := &Service{repo: repo}
	return NewHandler(svc)
}

func setLeadClaims(c echo.Context) {
	c.Set(string(auth.UserContextKey), &auth.Claims{
		UserID: uuid.New(),
		Email:  "test@m360.sa",
		Role:   auth.RoleAdmin,
	})
}

func TestLeadHandler_Create_Success(t *testing.T) {
	fixedID := uuid.New()
	repo := &mockLeadRepo{
		createFn: func(ctx context.Context, l *Lead) error {
			l.ID = fixedID
			l.CreatedAt = time.Now()
			l.UpdatedAt = time.Now()
			return nil
		},
	}
	h := newLeadHandler(repo)

	body := `{"contact_name":"Ahmed Al-Rashid","source":"referral"}`
	e := newTestEcho()
	req := httptest.NewRequest(http.MethodPost, "/leads", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setLeadClaims(c)

	if err := h.Create(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", rec.Code)
	}

	var result Lead
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.ContactName != "Ahmed Al-Rashid" {
		t.Errorf("expected contact_name 'Ahmed Al-Rashid', got %q", result.ContactName)
	}
	if result.Source != "referral" {
		t.Errorf("expected source 'referral', got %q", result.Source)
	}
	if result.Status != StatusNew {
		t.Errorf("expected status %q, got %q", StatusNew, result.Status)
	}
}

func TestLeadHandler_Create_BadRequest(t *testing.T) {
	h := newLeadHandler(&mockLeadRepo{})

	e := newTestEcho()
	// Send malformed JSON that will fail binding (non-JSON content with JSON content-type
	// will cause echo's binder to error for numeric fields, but for a struct with only
	// strings it may bind to zero values — use a truly malformed payload).
	req := httptest.NewRequest(http.MethodPost, "/leads", strings.NewReader(`{bad json`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setLeadClaims(c)

	err := h.Create(c)
	if err == nil {
		t.Fatal("expected error for bad JSON, got nil")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected *echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", he.Code)
	}
}

func TestLeadHandler_GetByID_Success(t *testing.T) {
	targetID := uuid.New()
	repo := &mockLeadRepo{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*Lead, error) {
			return &Lead{
				ID:          id,
				ContactName: "Fatima Al-Zahrani",
				Source:      "website",
				Status:      StatusNew,
			}, nil
		},
	}
	h := newLeadHandler(repo)

	e := newTestEcho()
	req := httptest.NewRequest(http.MethodGet, "/leads/"+targetID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(targetID.String())
	setLeadClaims(c)

	if err := h.GetByID(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result Lead
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.ID != targetID {
		t.Errorf("expected id %v, got %v", targetID, result.ID)
	}
}

func TestLeadHandler_GetByID_InvalidID(t *testing.T) {
	h := newLeadHandler(&mockLeadRepo{})

	e := newTestEcho()
	req := httptest.NewRequest(http.MethodGet, "/leads/invalid", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("invalid")
	setLeadClaims(c)

	err := h.GetByID(c)
	if err == nil {
		t.Fatal("expected error for invalid id, got nil")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected *echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", he.Code)
	}
}

func TestLeadHandler_List_Success(t *testing.T) {
	leads := []Lead{
		{ID: uuid.New(), ContactName: "Khalid", Source: "referral", Status: StatusNew},
		{ID: uuid.New(), ContactName: "Nora", Source: "website", Status: StatusContacted},
	}
	repo := &mockLeadRepo{
		listFn: func(ctx context.Context, params ListParams) ([]Lead, int, error) {
			return leads, len(leads), nil
		},
	}
	h := newLeadHandler(repo)

	e := newTestEcho()
	req := httptest.NewRequest(http.MethodGet, "/leads", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setLeadClaims(c)

	if err := h.List(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if _, ok := result["data"]; !ok {
		t.Error("response missing 'data' key")
	}
	if _, ok := result["total"]; !ok {
		t.Error("response missing 'total' key")
	}
	total, ok := result["total"].(float64)
	if !ok {
		t.Fatalf("total is not a number, got %T", result["total"])
	}
	if int(total) != len(leads) {
		t.Errorf("expected total %d, got %d", len(leads), int(total))
	}
}
