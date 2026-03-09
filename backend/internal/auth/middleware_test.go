package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

func okHandler(c echo.Context) error {
	return c.String(http.StatusOK, "ok")
}

func newTestContext(method, path string) (echo.Context, *httptest.ResponseRecorder) {
	e := echo.New()
	req := httptest.NewRequest(method, path, nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)
	return c, rec
}

func TestRequireRole_Allowed(t *testing.T) {
	c, rec := newTestContext(http.MethodGet, "/")
	claims := &Claims{UserID: uuid.New(), Email: "test@m360.sa", Role: RoleAdmin}
	c.Set(string(UserContextKey), claims)

	mw := RequireRole(RoleAdmin, RoleManager)
	h := mw(okHandler)
	if err := h(c); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}
}

func TestRequireRole_Forbidden(t *testing.T) {
	c, _ := newTestContext(http.MethodGet, "/")
	claims := &Claims{UserID: uuid.New(), Email: "test@m360.sa", Role: RoleDataEntry}
	c.Set(string(UserContextKey), claims)

	mw := RequireRole(RoleAdmin, RoleManager)
	h := mw(okHandler)
	err := h(c)
	if err == nil {
		t.Fatal("expected an error, got nil")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected *echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusForbidden {
		t.Errorf("expected 403, got %d", he.Code)
	}
}

func TestRequireRole_NoClaims(t *testing.T) {
	c, _ := newTestContext(http.MethodGet, "/")
	// no claims set in context

	mw := RequireRole(RoleAdmin)
	h := mw(okHandler)
	err := h(c)
	if err == nil {
		t.Fatal("expected an error, got nil")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected *echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", he.Code)
	}
}

func TestGetClaims_Valid(t *testing.T) {
	c, _ := newTestContext(http.MethodGet, "/")
	want := &Claims{UserID: uuid.New(), Email: "test@m360.sa", Role: RoleAdmin}
	c.Set(string(UserContextKey), want)

	got := GetClaims(c)
	if got == nil {
		t.Fatal("expected claims, got nil")
	}
	if got.UserID != want.UserID {
		t.Errorf("UserID mismatch: got %v, want %v", got.UserID, want.UserID)
	}
	if got.Email != want.Email {
		t.Errorf("Email mismatch: got %s, want %s", got.Email, want.Email)
	}
	if got.Role != want.Role {
		t.Errorf("Role mismatch: got %s, want %s", got.Role, want.Role)
	}
}

func TestGetClaims_Missing(t *testing.T) {
	c, _ := newTestContext(http.MethodGet, "/")
	// nothing set

	got := GetClaims(c)
	if got != nil {
		t.Errorf("expected nil claims, got %+v", got)
	}
}
