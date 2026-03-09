package activity

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/CamelLabSA/M360/backend/internal/auth"
)

type mockActivityRepo struct {
	createFn       func(ctx context.Context, activity *Activity) error
	listByEntityFn func(ctx context.Context, entityType string, entityID uuid.UUID, limit, offset int) ([]Activity, int, error)
	listByUserFn   func(ctx context.Context, userID uuid.UUID, limit, offset int) ([]Activity, int, error)
}

func (m *mockActivityRepo) Create(ctx context.Context, activity *Activity) error {
	if m.createFn != nil {
		return m.createFn(ctx, activity)
	}
	return nil
}

func (m *mockActivityRepo) ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID, limit, offset int) ([]Activity, int, error) {
	if m.listByEntityFn != nil {
		return m.listByEntityFn(ctx, entityType, entityID, limit, offset)
	}
	return nil, 0, nil
}

func (m *mockActivityRepo) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]Activity, int, error) {
	if m.listByUserFn != nil {
		return m.listByUserFn(ctx, userID, limit, offset)
	}
	return nil, 0, nil
}

func newActivityHandler(repo repository) *Handler {
	svc := &Service{repo: repo}
	return NewHandler(svc)
}

func setActivityClaims(c echo.Context) uuid.UUID {
	userID := uuid.New()
	c.Set(string(auth.UserContextKey), &auth.Claims{
		UserID: userID,
		Email:  "test@m360.sa",
		Role:   auth.RoleAdmin,
	})
	return userID
}

// --- Create ---

