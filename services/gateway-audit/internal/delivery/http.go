package delivery

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"gateways/gateway-audit/internal/audit"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type HTTPHandler struct {
	repo          *audit.Repository
	engine        *audit.BatchIngestionEngine
	archiveReader *audit.ArchiveReader
	dispatcher    *audit.AlertDispatcher
}

func NewHTTPHandler(repo *audit.Repository, engine *audit.BatchIngestionEngine, archiveReader *audit.ArchiveReader, dispatcher *audit.AlertDispatcher) *HTTPHandler {
	return &HTTPHandler{repo: repo, engine: engine, archiveReader: archiveReader, dispatcher: dispatcher}
}

// POST /audit/events
func (h *HTTPHandler) CreateAuditEvent(c *gin.Context) {
	ctx := c.Request.Context()
	var req audit.CreateAuditEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	if c.Query("sync") == "true" {
		ev, err := h.repo.CreateEvent(ctx, &req)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"success": true, "data": ev})
		return
	}

	if err := h.engine.Ingest(&req); err != nil {
		c.JSON(http.StatusAccepted, gin.H{"success": true, "status": "spooled_dlq", "message": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"success": true, "status": "queued"})
}

// POST /audit/events/kong
func (h *HTTPHandler) CreateKongLog(c *gin.Context) {
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

	// Route Tagging & Explicit Header Filter (P.7.4.1):
	// Allow GET only if marked with explicit X-Audit-Required header
	isSensitiveGet := payload.Request.Headers["x-audit-required"] == "true" || payload.Request.Headers["X-Audit-Required"] == "true"
	if (payload.Request.Method == "GET" || payload.Request.Method == "HEAD" || payload.Request.Method == "OPTIONS") && !isSensitiveGet {
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Ignored read-only request"})
		return
	}

	// Filter out GitHub webhook noise
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

	if err := h.engine.Ingest(&req); err != nil {
		c.JSON(http.StatusAccepted, gin.H{"success": true, "status": "spooled_dlq", "message": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{"success": true, "status": "queued"})
}

// GET /audit/events
func (h *HTTPHandler) GetAuditEvents(c *gin.Context) {
	ctx := c.Request.Context()
	tenant := c.Query("tenantSlug")
	actor := c.Query("actorId")
	action := c.Query("action")
	resource := c.Query("resourceType")
	logGroup := c.Query("logGroup")
	severity := c.Query("severity")
	projectID := c.Query("projectId")
	scope := c.Query("scope")
	category := c.Query("category")
	logType := c.Query("logType")
	serviceSource := c.Query("serviceSource")
	search := c.Query("search")
	startStr := c.Query("startDate")
	endStr := c.Query("endDate")
	cursorStr := c.Query("cursor")
	includeBenchmark := c.DefaultQuery("includeBenchmark", "false") == "true"

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "50"))
	if pageSize <= 0 {
		pageSize = 50
	}

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

	var beforeOccurredAt *time.Time
	var beforeID string
	if cursorStr != "" {
		var decodedBytes []byte
		var decodeErr error
		decodedBytes, decodeErr = base64.URLEncoding.DecodeString(cursorStr)
		if decodeErr != nil {
			decodedBytes, decodeErr = base64.StdEncoding.DecodeString(cursorStr)
		}
		if decodeErr == nil {
			parts := strings.Split(string(decodedBytes), "|")
			if len(parts) == 2 {
				if t, err := time.Parse(time.RFC3339Nano, parts[0]); err == nil {
					beforeOccurredAt = &t
					beforeID = parts[1]
				} else if t, err := time.Parse(time.RFC3339, parts[0]); err == nil {
					beforeOccurredAt = &t
					beforeID = parts[1]
				}
			}
		}
	}

	resp, err := h.repo.QueryEventsWithFilter(ctx, audit.QueryAuditEventsFilter{
		TenantSlug:       tenant,
		ActorID:          actor,
		Action:           action,
		ResourceType:     resource,
		LogGroup:         logGroup,
		Severity:         severity,
		ProjectID:        projectID,
		Scope:            scope,
		Category:         category,
		LogType:          logType,
		ServiceSource:    serviceSource,
		Search:           search,
		StartDate:        start,
		EndDate:          end,
		BeforeOccurredAt: beforeOccurredAt,
		BeforeID:         beforeID,
		IncludeBenchmark: includeBenchmark,
		Page:             page,
		PageSize:         pageSize,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"data":       resp.Data,
		"totalCount": resp.TotalCount,
		"page":       resp.Page,
		"pageSize":   resp.PageSize,
		"totalPages": resp.TotalPages,
		"hasMore":    resp.HasMore,
		"nextCursor": resp.NextCursor,
	})
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

// GET /audit/report/tenant/:slug/project/:projectId
func (h *HTTPHandler) GetProjectAuditReport(c *gin.Context) {
	ctx := c.Request.Context()
	slug := c.Param("slug")
	projectID := c.Param("projectId")

	report, err := h.repo.GetProjectReport(ctx, slug, projectID)
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

// GET /audit/analytics/summary
func (h *HTTPHandler) GetAnalyticsSummary(c *gin.Context) {
	ctx := c.Request.Context()
	tenantSlug := c.Query("tenantSlug")
	hours, _ := strconv.Atoi(c.DefaultQuery("hours", "24"))

	summary, err := h.repo.GetMaterializedSummary(ctx, tenantSlug, hours)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    summary,
		"hours":   hours,
	})
}

