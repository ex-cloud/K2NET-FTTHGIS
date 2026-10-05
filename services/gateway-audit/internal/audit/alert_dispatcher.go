package audit

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type AlertConfig struct {
	Enabled                bool     `json:"enabled"`
	WebhookURL             string   `json:"webhookUrl"`
	WebhookType            string   `json:"webhookType"` // "generic", "slack", "discord", "telegram"
	SecretKey              string   `json:"secretKey"`
	NotificationGatewayURL string   `json:"notificationGatewayUrl"`
	EnableEmail            bool     `json:"enableEmail"`
	AlertEmail             string   `json:"alertEmail"`
	EnableWhatsApp         bool     `json:"enableWhatsApp"`
	AlertPhone             string   `json:"alertPhone"`
	CooldownSeconds        int      `json:"cooldownSeconds"`
	MinSeverity            string   `json:"minSeverity"` // "CRITICAL", "ERROR"
	HighRiskActions        []string `json:"highRiskActions"`
}

type IncidentAlertPayload struct {
	EventID        string         `json:"eventId"`
	OccurredAt     time.Time      `json:"occurredAt"`
	TenantSlug     string         `json:"tenantSlug"`
	ActorID        string         `json:"actorId"`
	ActorRole      string         `json:"actorRole"`
	ActorIP        string         `json:"actorIp"`
	Action         string         `json:"action"`
	ResourceType   string         `json:"resourceType"`
	ResourceID     string         `json:"resourceId"`
	Severity       string         `json:"severity"`
	LogGroup       string         `json:"logGroup"`
	ServiceSource  string         `json:"serviceSource"`
	Reason         string         `json:"reason"`
	SuppressedHits int64          `json:"suppressedHits,omitempty"`
	Metadata       map[string]any `json:"metadata,omitempty"`
}

type AlertTestResult struct {
	Success        bool   `json:"success"`
	Channel        string `json:"channel"`
	Target         string `json:"target"`
	ResponseCode   int    `json:"responseCode"`
	ResponseStatus string `json:"responseStatus"`
	LatencyMs      int64  `json:"latencyMs"`
	Error          string `json:"error,omitempty"`
}

type cooldownEntry struct {
	lastTriggered time.Time
	suppressed    int64
}

type AlertDispatcher struct {
	mu          sync.RWMutex
	cfg         AlertConfig
	configPath  string
	cooldownMu  sync.Mutex
	cooldownMap map[string]*cooldownEntry
	httpClient  *http.Client
	eventQueue  chan *IncidentAlertPayload
	stopChan    chan struct{}
	wg          sync.WaitGroup
}

func DefaultAlertConfig() AlertConfig {
	return AlertConfig{
		Enabled:                true,
		WebhookURL:             "",
		WebhookType:            "generic",
		SecretKey:              "",
		NotificationGatewayURL: "http://notification-gateway:5001",
		EnableEmail:            false,
		AlertEmail:             "soc-admin@k2net.id",
		EnableWhatsApp:         false,
		AlertPhone:             "",
		CooldownSeconds:        30,
		MinSeverity:            "CRITICAL",
		HighRiskActions: []string{
			"impersonation.stepup_failed",
			"impersonation.unauthorized_attempt",
			"impersonation.force_revoked",
			"auth.tamper_detected",
			"system.security.tamper_detected",
			"tenant.suspend",
			"security.pii_violation",
			"auth.brute_force",
			"system.config.critical_mutation",
			"backup.destructive_purge",
		},
	}
}

func NewAlertDispatcher(configDir string) *AlertDispatcher {
	if configDir == "" {
		configDir = "/opt/project5/backups/config"
	}
	_ = os.MkdirAll(configDir, 0755)
	configPath := filepath.Join(configDir, "audit_alerts.json")

	dispatcher := &AlertDispatcher{
		cfg:         DefaultAlertConfig(),
		configPath:  configPath,
		cooldownMap: make(map[string]*cooldownEntry),
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
		eventQueue: make(chan *IncidentAlertPayload, 500),
		stopChan:   make(chan struct{}),
	}

	dispatcher.loadConfig()
	dispatcher.startWorker()

	return dispatcher
}

