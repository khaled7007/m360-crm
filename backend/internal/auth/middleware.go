package auth

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

type contextKey string

const UserContextKey contextKey = "user"

func JWTMiddleware(svc *Service) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			header := c.Request().Header.Get("Authorization")
			if header == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "missing authorization header")
			}

			parts := strings.SplitN(header, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid authorization format")
			}

			claims, err := svc.ParseToken(parts[1])
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
			}

			c.Set(string(UserContextKey), claims)
			return next(c)
		}
	}
}

func RequireRole(roles ...Role) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			claims, ok := c.Get(string(UserContextKey)).(*Claims)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "not authenticated")
			}

			for _, r := range roles {
				if claims.Role == r {
					return next(c)
				}
			}

			return echo.NewHTTPError(http.StatusForbidden, "insufficient permissions")
		}
	}
}

func GetClaims(c echo.Context) *Claims {
	claims, _ := c.Get(string(UserContextKey)).(*Claims)
	return claims
}
