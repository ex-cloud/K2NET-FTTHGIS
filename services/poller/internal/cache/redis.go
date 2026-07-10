package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/redis/go-redis/v9"
)

// StatusCache handles Redis operations for device status caching
type StatusCache struct {
	client *redis.Client
	ctx    context.Context
}

// DeviceStatus represents the status data stored in Redis
type DeviceStatus struct {
	Code      string                 `json:"code"`
	Status    string                 `json:"status"`
	Metrics   map[string]interface{} `json:"metrics,omitempty"`
	Timestamp time.Time              `json:"timestamp"`
}

// NewStatusCache creates a new Redis cache client
func NewStatusCache(addr, password string, db int) (*StatusCache, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	ctx := context.Background()

	// Test connection
	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("redis connection failed: %w", err)
	}

	log.Println("✅ Connected to Redis successfully")
	return &StatusCache{client: client, ctx: ctx}, nil
}

// SetStatus stores device status in Redis
func (sc *StatusCache) SetStatus(status *DeviceStatus) error {
	key := fmt.Sprintf("device:status:%s", status.Code)

	data, err := json.Marshal(status)
	if err != nil {
		return fmt.Errorf("failed to marshal status: %w", err)
	}

	// Store with 5 minute expiry (auto-cleanup if poller stops)
	if err := sc.client.Set(sc.ctx, key, data, 5*time.Minute).Err(); err != nil {
		return fmt.Errorf("failed to set status in Redis: %w", err)
	}

	log.Printf("📝 Cached status for %s: %s", status.Code, status.Status)
	return nil
}

// PublishStatusChange publishes status change event for real-time updates
func (sc *StatusCache) PublishStatusChange(status *DeviceStatus) error {
	channel := "network-events"

	data, err := json.Marshal(status)
	if err != nil {
		return fmt.Errorf("failed to marshal status: %w", err)
	}

	if err := sc.client.Publish(sc.ctx, channel, data).Err(); err != nil {
		return fmt.Errorf("failed to publish event: %w", err)
	}

	log.Printf("📢 Published status change for %s to channel '%s'", status.Code, channel)
	return nil
}

// GetStatus retrieves device status from Redis
func (sc *StatusCache) GetStatus(deviceCode string) (*DeviceStatus, error) {
	key := fmt.Sprintf("device:status:%s", deviceCode)

	data, err := sc.client.Get(sc.ctx, key).Bytes()
	if err == redis.Nil {
		return nil, nil // Not found
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get status from Redis: %w", err)
	}

	var status DeviceStatus
	if err := json.Unmarshal(data, &status); err != nil {
		return nil, fmt.Errorf("failed to unmarshal status: %w", err)
	}

	return &status, nil
}

// Close closes the Redis connection
func (sc *StatusCache) Close() error {
	return sc.client.Close()
}

// Ping tests the Redis connection
func (sc *StatusCache) Ping() error {
	return sc.client.Ping(sc.ctx).Err()
}

// ScanDeviceKeys scans Redis for all device:status:* keys and returns device codes
func (sc *StatusCache) ScanDeviceKeys(ctx context.Context, cursor uint64) (codes []string, nextCursor uint64, err error) {
	ks, next, err := sc.client.Scan(ctx, cursor, "device:status:*", 100).Result()
	if err != nil {
		return nil, 0, fmt.Errorf("failed to scan device keys: %w", err)
	}
	// Strip "device:status:" prefix to get bare device codes
	for _, k := range ks {
		code := k
		if len(k) > len("device:status:") {
			code = k[len("device:status:"):]
		}
		codes = append(codes, code)
	}
	return codes, next, nil
}
