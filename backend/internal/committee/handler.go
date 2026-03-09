package committee

import (
	"fmt"
	"net/http"

	"github.com/CamelLabSA/M360/backend/internal/auth"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Register(g *echo.Group, authMW echo.MiddlewareFunc) {
	g.POST("/packages", h.CreatePackage, authMW, auth.RequireRole(auth.RoleCreditAnalyst, auth.RoleAdmin, auth.RoleManager))
	g.GET("/packages", h.ListPackages, authMW)
	g.GET("/packages/:id", h.GetPackage, authMW)
	g.GET("/packages/application/:app_id", h.GetByApplicationID, authMW)
	g.POST("/packages/:id/vote", h.CastVote, authMW, auth.RequireRole(auth.RoleManager))
}

func (h *Handler) CreatePackage(c echo.Context) error {
	req := &CreatePackageRequest{}
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	claims := auth.GetClaims(c)

	pkg, err := h.service.CreatePackage(c.Request().Context(), req, claims.UserID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create package"})
	}

	return c.JSON(http.StatusCreated, pkg)
}

func (h *Handler) GetPackage(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid package id"})
	}

	pkg, err := h.service.GetByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "package not found"})
	}

	return c.JSON(http.StatusOK, pkg)
}

func (h *Handler) GetByApplicationID(c echo.Context) error {
	appID, err := uuid.Parse(c.Param("app_id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid application id"})
	}

	pkg, err := h.service.GetByApplicationID(c.Request().Context(), appID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{"error": "package not found"})
	}

	return c.JSON(http.StatusOK, pkg)
}

func (h *Handler) ListPackages(c echo.Context) error {
	limit, offset := 20, 0
	if l := c.QueryParam("limit"); l != "" {
		if n, err := parseInt(l); err == nil && n > 0 {
			limit = n
		}
	}
	if o := c.QueryParam("offset"); o != "" {
		if n, err := parseInt(o); err == nil && n >= 0 {
			offset = n
		}
	}
	if limit > 100 {
		limit = 100
	}

	packages, err := h.service.ListPackages(c.Request().Context(), limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list packages"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": packages,
	})
}

func parseInt(s string) (int, error) {
	var n int
	_, err := fmt.Sscanf(s, "%d", &n)
	return n, err
}

func (h *Handler) CastVote(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid package id"})
	}

	req := &CastVoteRequest{}
	if err := c.Bind(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
	}

	if err := c.Validate(req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": err.Error()})
	}

	claims := auth.GetClaims(c)

	pkg, err := h.service.CastVote(c.Request().Context(), id, claims.UserID, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to cast vote"})
	}

	return c.JSON(http.StatusOK, pkg)
}
