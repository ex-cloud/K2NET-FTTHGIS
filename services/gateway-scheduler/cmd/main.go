package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/gateway-scheduler/internal/config"
	"gateways/gateway-scheduler/internal/delivery"
	"gateways/gateway-scheduler/internal/scheduler"
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
	logger.Info(ctx, "Starting Scheduler Gateway service...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("gateway-scheduler")

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
		logger.Error(ctx, "Failed to ping PostgreSQL", zap.Error(err))
		os.Exit(1)
	}
	logger.Info(ctx, "Connected to PostgreSQL successfully")

	// Init repository & run migrations
	repo := scheduler.NewRepository(dbPool)
	if err := repo.RunMigrations(ctx); err != nil {
		logger.Error(ctx, "Failed to run scheduler DB migrations", zap.Error(err))
		os.Exit(1)
	}
	logger.Info(ctx, "Scheduler DB migrations completed")

	// Init cron engine
	engine := scheduler.NewEngine(repo, rdb, cfg.Timezone)
	if err := engine.Start(ctx); err != nil {
		logger.Warn(ctx, "Scheduler engine failed to start", zap.Error(err))
	}
	defer engine.Stop()

	// HTTP server
	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	handler := delivery.NewHTTPHandler(repo, engine)

	router.GET("/metrics", telemetry.GetMetricsHandler())
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "gateway-scheduler",
			"version": "1.0.0",
		})
	})

	cfgHandler := confighandler.NewConfigHandler("scheduler-gateway")

	api := router.Group("/api/v1")
	api.Use(middleware.InternalAuthMiddleware())
	{
		api.GET("/config", cfgHandler.GetConfig)
		api.POST("/config", cfgHandler.UpdateConfig)
		api.GET("/gateway-status", cfgHandler.GetGatewayStatus)
		api.POST("/scheduler/jobs", handler.CreateJob)
		api.GET("/scheduler/jobs", handler.GetJobs)
		api.GET("/scheduler/jobs/tenant/:slug", handler.GetTenantJobs)
		api.GET("/scheduler/jobs/:id", handler.GetJob)
		api.PUT("/scheduler/jobs/:id", handler.UpdateJob)
		api.DELETE("/scheduler/jobs/:id", handler.DeleteJob)
		api.POST("/scheduler/jobs/:id/trigger", handler.TriggerJob)
		api.GET("/scheduler/history/:jobId", handler.GetJobHistory)
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

	logger.Info(ctx, "Shutting down gracefully...")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error(ctx, "Server forced to shutdown", zap.Error(err))
	}

	logger.Info(ctx, "Scheduler Gateway server exited cleanly")
}
