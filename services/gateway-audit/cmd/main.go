package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"gateways/gateway-audit/internal/config"
	"gateways/gateway-audit/internal/delivery"
	"gateways/gateway-audit/internal/audit"
	"gateways/shared/confighandler"
	"gateways/shared/logger"
	"gateways/shared/middleware"
	"gateways/shared/telemetry"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

func main() {
	logger.InitLogger()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg := config.LoadConfig()
	logger.Info(ctx, "Starting Audit Gateway service...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("gateway-audit")

	// Connect to PostgreSQL
	dbPool, err := pgxpool.New(ctx, cfg.DatabaseUrl)
	if err != nil {
		logger.Error(ctx, "Failed to create PostgreSQL connection pool", zap.Error(err))
		os.Exit(1)
	}
	defer dbPool.Close()

	if err := dbPool.Ping(ctx); err != nil {
		logger.Warn(ctx, "Failed to ping PostgreSQL", zap.Error(err))
	} else {
		logger.Info(ctx, "Connected to PostgreSQL successfully")
	}

	// Init repository & migrations
	repo := audit.NewRepository(dbPool)
	if err := repo.RunMigrations(ctx); err != nil {
		logger.Error(ctx, "Failed to run audit DB migrations", zap.Error(err))
		os.Exit(1)
	}
	logger.Info(ctx, "Audit DB migrations completed")

	// Parse retention days
	retDays, err := strconv.Atoi(cfg.RetentionDays)
	if err != nil || retDays <= 0 {
		retDays = 365
	}

	// Start background retention scheduler job
	go func() {
		// Run first cleanup on startup
		logger.Info(ctx, "Running startup audit log retention cleanup...", zap.Int("retentionDays", retDays))
		if affected, err := repo.CleanupExpiredEvents(ctx, retDays); err != nil {
			logger.Error(ctx, "Failed to clean expired audit events", zap.Error(err))
		} else {
			logger.Info(ctx, "Audit cleanup completed on startup", zap.Int64("deletedRows", affected))
		}

		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				logger.Info(ctx, "Running daily audit log retention cleanup...", zap.Int("retentionDays", retDays))
				if affected, err := repo.CleanupExpiredEvents(ctx, retDays); err != nil {
					logger.Error(ctx, "Failed to clean expired audit events", zap.Error(err))
				} else {
					logger.Info(ctx, "Audit cleanup completed", zap.Int64("deletedRows", affected))
				}
			}
		}
	}()

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	handler := delivery.NewHTTPHandler(repo)

	// Metrics
	router.GET("/metrics", telemetry.GetMetricsHandler())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "gateway-audit",
			"version": "1.0.0",
		})
	})

	cfgHandler := confighandler.NewConfigHandler("audit-gateway")

	api := router.Group("/api/v1")
	api.Use(middleware.InternalAuthMiddleware())
	{
		api.GET("/config", cfgHandler.GetConfig)
		api.POST("/config", cfgHandler.UpdateConfig)
		api.GET("/gateway-status", cfgHandler.GetGatewayStatus)
		api.POST("/audit/events", handler.CreateAuditEvent)
		api.POST("/audit/events/kong", handler.CreateKongLog)
		api.GET("/audit/events", handler.GetAuditEvents)
		api.GET("/audit/events/:id", handler.GetAuditEvent)
		api.GET("/audit/report/tenant/:slug", handler.GetTenantAuditReport)
		api.GET("/audit/report/user/:userId", handler.GetUserAuditReport)
		api.POST("/audit/export", handler.ExportAuditEvents)
	}

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error(ctx, "Listen and serve error", zap.Error(err))
			os.Exit(1)
		}
	}()

	logger.Info(ctx, "HTTP Server listening on port "+cfg.Port)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info(ctx, "Shutting down servers gracefully...")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error(ctx, "Server forced to shutdown", zap.Error(err))
	}

	logger.Info(ctx, "Audit Gateway server exited cleanly")
}
