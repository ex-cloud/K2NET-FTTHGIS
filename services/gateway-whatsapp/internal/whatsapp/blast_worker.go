package whatsapp

import (
	"context"
	"encoding/json"
	"strconv"
	"time"

	"gateways/shared/logger"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type BlastPayload struct {
	Phone        string `json:"phone"`
	Message      string `json:"message,omitempty"`
	TemplateName string `json:"templateName,omitempty"`
	Language     string `json:"language,omitempty"` // language code, e.g., "id"
	Components   []any  `json:"components,omitempty"`
}

type BlastWorker struct {
	rdb    *redis.Client
	client *Client
}

func NewBlastWorker(rdb *redis.Client, client *Client) *BlastWorker {
	return &BlastWorker{
		rdb:    rdb,
		client: client,
	}
}

func (w *BlastWorker) Start(ctx context.Context) {
	logger.Info(ctx, "Starting WhatsApp blast worker daemon...")
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Info(ctx, "Stopping WhatsApp blast worker...")
			return
		case <-ticker.C:
			w.pollQueues(ctx)
		}
	}
}

func (w *BlastWorker) pollQueues(ctx context.Context) {
	// Scan active blast queues matching "wa:blast:*"
	var cursor uint64
	for {
		keys, nextCursor, err := w.rdb.Scan(ctx, cursor, "wa:blast:*", 50).Result()
		if err != nil {
			logger.Error(ctx, "Failed to scan Redis for blast queues", zap.Error(err))
			break
		}

		for _, key := range keys {
			// Extract tenant slug from key format: wa:blast:{tenantSlug}
			// Let's pop messages from this queue
			w.processQueue(ctx, key)
		}

		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}
}

func (w *BlastWorker) processQueue(ctx context.Context, queueKey string) {
	// Extract tenant name
	// e.g., "wa:blast:garut" -> "garut"
	tenant := queueKey[len("wa:blast:"):]

	for {
		// Check rate limit for this tenant first
		allowed, err := w.checkRateLimit(ctx, tenant)
		if err != nil {
			logger.Error(ctx, "Rate limit check failed", zap.String("tenant", tenant), zap.Error(err))
			break
		}
		if !allowed {
			// Rate limit exceeded, skip this queue for this tick
			break
		}

		// Pop a message from the queue
		val, err := w.rdb.LPop(ctx, queueKey).Result()
		if err == redis.Nil {
			// Queue is empty
			break
		} else if err != nil {
			logger.Error(ctx, "Failed to pop message from queue", zap.String("key", queueKey), zap.Error(err))
			break
		}

		var payload BlastPayload
		if err := json.Unmarshal([]byte(val), &payload); err != nil {
			logger.Error(ctx, "Failed to unmarshal blast payload", zap.String("value", val), zap.Error(err))
			continue
		}

		// Execute sending in goroutine to not block the main polling cycle
		go func(p BlastPayload) {
			sendCtx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
			defer cancel()

			var err error
			if p.TemplateName != "" {
				err = w.client.SendTemplate(sendCtx, p.Phone, p.TemplateName, p.Language, p.Components)
			} else {
				err = w.client.SendText(sendCtx, p.Phone, p.Message)
			}

			if err != nil {
				logger.Error(sendCtx, "Failed to send blast message", zap.String("phone", p.Phone), zap.Error(err))
				// Optionally enqueue to a failed queue or retry
			}
		}(payload)
	}
}

// checkRateLimit enforces 60 messages/sec sliding window via ZSet in Redis
func (w *BlastWorker) checkRateLimit(ctx context.Context, tenant string) (bool, error) {
	key := "wa:ratelimit:" + tenant
	limit := int64(60) // Max 60 messages per second

	now := time.Now().UnixNano()
	clearBefore := now - int64(time.Second)

	pipe := w.rdb.TxPipeline()
	pipe.ZRemRangeByScore(ctx, key, "0", strconv.FormatInt(clearBefore, 10))
	pipe.ZCard(ctx, key)
	pipe.ZAdd(ctx, key, redis.Z{Score: float64(now), Member: strconv.FormatInt(now, 10)})
	pipe.Expire(ctx, key, 3*time.Second)

	cmds, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return false, err
	}

	count := cmds[1].(*redis.IntCmd).Val()
	if count > limit {
		return false, nil
	}

	return true, nil
}
