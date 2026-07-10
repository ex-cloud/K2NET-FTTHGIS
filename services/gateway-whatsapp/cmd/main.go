package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/gateway-whatsapp/internal/config"
	"gateways/gateway-whatsapp/internal/delivery"
	"gateways/gateway-whatsapp/internal/whatsapp"
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
	logger.Info(ctx, "Starting WhatsApp Gateway service...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("gateway-whatsapp")

	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})

	if err := rdb.Ping(ctx).Err(); err != nil {
		logger.Warn(ctx, "Failed to connect to Redis", zap.Error(err))
	} else {
		logger.Info(ctx, "Connected to Redis successfully")
	}

	// Initialize WhatsApp client & managers
	waClient := whatsapp.NewClient(cfg.WaApiUrl, cfg.WaAccessToken, cfg.WaPhoneNumberId)
	sessionMgr := whatsapp.NewSessionManager(rdb)
	
	// Start async blast queue worker daemon
	blastWorker := whatsapp.NewBlastWorker(rdb, waClient)
	go blastWorker.Start(ctx)

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	handler := delivery.NewHTTPHandler(waClient, sessionMgr, rdb)

	// Metrics endpoint
	router.GET("/metrics", telemetry.GetMetricsHandler())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "gateway-whatsapp",
			"version": "1.0.0",
		})
	})

	cfgHandler := confighandler.NewConfigHandler("whatsapp-gateway")

	api := router.Group("/api/v1")
	api.Use(middleware.InternalAuthMiddleware())
	{
		api.GET("/config", cfgHandler.GetConfig)
		api.POST("/config", cfgHandler.UpdateConfig)
		api.GET("/gateway-status", cfgHandler.GetGatewayStatus)
		api.POST("/wa/send/single", handler.SendSingle)
		api.POST("/wa/send/blast", handler.SendBlast)
		api.POST("/wa/send/otp", handler.SendOTP)
		api.GET("/wa/template/list", handler.GetTemplates)
		api.GET("/wa/session/:phone/status", handler.GetSessionStatus)
	}

	// Webhooks (public, signature verification inside PostWebhook)
	webhooks := router.Group("/wa/webhook")
	{
		webhooks.GET("", handler.GetWebhook)
		webhooks.POST("", handler.PostWebhook)
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

	logger.Info(ctx, "WhatsApp Gateway server exited cleanly")
}
