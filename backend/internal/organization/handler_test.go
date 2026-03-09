package organization

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

// mockOrgRepo satisfies the repository interface defined in service.go.
type mockOrgRepo struct {
	createFn  func(ctx context.Context, o *Organization) error
	getByIDFn func(ctx context.Context, id uuid.UUID) (*Organization, error)
	listFn    func(ctx context.Context, params ListParams) ([]Organization, int, error)
	updateFn  func(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Organization, error)
	deleteFn  func(ctx context.Context, id uuid.UUID) error
}

func (m *mockOrgRepo) Create(ctx context.Context, o *Organization) error {
	if m.createFn != nil {
		return m.createFn(ctx, o)
	}
	return nil
}

func (m *mockOrgRepo) GetByID(ctx context.Context, id uuid.UUID) (*Organization, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	return nil, nil
}

func (m *mockOrgRepo) List(ctx context.Context, params ListParams) ([]Organization, int, error) {
	if m.listFn != nil {
		return m.listFn(ctx, params)
	}
	return nil, 0, nil
}

func (m *mockOrgRepo) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Organization, error) {
	if m.updateFn != nil {
		return m.updateFn(ctx, id, req)
	}
	return nil, nil
}

func (m *mockOrgRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	return nil
}

func newOrgHandler(repo repository) *Handler {
	svc := &Service{repo: repo}
	return NewHandler(svc)
}

func setOrgClaims(c echo.Context) {
	c.Set(string(auth.UserContextKey), &auth.Claims{
		UserID: uuid.New(),
		Email:  "test@m360.sa",
		Role:   auth.RoleAdmin,
	})
}

func TestOrgHandler_Create_Success(t *testing.T) {
	fixedID := uuid.New()
	repo := &mockOrgRepo{
		createFn: func(ctx context.Context, o *Organization) error {
			o.ID = fixedID
			o.CreatedAt = time.Now()
			o.UpdatedAt = time.Now()
			return nil
		},
	}
	h := newOrgHandler(repo)

	body := `{"name_en":"Saudi Trading Co.","name_ar":"شركة التجارة السعودية"}`
	e := newTestEcho()
	req := httptest.NewRequest(http.MethodPost, "/organizations", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setOrgClaims(c)

	if err := h.Create(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", rec.Code)
	}

	var result Organization
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.NameEN != "Saudi Trading Co." {
		t.Errorf("expected name_en 'Saudi Trading Co.', got %q", result.NameEN)
	}
	if result.ID != fixedID {
		t.Errorf("expected id %v, got %v", fixedID, result.ID)
	}
}

func TestOrgHandler_Create_BadRequest(t *testing.T) {
	h := newOrgHandler(&mockOrgRepo{})

	e := newTestEcho()
	req := httptest.NewRequest(http.MethodPost, "/organizations", strings.NewReader(`{bad json`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setOrgClaims(c)

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

func TestOrgHandler_GetByID_Success(t *testing.T) {
	targetID := uuid.New()
	repo := &mockOrgRepo{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*Organization, error) {
			return &Organization{
				ID:     id,
				NameEN: "Riyadh Holdings",
				NameAR: "مجموعة الرياض",
			}, nil
		},
	}
	h := newOrgHandler(repo)

	e := newTestEcho()
	req := httptest.NewRequest(http.MethodGet, "/organizations/"+targetID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(targetID.String())
	setOrgClaims(c)

	if err := h.GetByID(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result Organization
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.ID != targetID {
		t.Errorf("expected id %v, got %v", targetID, result.ID)
	}
	if result.NameEN != "Riyadh Holdings" {
		t.Errorf("expected name_en 'Riyadh Holdings', got %q", result.NameEN)
	}
}

func TestOrgHandler_List_Success(t *testing.T) {
	orgs := []Organization{
		{ID: uuid.New(), NameEN: "Alpha Corp", NameAR: "الفا"},
		{ID: uuid.New(), NameEN: "Beta Ltd", NameAR: "بيتا"},
	}
	repo := &mockOrgRepo{
		listFn: func(ctx context.Context, params ListParams) ([]Organization, int, error) {
			return orgs, len(orgs), nil
		},
	}
	h := newOrgHandler(repo)

	e := newTestEcho()
	req := httptest.NewRequest(http.MethodGet, "/organizations", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setOrgClaims(c)

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
	if int(total) != len(orgs) {
		t.Errorf("expected total %d, got %d", len(orgs), int(total))
	}
}
