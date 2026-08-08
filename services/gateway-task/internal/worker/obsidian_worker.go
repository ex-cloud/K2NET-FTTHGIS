package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"gateways/gateway-task/internal/config"
	"gateways/gateway-task/internal/nextcloud"
	"gateways/gateway-task/internal/template"
	"gateways/shared/auditclient"

	"github.com/redis/go-redis/v9"
)

type ObsidianWorker struct {
	cfg       config.Config
	rdb       *redis.Client
	nextcloud *nextcloud.Client
	audit     *auditclient.Client
}

func NewObsidianWorker(cfg config.Config, rdb *redis.Client, nc *nextcloud.Client) *ObsidianWorker {
	return &ObsidianWorker{
		cfg:       cfg,
		rdb:       rdb,
		nextcloud: nc,
		audit:     auditclient.NewFromEnv(),
	}
}

func (w *ObsidianWorker) Start(ctx context.Context) {
	log.Println("[ObsidianWorker] Starting queue worker subscribing to 'obsidian:sync' list...")
	for {
		select {
		case <-ctx.Done():
			log.Println("[ObsidianWorker] Stopping queue worker...")
			return
		default:
			// BRPop with a timeout of 5 seconds to periodically check context cancellation
			result, err := w.rdb.BRPop(ctx, 5*time.Second, "obsidian:sync").Result()
			if err == redis.Nil {
				continue
			} else if err != nil {
				log.Printf("[ObsidianWorker] Redis BRPop error: %v. Retrying in 2s...\n", err)
				time.Sleep(2 * time.Second)
				continue
			}

			if len(result) < 2 {
				continue
			}

			payloadStr := result[1]
			log.Printf("[ObsidianWorker] Received sync task: %s\n", payloadStr)

			var payload template.TaskPayload
			if err := json.Unmarshal([]byte(payloadStr), &payload); err != nil {
				log.Printf("[ObsidianWorker] Failed to unmarshal payload: %v\n", err)
				continue
			}

			w.processTaskWithRetry(ctx, payload)
		}
	}
}

func (w *ObsidianWorker) processTaskWithRetry(ctx context.Context, payload template.TaskPayload) {
	vaultFolder := "K2NET_Engineering_Vault"
	var folder string
	if payload.TaskType == "PROJECT" {
		folder = "01_Projects"
	} else {
		folder = "02_Tickets"
	}

	// Nextcloud WebDAV destination path
	filePath := fmt.Sprintf("%s/%s/%s.md", vaultFolder, folder, payload.TaskID)

	content, err := template.RenderTask(payload)
	if err != nil {
		log.Printf("[ObsidianWorker] Failed to render template for %s: %v\n", payload.TaskID, err)
		w.logSyncError(ctx, payload, fmt.Errorf("render error: %w", err))
		return
	}

	maxRetries := 5
	backoff := 2 * time.Second

	for attempt := 1; attempt <= maxRetries; attempt++ {
		err = w.nextcloud.UploadFile(filePath, content)
		if err == nil {
			log.Printf("[ObsidianWorker] Successfully synced %s to Nextcloud path %s\n", payload.TaskID, filePath)
			w.logSyncSuccess(ctx, payload, filePath)
			return
		}

		log.Printf("[ObsidianWorker] Attempt %d/%d failed to upload %s: %v\n", attempt, maxRetries, payload.TaskID, err)
		if attempt < maxRetries {
			select {
			case <-ctx.Done():
				return
			case <-time.After(backoff):
				backoff *= 2
			}
		}
	}

	log.Printf("[ObsidianWorker] Failed to sync task %s after %d attempts\n", payload.TaskID, maxRetries)
	w.logSyncError(ctx, payload, fmt.Errorf("all %d upload attempts failed: %w", maxRetries, err))
}

func (w *ObsidianWorker) logSyncSuccess(ctx context.Context, payload template.TaskPayload, filePath string) {
	w.audit.LogSuccess(ctx,
		payload.TenantSlug,
		"gateway-task",
		"OBSIDIAN_FILE_SYNCED",
		"TASK",
		payload.TaskID,
		auditclient.GroupOperations,
		"gateway-task",
		map[string]any{
			"vaultPath": filePath,
			"taskType":  payload.TaskType,
		},
	)
}

func (w *ObsidianWorker) logSyncError(ctx context.Context, payload template.TaskPayload, err error) {
	w.audit.LogError(ctx,
		payload.TenantSlug,
		"gateway-task",
		"OBSIDIAN_SYNC_FAILED",
		"TASK",
		payload.TaskID,
		auditclient.GroupOperations,
		"gateway-task",
		err.Error(),
		nil,
	)
}
