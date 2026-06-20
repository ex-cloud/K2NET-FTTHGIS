package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/shared/logger"
	"gateways/shared/middleware"
	"gateways/shared/telemetry"
	"gateways/storage-gateway/internal/config"
	"gateways/storage-gateway/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	logger.InitLogger()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg := config.LoadConfig()
	logger.Info(ctx, "Starting Storage Gateway service...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("storage-gateway")

	storageService := service.NewStorageService(cfg)

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	router.GET("/metrics", telemetry.GetMetricsHandler())

	api := router.Group("/api/v1")
	api.Use(middleware.InternalAuthMiddleware())
	{
		router.MaxMultipartMemory = 10 << 20 

		api.POST("/upload", func(c *gin.Context) {
			file, header, err := c.Request.FormFile("image")
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Multipart field 'image' is required"})
				return
			}
			defer file.Close()

			url, err := storageService.UploadImage(c.Request.Context(), file, header.Filename, header.Size)
			if err != nil {
				logger.Error(c.Request.Context(), "Image upload failed", zap.Error(err), zap.String("filename", header.Filename))
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"status": "Success",
				"url":    url,
			})
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

	logger.Info(ctx, "Storage Gateway server exited cleanly")
}
