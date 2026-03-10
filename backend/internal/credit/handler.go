package credit

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
	credit := g.Group("/credit-assessments", authMiddleware)
	credit.POST("", h.Create, auth.RequireRole(auth.RoleAdmin, auth.RoleManager, auth.RoleCreditAnalyst, auth.RoleLoanOfficer))
	credit.GET("", h.List)
	credit.GET("/:id", h.GetByID)
	credit.PUT("/:id", h.Update)
	credit.POST("/:id/score", h.Score, auth.RequireRole(auth.RoleAdmin, auth.RoleManager, auth.RoleCreditAnalyst))
	credit.DELETE("/:id", h.Delete, auth.RequireRole(auth.RoleAdmin, auth.RoleManager))
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
	assessment, err := h.svc.Create(c.Request().Context(), req, claims.UserID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create credit assessment")
	}

	return c.JSON(http.StatusCreated, assessment)
}

func (h *Handler) GetByID(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	assessment, err := h.svc.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "credit assessment not found")
	}

	return c.JSON(http.StatusOK, assessment)
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

	params := ListParams{
		Limit:  limit,
		Offset: offset,
	}

	if s := c.QueryParam("status"); s != "" {
		status := AssessmentStatus(s)
		params.Status = &status
	}
	if s := c.QueryParam("organization_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			params.OrganizationID = &id
		}
	}
	if s := c.QueryParam("application_id"); s != "" {
		if id, err := uuid.Parse(s); err == nil {
			params.ApplicationID = &id
		}
	}

	assessments, total, err := h.svc.List(c.Request().Context(), params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list credit assessments")
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":  assessments,
		"total": total,
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

	assessment, err := h.svc.Update(c.Request().Context(), id, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update credit assessment")
	}

	return c.JSON(http.StatusOK, assessment)
}

func (h *Handler) Score(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	assessment, err := h.svc.RunScoring(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to score credit assessment")
	}

	return c.JSON(http.StatusOK, assessment)
}

func (h *Handler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}

	if err := h.svc.Delete(c.Request().Context(), id); err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to delete credit assessment")
	}

	return c.NoContent(http.StatusNoContent)
}
