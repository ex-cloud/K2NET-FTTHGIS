package delivery

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"gateways/notification-gateway/internal/provider"
	"gateways/notification-gateway/internal/service"
	"gateways/notification-gateway/internal/templates"
	"gateways/shared/auditclient"
	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type HTTPHandler struct {
	worker      *service.Worker
	rdb         *redis.Client
	audit       *auditclient.Client
	emailSender EmailSender
}

func NewHTTPHandler(worker *service.Worker, rdb *redis.Client) *HTTPHandler {
	return &HTTPHandler{
		worker:      worker,
		rdb:         rdb,
		audit:       auditclient.NewFromEnv(),
		emailSender: NewSMTPEmailSender(),
	}
}

func (h *HTTPHandler) SetEmailSender(sender EmailSender) {
	h.emailSender = sender
}

// RateLimiter implements a sliding-window rate limiting algorithm using Redis
func (h *HTTPHandler) RateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := c.Request.Context()
		clientIP := c.ClientIP()
		
		key := "ratelimit:" + clientIP
		limit := int64(30) // Allow max 30 requests per minute
		
		now := time.Now().UnixNano()
		clearBefore := now - int64(60*time.Second)
		
		pipe := h.rdb.TxPipeline()
		pipe.ZRemRangeByScore(ctx, key, "0", strconv.FormatInt(clearBefore, 10))
		pipe.ZCard(ctx, key)
		pipe.ZAdd(ctx, key, redis.Z{Score: float64(now), Member: strconv.FormatInt(now, 10)})
		pipe.Expire(ctx, key, 70*time.Second)
		
		cmds, err := pipe.Exec(ctx)
		if err != nil && err != redis.Nil {
			logger.Error(ctx, "Rate limit Redis error", zap.Error(err))
			c.Next()
			return
		}
		
		count := cmds[1].(*redis.IntCmd).Val()
		if count > limit {
			logger.Warn(ctx, "Rate limit exceeded", zap.String("ip", clientIP))
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Max 30 requests/minute.",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

func (h *HTTPHandler) SendNotification(c *gin.Context) {
	ctx := c.Request.Context()
	
	var payload provider.NotificationPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	idempotencyKey := c.GetHeader("X-Idempotency-Key")
	if idempotencyKey != "" {
		unique, err := h.worker.CheckIdempotency(ctx, idempotencyKey)
		if err != nil {
			logger.Error(ctx, "Idempotency check failed", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}
		if !unique {
			logger.Warn(ctx, "Duplicate request blocked", zap.String("key", idempotencyKey))
			c.JSON(http.StatusConflict, gin.H{"error": "Duplicate request blocked by idempotency check"})
			return
		}
	}
	
	if err := h.worker.Enqueue(ctx, payload); err != nil {
		// Log failed notification to Redis
		h.appendNotificationLog(c, payload, "failed", err.Error())
		logger.Error(ctx, "Failed to enqueue notification task", zap.Error(err))
		// Audit: persist failure event to gateway-audit
		h.audit.LogError(ctx,
			c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
			"NOTIFICATION_FAILED", "NOTIFICATION", "",
			auditclient.GroupOperations, "notification-gateway",
			err.Error(), map[string]any{"channel": string(payload.Type), "recipient": payload.To},
		)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Log successful notification to Redis
	h.appendNotificationLog(c, payload, "sent", "")
	// Audit: persist success event to gateway-audit
	h.audit.LogSuccess(ctx,
		c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
		"NOTIFICATION_SENT", "NOTIFICATION", "",
		auditclient.GroupOperations, "notification-gateway",
		map[string]any{"channel": string(payload.Type), "recipient": payload.To},
	)

	c.JSON(http.StatusAccepted, gin.H{
		"status":  "Accepted",
		"message": "Notification enqueued asynchronously",
	})
}

// appendNotificationLog pushes a log entry to Redis list gateway:notification:logs (max 50 entries)
func (h *HTTPHandler) appendNotificationLog(c *gin.Context, payload provider.NotificationPayload, status, errMsg string) {
	ctx := c.Request.Context()
	type logEntry struct {
		ID           string `json:"id"`
		Channel      string `json:"channel"`
		Recipient    string `json:"recipient"`
		Subject      string `json:"subject,omitempty"`
		Status       string `json:"status"`
		ErrorMessage string `json:"errorMessage,omitempty"`
		SentAt       string `json:"sentAt"`
	}

	entry := logEntry{
		ID:           fmt.Sprintf("%d", time.Now().UnixNano()),
		Channel:      string(payload.Type),
		Recipient:    payload.To,
		Subject:      payload.Body,
		Status:       status,
		ErrorMessage: errMsg,
		SentAt:       time.Now().UTC().Format(time.RFC3339),
	}

	data, err := json.Marshal(entry)
	if err != nil {
		return
	}

	pipe := h.rdb.TxPipeline()
	pipe.LPush(ctx, "gateway:notification:logs", string(data))
	pipe.LTrim(ctx, "gateway:notification:logs", 0, 49) // Keep last 50 entries
	if _, err := pipe.Exec(ctx); err != nil {
		logger.Error(ctx, "Failed to push notification log to Redis", zap.Error(err))
	}
}

// GetNotificationLogs reads the last 50 notification logs from Redis list
func (h *HTTPHandler) GetNotificationLogs(c *gin.Context) {
	ctx := c.Request.Context()

	items, err := h.rdb.LRange(ctx, "gateway:notification:logs", 0, 49).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"code": "REDIS_ERROR", "message": err.Error()},
		})
		return
	}

	type logEntry struct {
		ID           string `json:"id"`
		Channel      string `json:"channel"`
		Recipient    string `json:"recipient"`
		Subject      string `json:"subject,omitempty"`
		Status       string `json:"status"`
		ErrorMessage string `json:"errorMessage,omitempty"`
		SentAt       string `json:"sentAt"`
	}

	var logs []logEntry
	for _, item := range items {
		var entry logEntry
		if err := json.Unmarshal([]byte(item), &entry); err != nil {
			continue
		}
		logs = append(logs, entry)
	}
	if logs == nil {
		logs = []logEntry{}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    logs,
	})
}