// POST /audit/analytics/refresh
func (h *HTTPHandler) RefreshSummary(c *gin.Context) {
	ctx := c.Request.Context()
	if err := h.repo.RefreshMaterializedView(ctx); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Summary materialized view refreshed"})
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

// GET /api/v1/audit/archives
func (h *HTTPHandler) GetAuditArchives(c *gin.Context) {
	ctx := c.Request.Context()
	table := c.Query("table")
	search := c.Query("search")

	var startDate, endDate *time.Time
	if startStr := c.Query("startDate"); startStr != "" {
		if t, err := time.Parse(time.RFC3339, startStr); err == nil {
			startDate = &t
		}
	}
	if endStr := c.Query("endDate"); endStr != "" {
		if t, err := time.Parse(time.RFC3339, endStr); err == nil {
			endDate = &t
		}
	}

	query := audit.AuditArchiveQuery{
		Table:     table,
		StartDate: startDate,
		EndDate:   endDate,
		Search:    search,
	}

	archives, summary, err := h.archiveReader.ListArchives(ctx, query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "ARCHIVE_READ_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    archives,
		"summary": summary,
	})
}

// GET /api/v1/audit/alerts/config
func (h *HTTPHandler) GetAlertConfig(c *gin.Context) {
	if h.dispatcher == nil {
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data":    audit.DefaultAlertConfig(),
		})
		return
	}

	cfg := h.dispatcher.GetConfig()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    cfg,
	})
}

// PUT /api/v1/audit/alerts/config
func (h *HTTPHandler) UpdateAlertConfig(c *gin.Context) {
	if h.dispatcher == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DISPATCHER_UNAVAILABLE",
				"message": "Alert dispatcher is not initialized",
			},
		})
		return
	}

	var req audit.AlertConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "BAD_REQUEST",
				"message": err.Error(),
			},
		})
		return
	}

	if err := h.dispatcher.SaveConfig(req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "SAVE_ERROR",
				"message": err.Error(),
			},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Alert configuration saved successfully",
		"data":    h.dispatcher.GetConfig(),
	})
}

// POST /api/v1/audit/alerts/test
func (h *HTTPHandler) TestAlert(c *gin.Context) {
	if h.dispatcher == nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "DISPATCHER_UNAVAILABLE",
				"message": "Alert dispatcher is not initialized",
			},
		})
		return
	}

	var req struct {
		TargetType string `json:"targetType"` // "generic", "slack", "discord", "telegram"
		TargetURL  string `json:"targetUrl" binding:"required"`
		SecretKey  string `json:"secretKey"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error": gin.H{
				"code":    "BAD_REQUEST",
				"message": err.Error(),
			},
		})
		return
	}

	if req.TargetType == "" {
		req.TargetType = "generic"
	}

	result := h.dispatcher.TestAlert(c.Request.Context(), req.TargetType, req.TargetURL, req.SecretKey)

	status := http.StatusOK
	if !result.Success {
		status = http.StatusBadRequest
	}

	c.JSON(status, gin.H{
		"success": result.Success,
		"data":    result,
	})
}

