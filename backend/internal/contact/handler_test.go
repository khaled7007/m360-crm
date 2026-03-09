package contact

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/CamelLabSA/M360/backend/internal/auth"
)

// mockContactRepo satisfies the repository interface defined in service.go.
type mockContactRepo struct {
	createFn              func(ctx context.Context, c *Contact) error
	getByIDFn             func(ctx context.Context, id uuid.UUID) (*Contact, error)
	listByOrganizationFn  func(ctx context.Context, orgID uuid.UUID) ([]Contact, error)
	updateFn              func(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Contact, error)
	deleteFn              func(ctx context.Context, id uuid.UUID) error
}

func (m *mockContactRepo) Create(ctx context.Context, c *Contact) error {
	if m.createFn != nil {
		return m.createFn(ctx, c)
	}
	return nil
}

func (m *mockContactRepo) GetByID(ctx context.Context, id uuid.UUID) (*Contact, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	return nil, nil
}

func (m *mockContactRepo) ListByOrganization(ctx context.Context, orgID uuid.UUID) ([]Contact, error) {
	if m.listByOrganizationFn != nil {
		return m.listByOrganizationFn(ctx, orgID)
	}
	return nil, nil
}

func (m *mockContactRepo) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Contact, error) {
	if m.updateFn != nil {
		return m.updateFn(ctx, id, req)
	}
	return nil, nil
}

func (m *mockContactRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	return nil
}

func newContactHandler(repo repository) *Handler {
	svc := &Service{repo: repo}
	return NewHandler(svc)
}

func setContactClaims(c echo.Context) {
	c.Set(string(auth.UserContextKey), &auth.Claims{
		UserID: uuid.New(),
		Email:  "test@m360.sa",
		Role:   auth.RoleAdmin,
	})
}

func TestContactHandler_Create_Success(t *testing.T) {
	orgID := uuid.New()
	fixedID := uuid.New()
	repo := &mockContactRepo{
		createFn: func(ctx context.Context, c *Contact) error {
			c.ID = fixedID
			c.CreatedAt = time.Now()
			c.UpdatedAt = time.Now()
			return nil
		},
	}
	h := newContactHandler(repo)

	body := `{"organization_id":"` + orgID.String() + `","name_en":"Omar Al-Farsi","name_ar":"عمر الفارسي"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/contacts", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setContactClaims(c)

	if err := h.Create(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", rec.Code)
	}

	var result Contact
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.NameEN != "Omar Al-Farsi" {
		t.Errorf("expected name_en 'Omar Al-Farsi', got %q", result.NameEN)
	}
	if result.OrganizationID != orgID {
		t.Errorf("expected organization_id %v, got %v", orgID, result.OrganizationID)
	}
	if result.ID != fixedID {
		t.Errorf("expected id %v, got %v", fixedID, result.ID)
	}
}

func TestContactHandler_GetByID_Success(t *testing.T) {
	targetID := uuid.New()
	orgID := uuid.New()
	repo := &mockContactRepo{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*Contact, error) {
			return &Contact{
				ID:             id,
				OrganizationID: orgID,
				NameEN:         "Layla Al-Qasim",
				NameAR:         "ليلى القاسم",
			}, nil
		},
	}
	h := newContactHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/contacts/"+targetID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(targetID.String())
	setContactClaims(c)

	if err := h.GetByID(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result Contact
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.ID != targetID {
		t.Errorf("expected id %v, got %v", targetID, result.ID)
	}
	if result.NameEN != "Layla Al-Qasim" {
		t.Errorf("expected name_en 'Layla Al-Qasim', got %q", result.NameEN)
	}
}

func TestContactHandler_List_Success(t *testing.T) {
	orgID := uuid.New()
	contacts := []Contact{
		{ID: uuid.New(), OrganizationID: orgID, NameEN: "Rami Khalil", NameAR: "رامي خليل"},
		{ID: uuid.New(), OrganizationID: orgID, NameEN: "Sara Nasser", NameAR: "سارة ناصر"},
	}
	repo := &mockContactRepo{
		listByOrganizationFn: func(ctx context.Context, id uuid.UUID) ([]Contact, error) {
			return contacts, nil
		},
	}
	h := newContactHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/contacts/organization/"+orgID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("org_id")
	c.SetParamValues(orgID.String())
	setContactClaims(c)

	if err := h.ListByOrganization(c); err != nil {
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
	data, ok := result["data"].([]interface{})
	if !ok {
		t.Fatalf("'data' is not an array, got %T", result["data"])
	}
	if len(data) != len(contacts) {
		t.Errorf("expected %d contacts, got %d", len(contacts), len(data))
	}
}
