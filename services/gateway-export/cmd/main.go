package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/gateway-export/internal/config"
	"gateways/gateway-export/internal/delivery"
	"gateways/gateway-export/internal/exporter"
	"gateways/shared/confighandler"
	"gateways/shared/logger"
	"gateways/shared/middleware"
	"gateways/shared/telemetry"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

func main() {
	logger.InitLogger()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg := config.LoadConfig()
	logger.Info(ctx, "Starting Export Gateway service...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("gateway-export")

	// Connect to Redis
	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})
	if err := rdb.Ping(ctx).Err(); err != nil {
		logger.Warn(ctx, "Failed to connect to Redis", zap.Error(err))
	} else {
		logger.Info(ctx, "Connected to Redis successfully")
	}

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

	// Initialize worker
	worker := exporter.NewWorker(rdb, dbPool, cfg.StorageGatewayUrl, cfg.GatewayToken)

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	handler := delivery.NewHTTPHandler(worker)

	// Metrics
	router.GET("/metrics", telemetry.GetMetricsHandler())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "gateway-export",
			"version": "1.0.0",
		})
	})

	cfgHandler := confighandler.NewConfigHandler("export-gateway")

	api := router.Group("/api/v1")
	api.Use(middleware.InternalAuthMiddleware())
	{
		api.GET("/config", cfgHandler.GetConfig)
		api.POST("/config", cfgHandler.UpdateConfig)
		api.GET("/gateway-status", cfgHandler.GetGatewayStatus)
		api.POST("/export/invoice/:invoiceId", handler.ExportInvoice)
		api.POST("/export/report/billing", handler.ExportBillingReport)
		api.POST("/export/report/network", handler.ExportNetworkReport)
		api.POST("/export/report/inventory", handler.ExportInventoryReport)
		api.POST("/export/report/tickets", handler.ExportTicketsReport)
		api.POST("/export/report/customer", handler.ExportCustomerReport)
		
		api.GET("/export/job/:jobId/status", handler.GetJobStatus)
		api.GET("/export/job/:jobId/download", handler.DownloadJob)
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

	logger.Info(ctx, "Export Gateway server exited cleanly")
}
