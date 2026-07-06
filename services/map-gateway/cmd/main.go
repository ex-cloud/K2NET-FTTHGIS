package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/map-gateway/internal/config"
	"gateways/map-gateway/internal/service"
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
	logger.Info(ctx, "Starting Map Gateway service...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("map-gateway")

	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})
	
	if err := rdb.Ping(ctx).Err(); err != nil {
		logger.Error(ctx, "Failed to connect to Redis", zap.Error(err))
		os.Exit(1)
	}
	logger.Info(ctx, "Connected to Redis successfully")

	geoService := service.NewGeocodingService(rdb, cfg.GoogleMapKey, cfg.HereMapKey)

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	router.GET("/metrics", telemetry.GetMetricsHandler())
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "map-gateway",
			"version": "1.0.0",
		})
	})

	api := router.Group("/api/v1")
	api.Use(middleware.InternalAuthMiddleware())
	{
		api.GET("/geocode", func(c *gin.Context) {
			address := c.Query("address")
			if address == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Query parameter 'address' is required"})
				return
			}
			
			result, err := geoService.ForwardGeocode(c.Request.Context(), address)
			if err != nil {
				logger.Error(c.Request.Context(), "Geocoding request failed", zap.Error(err), zap.String("address", address))
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			
			c.JSON(http.StatusOK, result)
		})
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

	logger.Info(ctx, "Map Gateway server exited cleanly")
}