func (d *AlertDispatcher) loadConfig() {
	d.mu.Lock()
	defer d.mu.Unlock()

	data, err := os.ReadFile(d.configPath)
	if err != nil {
		return
	}

	var loaded AlertConfig
	if err := json.Unmarshal(data, &loaded); err == nil {
		if loaded.CooldownSeconds <= 0 {
			loaded.CooldownSeconds = 30
		}
		if loaded.MinSeverity == "" {
			loaded.MinSeverity = "CRITICAL"
		}
		if loaded.NotificationGatewayURL == "" {
			loaded.NotificationGatewayURL = "http://notification-gateway:5001"
		}
		d.cfg = loaded
	}
}

func (d *AlertDispatcher) SaveConfig(newCfg AlertConfig) error {
	d.mu.Lock()
	defer d.mu.Unlock()

	if newCfg.CooldownSeconds <= 0 {
		newCfg.CooldownSeconds = 30
	}
	if newCfg.MinSeverity == "" {
		newCfg.MinSeverity = "CRITICAL"
	}
	if newCfg.NotificationGatewayURL == "" {
		newCfg.NotificationGatewayURL = "http://notification-gateway:5001"
	}

	data, err := json.MarshalIndent(newCfg, "", "  ")
	if err != nil {
		return err
	}

	if err := os.WriteFile(d.configPath, data, 0644); err != nil {
		// Non-fatal if backup directory is read-only, keep in-memory
	}

	d.cfg = newCfg
	return nil
}

func (d *AlertDispatcher) GetConfig() AlertConfig {
	d.mu.RLock()
	defer d.mu.RUnlock()
	return d.cfg
}

// ShouldAlert evaluates if the given audit event qualifies as an incident
func (d *AlertDispatcher) ShouldAlert(req *CreateAuditEventRequest) (bool, string) {
	d.mu.RLock()
	cfg := d.cfg
	d.mu.RUnlock()

	if !cfg.Enabled {
		return false, ""
	}

	severity := "INFO"
	if req.Metadata != nil {
		if s, ok := req.Metadata["severity"].(string); ok && s != "" {
			severity = strings.ToUpper(s)
		}
	}

	// 1. Direct Critical Severity Check
	if severity == "CRITICAL" {
		return true, "Critical severity incident detected"
	}

	// 2. High-Risk Action Pattern Matching
	actionLower := strings.ToLower(req.Action)
	for _, highRisk := range cfg.HighRiskActions {
		if strings.Contains(actionLower, strings.ToLower(highRisk)) {
			return true, fmt.Sprintf("High-risk security action detected: %s", highRisk)
		}
	}

	// 3. Optional Error Severity Trigger
	if cfg.MinSeverity == "ERROR" && severity == "ERROR" {
		return true, "Error severity threshold met"
	}

	return false, ""
}

// Dispatch evaluates and non-blockingly queues incident notifications
func (d *AlertDispatcher) Dispatch(req *CreateAuditEventRequest, occurredAt time.Time) {
	shouldAlert, reason := d.ShouldAlert(req)
	if !shouldAlert {
		return
	}

	d.mu.RLock()
	cooldownDuration := time.Duration(d.cfg.CooldownSeconds) * time.Second
	d.mu.RUnlock()

	severity := "INFO"
	logGroup := "CORE"
	serviceSource := ""
	if req.Metadata != nil {
		if s, ok := req.Metadata["severity"].(string); ok {
			severity = strings.ToUpper(s)
		}
		if g, ok := req.Metadata["logGroup"].(string); ok {
			logGroup = g
		}
		if src, ok := req.Metadata["serviceSource"].(string); ok {
			serviceSource = src
		}
	}

	// Sliding Window Cooldown Key
	cooldownKey := fmt.Sprintf("%s:%s:%s", req.TenantSlug, req.Action, severity)

	d.cooldownMu.Lock()
	entry, exists := d.cooldownMap[cooldownKey]
	now := time.Now()
	if exists && now.Sub(entry.lastTriggered) < cooldownDuration {
		entry.suppressed++
		d.cooldownMu.Unlock()
		return
	}

	suppressedHits := int64(0)
	if exists {
		suppressedHits = entry.suppressed
	}
	d.cooldownMap[cooldownKey] = &cooldownEntry{
		lastTriggered: now,
		suppressed:    0,
	}
	d.cooldownMu.Unlock()

	payload := &IncidentAlertPayload{
		EventID:        fmt.Sprintf("inc-%d", now.UnixNano()),
		OccurredAt:     occurredAt,
		TenantSlug:     req.TenantSlug,
		ActorID:        req.ActorID,
		ActorRole:      req.ActorRole,
		ActorIP:        req.ActorIP,
		Action:         req.Action,
		ResourceType:   req.ResourceType,
		ResourceID:     req.ResourceID,
		Severity:       severity,
		LogGroup:       logGroup,
		ServiceSource:  serviceSource,
		Reason:         reason,
		SuppressedHits: suppressedHits,
		Metadata:       req.Metadata,
	}

	select {
	case d.eventQueue <- payload:
	default:
		// Queue saturated, drop gracefully to avoid blocking ingestion pipeline
	}
}

