package notification

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

	"github.com/CamelLabSA/M360/backend/internal/auth"
)

type mockNotificationRepo struct {
	createFn      func(ctx context.Context, req *CreateRequest) (*Notification, error)
	listByUserFn  func(ctx context.Context, userID uuid.UUID, unreadOnly bool, limit, offset int) ([]*Notification, error)
	markAsReadFn  func(ctx context.Context, id uuid.UUID) error
	markAllReadFn func(ctx context.Context, userID uuid.UUID) error
	countUnreadFn func(ctx context.Context, userID uuid.UUID) (int, error)
}

func (m *mockNotificationRepo) Create(ctx context.Context, req *CreateRequest) (*Notification, error) {
	if m.createFn != nil {
		return m.createFn(ctx, req)
	}
	return nil, nil
}

func (m *mockNotificationRepo) ListByUser(ctx context.Context, userID uuid.UUID, unreadOnly bool, limit, offset int) ([]*Notification, error) {
	if m.listByUserFn != nil {
		return m.listByUserFn(ctx, userID, unreadOnly, limit, offset)
	}
	return nil, nil
}

func (m *mockNotificationRepo) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	if m.markAsReadFn != nil {
		return m.markAsReadFn(ctx, id)
	}
	return nil
}

func (m *mockNotificationRepo) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	if m.markAllReadFn != nil {
		return m.markAllReadFn(ctx, userID)
	}
	return nil
}

func (m *mockNotificationRepo) CountUnread(ctx context.Context, userID uuid.UUID) (int, error) {
	if m.countUnreadFn != nil {
		return m.countUnreadFn(ctx, userID)
	}
	return 0, nil
}

func newNotificationHandler(repo repository) *Handler {
	svc := &Service{repo: repo}
	return NewHandler(svc)
}

func setNotificationClaims(c echo.Context) uuid.UUID {
	userID := uuid.New()
	c.Set(string(auth.UserContextKey), &auth.Claims{
		UserID: userID,
		Email:  "test@m360.sa",
		Role:   auth.RoleAdmin,
	})
	return userID
}

// --- ListNotifications ---

func TestNotificationHandler_List_Success(t *testing.T) {
	userID := uuid.New()
	notifications := []*Notification{
		{ID: uuid.New(), UserID: userID, Title: "New lead assigned", Type: "info", IsRead: false, CreatedAt: time.Now()},
		{ID: uuid.New(), UserID: userID, Title: "Application approved", Type: "success", IsRead: true, CreatedAt: time.Now()},
	}
	repo := &mockNotificationRepo{
		listByUserFn: func(ctx context.Context, uid uuid.UUID, unreadOnly bool, limit, offset int) ([]*Notification, error) {
			return notifications, nil
		},
	}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/notifications", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.Set(string(auth.UserContextKey), &auth.Claims{
		UserID: userID,
		Email:  "test@m360.sa",
		Role:   auth.RoleAdmin,
	})

	if err := h.ListNotifications(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result []*Notification
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 notifications, got %d", len(result))
	}
}

