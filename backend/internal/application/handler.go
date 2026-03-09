package application

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

func (h *Handler) Register(g *echo.Group, authMW echo.MiddlewareFunc) {
	a := g.Group("/applications", authMW)
	a.POST("", h.Create, auth.RequireRole(auth.RoleAdmin, auth.RoleManager, auth.RoleLoanOfficer))
	a.GET("", h.List)
	a.GET("/:id", h.GetByID)
	a.PUT("/:id/status", h.UpdateStatus)
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if err := c.Validate(&req); err != nil {
		return err
	}
	claims := auth.GetClaims(c)
	app, err := h.svc.Create(c.Request().Context(), req, claims.UserID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create application")
	}
	return c.JSON(http.StatusCreated, app)
}

func (h *Handler) GetByID(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	app, err := h.svc.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "application not found")
	}
	return c.JSON(http.StatusOK, app)
}

func (h *Handler) List(c echo.Context) error {
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}
	params := ListParams{Search: c.QueryParam("search"), Limit: limit, Offset: offset}
	if s := c.QueryParam("status"); s != "" {
		st := Status(s)
		params.Status = &st
	}
	apps, total, err := h.svc.List(c.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list applications")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"data": apps, "total": total})
}

func (h *Handler) UpdateStatus(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	var req UpdateStatusRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if err := c.Validate(&req); err != nil {
		return err
	}
	app, err := h.svc.UpdateStatus(c.Request().Context(), id, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return c.JSON(http.StatusOK, app)
}