func (d *AlertDispatcher) startWorker() {
	d.wg.Add(1)
	go func() {
		defer d.wg.Done()
		for {
			select {
			case <-d.stopChan:
				return
			case payload := <-d.eventQueue:
				d.processIncident(payload)
			}
		}
	}()
}

func (d *AlertDispatcher) processIncident(payload *IncidentAlertPayload) {
	d.mu.RLock()
	cfg := d.cfg
	d.mu.RUnlock()

	// 1. Dispatch Webhook
	if cfg.WebhookURL != "" {
		_ = d.sendWebhook(cfg, payload)
	}

	// 2. Dispatch Email via Notification Gateway
	if cfg.EnableEmail && cfg.AlertEmail != "" {
		_ = d.sendNotificationGateway(cfg, "email", cfg.AlertEmail, payload)
	}

	// 3. Dispatch WhatsApp via Notification Gateway
	if cfg.EnableWhatsApp && cfg.AlertPhone != "" {
		_ = d.sendNotificationGateway(cfg, "whatsapp", cfg.AlertPhone, payload)
	}
}

func (d *AlertDispatcher) sendWebhook(cfg AlertConfig, payload *IncidentAlertPayload) error {
	var body []byte
	var contentType string = "application/json"

	switch strings.ToLower(cfg.WebhookType) {
	case "slack":
		slackMsg := map[string]any{
			"text": fmt.Sprintf("🚨 *[CRITICAL AUDIT INCIDENT]* %s\n*Actor:* `%s` | *Tenant:* `%s` | *Action:* `%s`",
				payload.Reason, payload.ActorID, payload.TenantSlug, payload.Action),
			"attachments": []map[string]any{
				{
					"color": "#EF4444",
					"fields": []map[string]any{
						{"title": "Severity", "value": payload.Severity, "short": true},
						{"title": "Log Group", "value": payload.LogGroup, "short": true},
						{"title": "Actor IP", "value": payload.ActorIP, "short": true},
						{"title": "Resource", "value": fmt.Sprintf("%s (%s)", payload.ResourceType, payload.ResourceID), "short": true},
						{"title": "Occurred At", "value": payload.OccurredAt.Format(time.RFC3339), "short": false},
					},
				},
			},
		}
		body, _ = json.Marshal(slackMsg)

	case "discord":
		discordMsg := map[string]any{
			"content": fmt.Sprintf("🚨 **[CRITICAL AUDIT INCIDENT]** %s", payload.Reason),
			"embeds": []map[string]any{
				{
					"title":       fmt.Sprintf("Action: %s", payload.Action),
					"description": fmt.Sprintf("Actor: `%s` | Tenant: `%s`", payload.ActorID, payload.TenantSlug),
					"color":       15673636, // Red
					"fields": []map[string]any{
						{"name": "Severity", "value": payload.Severity, "inline": true},
						{"name": "Log Group", "value": payload.LogGroup, "inline": true},
						{"name": "Actor IP", "value": payload.ActorIP, "inline": true},
						{"name": "Resource ID", "value": payload.ResourceID, "inline": true},
					},
					"timestamp": payload.OccurredAt.Format(time.RFC3339),
				},
			},
		}
		body, _ = json.Marshal(discordMsg)

	case "telegram":
		text := fmt.Sprintf("🚨 *CRITICAL AUDIN INCIDENT*\n\n*Reason:* %s\n*Actor:* `%s`\n*Tenant:* `%s`\n*Action:* `%s`\n*Severity:* `%s`\n*Time:* %s",
			payload.Reason, payload.ActorID, payload.TenantSlug, payload.Action, payload.Severity, payload.OccurredAt.Format(time.RFC3339))
		tgMsg := map[string]any{
			"text":       text,
			"parse_mode": "Markdown",
		}
		body, _ = json.Marshal(tgMsg)

	default: // Generic JSON Webhook
		body, _ = json.Marshal(payload)
	}

	req, err := http.NewRequestWithContext(context.Background(), "POST", cfg.WebhookURL, bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", contentType)
	req.Header.Set("User-Agent", "K2NET-Audit-Alert-Dispatcher/1.0")
	req.Header.Set("X-Incident-Severity", payload.Severity)

	// HMAC-SHA256 Payload Signature
	if cfg.SecretKey != "" {
		mac := hmac.New(sha256.New, []byte(cfg.SecretKey))
		mac.Write(body)
		signature := hex.EncodeToString(mac.Sum(nil))
		req.Header.Set("X-Audit-Signature", "sha256="+signature)
	}

	resp, err := d.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("webhook responded with HTTP %d", resp.StatusCode)
	}

	return nil
}

