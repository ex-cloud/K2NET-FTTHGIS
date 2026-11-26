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

	"gateways/shared/logger"
	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/zap"
)

type AlertConfig struct {
	Enabled                bool     `json:"enabled"`
	WebhookURL             string   `json:"webhookUrl"`
	WebhookType            string   `json:"webhookType"` // "generic", "slack", "discord", "telegram"
	SecretKey              string   `json:"secretKey"`
	NotificationGatewayURL string   `json:"notificationGatewayUrl"`
	WhatsAppGatewayURL     string   `json:"whatsAppGatewayUrl"`
	EnableEmail            bool     `json:"enableEmail"`
	AlertEmail             string   `json:"alertEmail"`
	EnableWhatsApp         bool     `json:"enableWhatsApp"`
	AlertPhone             string   `json:"alertPhone"`
	CooldownSeconds        int      `json:"cooldownSeconds"`
	MinSeverity            string   `json:"minSeverity"` // "CRITICAL", "ERROR"
	HighRiskActions        []string `json:"highRiskActions"`
}

// SecurityRecipient represents a resolved Security Officer or Organization Owner/Admin contact.
type SecurityRecipient struct {
	Email    string
	FullName string
	Phone    string
	Locale   string
	OrgName  string
}

// RecipientResolverFunc resolves security alert recipients for a given tenant slug.
type RecipientResolverFunc func(ctx context.Context, tenantSlug string) ([]SecurityRecipient, error)

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
	mu                 sync.RWMutex
	cfg                AlertConfig
	configPath         string
	db                 *pgxpool.Pool
	recipientResolver  RecipientResolverFunc
	backendURL         string
	cooldownMu         sync.Mutex
	cooldownMap        map[string]*cooldownEntry
	httpClient         *http.Client
	externalHTTPClient *http.Client
	eventQueue         chan *IncidentAlertPayload
	siemQueue          chan *CreateAuditEventRequest
	stopChan           chan struct{}
	wg                 sync.WaitGroup
}

func defaultBackendURL() string {
	if envURL := strings.TrimSpace(os.Getenv("BACKEND_URL")); envURL != "" {
		return strings.TrimRight(envURL, "/")
	}
	return "http://backend:9090"
}

func defaultNotificationGatewayURL() string {
	if envURL := strings.TrimSpace(os.Getenv("NOTIFICATION_GATEWAY_URL")); envURL != "" {
		return envURL
	}
	return "http://ftth-notification-gateway:5001"
}

func defaultWhatsAppGatewayURL() string {
	if envURL := strings.TrimSpace(os.Getenv("WHATSAPP_GATEWAY_URL")); envURL != "" {
		return envURL
	}
	return "http://ftth-whatsapp-gateway:5005"
}

func DefaultAlertConfig() AlertConfig {
	return AlertConfig{
		Enabled:                true,
		WebhookURL:             "",
		WebhookType:            "generic",
		SecretKey:              "",
		NotificationGatewayURL: defaultNotificationGatewayURL(),
		WhatsAppGatewayURL:     defaultWhatsAppGatewayURL(),
		EnableEmail:            false,
		AlertEmail:             "soc-admin@k2net.id",
		EnableWhatsApp:         false,
		AlertPhone:             "",
		CooldownSeconds:        30,
		MinSeverity:            "CRITICAL",
		HighRiskActions: []string{
			"SECURITY_BREAK_GLASS_LOGIN",
			"SECURITY_BREAK_GLASS_UNAUTHORIZED",
			"AUTH_BREAK_GLASS_LOGIN_SUCCESS",
			"SECURITY_SESSION_HIJACK_DETECTED",
			"SSO_IDP_UNHEALTHY",
			"SSO_CERT_EXPIRED",
			"SSO_CERT_EXPIRING",
			"SSO_SAML_CERT_ROTATED",
			"SCIM_USER_DEPROVISIONED",
			"SECURITY_ORPHAN_ACCOUNT_PURGED",
			"SECURITY_SIEM_ENDPOINT_AUTO_DISABLED",
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

func ensureMandatoryHighRiskActions(actions []string) []string {
	mandatory := []string{
		"SECURITY_BREAK_GLASS_LOGIN",
		"SECURITY_BREAK_GLASS_UNAUTHORIZED",
		"AUTH_BREAK_GLASS_LOGIN_SUCCESS",
		"SECURITY_SESSION_HIJACK_DETECTED",
		"SSO_IDP_UNHEALTHY",
		"SSO_CERT_EXPIRED",
		"SSO_CERT_EXPIRING",
		"SSO_SAML_CERT_ROTATED",
		"SCIM_USER_DEPROVISIONED",
		"SECURITY_ORPHAN_ACCOUNT_PURGED",
		"SECURITY_SIEM_ENDPOINT_AUTO_DISABLED",
	}
	existing := make(map[string]bool, len(actions))
	for _, a := range actions {
		existing[strings.ToUpper(strings.TrimSpace(a))] = true
	}
	result := append([]string{}, actions...)
	for _, m := range mandatory {
		if !existing[m] {
			result = append(result, m)
		}
	}
	return result
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
		backendURL:  defaultBackendURL(),
		cooldownMap: make(map[string]*cooldownEntry),
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
		externalHTTPClient: NewSafeWebhookHTTPClient(5 * time.Second),
		eventQueue:         make(chan *IncidentAlertPayload, 500),
		siemQueue:          make(chan *CreateAuditEventRequest, 500),
		stopChan:           make(chan struct{}),
	}

	dispatcher.loadConfig()
	dispatcher.startWorker()

	return dispatcher
}

// SetBackendURL overrides the internal Spring Boot backend base URL (used in tests).
func (d *AlertDispatcher) SetBackendURL(url string) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.backendURL = strings.TrimRight(strings.TrimSpace(url), "/")
}

// SetDBPool wires the live PostgreSQL connection pool for dynamic tenant Security Officer / Owner lookup.
func (d *AlertDispatcher) SetDBPool(db *pgxpool.Pool) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.db = db
}

