package service

import (
	"context"
	"testing"

	"gateways/notification-gateway/internal/provider"
)

type mockSMSProvider struct {
	sentPayloads []provider.NotificationPayload
}

func (m *mockSMSProvider) Send(ctx context.Context, payload provider.NotificationPayload) (string, error) {
	m.sentPayloads = append(m.sentPayloads, payload)
	return "mock-msg-id-001", nil
}

func TestWorkerInstantiation(t *testing.T) {
	mockProv := &mockSMSProvider{}
	w := NewWorker(nil, mockProv)

	if w == nil {
		t.Fatal("expected non-nil Worker instance")
	}

	if w.provider == nil {
		t.Fatal("expected non-nil provider inside Worker")
	}

	// Test check idempotency with empty key
	unique, err := w.CheckIdempotency(context.Background(), "")
	if err != nil {
		t.Errorf("expected no error for empty idempotency key, got %v", err)
	}
	if !unique {
		t.Error("expected true for empty idempotency key")
	}
}
