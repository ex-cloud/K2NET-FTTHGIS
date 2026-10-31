package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/gateway-auth/internal/auth"
	"gateways/gateway-auth/internal/config"
	"gateways/shared/auditclient"
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
	logger.Info(ctx, "Starting Edge Auth BFF Gateway (gateway-auth)...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("gateway-auth")

	var dbPool *pgxpool.Pool
	if cfg.DatabaseURL != "" {
		pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
		if err != nil {
			logger.Error(ctx, "Failed creating PostgreSQL pool for gateway-auth", zap.Error(err))
			os.Exit(1)
		}
		defer pool.Close()

		pingCtx, pingCancel := context.WithTimeout(ctx, 5*time.Second)
		if err := pool.Ping(pingCtx); err != nil {
			logger.Warn(ctx, "PostgreSQL ping warning on startup", zap.Error(err))
		} else {
			logger.Info(ctx, "gateway-auth connected to PostgreSQL ftth_gis")
		}
		pingCancel()
		dbPool = pool
	}

	var rdb *redis.Client
	if cfg.RedisAddr != "" {
		client := redis.NewClient(&redis.Options{
			Addr: cfg.RedisAddr,
		})
		defer client.Close()

		pingCtx, pingCancel := context.WithTimeout(ctx, 3*time.Second)
		if err := client.Ping(pingCtx).Err(); err != nil {
			logger.Warn(ctx, "Redis ping warning on startup (continuing without cache)", zap.Error(err))
		} else {
			logger.Info(ctx, "gateway-auth connected to Redis cache")
			rdb = client
		}
		pingCancel()
	}

	auditClient := auditclient.New(cfg.AuditGatewayURL, cfg.GatewayToken)
	repo := auth.NewPostgresRepository(dbPool, rdb)
	handler := auth.NewHandler(cfg, repo, auditClient, rdb)

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(middleware.TenantContextMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	// Observability & Health endpoints
	router.GET("/metrics", telemetry.GetMetricsHandler())
	router.GET("/health", handler.HealthCheck)
	router.GET("/healthz", handler.HealthCheck)
	router.GET("/api/v1/health", handler.HealthCheck)

	// Internal mesh config endpoints protected by X-Gateway-Token
	cfgHandler := confighandler.NewConfigHandler("gateway-auth")
	internalAPI := router.Group("/api/v1")
	internalAPI.Use(middleware.InternalAuthMiddleware())
	{
		internalAPI.GET("/config", cfgHandler.GetConfig)
		internalAPI.POST("/config", cfgHandler.UpdateConfig)
		internalAPI.GET("/gateway-status", cfgHandler.GetGatewayStatus)
	}

	// Edge BFF Authentication endpoints (exposed via Kong /api/v1/auth/*)
	mutationLimiter := auth.PerIPRateLimitMiddleware(30, time.Minute)
	authAPI := router.Group("/api/v1/auth")
	authAPI.Use(auth.SecurityHeadersAndCSRFMiddleware())
	{
		authAPI.GET("/tenant-context", handler.GetTenantContext)
		authAPI.POST("/login", mutationLimiter, handler.Login)
		authAPI.POST("/mfa/verify", mutationLimiter, handler.VerifyMFA)
		authAPI.POST("/refresh", handler.Refresh)
		authAPI.POST("/logout", handler.Logout)
		authAPI.POST("/register", mutationLimiter, handler.Register)
		authAPI.POST("/forgot-password", handler.ForgotPassword)
		authAPI.GET("/reset-password/validate", handler.ValidateResetToken)
		authAPI.POST("/reset-password", mutationLimiter, handler.ResetPassword)
		authAPI.GET("/activate/validate", handler.ValidateActivationToken)
		authAPI.POST("/activate", mutationLimiter, handler.ActivateAccount)
	}

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           router,
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error(ctx, "gateway-auth HTTP server failed", zap.Error(err))
			os.Exit(1)
		}
	}()

	logger.Info(ctx, "gateway-auth listening", zap.String("addr", ":"+cfg.Port))

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info(ctx, "Shutting down gateway-auth...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error(ctx, "gateway-auth forced shutdown", zap.Error(err))
	}
	logger.Info(ctx, "gateway-auth stopped cleanly")
}
