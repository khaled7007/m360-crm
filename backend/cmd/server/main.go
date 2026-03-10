package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/CamelLabSA/M360/backend/internal/activity"
	"github.com/CamelLabSA/M360/backend/internal/application"
	"github.com/CamelLabSA/M360/backend/internal/auth"
	"github.com/CamelLabSA/M360/backend/internal/collection"
	"github.com/CamelLabSA/M360/backend/internal/committee"
	"github.com/CamelLabSA/M360/backend/internal/contact"
	"github.com/CamelLabSA/M360/backend/internal/credit"
	"github.com/CamelLabSA/M360/backend/internal/document"
	"github.com/CamelLabSA/M360/backend/internal/facility"
	"github.com/CamelLabSA/M360/backend/internal/integration"
	"github.com/CamelLabSA/M360/backend/internal/lead"
	"github.com/CamelLabSA/M360/backend/internal/notification"
	"github.com/CamelLabSA/M360/backend/internal/organization"
	"github.com/CamelLabSA/M360/backend/internal/platform/config"
	"github.com/CamelLabSA/M360/backend/internal/platform/database"
	"github.com/CamelLabSA/M360/backend/internal/platform/logger"
	"github.com/CamelLabSA/M360/backend/internal/platform/server"
	"github.com/CamelLabSA/M360/backend/internal/product"
	"github.com/CamelLabSA/M360/backend/internal/reporting"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	logger.Setup(cfg.Environment)

	slog.Info("starting THARA360 server",
		"environment", cfg.Environment,
		"port", cfg.Port,
	)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	pool, err := database.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	slog.Info("database connected")

	// Auth
	authRepo := auth.NewRepository(pool)
	authSvc := auth.NewService(authRepo, cfg.JWTSecret)
	authHandler := auth.NewHandler(authSvc)

	e := server.New(cfg)
	server.RegisterHealthChecks(e, pool, cfg.RedisURL)
	api := e.Group("/api/v1")
	authHandler.Register(api)

	authMW := auth.JWTMiddleware(authSvc)

	// Activity log (initialized early so audit middleware can use it)
	activityRepo := activity.NewRepository(pool)
	activitySvc := activity.NewService(activityRepo)
	activityHandler := activity.NewHandler(activitySvc)
	activityHandler.Register(api, authMW)

	// Audit trail middleware — logs all POST/PUT/DELETE mutations
	api.Use(activity.AuditMiddleware(activitySvc))

	// Organization
	orgRepo := organization.NewRepository(pool)
	orgSvc := organization.NewService(orgRepo)
	orgHandler := organization.NewHandler(orgSvc)
	orgHandler.Register(api, authMW)

	// Contact
	contactRepo := contact.NewRepository(pool)
	contactSvc := contact.NewService(contactRepo)
	contactHandler := contact.NewHandler(contactSvc)
	contactHandler.Register(api, authMW)

	// Lead
	leadRepo := lead.NewRepository(pool)
	leadSvc := lead.NewService(leadRepo)
	leadHandler := lead.NewHandler(leadSvc)
	leadHandler.Register(api, authMW)

	// Product (Murabaha templates)
	productRepo := product.NewRepository(pool)
	productSvc := product.NewService(productRepo)
	productHandler := product.NewHandler(productSvc)
	productHandler.Register(api, authMW)

	// Notifications (initialized early — needed by application and facility)
	notifHub := notification.NewHub()
	notifRepo := notification.NewRepository(pool)
	notifSvc := notification.NewService(notifRepo)
	notifSvc.SetHub(notifHub)
	notifHandler := notification.NewHandler(notifSvc)
	notifHandler.SetHub(notifHub, authSvc)
	notifHandler.Register(api, authMW)

	// WebSocket endpoint for real-time notifications (outside /api/v1, no auth middleware — token in query param)
	e.GET("/ws/notifications", notifHandler.WebSocket)

	// Document management
	docRepo := document.NewRepository(pool)
	docSvc := document.NewService(docRepo)
	docHandler := document.NewHandler(docSvc)
	docHandler.Register(api, authMW)

	// Credit committee
	committeeRepo := committee.NewRepository(pool)
	committeeSvc := committee.NewService(committeeRepo)
	committeeHandler := committee.NewHandler(committeeSvc)
	committeeHandler.Register(api, authMW)

	// Application (loan lifecycle) — depends on document and committee services for transition prerequisites
	appRepo := application.NewRepository(pool)
	appSvc := application.NewService(appRepo, notifSvc, docSvc, committeeSvc)
	appHandler := application.NewHandler(appSvc)
	appHandler.Register(api, authMW)

	// Facility (post-disbursement — depends on notification)
	facilityHandler := facility.NewHandler(pool, notifSvc)
	facilityHandler.Register(api, authMW)

	// Collections
	collectionRepo := collection.NewRepository(pool)
	collectionSvc := collection.NewService(collectionRepo)
	collectionHandler := collection.NewHandler(collectionSvc)
	collectionHandler.Register(api, authMW)
	collection.StartOverdueChecker(collectionSvc, 24*time.Hour)

	// Saudi integrations (SIMAH, Bayan, Nafath, Yaqeen, Watheq)
	integrationHandler := integration.New()
	integrationHandler.Register(api, authMW)

	// Credit assessment
	creditRepo := credit.NewRepository(pool)
	creditSvc := credit.NewService(creditRepo)
	creditHandler := credit.NewHandler(creditSvc)
	creditHandler.Register(api, authMW)

	// Reporting & analytics
	reportingRepo := reporting.NewRepository(pool)
	reportingSvc := reporting.NewService(reportingRepo)
	reportingHandler := reporting.NewHandler(reportingSvc)
	reportingHandler.Register(api, authMW)

	go func() {
		if err := server.Start(e, cfg); err != nil {
			slog.Info("server stopped", "error", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down...")
	if err := e.Close(); err != nil {
		slog.Error("server shutdown failed", "error", err)
		os.Exit(1)
	}
}