// GetStats returns dynamically calculated statistics from Redis logs and environment configuration
func (h *HTTPHandler) GetStats(c *gin.Context) {
	ctx := c.Request.Context()

	items, err := h.rdb.LRange(ctx, "gateway:notification:logs", 0, -1).Result()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalSent := 0
	totalFailed := 0

	type logEntry struct {
		ID           string `json:"id"`
		Channel      string `json:"channel"`
		Recipient    string `json:"recipient"`
		Subject      string `json:"subject,omitempty"`
		Status       string `json:"status"`
		ErrorMessage string `json:"errorMessage,omitempty"`
		SentAt       string `json:"sentAt"`
	}

	var recentQueue []logEntry
	for _, item := range items {
		var entry logEntry
		if err := json.Unmarshal([]byte(item), &entry); err != nil {
			continue
		}
		if entry.Status == "sent" {
			totalSent++
		} else if entry.Status == "failed" {
			totalFailed++
		}
		if len(recentQueue) < 20 {
			recentQueue = append(recentQueue, entry)
		}
	}

	if recentQueue == nil {
		recentQueue = []logEntry{}
	}

	deliveryRate := 100.0
	if totalSent+totalFailed > 0 {
		deliveryRate = float64(totalSent) / float64(totalSent+totalFailed) * 100.0
	}

	queueDepth, _ := h.rdb.LLen(ctx, "gateway:notification:queue").Result()

	twilioConfigured := os.Getenv("TWILIO_ACCOUNT_SID") != ""
	smtpConfigured := os.Getenv("SMTP_HOST") != ""

	wabaStatus := "NOT_CONFIGURED"
	if twilioConfigured {
		wabaStatus = "CONFIGURED"
	}

	c.JSON(http.StatusOK, gin.H{
		"queue_depth":          queueDepth,
		"delivery_rate_24h":   deliveryRate,
		"total_sent_24h":      totalSent,
		"total_delivered_24h": totalSent,
		"total_failed_24h":    totalFailed,
		"waba_status":         wabaStatus,
		"twilio_configured":   twilioConfigured,
		"smtp_configured":     smtpConfigured,
		"status":              "healthy",
		"recent_queue":        recentQueue,
	})
}

