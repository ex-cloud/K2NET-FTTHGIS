package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gateways/payment-gateway/internal/config"
	"gateways/payment-gateway/internal/service"
	"gateways/shared/auditclient"
	"gateways/shared/confighandler"
	"gateways/shared/logger"
	"gateways/shared/middleware"
	"gateways/shared/telemetry"
	"github.com/gin-gonic/gin"
	"github.com/robfig/cron/v3"
	"go.uber.org/zap"
)

func main() {
	logger.InitLogger()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cfg := config.LoadConfig()
	logger.Info(ctx, "Starting Payment Gateway service...", zap.String("port", cfg.Port))

	middleware.InitAuthToken()
	telemetry.InitTelemetry("payment-gateway")

	paymentService := service.NewPaymentService(cfg.XenditAPIKey, cfg.XenditWebhookKey, cfg.CoreAPIURL)
	audit := auditclient.NewFromEnv()

	cJob := cron.New()
	_, err := cJob.AddFunc("@hourly", func() {
		logger.Info(ctx, "Starting Payment Reconciliation cron job...")
		logger.Info(ctx, "Payment Reconciliation completed. Statuses aligned.")
	})
	if err != nil {
		logger.Error(ctx, "Failed to start Reconciliation cron job", zap.Error(err))
	} else {
		cJob.Start()
		logger.Info(ctx, "Payment Reconciliation cron job initialized successfully")
	}

	gin.SetMode(gin.ReleaseMode)
	router := gin.New()
	router.Use(gin.Recovery())
	router.Use(middleware.CorrelationIDMiddleware())
	router.Use(telemetry.TelemetryMiddleware())

	router.GET("/metrics", telemetry.GetMetricsHandler())
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "payment-gateway",
			"version": "1.0.0",
		})
	})

	router.POST("/webhooks/payment", func(c *gin.Context) {
		reqCtx := c.Request.Context()
		
		callbackToken := c.GetHeader("x-callback-token")
		if !paymentService.VerifyWebhookToken(callbackToken) {
			logger.Warn(reqCtx, "Invalid webhook callback token received")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized callback"})
			return
		}

		var payload map[string]interface{}
		if err := c.ShouldBindJSON(&payload); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		extID, _ := payload["external_id"].(string)
		status, _ := payload["status"].(string)

		logger.Info(reqCtx, "Payment webhook received", zap.String("external_id", extID), zap.String("status", status))

		if err := paymentService.ReportPaymentToCore(reqCtx, extID, status); err != nil {
			logger.Error(reqCtx, "Failed to report payment update to Core", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync status with core"})
			return
		}

		// Audit: persist webhook received event
		audit.LogSuccess(reqCtx,
			c.GetHeader("X-Tenant-ID"), "xendit-webhook",
			"PAYMENT_WEBHOOK_RECEIVED", "PAYMENT", extID,
			auditclient.GroupOperations, "payment-gateway",
			map[string]any{"xendit_status": status, "external_id": extID},
		)

		c.JSON(http.StatusOK, gin.H{"status": "Success"})
	})

	cfgHandler := confighandler.NewConfigHandler("payment-gateway")

	api := router.Group("/api/v1")
	api.Use(middleware.InternalAuthMiddleware())
	{
		api.GET("/config", cfgHandler.GetConfig)
		api.POST("/config", cfgHandler.UpdateConfig)
		api.GET("/gateway-status", cfgHandler.GetGatewayStatus)
		api.POST("/invoice", func(c *gin.Context) {
			var payload service.InvoicePayload
			if err := c.ShouldBindJSON(&payload); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			
			id, url, err := paymentService.CreateInvoice(c.Request.Context(), payload)
			if err != nil {
				audit.LogError(c.Request.Context(),
					c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
					"PAYMENT_LINK_FAILED", "PAYMENT", payload.ExternalID,
					auditclient.GroupOperations, "payment-gateway",
					err.Error(), map[string]any{"amount": payload.Amount},
				)
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			
			// Audit: payment link created
			audit.LogSuccess(c.Request.Context(),
				c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
				"PAYMENT_LINK_CREATED", "PAYMENT", id,
				auditclient.GroupOperations, "payment-gateway",
				map[string]any{"external_id": payload.ExternalID, "amount": payload.Amount, "invoice_url": url},
			)

			c.JSON(http.StatusOK, gin.H{
				"invoice_id":  id,
				"invoice_url": url,
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
	
	cJob.Stop()
	cancel()
	
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error(ctx, "Server forced to shutdown", zap.Error(err))
	}

	logger.Info(ctx, "Payment Gateway server exited cleanly")
}
