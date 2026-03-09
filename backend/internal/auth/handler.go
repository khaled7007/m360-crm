package auth

import (
	"fmt"
	"net/http"
	"time"

	"github.com/labstack/echo/v4"
	"golang.org/x/time/rate"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) Register(e *echo.Group) {
	authRL := NewIPRateLimiter(rate.Every(12*time.Second), 5) // 5 req/min
	e.POST("/auth/login", h.Login, RateLimitMiddleware(authRL))
	e.POST("/auth/register", h.CreateUser, JWTMiddleware(h.svc), RequireRole(RoleAdmin))
	e.POST("/auth/refresh", h.Refresh)
	e.POST("/auth/forgot-password", h.ForgotPassword, RateLimitMiddleware(authRL))
	e.POST("/auth/reset-password", h.ResetPassword, RateLimitMiddleware(authRL))
	e.GET("/auth/me", h.Me, JWTMiddleware(h.svc))
	e.GET("/auth/users", h.ListUsers, JWTMiddleware(h.svc), RequireRole(RoleAdmin))
	e.POST("/auth/users", h.CreateUser, JWTMiddleware(h.svc), RequireRole(RoleAdmin))
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

var validRoles = map[Role]bool{
	RoleAdmin: true, RoleManager: true, RoleLoanOfficer: true,
	RoleCreditAnalyst: true, RoleComplianceOfficer: true,
	RoleCollectionsOfficer: true, RoleDataEntry: true,
}

func (h *Handler) CreateUser(c echo.Context) error {
	var req CreateUserRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if !validRoles[req.Role] {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid role")
	}

	user, err := h.svc.Register(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "failed to create user")
	}

	return c.JSON(http.StatusCreated, user)
}

func (h *Handler) Refresh(c echo.Context) error {
	var req RefreshRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	resp, err := h.svc.RefreshToken(c.Request().Context(), req.RefreshToken)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	return c.JSON(http.StatusOK, resp)
}

func (h *Handler) ForgotPassword(c echo.Context) error {
	var req ForgotPasswordRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := h.svc.ForgotPassword(c.Request().Context(), req.Email); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to process request")
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "if the email exists, a reset link has been sent"})
}

func (h *Handler) ResetPassword(c echo.Context) error {
	var req ResetPasswordRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := h.svc.ResetPassword(c.Request().Context(), req.Token, req.NewPassword); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "password has been reset"})
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

func (h *Handler) ListUsers(c echo.Context) error {
	limit, _ := parseInt(c.QueryParam("limit"), 20)
	offset, _ := parseInt(c.QueryParam("offset"), 0)
	search := c.QueryParam("search")

	if limit > 100 {
		limit = 100
	}
	if limit < 1 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	users, total, err := h.svc.repo.ListUsers(c.Request().Context(), limit, offset, search)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list users")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":  users,
		"total": total,
		"pagination": map[string]interface{}{
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
	})
}

func parseInt(s string, defaultVal int) (int, bool) {
	if s == "" {
		return defaultVal, false
	}
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	if err != nil {
		return defaultVal, false
	}
	return n, true
}