// SetRecipientResolver allows injecting a custom recipient lookup function (useful for unit testing).
func (d *AlertDispatcher) SetRecipientResolver(fn RecipientResolverFunc) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.recipientResolver = fn
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
			loaded.NotificationGatewayURL = defaultNotificationGatewayURL()
		}
		if loaded.WhatsAppGatewayURL == "" {
			loaded.WhatsAppGatewayURL = defaultWhatsAppGatewayURL()
		}
		loaded.HighRiskActions = ensureMandatoryHighRiskActions(loaded.HighRiskActions)
		d.cfg = loaded
	}
}

func (d *AlertDispatcher) SaveConfig(newCfg AlertConfig) error {
	if strings.TrimSpace(newCfg.WebhookURL) != "" {
		if err := ValidateWebhookURL(newCfg.WebhookURL); err != nil {
			return err
		}
	}

	d.mu.Lock()
	defer d.mu.Unlock()

	if newCfg.CooldownSeconds <= 0 {
		newCfg.CooldownSeconds = 30
	}
	if newCfg.MinSeverity == "" {
		newCfg.MinSeverity = "CRITICAL"
	}
	if newCfg.NotificationGatewayURL == "" {
		newCfg.NotificationGatewayURL = defaultNotificationGatewayURL()
	}
	if newCfg.WhatsAppGatewayURL == "" {
		newCfg.WhatsAppGatewayURL = defaultWhatsAppGatewayURL()
	}
	newCfg.HighRiskActions = ensureMandatoryHighRiskActions(newCfg.HighRiskActions)

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

// Dispatch evaluates and non-blockingly queues incident notifications and SIEM stream forwarding
func (d *AlertDispatcher) Dispatch(req *CreateAuditEventRequest, occurredAt time.Time) {
	if d.shouldForwardToTenantSiem(req) {
		select {
		case d.siemQueue <- req:
		default:
			// Drop gracefully if SIEM queue is saturated
		}
	}

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
	d.wg.Add(2)
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
	go func() {
		defer d.wg.Done()
		for {
			select {
			case <-d.stopChan:
				return
			case ev := <-d.siemQueue:
				d.forwardToBackendSiem(ev)
			}
		}
	}()
}

func (d *AlertDispatcher) shouldForwardToTenantSiem(req *CreateAuditEventRequest) bool {
	if req == nil || strings.TrimSpace(req.TenantSlug) == "" {
		return false
	}
	if strings.EqualFold(strings.TrimSpace(req.TenantSlug), "system") {
		return false
	}
	if req.Metadata != nil {
		if dispatched, ok := req.Metadata["siemDispatched"].(bool); ok && dispatched {
			return false
		}
	}
	upAction := strings.ToUpper(strings.TrimSpace(req.Action))
	if strings.HasPrefix(upAction, "SECURITY_SIEM_") {
		return false
	}
	if strings.HasPrefix(upAction, "SECURITY_") ||
		strings.HasPrefix(upAction, "SSO_") ||
		strings.HasPrefix(upAction, "SCIM_") ||
		strings.HasPrefix(upAction, "AUTH_") ||
		strings.HasPrefix(upAction, "MFA_") ||
		strings.HasPrefix(upAction, "PASSKEY_") ||
		strings.HasPrefix(upAction, "IMPERSONATION") {
		return true
	}
	if req.Metadata != nil {
		if sev, ok := req.Metadata["severity"].(string); ok {
			upSev := strings.ToUpper(strings.TrimSpace(sev))
			if upSev == "CRITICAL" || upSev == "ERROR" || upSev == "WARN" || upSev == "WARNING" {
				// Forward HTTP 5xx/4xx Edge or explicit security warnings only if security resource or auth action
				return strings.EqualFold(req.ResourceType, "AUTH_SESSION") || strings.EqualFold(req.ResourceType, "SECURITY")
			}
		}
	}
	return false
}

func (d *AlertDispatcher) forwardToBackendSiem(req *CreateAuditEventRequest) {
	if req == nil {
		return
	}
	d.mu.RLock()
	baseURL := d.backendURL
	d.mu.RUnlock()
	if baseURL == "" {
		return
	}

	severity := "WARNING"
	if req.Metadata != nil {
		if s, ok := req.Metadata["severity"].(string); ok && s != "" {
			severity = strings.ToUpper(s)
		}
	}

	payload := map[string]any{
		"tenantSlug":   req.TenantSlug,
		"action":       req.Action,
		"severity":     severity,
		"actorId":      req.ActorID,
		"actorRole":    req.ActorRole,
		"actorIp":      req.ActorIP,
		"resourceType": req.ResourceType,
		"resourceId":   req.ResourceID,
		"occurredAt":   time.Now().UTC().Format(time.RFC3339),
		"metadata":     req.Metadata,
	}
	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, baseURL+"/api/v1/internal/siem/ingest", bytes.NewReader(bodyBytes))
	if err != nil {
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	if tok := strings.TrimSpace(os.Getenv("GATEWAY_TOKEN")); tok != "" {
		httpReq.Header.Set("X-Gateway-Token", tok)
	}

	resp, err := d.httpClient.Do(httpReq)
	if err != nil {
		logger.Warn(ctx, "SIEM push bridge request skipped/failed", zap.String("action", req.Action), zap.Error(err))
		return
	}
	defer resp.Body.Close()
}

func isBreakGlassAction(action string) bool {
	upper := strings.ToUpper(strings.TrimSpace(action))
	return strings.Contains(upper, "BREAK_GLASS")
}

func (d *AlertDispatcher) processIncident(payload *IncidentAlertPayload) {
	d.mu.RLock()
	cfg := d.cfg
	d.mu.RUnlock()

	// 1. Dispatch Webhook
	if cfg.WebhookURL != "" {
		_ = d.sendWebhook(cfg, payload)
	}

	// 2. Real-Time SecOps Break-Glass Dual-Channel Alerting (Email + WhatsApp to Tenant Owners / Security Officers)
	if isBreakGlassAction(payload.Action) {
		d.dispatchBreakGlassAlerts(cfg, payload)
		return
	}

	// 3. Generic Incident Dispatch Email via Notification Gateway
	if cfg.EnableEmail && cfg.AlertEmail != "" {
		_ = d.sendNotificationGateway(cfg, "email", cfg.AlertEmail, payload)
	}

	// 4. Generic Incident Dispatch WhatsApp via Notification Gateway
	if cfg.EnableWhatsApp && cfg.AlertPhone != "" {
		_ = d.sendNotificationGateway(cfg, "whatsapp", cfg.AlertPhone, payload)
	}
}

func normalizeWhatsAppPhone(raw string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(raw) {
		if r >= '0' && r <= '9' {
			b.WriteRune(r)
		}
	}
	digits := b.String()
	if strings.HasPrefix(digits, "08") {
		digits = "62" + digits[1:]
	}
	if len(digits) < 9 || len(digits) > 16 {
		return ""
	}
	return digits
}

func (d *AlertDispatcher) resolveSecurityRecipients(ctx context.Context, tenantSlug string) ([]SecurityRecipient, error) {
	d.mu.RLock()
	resolver := d.recipientResolver
	db := d.db
	d.mu.RUnlock()

	if resolver != nil {
		return resolver(ctx, tenantSlug)
	}
	if db == nil {
		return nil, nil
	}

	slug := strings.TrimSpace(tenantSlug)
	if slug == "" {
		slug = "ops"
	}

	query := `
		SELECT
			COALESCE(u.email, ''),
			COALESCE(u.full_name, u.username, ''),
			COALESCE(u.phone, ''),
			COALESCE(u.locale, 'id'),
			COALESCE(o.name, $1)
		FROM organization_members om
		JOIN organizations o ON o.id = om.organization_id
		JOIN users u ON u.id = om.user_id
		WHERE LOWER(o.slug) = LOWER($1)
		  AND UPPER(om.status) = 'ACTIVE'
		  AND UPPER(u.status) = 'ACTIVE'
		  AND LOWER(om.role_name) IN ('admin', 'owner', 'super_admin', 'security_officer')
		ORDER BY om.joined_at ASC
	`

	var recipients []SecurityRecipient
	rows, err := db.Query(ctx, query, slug)
	if err == nil {
		for rows.Next() {
			var r SecurityRecipient
			if scanErr := rows.Scan(&r.Email, &r.FullName, &r.Phone, &r.Locale, &r.OrgName); scanErr == nil {
				recipients = append(recipients, r)
			}
		}
		rows.Close()
	}

	if len(recipients) == 0 {
		fallbackQuery := `
			SELECT
				COALESCE(u.email, ''),
				COALESCE(u.full_name, u.username, ''),
				COALESCE(u.phone, ''),
				COALESCE(u.locale, 'id'),
				COALESCE(o.name, $1)
			FROM users u
			LEFT JOIN organizations o ON o.id = u.organization_id
			JOIN roles r ON r.id = u.role_id
			WHERE UPPER(u.status) = 'ACTIVE'
			  AND (
				(LOWER(o.slug) = LOWER($1) AND LOWER(r.name) IN ('admin', 'owner', 'super_admin'))
				OR ($1 = 'system' AND LOWER(r.name) = 'super_admin')
			  )
		`
		fRows, fErr := db.Query(ctx, fallbackQuery, slug)
		if fErr == nil {
			for fRows.Next() {
				var r SecurityRecipient
				if scanErr := fRows.Scan(&r.Email, &r.FullName, &r.Phone, &r.Locale, &r.OrgName); scanErr == nil {
					recipients = append(recipients, r)
				}
			}
			fRows.Close()
		}
	}

	return recipients, nil
}

func extractMetadataString(meta map[string]any, key string) string {
	if meta == nil {
		return ""
	}
	if v, ok := meta[key].(string); ok {
		return strings.TrimSpace(v)
	}
	return ""
}

func (d *AlertDispatcher) dispatchBreakGlassAlerts(cfg AlertConfig, payload *IncidentAlertPayload) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	recipients, err := d.resolveSecurityRecipients(ctx, payload.TenantSlug)
	if err != nil {
		logger.Warn(ctx, "Failed resolving tenant security recipients for Break-Glass alert",
			zap.String("tenant", payload.TenantSlug),
			zap.Error(err))
	}

	// Merge global configured AlertEmail / AlertPhone if explicitly configured
	if cfg.EnableEmail && strings.TrimSpace(cfg.AlertEmail) != "" && !strings.EqualFold(cfg.AlertEmail, "soc-admin@k2net.id") {
		recipients = append(recipients, SecurityRecipient{
			Email:    strings.TrimSpace(cfg.AlertEmail),
			FullName: "SecOps Administrator",
			Locale:   "id",
			OrgName:  strings.ToUpper(payload.TenantSlug),
		})
	}
	if cfg.EnableWhatsApp && strings.TrimSpace(cfg.AlertPhone) != "" {
		recipients = append(recipients, SecurityRecipient{
			Phone:    strings.TrimSpace(cfg.AlertPhone),
			FullName: "SecOps Administrator",
			Locale:   "id",
			OrgName:  strings.ToUpper(payload.TenantSlug),
		})
	}

	seenEmails := make(map[string]bool)
	seenPhones := make(map[string]bool)

	for _, rec := range recipients {
		emailLower := strings.ToLower(strings.TrimSpace(rec.Email))
		if emailLower != "" && !strings.HasSuffix(emailLower, "@example.com") && !seenEmails[emailLower] {
			seenEmails[emailLower] = true
			if sendErr := d.sendBreakGlassEmailAlert(ctx, cfg, rec, payload); sendErr != nil {
				logger.Warn(ctx, "Failed sending Break-Glass email alert",
					zap.String("to", rec.Email),
					zap.String("tenant", payload.TenantSlug),
					zap.Error(sendErr))
			} else {
				logger.Info(ctx, "Dispatched real-time Break-Glass email alert",
					zap.String("to", rec.Email),
					zap.String("tenant", payload.TenantSlug),
					zap.String("action", payload.Action))
			}
		}

		normPhone := normalizeWhatsAppPhone(rec.Phone)
		if normPhone != "" && !seenPhones[normPhone] {
			seenPhones[normPhone] = true
			if waErr := d.sendBreakGlassWhatsAppAlert(ctx, cfg, normPhone, rec, payload); waErr != nil {
				logger.Warn(ctx, "Failed sending Break-Glass WhatsApp alert",
					zap.String("phone", normPhone),
					zap.String("tenant", payload.TenantSlug),
					zap.Error(waErr))
			} else {
				logger.Info(ctx, "Dispatched real-time Break-Glass WhatsApp alert",
					zap.String("phone", normPhone),
					zap.String("tenant", payload.TenantSlug),
					zap.String("action", payload.Action))
			}
		}
	}
}

