package delivery

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"gateways/notification-gateway/internal/provider"
	"gateways/notification-gateway/internal/service"
	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type HTTPHandler struct {
	worker *service.Worker
	rdb    *redis.Client
}

func NewHTTPHandler(worker *service.Worker, rdb *redis.Client) *HTTPHandler {
	return &HTTPHandler{
		worker: worker,
		rdb:    rdb,
	}
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Log successful notification to Redis
	h.appendNotificationLog(c, payload, "sent", "")
	
	c.JSON(http.StatusAccepted, gin.H{
		"status": "Accepted",
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
