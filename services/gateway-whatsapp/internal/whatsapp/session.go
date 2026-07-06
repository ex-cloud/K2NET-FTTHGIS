package whatsapp

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type SessionManager struct {
	rdb *redis.Client
}

func NewSessionManager(rdb *redis.Client) *SessionManager {
	return &SessionManager{rdb: rdb}
}

func getSessionKey(tenant, phone string) string {
	return fmt.Sprintf("wa:session:%s:%s", tenant, phone)
}

func (s *SessionManager) GetSessionState(ctx context.Context, tenant, phone string) (string, string, error) {
	key := getSessionKey(tenant, phone)
	val, err := s.rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		return "idle", "", nil
	} else if err != nil {
		return "", "", err
	}

	if strings.HasPrefix(val, "in_ticket:") {
		ticketID := strings.TrimPrefix(val, "in_ticket:")
		return "in_ticket", ticketID, nil
	}

	return val, "", nil
}

func (s *SessionManager) SetSessionState(ctx context.Context, tenant, phone, state, ticketID string) error {
	key := getSessionKey(tenant, phone)
	val := state
	if state == "in_ticket" && ticketID != "" {
		val = "in_ticket:" + ticketID
	}

	err := s.rdb.Set(ctx, key, val, 24*time.Hour).Err()
	if err != nil {
		return fmt.Errorf("failed to set session state in redis: %w", err)
	}

	return nil
}

func (s *SessionManager) ClearSession(ctx context.Context, tenant, phone string) error {
	key := getSessionKey(tenant, phone)
	err := s.rdb.Del(ctx, key).Err()
	if err != nil {
		return fmt.Errorf("failed to delete session from redis: %w", err)
	}
	return nil
}