func (d *AlertDispatcher) sendNotificationGateway(cfg AlertConfig, channel, recipient string, payload *IncidentAlertPayload) error {
	gatewayURL := cfg.NotificationGatewayURL
	if gatewayURL == "" {
		gatewayURL = "http://notification-gateway:5001"
	}
	targetURL := strings.TrimRight(gatewayURL, "/") + "/api/v1/notification/send"

	subject := fmt.Sprintf("[CRITICAL ALERT] Security Incident Detected on %s", payload.TenantSlug)
	content := fmt.Sprintf("CRITICAL Audit Incident: %s\nActor: %s\nAction: %s\nResource: %s\nOccurred At: %s",
		payload.Reason, payload.ActorID, payload.Action, payload.ResourceType, payload.OccurredAt.Format(time.RFC3339))

	reqBody, _ := json.Marshal(map[string]any{
		"channel":   channel,
		"recipient": recipient,
		"subject":   subject,
		"content":   content,
	})

	req, err := http.NewRequestWithContext(context.Background(), "POST", targetURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Gateway-Token", os.Getenv("GATEWAY_TOKEN"))

	resp, err := d.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	return nil
}

// TestAlert synchronously fires a mock incident payload to verify delivery
func (d *AlertDispatcher) TestAlert(ctx context.Context, targetType, targetURL, secretKey string) AlertTestResult {
	start := time.Now()

	testPayload := &IncidentAlertPayload{
		EventID:       fmt.Sprintf("test-%d", time.Now().UnixNano()),
		OccurredAt:    time.Now(),
		TenantSlug:    "system",
		ActorID:       "super_admin@k2net.id",
		ActorRole:     "super_admin",
		ActorIP:       "127.0.0.1",
		Action:        "system.security.test_alert_ping",
		ResourceType:  "INCIDENT_ALERT_ENGINE",
		ResourceID:    "test-target",
		Severity:      "CRITICAL",
		LogGroup:      "SECURITY",
		ServiceSource: "gateway-audit",
		Reason:        "Manual test alert ping from Super Admin SOC Explorer",
		Metadata: map[string]any{
			"isTest":        true,
			"dispatchedBy":  "Super Admin",
			"testTimestamp": time.Now().Format(time.RFC3339),
		},
	}

	testCfg := AlertConfig{
		Enabled:     true,
		WebhookURL:  targetURL,
		WebhookType: targetType,
		SecretKey:   secretKey,
	}

	err := d.sendWebhook(testCfg, testPayload)
	latency := time.Since(start).Milliseconds()

	if err != nil {
		return AlertTestResult{
			Success:        false,
			Channel:        targetType,
			Target:         targetURL,
			ResponseCode:   500,
			ResponseStatus: "FAILED",
			LatencyMs:      latency,
			Error:          err.Error(),
		}
	}

	return AlertTestResult{
		Success:        true,
		Channel:        targetType,
		Target:         targetURL,
		ResponseCode:   200,
		ResponseStatus: "DELIVERED",
		LatencyMs:      latency,
	}
}

func (d *AlertDispatcher) Close() {
	close(d.stopChan)
	d.wg.Wait()
}
