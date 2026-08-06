package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"gateways/shared/auditclient"
	"gateways/shared/confighandler"
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
	audit := auditclient.NewFromEnv()

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	router.GET("/metrics", telemetry.GetMetricsHandler())
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "storage-gateway",
			"version": "1.0.0",
		})
	})

	cfgHandler := confighandler.NewConfigHandler("storage-gateway")

	api := router.Group("/api/v1")
	api.Use(middleware.InternalAuthMiddleware())
	{
		api.GET("/config", cfgHandler.GetConfig)
		api.POST("/config", cfgHandler.UpdateConfig)
		api.GET("/gateway-status", cfgHandler.GetGatewayStatus)
		router.MaxMultipartMemory = 150 << 20 // Max size 150MB untuk database backup

		api.POST("/upload", func(c *gin.Context) {
			// Dukung form field 'file' atau 'image' (Spring Boot legacy)
			file, header, err := c.Request.FormFile("file")
			if err != nil {
				// Fallback ke 'image'
				file, header, err = c.Request.FormFile("image")
				if err != nil {
					c.JSON(http.StatusBadRequest, gin.H{"error": "Multipart field 'file' or 'image' is required"})
					return
				}
			}
			defer file.Close()

			// Baca target bucket dinamis
			bucket := c.DefaultPostForm("bucket", "")
			if bucket == "" {
				bucket = c.DefaultQuery("bucket", "")
			}

			contentType := header.Header.Get("Content-Type")

			url, err := storageService.UploadFile(c.Request.Context(), file, header.Filename, header.Size, contentType, bucket)
			if err != nil {
				logger.Error(c.Request.Context(), "File upload failed", zap.Error(err), zap.String("filename", header.Filename))
				audit.LogError(c.Request.Context(),
					c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
					"FILE_UPLOAD_FAILED", "FILE", header.Filename,
					auditclient.GroupOperations, "storage-gateway",
					err.Error(), map[string]any{"bucket": bucket, "size": header.Size, "mime": contentType},
				)
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Audit: file uploaded successfully
			audit.LogSuccess(c.Request.Context(),
				c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
				"FILE_UPLOADED", "FILE", header.Filename,
				auditclient.GroupOperations, "storage-gateway",
				map[string]any{"bucket": bucket, "url": url, "size": header.Size, "mime": contentType},
			)

			c.JSON(http.StatusOK, gin.H{
				"status": "Success",
				"url":    url,
				"name":   header.Filename,
				"size":   header.Size,
			})
		})

		api.GET("/presigned-url", func(c *gin.Context) {
			bucket := c.Query("bucket")
			key := c.Query("key")
			expiryStr := c.Query("expiry_minutes")

			if bucket == "" || key == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Params 'bucket' and 'key' are required"})
				return
			}

			expiryMinutes := 15
			if expiryStr != "" {
				if val, err := strconv.Atoi(expiryStr); err == nil {
					expiryMinutes = val
				}
			}

			url, err := storageService.GeneratePresignedURL(c.Request.Context(), bucket, key, time.Duration(expiryMinutes)*time.Minute)
			if err != nil {
				logger.Error(c.Request.Context(), "Failed to generate presigned URL", zap.Error(err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"url": url,
			})
		})

		api.GET("/bucket-stats", func(c *gin.Context) {
			bucket := c.Query("bucket")
			if bucket == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "bucket query parameter is required"})
				return
			}
			stats, err := storageService.GetBucketStats(c.Request.Context(), bucket)
			if err != nil {
				logger.Error(c.Request.Context(), "Failed to get bucket stats", zap.Error(err), zap.String("bucket", bucket))
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, stats)
		})

		// Endpoint untuk mengambil statistik penyimpanan secara real-time
		api.GET("/stats", func(c *gin.Context) {
			stats, err := storageService.GetStats(c.Request.Context())
			if err != nil {
				logger.Error(c.Request.Context(), "Failed to get storage stats", zap.Error(err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			// Hitung persentase penghematan ruang
			var spaceSavedPercent float64
			if stats.TotalOriginalSize > 0 {
				spaceSavedPercent = float64(stats.TotalOriginalSize-stats.TotalCompressedSize) / float64(stats.TotalOriginalSize) * 100
			}

			var failureRate float64
			totalOps := stats.SuccessCount + stats.FailureCount
			if totalOps > 0 {
				failureRate = float64(stats.FailureCount) / float64(totalOps) * 100
			}

			c.JSON(http.StatusOK, gin.H{
				"total_files":          stats.TotalFiles,
				"total_original_size":  stats.TotalOriginalSize,
				"total_compressed_size": stats.TotalCompressedSize,
				"success_count":        stats.SuccessCount,
				"failure_count":        stats.FailureCount,
				"space_saved_percent":  spaceSavedPercent,
				"failure_rate_percent": failureRate,
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
