package activity

import (
	"net/http"
	"strconv"

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
	g.POST("/activities", h.Create, authMW)
	g.GET("/activities/entity/:type/:id", h.ListByEntity)
	g.GET("/activities/user/:id", h.ListByUser)
}

func (h *Handler) Create(c echo.Context) error {
	claims := auth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
	}

	var req CreateRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request body"})
	}

	activity, err := h.service.Create(c.Request().Context(), claims.UserID, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create activity"})
	}

	return c.JSON(http.StatusCreated, activity)
}

func (h *Handler) ListByEntity(c echo.Context) error {
	entityType := c.Param("type")
	entityIDStr := c.Param("id")

	entityID, err := uuid.Parse(entityIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid entity id"})
	}

	limit := 20
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

	activities, total, err := h.service.ListByEntity(c.Request().Context(), entityType, entityID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list activities"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":  activities,
		"total": total,
	})
}

func (h *Handler) ListByUser(c echo.Context) error {
	userIDStr := c.Param("id")

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid user id"})
	}

	limit := 20
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

	activities, total, err := h.service.ListByUser(c.Request().Context(), userID, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to list activities"})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"data":  activities,
		"total": total,
	})
}
