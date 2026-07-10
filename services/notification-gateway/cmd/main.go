package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/notification-gateway/internal/config"
	"gateways/notification-gateway/internal/delivery"
	"gateways/notification-gateway/internal/provider"
	"gateways/notification-gateway/internal/service"
	"gateways/shared/confighandler"
	"gateways/shared/logger"
	"gateways/shared/middleware"
	"gateways/shared/telemetry"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

func main() {
	logger.InitLogger()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg := config.LoadConfig()
	logger.Info(ctx, "Starting Notification Gateway service...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("notification-gateway")

	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})
	
	if err := rdb.Ping(ctx).Err(); err != nil {
		logger.Error(ctx, "Failed to connect to Redis", zap.Error(err))
		os.Exit(1)
	}
	logger.Info(ctx, "Connected to Redis successfully")

	twilioProv := provider.NewTwilioProvider(cfg.TwilioSID, cfg.TwilioAuthToken, cfg.TwilioFrom)
	worker := service.NewWorker(rdb, twilioProv)

	go worker.Start(ctx)

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	handler := delivery.NewHTTPHandler(worker, rdb)

	router.GET("/metrics", telemetry.GetMetricsHandler())
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "notification-gateway",
			"version": "1.0.0",
		})
	})

	cfgHandler := confighandler.NewConfigHandler("notification-gateway")

	api := router.Group("/api/v1")
	api.Use(middleware.InternalAuthMiddleware())
	{
		api.GET("/config", cfgHandler.GetConfig)
		api.POST("/config", cfgHandler.UpdateConfig)
		api.GET("/gateway-status", cfgHandler.GetGatewayStatus)
	}

	notifyGroup := api.Group("")
	notifyGroup.Use(handler.RateLimiter())
	{
		notifyGroup.POST("/notify", handler.SendNotification)
		notifyGroup.GET("/notification/logs", handler.GetNotificationLogs)
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

	logger.Info(ctx, "Notification Gateway server exited cleanly")
}
