package facility

import (
	"net/http"

	"github.com/CamelLabSA/M360/backend/internal/auth"
	"github.com/CamelLabSA/M360/backend/internal/notification"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

// Handler handles HTTP requests for facilities
type Handler struct {
	service *Service
}

// NewHandler creates a new facility handler
func NewHandler(pool *pgxpool.Pool, notifSvc *notification.Service) *Handler {
	service := NewService(pool, notifSvc)
	return &Handler{
		service: service,
	}
}

// Register registers facility routes with the echo group
func (h *Handler) Register(g *echo.Group, authMW echo.MiddlewareFunc) {
	g.GET("/facilities", h.listFacilities, authMW)
	g.GET("/facilities/:id", h.getFacility, authMW)
	g.GET("/facilities/:id/schedule", h.getFacilitySchedule, authMW)

	g.POST("/facilities", h.createFacility, authMW, auth.RequireRole(auth.RoleAdmin, auth.RoleManager))
	g.POST("/facilities/:id/payments", h.recordPayment, authMW)
}

func (h *Handler) createFacility(c echo.Context) error {
	req := &CreateRequest{}
	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	facility, err := h.service.Create(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to create facility")
	}

	return c.JSON(http.StatusCreated, facility)
}

func (h *Handler) listFacilities(c echo.Context) error {
	params := &ListParams{}
	if err := c.Bind(params); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid query parameters")
	}

	if params.Limit == 0 {
		params.Limit = 20
	}
	if params.Limit > 100 {
		params.Limit = 100
	}
	if params.Offset < 0 {
		params.Offset = 0
	}

	facilities, total, err := h.service.List(c.Request().Context(), *params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to list facilities")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data": facilities,
		"pagination": map[string]interface{}{
			"total":  total,
			"limit":  params.Limit,
			"offset": params.Offset,
		},
	})
}

func (h *Handler) getFacility(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid facility ID")
	}

	facility, err := h.service.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Facility not found")
	}

	return c.JSON(http.StatusOK, facility)
}

func (h *Handler) getFacilitySchedule(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid facility ID")
	}

	if _, err := h.service.GetByID(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Facility not found")
	}

	schedule, err := h.service.GetSchedule(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to retrieve repayment schedule")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"facility_id": id,
		"schedule":    schedule,
	})
}

func (h *Handler) recordPayment(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid facility ID")
	}

	req := &RecordPaymentRequest{}
	if err := c.Bind(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "Invalid request body")
	}

	if err := c.Validate(req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	if _, err := h.service.GetByID(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "Facility not found")
	}

	if err := h.service.RecordPayment(c.Request().Context(), id, req); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "Failed to record payment")
	}

	facility, _ := h.service.GetByID(c.Request().Context(), id)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message":  "Payment recorded successfully",
		"facility": facility,
	})
}
