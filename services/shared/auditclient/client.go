// Package auditclient provides a lightweight HTTP client for sending audit events
// to the K2NET gateway-audit service (port 5009).
//
// Design: fire-and-forget (async goroutine) — audit failures never block the caller.
//
// Usage:
//
//	client := auditclient.New(os.Getenv("AUDIT_GATEWAY_URL"), os.Getenv("GATEWAY_TOKEN"))
//	client.Log(ctx, auditclient.Event{
//	    TenantSlug:   tenantSlug,
//	    ActorID:      actorID,
//	    Action:       "NOTIFICATION_SENT",
//	    ResourceType: "NOTIFICATION",
//	    LogGroup:     auditclient.GroupOperations,
//	    ServiceSource: "notification-gateway",
//	    Metadata:     map[string]any{"channel": "SMS", "recipient": phone},
//	})
package auditclient

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"gateways/shared/httpclient"
	"gateways/shared/logger"
	"go.uber.org/zap"
)

// LogGroup constants — match frontend LOG_GROUPS keys
const (
	GroupCore       = "CORE"
	GroupOperations = "OPERATIONS"
	GroupNetwork    = "NETWORK"
	GroupMessaging  = "MESSAGING"
)

// Event is the payload sent to gateway-audit POST /api/v1/audit/events.
// Fields map directly to the AuditEvent model in gateway-audit.
type Event struct {
	TenantSlug    string         `json:"tenantSlug"`
	ActorID       string         `json:"actorId"`
	ActorRole     string         `json:"actorRole,omitempty"`
	ActorIP       string         `json:"actorIp,omitempty"`
	Action        string         `json:"action"`
	ResourceType  string         `json:"resourceType"`
	ResourceID    string         `json:"resourceId,omitempty"`
	OldValue      map[string]any `json:"oldValue,omitempty"`
	NewValue      map[string]any `json:"newValue,omitempty"`
	// Metadata is forwarded as-is. Include logGroup and serviceSource here
	// so the frontend can display them correctly.
	Metadata      map[string]any `json:"metadata,omitempty"`
}

// Client is a fire-and-forget audit event emitter.
type Client struct {
	baseURL      string
	gatewayToken string
	httpClient   *http.Client
	disabled     bool
}

// New creates an audit client. If auditURL is empty, the client is disabled (no-op).
func New(auditURL, gatewayToken string) *Client {
	if auditURL == "" {
		auditURL = os.Getenv("AUDIT_GATEWAY_URL")
	}
	if gatewayToken == "" {
		gatewayToken = os.Getenv("GATEWAY_TOKEN")
	}
	disabled := auditURL == ""
	return &Client{
		baseURL:      auditURL,
		gatewayToken: gatewayToken,
		httpClient:   httpclient.NewClient(5 * time.Second),
		disabled:     disabled,
	}
}

// NewFromEnv creates a client using AUDIT_GATEWAY_URL and GATEWAY_TOKEN env vars.
func NewFromEnv() *Client {
	return New("", "")
}

// Log sends an audit event asynchronously. Never panics, never blocks the caller.
// If the audit service is unreachable, the error is logged at WARN level and silently dropped.
func (c *Client) Log(ctx context.Context, event Event, logGroup, serviceSource string) {
	if c.disabled {
		return
	}

	// Enrich metadata with logGroup and serviceSource for frontend grouping
	if event.Metadata == nil {
		event.Metadata = make(map[string]any)
	}
	if logGroup != "" {
		event.Metadata["logGroup"] = logGroup
	}
	if serviceSource != "" {
		event.Metadata["serviceSource"] = serviceSource
	}
	event.Metadata["emittedAt"] = time.Now().UTC().Format(time.RFC3339)

	// Snapshot values before goroutine to avoid race on caller's stack
	payload := event
	url := c.baseURL + "/api/v1/audit/events"
	token := c.gatewayToken

	go func() {
		body, err := json.Marshal(payload)
		if err != nil {
			logger.Warn(context.Background(), "[auditclient] Failed to marshal event",
				zap.String("action", payload.Action), zap.Error(err))
			return
		}

		req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, url, bytes.NewReader(body))
		if err != nil {
			logger.Warn(context.Background(), "[auditclient] Failed to build request",
				zap.String("url", url), zap.Error(err))
			return
		}
		req.Header.Set("Content-Type", "application/json")
		if token != "" {
			req.Header.Set("X-Gateway-Token", token)
		}

		resp, err := c.httpClient.Do(req)
		if err != nil {
			logger.Warn(context.Background(), "[auditclient] Failed to send audit event",
				zap.String("action", payload.Action), zap.Error(err))
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 400 {
			logger.Warn(context.Background(), "[auditclient] Audit event rejected",
				zap.String("action", payload.Action), zap.Int("status", resp.StatusCode))
		}
	}()
}

// LogSuccess is a convenience helper for successful (INFO-level) events.
func (c *Client) LogSuccess(ctx context.Context, tenantSlug, actorID, action, resourceType, resourceID, logGroup, serviceSource string, metadata map[string]any) {
	e := Event{
		TenantSlug:   tenantSlug,
		ActorID:      actorID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Metadata:     metadata,
	}
	c.Log(ctx, e, logGroup, serviceSource)
}

// LogError is a convenience helper for failed/error events. Adds error detail to metadata.
func (c *Client) LogError(ctx context.Context, tenantSlug, actorID, action, resourceType, resourceID, logGroup, serviceSource, errMsg string, metadata map[string]any) {
	if metadata == nil {
		metadata = make(map[string]any)
	}
	metadata["error"] = errMsg
	metadata["status"] = "FAILED"
	e := Event{
		TenantSlug:   tenantSlug,
		ActorID:      actorID,
		Action:       action,
		ResourceType: resourceType,
		ResourceID:   resourceID,
		Metadata:     metadata,
	}
	c.Log(ctx, e, logGroup, serviceSource)
}
