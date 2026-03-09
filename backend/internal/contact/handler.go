package contact

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

func (h *Handler) Register(g *echo.Group, authMiddleware echo.MiddlewareFunc) {
	contacts := g.Group("/contacts", authMiddleware)
	contacts.POST("", h.Create)
	contacts.GET("", h.List)
	contacts.GET("/organization/:org_id", h.ListByOrganization)
	contacts.GET("/:id", h.GetByID)
	contacts.PUT("/:id", h.Update)
	contacts.DELETE("/:id", h.Delete, auth.RequireRole(auth.RoleAdmin, auth.RoleManager))
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	contact, err := h.svc.Create(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create contact")
	}

	return c.JSON(http.StatusCreated, contact)
}

func (h *Handler) GetByID(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	contact, err := h.svc.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "contact not found")
	}

	return c.JSON(http.StatusOK, contact)
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
	search := c.QueryParam("search")

	contacts, total, err := h.svc.List(c.Request().Context(), limit, offset, search)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list contacts")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":  contacts,
		"total": total,
		"pagination": map[string]interface{}{
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
	})
}

func (h *Handler) ListByOrganization(c echo.Context) error {
	orgID, err := uuid.Parse(c.Param("org_id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid organization id")
	}

	contacts, err := h.svc.ListByOrganization(c.Request().Context(), orgID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list contacts")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": contacts,
	})
}

func (h *Handler) Update(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	var req UpdateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	contact, err := h.svc.Update(c.Request().Context(), id, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update contact")
	}

	return c.JSON(http.StatusOK, contact)
}

func (h *Handler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	if err := h.svc.Delete(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete contact")
	}

	return c.NoContent(http.StatusNoContent)
}
