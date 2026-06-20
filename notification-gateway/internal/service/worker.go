package service

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"gateways/notification-gateway/internal/provider"
	"gateways/shared/logger"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Worker struct {
	rdb      *redis.Client
	provider provider.SMSProvider
}

func NewWorker(rdb *redis.Client, provider provider.SMSProvider) *Worker {
	return &Worker{
		rdb:      rdb,
		provider: provider,
	}
}

// CheckIdempotency checks if the key was already processed, sets it if not
func (w *Worker) CheckIdempotency(ctx context.Context, key string) (bool, error) {
	if key == "" {
		return true, nil
	}
	redisKey := "idempotency:notify:" + key
	success, err := w.rdb.SetNX(ctx, redisKey, "processed", 24*time.Hour).Result()
	return success, err
}

func (w *Worker) Enqueue(ctx context.Context, payload provider.NotificationPayload) error {
	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	
	return w.rdb.LPush(ctx, "queue:notification", data).Err()
}

func (w *Worker) Start(ctx context.Context) {
	logger.Info(ctx, "Starting background notification queue worker...")
	for {
		select {
		case <-ctx.Done():
			logger.Info(ctx, "Stopping notification worker...")
			return
		default:
			res, err := w.rdb.BRPop(ctx, 1*time.Second, "queue:notification").Result()
			if err != nil {
				if errors.Is(err, redis.Nil) {
					continue
				}
				logger.Error(ctx, "Redis queue pop error", zap.Error(err))
				time.Sleep(2 * time.Second)
				continue
			}
			
			if len(res) < 2 {
				continue
			}
			
			var payload provider.NotificationPayload
			if err := json.Unmarshal([]byte(res[1]), &payload); err != nil {
				logger.Error(ctx, "Failed to deserialize task", zap.Error(err))
				continue
			}
			
			msgID, err := w.provider.Send(ctx, payload)
			if err != nil {
				logger.Error(ctx, "Failed to deliver message via provider", 
					zap.Error(err), 
					zap.String("to", payload.To))
			} else {
				logger.Info(ctx, "Message successfully delivered", 
					zap.String("msg_id", msgID), 
					zap.String("to", payload.To))
			}
		}
	}
}
