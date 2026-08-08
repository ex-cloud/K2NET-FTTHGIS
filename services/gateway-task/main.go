package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/gateway-task/internal/config"
	"gateways/gateway-task/internal/nextcloud"
	"gateways/gateway-task/internal/worker"
	"gateways/shared/telemetry"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func main() {
	log.Println("[GatewayTask] Initializing Task Gateway (Obsidian Sync Worker)...")

	// Load configuration
	cfg := config.LoadConfig()

	// Initialize Redis client
	rdb := redis.NewClient(&redis.Options{
		Addr: cfg.RedisAddr,
	})

	// Test Redis connection on startup
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("[GatewayTask] Redis connection failed: %v", err)
	}
	log.Println("[GatewayTask] Successfully connected to Redis.")

	// Initialize Nextcloud client
	nc := nextcloud.NewClient(cfg.NextcloudURL, cfg.NextcloudUser, cfg.NextcloudPassword)
	log.Println("[GatewayTask] Nextcloud client initialized.")

	// Start Obsidian worker
	workerCtx, workerCancel := context.WithCancel(context.Background())
	obsidianWorker := worker.NewObsidianWorker(cfg, rdb, nc)
	go obsidianWorker.Start(workerCtx)

	// Initialize telemetry
	telemetry.InitTelemetry("gateway-task")

	// Initialize HTTP server for health check and prometheus metrics
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())

	r.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "UP", "timestamp": time.Now().Format(time.RFC3339)})
	})

	r.GET("/metrics", telemetry.GetMetricsHandler())

	srv := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	go func() {
		log.Printf("[GatewayTask] HTTP Server listening on port %s...\n", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[GatewayTask] HTTP server ListenAndServe failed: %v\n", err)
		}
	}()

	// Wait for termination signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("[GatewayTask] Shutting down Task Gateway...")

	// Shutdown worker
	workerCancel()

	// Shutdown HTTP server
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Printf("[GatewayTask] HTTP Server Shutdown error: %v\n", err)
	}

	log.Println("[GatewayTask] Task Gateway stopped.")
}