type TestEmailRequest struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
}

// SendTestEmail sends an immediate test email to verify SMTP configuration
func (h *HTTPHandler) SendTestEmail(c *gin.Context) {
	ctx := c.Request.Context()

	var req TestEmailRequest
	_ = c.ShouldBindJSON(&req)

	to := strings.TrimSpace(req.To)
	if to == "" {
		to = os.Getenv("SMTP_USER")
	}
	if to == "" {
		to = "notify@kdua.net"
	}

	subject := strings.TrimSpace(req.Subject)
	if subject == "" {
		subject = "[K2NET TEST] SMTP Gateway Connection Verified"
	}

	sender := NewSMTPEmailSender()
	if !sender.IsConfigured() {
		errMsg := "SMTP Gateway is not fully configured (missing SMTP_HOST, SMTP_USER, or SMTP_PASSWORD)"
		logger.Warn(ctx, errMsg)
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   errMsg,
		})
		return
	}

	htmlBody := fmt.Sprintf(`<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
  <h2 style="color: #09090b; margin-top: 0;">K2NET SMTP Gateway Test</h2>
  <p style="color: #71717a; font-size: 14px;">This is an automated test message dispatched from the K2NET Platform Admin Console (<code>/gateways/notification</code>).</p>
  <div style="background-color: #f4f4f5; padding: 12px 16px; border-radius: 6px; font-size: 13px; color: #18181b; line-height: 1.6;">
    <strong>Status:</strong> Connected &amp; Authenticated<br>
    <strong>SMTP Host:</strong> %s:%d<br>
    <strong>Timestamp:</strong> %s<br>
    <strong>Service:</strong> notification-gateway (:5001)
  </div>
  <p style="color: #a1a1aa; font-size: 12px; margin-top: 20px;">If you received this message, your SMTP credentials and TLS/SSL encryption are fully operational.</p>
</div>`, sender.host, sender.port, time.Now().UTC().Format(time.RFC3339))

	err := sender.Send(ctx, to, subject, htmlBody)
	payload := provider.NotificationPayload{
		Type:    provider.TypeEmail,
		To:      to,
		Subject: subject,
		Body:    subject,
	}

	if err != nil {
		h.appendNotificationLog(c, payload, "failed", err.Error())
		h.audit.LogError(ctx,
			c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
			"SMTP_TEST_FAILED", "NOTIFICATION", "",
			auditclient.GroupOperations, "notification-gateway",
			err.Error(), map[string]any{"to": to, "subject": subject},
		)
		logger.Error(ctx, "Failed to send test email", zap.Error(err), zap.String("to", to))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	h.appendNotificationLog(c, payload, "sent", "")
	h.audit.LogSuccess(ctx,
		c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
		"SMTP_TEST_SENT", "NOTIFICATION", "",
		auditclient.GroupOperations, "notification-gateway",
		map[string]any{"to": to, "subject": subject},
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Test email sent successfully to %s", to),
	})
}

// ActivationEmailRequest holds parameters for sending an onboarding activation email
type ActivationEmailRequest struct {
	To            string `json:"to" binding:"required"`
	RecipientName string `json:"recipient_name"`
	OrgName       string `json:"org_name"`
	Subdomain     string `json:"subdomain"`
	ActivationURL string `json:"activation_url" binding:"required"`
	ExpiresIn     string `json:"expires_in"`
	Lang          string `json:"lang"`
}

