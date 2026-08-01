package delivery

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"gateways/gateway-audit/internal/audit"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type HTTPHandler struct {
	repo *audit.Repository
}

func NewHTTPHandler(repo *audit.Repository) *HTTPHandler {
	return &HTTPHandler{repo: repo}
}

// POST /audit/events
func (h *HTTPHandler) CreateAuditEvent(c *gin.Context) {
	ctx := c.Request.Context()
	var req audit.CreateAuditEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	ev, err := h.repo.CreateEvent(ctx, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": ev})
}

// POST /audit/events/kong
func (h *HTTPHandler) CreateKongLog(c *gin.Context) {
	ctx := c.Request.Context()
	var payload struct {
		ClientIP  string `json:"client_ip"`
		Request   struct {
			Method  string            `json:"method"`
			URI     string            `json:"uri"`
			Headers map[string]string `json:"headers"`
		} `json:"request"`
		Response struct {
			Status int `json:"status"`
		} `json:"response"`
		Latencies struct {
			Request int `json:"request"`
		} `json:"latencies"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	// Filter out read operations to keep audit logs clean
	if payload.Request.Method == "GET" || payload.Request.Method == "HEAD" || payload.Request.Method == "OPTIONS" {
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Ignored read-only request"})
		return
	}

	// Filter out GitHub webhook calls — these are GitHub Actions deploy notifications.
	// The actual request is handled by Spring Boot (HMAC-SHA256 validated).
	// Will be re-enabled when tenant GitHub integration goes live.
	if payload.Request.URI == "/api/github/webhook" {
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Ignored github webhook noise"})
		return
	}

	tenantSlug := payload.Request.Headers["x-tenant-id"]
	if tenantSlug == "" {
		tenantSlug = "system"
	}
	actorID := payload.Request.Headers["x-user-email"]
	if actorID == "" {
		actorID = payload.Request.Headers["x-user-id"]
	}
	if actorID == "" {
		authHeader := payload.Request.Headers["authorization"]
		if authHeader == "" {
			authHeader = payload.Request.Headers["Authorization"]
		}
		if authHeader != "" {
			actorID = extractActorFromJWT(authHeader)
		}
	}
	if actorID == "" {
		actorID = "anonymous"
	}

	action := payload.Request.Method + ":" + payload.Request.URI
	
	logGroup := "CORE"
	severity := "INFO"
	if payload.Response.Status >= 400 {
		severity = "WARN"
	}
	if payload.Response.Status >= 500 {
		severity = "ERROR"
	}

	req := audit.CreateAuditEventRequest{
		TenantSlug:   tenantSlug,
		ActorID:      actorID,
		ActorRole:    "user",
		ActorIP:      payload.ClientIP,
		Action:       action,
		ResourceType: "EDGE_API",
		ResourceID:   payload.Request.URI,
		Metadata: map[string]any{
			"logGroup":      logGroup,
			"serviceSource": "kong-gateway",
			"severity":      severity,
			"status":        payload.Response.Status,
			"method":        payload.Request.Method,
			"latencyMs":     payload.Latencies.Request,
		},
	}

	ev, err := h.repo.CreateEvent(ctx, &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": ev})
}

// GET /audit/events
func (h *HTTPHandler) GetAuditEvents(c *gin.Context) {
	ctx := c.Request.Context()
	tenant := c.Query("tenantSlug")
	actor := c.Query("actorId")
	action := c.Query("action")
	resource := c.Query("resourceType")
	startStr := c.Query("startDate")
	endStr := c.Query("endDate")

	var start, end *time.Time
	if startStr != "" {
		if t, err := time.Parse(time.RFC3339, startStr); err == nil {
			start = &t
		} else if t, err := time.Parse("2006-01-02", startStr); err == nil {
			start = &t
		}
	}
	if endStr != "" {
		if t, err := time.Parse(time.RFC3339, endStr); err == nil {
			end = &t
		} else if t, err := time.Parse("2006-01-02", endStr); err == nil {
			end = &t
		}
	}

	events, err := h.repo.QueryEvents(ctx, tenant, actor, action, resource, start, end)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": events})
}

// GET /audit/events/:id
func (h *HTTPHandler) GetAuditEvent(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	ev, err := h.repo.GetEvent(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "Event not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": ev})
}

// GET /audit/report/tenant/:slug
func (h *HTTPHandler) GetTenantAuditReport(c *gin.Context) {
	ctx := c.Request.Context()
	slug := c.Param("slug")

	report, err := h.repo.GetTenantReport(ctx, slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": report})
}

// GET /audit/report/user/:userId
func (h *HTTPHandler) GetUserAuditReport(c *gin.Context) {
	ctx := c.Request.Context()
	userID := c.Param("userId")

	report, err := h.repo.GetUserReport(ctx, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true, "data": report})
}

// POST /audit/export
func (h *HTTPHandler) ExportAuditEvents(c *gin.Context) {
	// Stub/triggering audit export payload via gateway-export simulation
	c.JSON(http.StatusAccepted, gin.H{
		"success": true,
		"message": "Audit log export task successfully dispatched",
		"data": gin.H{
			"status": "queued",
		},
	})
}

func extractActorFromJWT(authHeader string) string {
	if authHeader == "" {
		return ""
	}
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return ""
	}
	token := parts[1]
	tokenParts := strings.Split(token, ".")
	if len(tokenParts) < 2 {
		return ""
	}
	payloadSegment := tokenParts[1]
	
	// Replace URL characters with standard base64 characters
	payloadSegment = strings.ReplaceAll(payloadSegment, "-", "+")
	payloadSegment = strings.ReplaceAll(payloadSegment, "_", "/")
	
	// Add padding if necessary
	switch len(payloadSegment) % 4 {
	case 2:
		payloadSegment += "=="
	case 3:
		payloadSegment += "="
	}
	
	decoded, err := base64.StdEncoding.DecodeString(payloadSegment)
	if err != nil {
		return ""
	}
	
	var claims map[string]any
	if err := json.Unmarshal(decoded, &claims); err != nil {
		return ""
	}
	
	if email, ok := claims["email"].(string); ok && email != "" {
		return email
	}
	if username, ok := claims["preferred_username"].(string); ok && username != "" {
		return username
	}
	if sub, ok := claims["sub"].(string); ok && sub != "" {
		return sub
	}
	return ""
}

