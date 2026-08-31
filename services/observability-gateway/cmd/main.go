package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/observability-gateway/internal/collector"
	"gateways/observability-gateway/internal/config"
	"gateways/observability-gateway/internal/delivery"
	"gateways/shared/confighandler"
	"gateways/shared/logger"
	"gateways/shared/middleware"
	"gateways/shared/telemetry"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	logger.InitLogger()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg := config.LoadConfig()
	logger.Info(ctx, "Starting Observability Gateway service...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("observability-gateway")

	col := collector.NewCollector(cfg)
	handler := delivery.NewHTTPHandler(col)

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	// Public health check & telemetry metrics
	router.GET("/metrics", telemetry.GetMetricsHandler())
	router.GET("/health", handler.HealthCheck)
	router.GET("/api/v1/health", handler.HealthCheck)

	// Config handler for Kong / devops
	cfgHandler := confighandler.NewConfigHandler("observability-gateway")
	router.GET("/api/v1/config", cfgHandler.GetConfig)
	router.POST("/api/v1/config", cfgHandler.UpdateConfig)

	// Protected routes (Protected by RequireRole: super-admin, tenant-admin, isp_admin)
	v1 := router.Group("/api/v1/observability")
	v1.Use(delivery.RequireRole("super-admin", "tenant-admin", "isp_admin"))
	{
		v1.GET("/summary", handler.GetSummary)
		v1.GET("/live", handler.StreamLiveMetrics)
	}

	// Kong proxy route compatibility (strip path: /api/gateway/observability)
	kongGroup := router.Group("/observability")
	kongGroup.Use(delivery.RequireRole("super-admin", "tenant-admin", "isp_admin"))
	{
		kongGroup.GET("/summary", handler.GetSummary)
		kongGroup.GET("/live", handler.StreamLiveMetrics)
	}

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error(ctx, "Observability Gateway failed to start", zap.Error(err))
			os.Exit(1)
		}
	}()

	logger.Info(ctx, "Observability Gateway listening on port :"+cfg.Port)

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info(ctx, "Shutting down Observability Gateway...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error(ctx, "Observability Gateway forced to shutdown", zap.Error(err))
	}

	logger.Info(ctx, "Observability Gateway stopped cleanly")
}
