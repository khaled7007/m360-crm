package product

import (
	"net/http"

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
	p := g.Group("/products", authMW)
	p.POST("", h.Create, auth.RequireRole(auth.RoleAdmin, auth.RoleManager))
	p.GET("", h.List)
	p.GET("/:id", h.GetByID)
	p.PUT("/:id", h.Update, auth.RequireRole(auth.RoleAdmin, auth.RoleManager))
}

func (h *Handler) Create(c echo.Context) error {
	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if err := c.Validate(&req); err != nil {
		return err
	}
	p, err := h.svc.Create(c.Request().Context(), req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to create product")
	}
	return c.JSON(http.StatusCreated, p)
}

func (h *Handler) GetByID(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid id")
	}
	p, err := h.svc.GetByID(c.Request().Context(), id)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, "product not found")
	}
	return c.JSON(http.StatusOK, p)
}

func (h *Handler) List(c echo.Context) error {
	activeOnly := c.QueryParam("active") == "true"
	products, err := h.svc.List(c.Request().Context(), activeOnly)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to list products")
	}
	return c.JSON(http.StatusOK, map[string]interface{}{"data": products})
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
	if err := c.Validate(&req); err != nil {
		return err
	}
	p, err := h.svc.Update(c.Request().Context(), id, req)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to update product")
	}
	return c.JSON(http.StatusOK, p)
}
