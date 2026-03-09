package logger

import (
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// Setup configures the default slog logger based on environment.
// JSON output for production, text output for development.
func Setup(env string) *slog.Logger {
	var handler slog.Handler

	if env == "production" {
		handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		})
	} else {
		handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
	}

	logger := slog.New(handler)
	slog.SetDefault(logger)
	return logger
}

// Middleware returns an Echo middleware that logs HTTP requests using slog.
// It generates a UUID request_id per request and adds it to the context.
// Requests to health check endpoints (/health, /ready) are skipped.
func Middleware(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		req := c.Request()
		path := req.URL.Path

		// Skip health check endpoints
		if path == "/health" || path == "/ready" {
			return next(c)
		}

		requestID := c.Response().Header().Get(echo.HeaderXRequestID)
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set("request_id", requestID)

		start := time.Now()
		err := next(c)
		latency := time.Since(start)

		status := c.Response().Status
		attrs := []slog.Attr{
			slog.String("method", req.Method),
			slog.String("path", path),
			slog.Int("status", status),
			slog.Int64("latency_ms", latency.Milliseconds()),
			slog.String("ip", c.RealIP()),
			slog.String("user_agent", req.UserAgent()),
			slog.String("request_id", requestID),
		}

		if query := req.URL.RawQuery; query != "" {
			// Redact sensitive query params
			if !strings.Contains(query, "token") {
				attrs = append(attrs, slog.String("query", query))
			}
		}

		msg := req.Method + " " + path

		switch {
		case status >= 500:
			if err != nil {
				attrs = append(attrs, slog.String("error", err.Error()))
			}
			slog.LogAttrs(req.Context(), slog.LevelError, msg, attrs...)
		case status >= 400:
			slog.LogAttrs(req.Context(), slog.LevelWarn, msg, attrs...)
		default:
			slog.LogAttrs(req.Context(), slog.LevelInfo, msg, attrs...)
		}

		return err
	}
}
