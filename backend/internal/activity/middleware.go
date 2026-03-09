package activity

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/CamelLabSA/M360/backend/internal/auth"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// AuditMiddleware logs all API mutations (POST, PUT, DELETE) as activity records.
// It runs after the handler completes and only logs successful requests (2xx/3xx).
func AuditMiddleware(svc *Service) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// Run the handler first
			err := next(c)

			method := c.Request().Method
			if method != http.MethodPost && method != http.MethodPut && method != http.MethodDelete {
				return err
			}

			// Only log successful mutations
			status := c.Response().Status
			if status >= 400 {
				return err
			}

			claims := auth.GetClaims(c)
			if claims == nil {
				// Unauthenticated endpoint (e.g. login) — skip audit
				return err
			}

			path := c.Request().URL.Path
			action := methodToAction(method)
			entityType, entityID := extractEntity(c)

			metadata, _ := json.Marshal(map[string]interface{}{
				"method":      method,
				"path":        path,
				"status_code": status,
			})

			desc := fmt.Sprintf("%s %s", method, path)
			req := CreateRequest{
				EntityType:  entityType,
				EntityID:    entityID,
				Action:      action,
				Description: &desc,
				Metadata:    metadata,
			}

			// Fire-and-forget: log errors but don't fail the request
			if _, logErr := svc.Create(c.Request().Context(), claims.UserID, req); logErr != nil {
				c.Logger().Errorf("audit log failed: %v", logErr)
			}

			return err
		}
	}
}

func methodToAction(method string) string {
	switch method {
	case http.MethodPost:
		return "created"
	case http.MethodPut:
		return "updated"
	case http.MethodDelete:
		return "deleted"
	default:
		return "unknown"
	}
}

// extractEntity attempts to determine entity type and ID from the request path.
// Expected path format: /api/v1/{entity}/{id}/...
func extractEntity(c echo.Context) (string, uuid.UUID) {
	path := c.Request().URL.Path
	parts := strings.Split(strings.Trim(path, "/"), "/")

	// Skip "api" and "v1" prefix segments
	if len(parts) >= 3 {
		parts = parts[2:] // strip "api", "v1"
	}

	entityType := "unknown"
	entityID := uuid.Nil

	if len(parts) >= 1 {
		entityType = parts[0]
	}

	if len(parts) >= 2 {
		if id, err := uuid.Parse(parts[1]); err == nil {
			entityID = id
		}
	}

	// For POST (create), the entity ID may not be in the URL yet — use nil UUID
	return entityType, entityID
}