func (d *AlertDispatcher) sendBreakGlassEmailAlert(ctx context.Context, cfg AlertConfig, rec SecurityRecipient, payload *IncidentAlertPayload) error {
	gatewayURL := strings.TrimSpace(cfg.NotificationGatewayURL)
	if gatewayURL == "" {
		gatewayURL = defaultNotificationGatewayURL()
	}
	targetURL := strings.TrimRight(gatewayURL, "/") + "/api/v1/notification/email/security-alert"

	actorEmail := extractMetadataString(payload.Metadata, "actorEmail")
	actorName := extractMetadataString(payload.Metadata, "actorName")
	if actorName == "" && actorEmail == "" {
		actorName = payload.ActorID
	}
	mfaMethod := extractMetadataString(payload.Metadata, "mfaMethod")
	if mfaMethod == "" {
		mfaMethod = "Multi-Factor Verified"
	}

	orgName := strings.TrimSpace(rec.OrgName)
	if orgName == "" {
		orgName = strings.ToUpper(payload.TenantSlug)
	}
	lang := strings.ToLower(strings.TrimSpace(rec.Locale))
	if lang != "en" {
		lang = "id"
	}

	wibZone := time.FixedZone("WIB", 7*3600)
	occurredStr := payload.OccurredAt.In(wibZone).Format("02 Jan 2006 15:04:05 WIB")

	reqBody, _ := json.Marshal(map[string]any{
		"to":             rec.Email,
		"recipient_name": rec.FullName,
		"org_name":       orgName,
		"tenant_slug":    payload.TenantSlug,
		"actor_name":     actorName,
		"actor_email":    actorEmail,
		"actor_role":     payload.ActorRole,
		"actor_ip":       payload.ActorIP,
		"mfa_method":     mfaMethod,
		"action":         payload.Action,
		"occurred_at":    occurredStr,
		"lang":           lang,
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, targetURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Gateway-Token", os.Getenv("GATEWAY_TOKEN"))
	req.Header.Set("X-Tenant-ID", payload.TenantSlug)

	resp, err := d.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("notification-gateway returned HTTP %d", resp.StatusCode)
	}
	return nil
}

func (d *AlertDispatcher) sendBreakGlassWhatsAppAlert(ctx context.Context, cfg AlertConfig, phone string, rec SecurityRecipient, payload *IncidentAlertPayload) error {
	waGatewayURL := strings.TrimSpace(cfg.WhatsAppGatewayURL)
	if waGatewayURL == "" {
		waGatewayURL = defaultWhatsAppGatewayURL()
	}
	targetURL := strings.TrimRight(waGatewayURL, "/") + "/api/v1/wa/send/single"

	actorEmail := extractMetadataString(payload.Metadata, "actorEmail")
	actorName := extractMetadataString(payload.Metadata, "actorName")
	actorDisplay := actorName
	if actorDisplay != "" && actorEmail != "" && !strings.EqualFold(actorDisplay, actorEmail) {
		actorDisplay = fmt.Sprintf("%s (%s)", actorDisplay, actorEmail)
	} else if actorEmail != "" {
		actorDisplay = actorEmail
	} else if actorDisplay == "" {
		actorDisplay = payload.ActorID
	}

	mfaMethod := extractMetadataString(payload.Metadata, "mfaMethod")
	if mfaMethod == "" {
		mfaMethod = "Multi-Factor Verified"
	}

	orgName := strings.TrimSpace(rec.OrgName)
	if orgName == "" {
		orgName = strings.ToUpper(payload.TenantSlug)
	}

	wibZone := time.FixedZone("WIB", 7*3600)
	occurredStr := payload.OccurredAt.In(wibZone).Format("02 Jan 2006 15:04:05 WIB")

	isUnauthorized := strings.Contains(strings.ToUpper(payload.Action), "UNAUTHORIZED")
	var msg string
	if strings.EqualFold(rec.Locale, "en") {
		title := "🚨 *[K2NET SECOPS ALERT — BREAK-GLASS ACCESS]*"
		desc := fmt.Sprintf("An administrator signed in via Emergency Break-Glass (Corporate SSO Bypass) on workspace *%s* (`%s.kdua.net`).", orgName, payload.TenantSlug)
		if isUnauthorized {
			title = "🚨 *[K2NET SECOPS ALERT — UNAUTHORIZED BREAK-GLASS BLOCKED]*"
			desc = fmt.Sprintf("An unauthorized Break-Glass attempt was blocked on workspace *%s* (`%s.kdua.net`).", orgName, payload.TenantSlug)
		}
		msg = fmt.Sprintf("%s\n%s\n\n• *Actor:* %s\n• *Role:* `%s`\n• *2FA Factor:* `%s`\n• *Source IP:* `%s`\n• *Time:* %s\n\nIf this activity was not authorized, immediately revoke active sessions in the Security & Audit Console.",
			title, desc, actorDisplay, payload.ActorRole, mfaMethod, payload.ActorIP, occurredStr)
	} else {
		title := "🚨 *[PERINGATAN SECOPS K2NET — AKSES DARURAT BREAK-GLASS]*"
		desc := fmt.Sprintf("Telah terjadi login darurat (Bypass Corporate SSO) pada workspace *%s* (`%s.kdua.net`).", orgName, payload.TenantSlug)
		if isUnauthorized {
			title = "🚨 *[PERINGATAN SECOPS K2NET — PERCOBAAN BREAK-GLASS TIDAK SAH DIBLOKIR]*"
			desc = fmt.Sprintf("Percobaan akses darurat Break-Glass oleh akun non-admin telah diblokir pada workspace *%s* (`%s.kdua.net`).", orgName, payload.TenantSlug)
		}
		msg = fmt.Sprintf("%s\n%s\n\n• *Aktor:* %s\n• *Peran:* `%s`\n• *Metode 2FA:* `%s`\n• *Alamat IP:* `%s`\n• *Waktu:* %s\n\nJika aktivitas ini tidak diotorisasi oleh tim Anda, segera cabut sesi aktif di menu Audit Trail & Security.",
			title, desc, actorDisplay, payload.ActorRole, mfaMethod, payload.ActorIP, occurredStr)
	}

	reqBody, _ := json.Marshal(map[string]any{
		"tenantSlug": payload.TenantSlug,
		"phone":      phone,
		"message":    msg,
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, targetURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Gateway-Token", os.Getenv("GATEWAY_TOKEN"))
	req.Header.Set("X-Tenant-ID", payload.TenantSlug)

	resp, err := d.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		return fmt.Errorf("gateway-whatsapp returned HTTP %d", resp.StatusCode)
	}
	return nil
}

func (d *AlertDispatcher) sendWebhook(cfg AlertConfig, payload *IncidentAlertPayload) error {
	if err := ValidateWebhookURL(cfg.WebhookURL); err != nil {
		return err
	}

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
		text := fmt.Sprintf("🚨 *CRITICAL AUDIT INCIDENT*\n\n*Reason:* %s\n*Actor:* `%s`\n*Tenant:* `%s`\n*Action:* `%s`\n*Severity:* `%s`\n*Time:* %s",
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

	client := d.externalHTTPClient
	if client == nil {
		client = NewSafeWebhookHTTPClient(5 * time.Second)
	}
	resp, err := client.Do(req)
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
	if err := ValidateWebhookURL(targetURL); err != nil {
		return AlertTestResult{
			Success:        false,
			Channel:        targetType,
			Target:         targetURL,
			ResponseCode:   400,
			ResponseStatus: "BLOCKED_SSRF",
			LatencyMs:      time.Since(start).Milliseconds(),
			Error:          err.Error(),
		}
	}

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
