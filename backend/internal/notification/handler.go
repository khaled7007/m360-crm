package notification

import (
	"net/http"
	"strconv"

	"github.com/CamelLabSA/M360/backend/internal/auth"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	service     *Service
	hub         *Hub
	authService *auth.Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Register(g *echo.Group, authMW echo.MiddlewareFunc) {
	g.GET("/notifications", h.ListNotifications, authMW)
	g.PUT("/notifications/:id/read", h.MarkAsRead, authMW)
	g.PUT("/notifications/read-all", h.MarkAllRead, authMW)
	g.GET("/notifications/count", h.CountUnread, authMW)
}

func (h *Handler) ListNotifications(c echo.Context) error {
	claims := auth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "unauthorized"})
	}

	userID := claims.UserID

	unreadOnly := false
	if unreadParam := c.QueryParam("unread"); unreadParam == "true" {
		unreadOnly = true
	}

	limit := 50
	if limitParam := c.QueryParam("limit"); limitParam != "" {
		if parsedLimit, err := strconv.Atoi(limitParam); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	offset := 0
	if offsetParam := c.QueryParam("offset"); offsetParam != "" {
		if parsedOffset, err := strconv.Atoi(offsetParam); err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	notifications, err := h.service.ListByUser(c.Request().Context(), userID, unreadOnly, limit, offset)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to retrieve notifications"})
	}

	if notifications == nil {
		notifications = []*Notification{}
	}

	return c.JSON(http.StatusOK, notifications)
}

func (h *Handler) MarkAsRead(c echo.Context) error {
	claims := auth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "unauthorized"})
	}

	notificationID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid notification id"})
	}

	err = h.service.MarkAsRead(c.Request().Context(), notificationID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to mark notification as read"})
	}

	return c.JSON(http.StatusOK, echo.Map{"success": true})
}

func (h *Handler) MarkAllRead(c echo.Context) error {
	claims := auth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "unauthorized"})
	}

	userID := claims.UserID

	err := h.service.MarkAllRead(c.Request().Context(), userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to mark all notifications as read"})
	}

	return c.JSON(http.StatusOK, echo.Map{"success": true})
}

func (h *Handler) CountUnread(c echo.Context) error {
	claims := auth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "unauthorized"})
	}

	userID := claims.UserID

	count, err := h.service.CountUnread(c.Request().Context(), userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to retrieve unread count"})
	}

	return c.JSON(http.StatusOK, echo.Map{"unread_count": count})
}
