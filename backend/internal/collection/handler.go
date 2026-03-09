package collection

import (
	"net/http"
	"strconv"

	"github.com/CamelLabSA/M360/backend/internal/auth"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// Handler handles HTTP requests for collection operations
type Handler struct {
	service *Service
}

// NewHandler creates a new collection handler
func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Register registers the collection routes
func (h *Handler) Register(g *echo.Group, authMW echo.MiddlewareFunc) {
	g.POST("/collections", h.Create, authMW, auth.RequireRole(auth.RoleCollectionsOfficer, auth.RoleAdmin, auth.RoleManager))
	g.GET("/collections/overdue", h.GetOverdue, authMW)
	g.GET("/collections/facility/:id", h.ListByFacility, authMW)
	g.GET("/collections", h.List, authMW)
}

// Create handles POST /collections - creates a new collection action
func (h *Handler) Create(c echo.Context) error {
	claims := auth.GetClaims(c)
	if claims == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "not authenticated")
	}

	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}

	if err := c.Validate(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	action, err := h.service.Create(c.Request().Context(), claims.UserID, &req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create collection action")
	}

	return c.JSON(http.StatusCreated, action)
}

// ListByFacility handles GET /collections/facility/:id
func (h *Handler) ListByFacility(c echo.Context) error {
	facilityIDStr := c.Param("id")
	facilityID, err := uuid.Parse(facilityIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid facility id format")
	}

	limit := 10
	offset := 0

	if limitStr := c.QueryParam("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr := c.QueryParam("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	actions, err := h.service.ListByFacility(c.Request().Context(), facilityID, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list collection actions")
	}

	return c.JSON(http.StatusOK, echo.Map{
		"data": actions,
		"meta": echo.Map{
			"limit":  limit,
			"offset": offset,
			"total":  len(actions),
		},
	})
}

// List handles GET /collections - list all collection actions with pagination
func (h *Handler) List(c echo.Context) error {
	limit, offset := 20, 0
	if l := c.QueryParam("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 {
			limit = n
		}
	}
	if o := c.QueryParam("offset"); o != "" {
		if n, err := strconv.Atoi(o); err == nil && n >= 0 {
			offset = n
		}
	}
	if limit > 100 {
		limit = 100
	}

	var facilityID *uuid.UUID
	if fid := c.QueryParam("facility_id"); fid != "" {
		if parsed, err := uuid.Parse(fid); err == nil {
			facilityID = &parsed
		}
	}

	actions, total, err := h.service.List(c.Request().Context(), facilityID, limit, offset)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list collection actions")
	}

	return c.JSON(http.StatusOK, echo.Map{
		"data": actions,
		"total": total,
		"pagination": echo.Map{
			"total":  total,
			"limit":  limit,
			"offset": offset,
		},
	})
}

// GetOverdue handles GET /collections/overdue
func (h *Handler) GetOverdue(c echo.Context) error {
	summary, err := h.service.GetOverdueSummary(c.Request().Context())
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get overdue summary")
	}

	return c.JSON(http.StatusOK, summary)
}
