package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/gateway-olt/internal/config"
	"gateways/gateway-olt/internal/delivery"
	"gateways/gateway-olt/internal/olt"
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
	logger.Info(ctx, "Starting OLT Gateway service...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("gateway-olt")

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
	repo := olt.NewRepository(dbPool)
	if err := repo.RunMigrations(ctx); err != nil {
		logger.Error(ctx, "Failed to run OLT DB migrations", zap.Error(err))
		os.Exit(1)
	}
	logger.Info(ctx, "OLT DB migrations completed")

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
			"service": "gateway-olt",
			"version": "1.0.0",
		})
	})

	api := router.Group("/api/v1")
	api.Use(middleware.InternalAuthMiddleware())
	{
		api.GET("/olt", handler.GetOlts)
		api.POST("/olt", handler.CreateOlt)
		api.GET("/olt/:id/status", handler.GetOltStatus)
		api.GET("/olt/:id/ports", handler.GetOltPorts)
		api.GET("/olt/:id/onts", handler.GetOltOnts)
		api.GET("/olt/:id/bandwidth", handler.GetOltBandwidth)
		api.POST("/olt/:id/provision", handler.ProvisionOnt)
		
		api.GET("/ont/:serial/signal", handler.GetOntSignal)
		api.GET("/ont/:serial/status", handler.GetOntStatus)
		api.POST("/ont/:serial/reboot", handler.RebootOnt)
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

	logger.Info(ctx, "OLT Gateway server exited cleanly")
}
