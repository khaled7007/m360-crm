package document

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type mockDocumentRepo struct {
	createFn      func(ctx context.Context, doc *Document) error
	getByIDFn     func(ctx context.Context, id uuid.UUID) (*Document, error)
	listByEntityFn func(ctx context.Context, entityType string, entityID uuid.UUID) ([]*Document, error)
	deleteFn      func(ctx context.Context, id uuid.UUID) error
}

func (m *mockDocumentRepo) Create(ctx context.Context, doc *Document) error {
	if m.createFn != nil {
		return m.createFn(ctx, doc)
	}
	return nil
}

func (m *mockDocumentRepo) GetByID(ctx context.Context, id uuid.UUID) (*Document, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	return nil, nil
}

func (m *mockDocumentRepo) ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*Document, error) {
	if m.listByEntityFn != nil {
		return m.listByEntityFn(ctx, entityType, entityID)
	}
	return nil, nil
}

func (m *mockDocumentRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	return nil
}

func newDocumentHandler(repo repository) *Handler {
	svc := &Service{repo: repo}
	return NewHandler(svc)
}

// --- ListByEntity ---

func TestDocumentHandler_ListByEntity_Success(t *testing.T) {
	entityID := uuid.New()
	userID := uuid.New()
	documents := []*Document{
		{ID: uuid.New(), EntityType: "application", EntityID: entityID, Name: "cr.pdf", FilePath: "/uploads/cr.pdf", FileSize: 1024, MimeType: "application/pdf", UploadedBy: userID, CreatedAt: time.Now()},
		{ID: uuid.New(), EntityType: "application", EntityID: entityID, Name: "id.jpg", FilePath: "/uploads/id.jpg", FileSize: 2048, MimeType: "image/jpeg", UploadedBy: userID, CreatedAt: time.Now()},
	}
	repo := &mockDocumentRepo{
		listByEntityFn: func(ctx context.Context, et string, eid uuid.UUID) ([]*Document, error) {
			return documents, nil
		},
	}
	h := newDocumentHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/documents/entity/application/"+entityID.String(), nil)
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

	var result []*Document
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 documents, got %d", len(result))
	}
}

func TestDocumentHandler_ListByEntity_InvalidEntityID(t *testing.T) {
	repo := &mockDocumentRepo{}
	h := newDocumentHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/documents/entity/application/invalid-uuid", nil)
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

func TestDocumentHandler_ListByEntity_ServiceError(t *testing.T) {
	entityID := uuid.New()
	repo := &mockDocumentRepo{
		listByEntityFn: func(ctx context.Context, et string, eid uuid.UUID) ([]*Document, error) {
			return nil, errors.New("db error")
		},
	}
	h := newDocumentHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/documents/entity/application/"+entityID.String(), nil)
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

func TestDocumentHandler_ListByEntity_EmptyReturnsArray(t *testing.T) {
	entityID := uuid.New()
	repo := &mockDocumentRepo{
		listByEntityFn: func(ctx context.Context, et string, eid uuid.UUID) ([]*Document, error) {
			return nil, nil
		},
	}
	h := newDocumentHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/documents/entity/application/"+entityID.String(), nil)
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

	var result []interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if len(result) != 0 {
		t.Errorf("expected empty array, got %d items", len(result))
	}
}

// --- GetByID ---

func TestDocumentHandler_GetByID_Success(t *testing.T) {
	docID := uuid.New()
	entityID := uuid.New()
	repo := &mockDocumentRepo{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*Document, error) {
			return &Document{
				ID:         id,
				EntityType: "application",
				EntityID:   entityID,
				Name:       "contract.pdf",
				FilePath:   "/uploads/contract.pdf",
				FileSize:   4096,
				MimeType:   "application/pdf",
				UploadedBy: uuid.New(),
				CreatedAt:  time.Now(),
			}, nil
		},
	}
	h := newDocumentHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/documents/"+docID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(docID.String())

	if err := h.GetByID(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result Document
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.ID != docID {
		t.Errorf("expected id %v, got %v", docID, result.ID)
	}
	if result.Name != "contract.pdf" {
		t.Errorf("expected name 'contract.pdf', got %q", result.Name)
	}
}

func TestDocumentHandler_GetByID_InvalidID(t *testing.T) {
	repo := &mockDocumentRepo{}
	h := newDocumentHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/documents/invalid-uuid", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("invalid-uuid")

	if err := h.GetByID(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestDocumentHandler_GetByID_NotFound(t *testing.T) {
	repo := &mockDocumentRepo{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*Document, error) {
			return nil, errors.New("not found")
		},
	}
	h := newDocumentHandler(repo)

	e := echo.New()
	docID := uuid.New()
	req := httptest.NewRequest(http.MethodGet, "/documents/"+docID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(docID.String())

	if err := h.GetByID(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}
}

// --- Upload validation ---

func TestDocumentHandler_Upload_Unauthorized(t *testing.T) {
	repo := &mockDocumentRepo{}
	h := newDocumentHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPost, "/documents", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	// No user_id set in context

	if err := h.Upload(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

// --- Delete ---

func TestDocumentHandler_Delete_InvalidID(t *testing.T) {
	repo := &mockDocumentRepo{}
	h := newDocumentHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodDelete, "/documents/invalid-uuid", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("invalid-uuid")

	if err := h.Delete(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestDocumentHandler_Delete_NotFound(t *testing.T) {
	repo := &mockDocumentRepo{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*Document, error) {
			return nil, errors.New("not found")
		},
	}
	h := newDocumentHandler(repo)

	e := echo.New()
	docID := uuid.New()
	req := httptest.NewRequest(http.MethodDelete, "/documents/"+docID.String(), nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(docID.String())

	if err := h.Delete(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}
}
