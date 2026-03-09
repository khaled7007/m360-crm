package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/CamelLabSA/M360/backend/internal/platform/config"
	"github.com/CamelLabSA/M360/backend/internal/platform/logger"
)

type customValidator struct {
	validator *validator.Validate
}

func (cv *customValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}

func globalErrorHandler(err error, c echo.Context) {
	if c.Response().Committed {
		return
	}

	code := http.StatusInternalServerError
	msg := "internal server error"

	if he, ok := err.(*echo.HTTPError); ok {
		code = he.Code
		if m, ok := he.Message.(string); ok {
			msg = m
		} else {
			msg = http.StatusText(code)
		}
	}

	_ = c.JSON(code, map[string]interface{}{
		"error": msg,
		"code":  code,
	})
}

func New(cfg *config.Config) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.Validator = &customValidator{validator: validator.New()}
	e.HTTPErrorHandler = globalErrorHandler

	e.Use(logger.Middleware)
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"http://localhost:3000", cfg.FrontendURL},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPut, http.MethodDelete, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderContentType, echo.HeaderAuthorization},
	}))
	e.Use(middleware.RequestID())

	return e
}

func RegisterHealthChecks(e *echo.Echo, pool *pgxpool.Pool, redisURL string) {
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(200, map[string]string{"status": "ok"})
	})

	e.GET("/ready", func(c echo.Context) error {
		ctx, cancel := context.WithTimeout(c.Request().Context(), 3*time.Second)
		defer cancel()

		if err := pool.Ping(ctx); err != nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]interface{}{
				"status": "not ready",
				"checks": map[string]string{
					"database": "failed",
				},
			})
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"status": "ready",
			"checks": map[string]string{
				"database": "ok",
			},
		})
	})
}

func Start(e *echo.Echo, cfg *config.Config) error {
	return e.Start(fmt.Sprintf(":%d", cfg.Port))
}