func TestActivityHandler_Create_Success(t *testing.T) {
	entityID := uuid.New()
	repo := &mockActivityRepo{
		createFn: func(ctx context.Context, a *Activity) error {
			return nil
		},
	}
	h := newActivityHandler(repo)

	body := `{"entity_type":"lead","entity_id":"` + entityID.String() + `","action":"status_change","description":"Changed status to submitted"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/activities", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setActivityClaims(c)

	if err := h.Create(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusCreated {
		t.Errorf("expected 201, got %d", rec.Code)
	}

	var result Activity
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.EntityType != "lead" {
		t.Errorf("expected entity_type 'lead', got %q", result.EntityType)
	}
	if result.Action != "status_change" {
		t.Errorf("expected action 'status_change', got %q", result.Action)
	}
	if result.EntityID != entityID {
		t.Errorf("expected entity_id %v, got %v", entityID, result.EntityID)
	}
}

func TestActivityHandler_Create_Unauthorized(t *testing.T) {
	repo := &mockActivityRepo{}
	h := newActivityHandler(repo)

	body := `{"entity_type":"lead","entity_id":"` + uuid.New().String() + `","action":"created"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/activities", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	// No claims set

	if err := h.Create(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestActivityHandler_Create_InvalidBody(t *testing.T) {
	repo := &mockActivityRepo{}
	h := newActivityHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/activities", strings.NewReader(`{invalid json`))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setActivityClaims(c)

	if err := h.Create(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestActivityHandler_Create_ServiceError(t *testing.T) {
	repo := &mockActivityRepo{
		createFn: func(ctx context.Context, a *Activity) error {
			return errors.New("db error")
		},
	}
	h := newActivityHandler(repo)

	entityID := uuid.New()
	body := `{"entity_type":"lead","entity_id":"` + entityID.String() + `","action":"created"}`
	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/activities", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setActivityClaims(c)

	if err := h.Create(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
}

// --- ListByEntity ---

func TestActivityHandler_ListByEntity_Success(t *testing.T) {
	entityID := uuid.New()
	userID := uuid.New()
	activities := []Activity{
		{ID: uuid.New(), EntityType: "application", EntityID: entityID, UserID: userID, Action: "created", CreatedAt: time.Now()},
		{ID: uuid.New(), EntityType: "application", EntityID: entityID, UserID: userID, Action: "updated", CreatedAt: time.Now()},
	}
	repo := &mockActivityRepo{
		listByEntityFn: func(ctx context.Context, et string, eid uuid.UUID, limit, offset int) ([]Activity, int, error) {
			return activities, 2, nil
		},
	}
	h := newActivityHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/activities/entity/application/"+entityID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("type", "id")
	c.SetParamValues("application", entityID.String())

	if err := h.ListByEntity(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	data, ok := result["data"].([]interface{})
	if !ok {
		t.Fatalf("'data' is not an array, got %T", result["data"])
	}
	if len(data) != 2 {
		t.Errorf("expected 2 activities, got %d", len(data))
	}
	total, ok := result["total"].(float64)
	if !ok {
		t.Fatal("'total' not found or not a number")
	}
	if int(total) != 2 {
		t.Errorf("expected total 2, got %v", total)
	}
}

func TestActivityHandler_ListByEntity_InvalidEntityID(t *testing.T) {
	repo := &mockActivityRepo{}
	h := newActivityHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/activities/entity/application/invalid-uuid", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("type", "id")
	c.SetParamValues("application", "invalid-uuid")

	if err := h.ListByEntity(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestActivityHandler_ListByEntity_ServiceError(t *testing.T) {
	entityID := uuid.New()
	repo := &mockActivityRepo{
		listByEntityFn: func(ctx context.Context, et string, eid uuid.UUID, limit, offset int) ([]Activity, int, error) {
			return nil, 0, errors.New("db error")
		},
	}
	h := newActivityHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/activities/entity/application/"+entityID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("type", "id")
	c.SetParamValues("application", entityID.String())

	if err := h.ListByEntity(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
}

// --- ListByUser ---

func TestActivityHandler_ListByUser_Success(t *testing.T) {
	userID := uuid.New()
	activities := []Activity{
		{ID: uuid.New(), EntityType: "lead", EntityID: uuid.New(), UserID: userID, Action: "created", CreatedAt: time.Now()},
	}
	repo := &mockActivityRepo{
		listByUserFn: func(ctx context.Context, uid uuid.UUID, limit, offset int) ([]Activity, int, error) {
			return activities, 1, nil
		},
	}
	h := newActivityHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/activities/user/"+userID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(userID.String())

	if err := h.ListByUser(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	data, ok := result["data"].([]interface{})
	if !ok {
		t.Fatalf("'data' is not an array, got %T", result["data"])
	}
	if len(data) != 1 {
		t.Errorf("expected 1 activity, got %d", len(data))
	}
}

func TestActivityHandler_ListByUser_InvalidUserID(t *testing.T) {
	repo := &mockActivityRepo{}
	h := newActivityHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/activities/user/invalid-uuid", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("invalid-uuid")

	if err := h.ListByUser(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestActivityHandler_ListByUser_ServiceError(t *testing.T) {
	userID := uuid.New()
	repo := &mockActivityRepo{
		listByUserFn: func(ctx context.Context, uid uuid.UUID, limit, offset int) ([]Activity, int, error) {
			return nil, 0, errors.New("db error")
		},
	}
	h := newActivityHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/activities/user/"+userID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(userID.String())

	if err := h.ListByUser(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
}

func TestActivityHandler_ListByEntity_WithPagination(t *testing.T) {
	var capturedLimit, capturedOffset int
	entityID := uuid.New()
	repo := &mockActivityRepo{
		listByEntityFn: func(ctx context.Context, et string, eid uuid.UUID, limit, offset int) ([]Activity, int, error) {
			capturedLimit = limit
			capturedOffset = offset
			return []Activity{}, 0, nil
		},
	}
	h := newActivityHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/activities/entity/lead/"+entityID.String()+"?limit=10&offset=5", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("type", "id")
	c.SetParamValues("lead", entityID.String())

	if err := h.ListByEntity(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if capturedLimit != 10 {
		t.Errorf("expected limit 10, got %d", capturedLimit)
	}
	if capturedOffset != 5 {
		t.Errorf("expected offset 5, got %d", capturedOffset)
	}
}