func TestNotificationHandler_List_Unauthorized(t *testing.T) {
	repo := &mockNotificationRepo{}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/notifications", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	// No claims set

	if err := h.ListNotifications(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestNotificationHandler_List_ServiceError(t *testing.T) {
	repo := &mockNotificationRepo{
		listByUserFn: func(ctx context.Context, uid uuid.UUID, unreadOnly bool, limit, offset int) ([]*Notification, error) {
			return nil, errors.New("db error")
		},
	}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/notifications", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setNotificationClaims(c)

	if err := h.ListNotifications(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
}

func TestNotificationHandler_List_EmptyReturnsArray(t *testing.T) {
	repo := &mockNotificationRepo{
		listByUserFn: func(ctx context.Context, uid uuid.UUID, unreadOnly bool, limit, offset int) ([]*Notification, error) {
			return nil, nil
		},
	}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/notifications", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setNotificationClaims(c)

	if err := h.ListNotifications(c); err != nil {
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

func TestNotificationHandler_List_UnreadOnlyParam(t *testing.T) {
	var capturedUnreadOnly bool
	repo := &mockNotificationRepo{
		listByUserFn: func(ctx context.Context, uid uuid.UUID, unreadOnly bool, limit, offset int) ([]*Notification, error) {
			capturedUnreadOnly = unreadOnly
			return []*Notification{}, nil
		},
	}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/notifications?unread=true", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setNotificationClaims(c)

	if err := h.ListNotifications(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !capturedUnreadOnly {
		t.Error("expected unreadOnly to be true when unread=true param is set")
	}
}

// --- MarkAsRead ---

func TestNotificationHandler_MarkAsRead_Success(t *testing.T) {
	notifID := uuid.New()
	repo := &mockNotificationRepo{
		markAsReadFn: func(ctx context.Context, id uuid.UUID) error {
			if id != notifID {
				t.Errorf("expected id %v, got %v", notifID, id)
			}
			return nil
		},
	}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/notifications/"+notifID.String()+"/read", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(notifID.String())
	setNotificationClaims(c)

	if err := h.MarkAsRead(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result["success"] != true {
		t.Error("expected success: true in response")
	}
}

func TestNotificationHandler_MarkAsRead_InvalidID(t *testing.T) {
	repo := &mockNotificationRepo{}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/notifications/invalid-uuid/read", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues("invalid-uuid")
	setNotificationClaims(c)

	if err := h.MarkAsRead(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", rec.Code)
	}
}

func TestNotificationHandler_MarkAsRead_Unauthorized(t *testing.T) {
	repo := &mockNotificationRepo{}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/notifications/"+uuid.New().String()+"/read", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(uuid.New().String())

	if err := h.MarkAsRead(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestNotificationHandler_MarkAsRead_ServiceError(t *testing.T) {
	repo := &mockNotificationRepo{
		markAsReadFn: func(ctx context.Context, id uuid.UUID) error {
			return errors.New("db error")
		},
	}
	h := newNotificationHandler(repo)

	e := echo.New()
	notifID := uuid.New()
	req := httptest.NewRequest(http.MethodPut, "/notifications/"+notifID.String()+"/read", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	c.SetParamNames("id")
	c.SetParamValues(notifID.String())
	setNotificationClaims(c)

	if err := h.MarkAsRead(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
}

// --- MarkAllRead ---

func TestNotificationHandler_MarkAllRead_Success(t *testing.T) {
	repo := &mockNotificationRepo{
		markAllReadFn: func(ctx context.Context, userID uuid.UUID) error {
			return nil
		},
	}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/notifications/read-all", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setNotificationClaims(c)

	if err := h.MarkAllRead(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestNotificationHandler_MarkAllRead_Unauthorized(t *testing.T) {
	repo := &mockNotificationRepo{}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/notifications/read-all", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.MarkAllRead(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestNotificationHandler_MarkAllRead_ServiceError(t *testing.T) {
	repo := &mockNotificationRepo{
		markAllReadFn: func(ctx context.Context, userID uuid.UUID) error {
			return errors.New("db error")
		},
	}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodPut, "/notifications/read-all", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setNotificationClaims(c)

	if err := h.MarkAllRead(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
}

// --- CountUnread ---

func TestNotificationHandler_CountUnread_Success(t *testing.T) {
	repo := &mockNotificationRepo{
		countUnreadFn: func(ctx context.Context, userID uuid.UUID) (int, error) {
			return 5, nil
		},
	}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/notifications/count", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setNotificationClaims(c)

	if err := h.CountUnread(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	count, ok := result["unread_count"].(float64)
	if !ok {
		t.Fatal("unread_count not found or not a number")
	}
	if int(count) != 5 {
		t.Errorf("expected unread_count 5, got %v", count)
	}
}

func TestNotificationHandler_CountUnread_Unauthorized(t *testing.T) {
	repo := &mockNotificationRepo{}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/notifications/count", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.CountUnread(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
}

func TestNotificationHandler_CountUnread_ServiceError(t *testing.T) {
	repo := &mockNotificationRepo{
		countUnreadFn: func(ctx context.Context, userID uuid.UUID) (int, error) {
			return 0, errors.New("db error")
		},
	}
	h := newNotificationHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/notifications/count", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	setNotificationClaims(c)

	if err := h.CountUnread(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", rec.Code)
	}
}
