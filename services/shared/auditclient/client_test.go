package auditclient

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"
)

func TestAuditClientDisabled(t *testing.T) {
	c := New("", "")
	if !c.disabled {
		t.Error("expected audit client without URL to be disabled")
	}

	// Logging to disabled client must be safe no-op without panicking
	c.Log(context.Background(), Event{Action: "TEST_ACTION"}, GroupCore, "test-service")
	c.LogSuccess(context.Background(), "isp-alpha", "actor-1", "LOGIN", "AUTH", "res-1", GroupCore, "test-service", nil)
	c.LogError(context.Background(), "isp-alpha", "actor-1", "LOGIN_FAILED", "AUTH", "res-1", GroupCore, "test-service", "bad password", nil)
}

func TestAuditClientSendEvent(t *testing.T) {
	var requestReceived int32
	var receivedEvent Event

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/audit/events" {
			t.Errorf("unexpected path: %s", r.URL.Path)
		}
		if r.Header.Get("X-Gateway-Token") != "my-audit-token" {
			t.Errorf("missing or invalid X-Gateway-Token: %s", r.Header.Get("X-Gateway-Token"))
		}

		var payload Event
		if err := json.NewDecoder(r.Body).Decode(&payload); err == nil {
			receivedEvent = payload
			atomic.StoreInt32(&requestReceived, 1)
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer server.Close()

	client := New(server.URL, "my-audit-token")
	if client.disabled {
		t.Fatal("expected audit client to be enabled")
	}

	ctx := context.Background()
	client.LogSuccess(
		ctx,
		"isp-alpha",
		"actor-user-99",
		"UPDATE_SETTINGS",
		"SYSTEM_SETTING",
		"setting-123",
		GroupOperations,
		"notification-gateway",
		map[string]any{"key": "app_name"},
	)

	// Wait for async goroutine
	time.Sleep(100 * time.Millisecond)

	if atomic.LoadInt32(&requestReceived) != 1 {
		t.Error("expected audit event to be dispatched to test server")
	}

	if receivedEvent.TenantSlug != "isp-alpha" {
		t.Errorf("expected TenantSlug isp-alpha, got %q", receivedEvent.TenantSlug)
	}
	if receivedEvent.Action != "UPDATE_SETTINGS" {
		t.Errorf("expected Action UPDATE_SETTINGS, got %q", receivedEvent.Action)
	}
	if receivedEvent.Metadata["logGroup"] != GroupOperations {
		t.Errorf("expected logGroup %q, got %v", GroupOperations, receivedEvent.Metadata["logGroup"])
	}
	if receivedEvent.Metadata["logType"] != "notification" {
		t.Errorf("expected logType notification, got %v", receivedEvent.Metadata["logType"])
	}
}