// SendActivationEmail renders and dispatches a workspace activation email
func (h *HTTPHandler) SendActivationEmail(c *gin.Context) {
	ctx := c.Request.Context()

	var req ActivationEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid activation request payload: " + err.Error(),
		})
		return
	}

	subject, htmlBody, err := templates.RenderActivationEmail(templates.ActivationEmailData{
		RecipientName: req.RecipientName,
		OrgName:       req.OrgName,
		Subdomain:     req.Subdomain,
		ActivationURL: req.ActivationURL,
		ExpiresIn:     req.ExpiresIn,
		Lang:          req.Lang,
	})
	if err != nil {
		logger.Error(ctx, "Failed rendering activation email template", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Template rendering failed: " + err.Error(),
		})
		return
	}

	sender := NewSMTPEmailSender()
	if !sender.IsConfigured() {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false,
			"error":   "SMTP Gateway is not configured",
		})
		return
	}

	sendErr := sender.Send(ctx, req.To, subject, htmlBody)
	payload := provider.NotificationPayload{
		Type:    provider.TypeEmail,
		To:      req.To,
		Subject: subject,
		Body:    subject,
	}

	if sendErr != nil {
		h.appendNotificationLog(c, payload, "failed", sendErr.Error())
		h.audit.LogError(ctx,
			c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
			"EMAIL_ACTIVATION_FAILED", "NOTIFICATION", "",
			auditclient.GroupOperations, "notification-gateway",
			sendErr.Error(), map[string]any{"to": req.To, "org": req.OrgName},
		)
		logger.Error(ctx, "Failed to send activation email", zap.Error(sendErr), zap.String("to", req.To))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   sendErr.Error(),
		})
		return
	}

	h.appendNotificationLog(c, payload, "sent", "")
	h.audit.LogSuccess(ctx,
		c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
		"EMAIL_ACTIVATION_SENT", "NOTIFICATION", "",
		auditclient.GroupOperations, "notification-gateway",
		map[string]any{"to": req.To, "org": req.OrgName},
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Activation email dispatched to %s", req.To),
	})
}

// PasswordResetEmailRequest holds parameters for sending a self-service password reset email
type PasswordResetEmailRequest struct {
	To            string `json:"to" binding:"required"`
	RecipientName string `json:"recipient_name"`
	ResetURL      string `json:"reset_url" binding:"required"`
	ExpiresIn     string `json:"expires_in"`
	ClientIP      string `json:"client_ip"`
	Lang          string `json:"lang"`
}

// SendPasswordResetEmail renders and dispatches a password recovery email
func (h *HTTPHandler) SendPasswordResetEmail(c *gin.Context) {
	ctx := c.Request.Context()

	var req PasswordResetEmailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Invalid password reset request payload: " + err.Error(),
		})
		return
	}

	clientIP := req.ClientIP
	if clientIP == "" {
		clientIP = c.ClientIP()
	}

	subject, htmlBody, err := templates.RenderPasswordResetEmail(templates.PasswordResetEmailData{
		RecipientName: req.RecipientName,
		ResetURL:      req.ResetURL,
		ExpiresIn:     req.ExpiresIn,
		ClientIP:      clientIP,
		Lang:          req.Lang,
	})
	if err != nil {
		logger.Error(ctx, "Failed rendering password reset email template", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   "Template rendering failed: " + err.Error(),
		})
		return
	}

	sender := NewSMTPEmailSender()
	if !sender.IsConfigured() {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"success": false,
			"error":   "SMTP Gateway is not configured",
		})
		return
	}

	sendErr := sender.Send(ctx, req.To, subject, htmlBody)
	payload := provider.NotificationPayload{
		Type:    provider.TypeEmail,
		To:      req.To,
		Subject: subject,
		Body:    subject,
	}

	if sendErr != nil {
		h.appendNotificationLog(c, payload, "failed", sendErr.Error())
		h.audit.LogError(ctx,
			c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
			"EMAIL_RESET_PASSWORD_FAILED", "NOTIFICATION", "",
			auditclient.GroupOperations, "notification-gateway",
			sendErr.Error(), map[string]any{"to": req.To},
		)
		logger.Error(ctx, "Failed to send password reset email", zap.Error(sendErr), zap.String("to", req.To))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   sendErr.Error(),
		})
		return
	}

	h.appendNotificationLog(c, payload, "sent", "")
	h.audit.LogSuccess(ctx,
		c.GetHeader("X-Tenant-ID"), c.GetHeader("X-Actor-ID"),
		"EMAIL_RESET_PASSWORD_SENT", "NOTIFICATION", "",
		auditclient.GroupOperations, "notification-gateway",
		map[string]any{"to": req.To},
	)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": fmt.Sprintf("Password reset email dispatched to %s", req.To),
	})
}




