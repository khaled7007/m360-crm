package reporting

import (
	"net/http"

	"github.com/CamelLabSA/M360/backend/internal/auth"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

// Register registers all reporting routes
func (h *Handler) Register(g *echo.Group, authMW echo.MiddlewareFunc) {
	// Apply auth middleware to all routes
	reporting := g.Group("/reports", authMW)

	// Dashboard endpoint
	reporting.GET("/dashboard", h.GetDashboard)

	// Pipeline endpoint
	reporting.GET("/pipeline", h.GetPipeline)

	// Officer performance endpoint (manager+ only)
	reporting.GET("/officers", h.GetOfficers, auth.RequireRole("manager", "admin"))

	// Portfolio at risk endpoint (manager+ only)
	reporting.GET("/par", h.GetPortfolioAtRisk, auth.RequireRole("manager", "admin"))
}

// GetDashboard retrieves dashboard statistics
// @Summary Get dashboard statistics
// @Description Retrieve overall dashboard statistics including leads, applications, facilities, and PAR metrics
// @Tags Reports
// @Produce json
// @Success 200 {object} DashboardStats
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Security Bearer
// @Router /reports/dashboard [get]
func (h *Handler) GetDashboard(c echo.Context) error {
	ctx := c.Request().Context()

	stats, err := h.service.GetDashboardStats(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"error": "failed to retrieve dashboard statistics",
		})
	}

	return c.JSON(http.StatusOK, stats)
}

// GetPipeline retrieves pipeline statistics
// @Summary Get pipeline statistics
// @Description Retrieve application pipeline funnel statistics grouped by status
// @Tags Reports
// @Produce json
// @Success 200 {object} PipelineStats
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 500 {object} map[string]string "Internal server error"
// @Security Bearer
// @Router /reports/pipeline [get]
func (h *Handler) GetPipeline(c echo.Context) error {
	ctx := c.Request().Context()

	stats, err := h.service.GetPipelineStats(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"error": "failed to retrieve pipeline statistics",
		})
	}

	return c.JSON(http.StatusOK, stats)
}

// GetOfficers retrieves officer performance metrics
// @Summary Get officer performance
// @Description Retrieve performance metrics for all loan officers (manager+ only)
// @Tags Reports
// @Produce json
// @Success 200 {object} []OfficerPerformance
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 403 {object} map[string]string "Forbidden"
// @Failure 500 {object} map[string]string "Internal server error"
// @Security Bearer
// @Router /reports/officers [get]
func (h *Handler) GetOfficers(c echo.Context) error {
	ctx := c.Request().Context()

	officers, err := h.service.GetOfficerPerformance(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"error": "failed to retrieve officer performance",
		})
	}

	if officers == nil {
		officers = []OfficerPerformance{}
	}

	return c.JSON(http.StatusOK, officers)
}

// GetPortfolioAtRisk retrieves portfolio at risk analysis
// @Summary Get portfolio at risk
// @Description Retrieve portfolio at risk analysis with delinquency breakdown (manager+ only)
// @Tags Reports
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Failure 401 {object} map[string]string "Unauthorized"
// @Failure 403 {object} map[string]string "Forbidden"
// @Failure 500 {object} map[string]string "Internal server error"
// @Security Bearer
// @Router /reports/par [get]
func (h *Handler) GetPortfolioAtRisk(c echo.Context) error {
	ctx := c.Request().Context()

	result, err := h.service.GetPortfolioAtRisk(ctx)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, map[string]string{
			"error": "failed to retrieve portfolio at risk data",
		})
	}

	return c.JSON(http.StatusOK, result)
}
