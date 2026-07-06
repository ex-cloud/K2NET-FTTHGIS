package delivery

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"gateways/gateway-whatsapp/internal/whatsapp"
	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type HTTPHandler struct {
	client     *whatsapp.Client
	sessionMgr *whatsapp.SessionManager
	rdb        *redis.Client
}

func NewHTTPHandler(client *whatsapp.Client, sessionMgr *whatsapp.SessionManager, rdb *redis.Client) *HTTPHandler {
	return &HTTPHandler{
		client:     client,
		sessionMgr: sessionMgr,
		rdb:        rdb,
	}
}

type SingleRequest struct {
	TenantSlug string `json:"tenantSlug" binding:"required"`
	Phone      string `json:"phone" binding:"required"`
	Message    string `json:"message" binding:"required"`
}

func (h *HTTPHandler) SendSingle(c *gin.Context) {
	ctx := c.Request.Context()
	var req SingleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	err := h.client.SendText(ctx, req.Phone, req.Message)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "API_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status": "sent",
		},
	})
}

type OTPRequest struct {
	TenantSlug   string `json:"tenantSlug" binding:"required"`
	Phone        string `json:"phone" binding:"required"`
	TemplateName string `json:"templateName" binding:"required"`
	Language     string `json:"language" binding:"required"`
	Code         string `json:"code" binding:"required"`
}

func (h *HTTPHandler) SendOTP(c *gin.Context) {
	ctx := c.Request.Context()
	var req OTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	// Construct standard Meta template OTP components (body parameter and optional button parameter)
	components := []any{
		map[string]any{
			"type": "body",
			"parameters": []any{
				map[string]any{
					"type": "text",
					"text": req.Code,
				},
			},
		},
		map[string]any{
			"type": "button",
			"index": "0",
			"sub_type": "url",
			"parameters": []any{
				map[string]any{
					"type": "text",
					"text": req.Code,
				},
			},
		},
	}

	err := h.client.SendTemplate(ctx, req.Phone, req.TemplateName, req.Language, components)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "API_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"status": "sent",
		},
	})
}

type BlastRequest struct {
	TenantSlug string                  `json:"tenantSlug" binding:"required"`
	Messages   []whatsapp.BlastPayload `json:"messages" binding:"required"`
}

func (h *HTTPHandler) SendBlast(c *gin.Context) {
	ctx := c.Request.Context()
	var req BlastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	queueKey := "wa:blast:" + req.TenantSlug
	pipe := h.rdb.Pipeline()
	for _, msg := range req.Messages {
		jsonData, err := json.Marshal(msg)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to marshal message payload"}})
			return
		}
		pipe.RPush(ctx, queueKey, jsonData)
	}

	_, err := pipe.Exec(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "REDIS_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusAccepted, gin.H{
		"success": true,
		"data": gin.H{
			"status": "queued",
			"count":  len(req.Messages),
		},
	})
}

func (h *HTTPHandler) GetTemplates(c *gin.Context) {
	// Standard template list endpoint - in scaffold returning mock approved list for now
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": []gin.H{
			{
				"name":     "otp_verification",
				"language": "id",
				"status":   "approved",
				"category": "UTILITY",
			},
			{
				"name":     "network_alert",
				"language": "id",
				"status":   "approved",
				"category": "UTILITY",
			},
		},
	})
}

func (h *HTTPHandler) GetSessionStatus(c *gin.Context) {
	ctx := c.Request.Context()
	phone := c.Param("phone")
	tenant := c.Query("tenantSlug")
	if tenant == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": "tenantSlug query param is required"}})
		return
	}

	state, ticketID, err := h.sessionMgr.GetSessionState(ctx, tenant, phone)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "REDIS_ERROR", "message": err.Error()}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"state":    state,
			"ticketId": ticketID,
		},
	})
}

func (h *HTTPHandler) GetWebhook(c *gin.Context) {
	verifyToken := c.Query("hub.verify_token")
	challenge := c.Query("hub.challenge")

	expectedToken := os.Getenv("WA_VERIFY_TOKEN")
	if expectedToken == "" {
		expectedToken = "ftth-wa-verify-2026"
	}

	if verifyToken == expectedToken {
		c.String(http.StatusOK, challenge)
		return
	}

	c.JSON(http.StatusForbidden, gin.H{"error": "Verification token mismatch"})
}

// Meta Webhook Payload structures
type MetaWebhookBody struct {
	Object string `json:"object"`
	Entry  []struct {
		ID      string `json:"id"`
		Changes []struct {
			Value struct {
				MessagingProduct string `json:"messaging_product"`
				Metadata         struct {
					DisplayPhoneNumber string `json:"display_phone_number"`
					PhoneNumberID      string `json:"phone_number_id"`
				} `json:"metadata"`
				Contacts []struct {
					Profile struct {
						Name string `json:"name"`
					} `json:"profile"`
					WaID string `json:"wa_id"`
				} `json:"contacts"`
				Messages []struct {
					From      string `json:"from"`
					ID        string `json:"id"`
					Timestamp string `json:"timestamp"`
					Type      string `json:"type"`
					Text      struct {
						Body string `json:"body"`
					} `json:"text"`
				} `json:"messages"`
			} `json:"value"`
			Field string `json:"field"`
		} `json:"changes"`
	} `json:"entry"`
}

func (h *HTTPHandler) PostWebhook(c *gin.Context) {
	ctx := c.Request.Context()

	// Read raw request body for signature verification
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "failed to read body"})
		return
	}

	// Validate Meta Webhook Signature if WA_APP_SECRET is set
	appSecret := os.Getenv("WA_APP_SECRET")
	if appSecret != "" {
		signatureHeader := c.GetHeader("X-Hub-Signature-256")
		if !validateSignature(bodyBytes, appSecret, signatureHeader) {
			logger.Warn(ctx, "Meta webhook signature verification failed")
			c.JSON(http.StatusForbidden, gin.H{"error": "signature verification failed"})
			return
		}
	}

	var webhookBody MetaWebhookBody
	if err := json.Unmarshal(bodyBytes, &webhookBody); err != nil {
		logger.Error(ctx, "Failed to unmarshal Meta webhook body", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"status": "ignored"})
		return
	}

	// Process incoming message events
	for _, entry := range webhookBody.Entry {
		for _, change := range entry.Changes {
			if change.Field != "messages" {
				continue
			}

			val := change.Value
			phoneNumberID := val.Metadata.PhoneNumberID

			// Resolve tenantSlug based on receiver phoneNumberID
			tenantSlug, err := h.resolveTenant(ctx, phoneNumberID)
			if err != nil {
				logger.Error(ctx, "Failed to resolve tenant for phone number ID", zap.String("phone_number_id", phoneNumberID), zap.Error(err))
				continue
			}

			for _, msg := range val.Messages {
				if msg.Type != "text" {
					continue
				}

				senderPhone := msg.From
				body := msg.Text.Body
				contactName := ""
				if len(val.Contacts) > 0 {
					contactName = val.Contacts[0].Profile.Name
				}

				logger.Info(ctx, "Received WhatsApp message", 
					zap.String("tenant", tenantSlug), 
					zap.String("from", senderPhone), 
					zap.String("body", body),
				)

				// Query/Manage session state machine
				state, ticketID, err := h.sessionMgr.GetSessionState(ctx, tenantSlug, senderPhone)
				if err != nil {
					logger.Error(ctx, "Failed to get session state", zap.Error(err))
					continue
				}

				if state == "idle" {
					// Auto-create ticket event
					eventPayload := map[string]any{
						"tenant":      tenantSlug,
						"phone":       senderPhone,
						"message":     body,
						"contactName": contactName,
						"timestamp":   time.Now().Format(time.RFC3339),
					}
					jsonEvent, _ := json.Marshal(eventPayload)

					// Publish to Redis tickets:create channel
					if err := h.rdb.Publish(ctx, "tickets:create", jsonEvent).Err(); err != nil {
						logger.Error(ctx, "Failed to publish tickets:create event", zap.Error(err))
					} else {
						logger.Info(ctx, "Published tickets:create event for new chat", zap.String("phone", senderPhone))
					}

					// Set session to state "in_ticket" to prevent ticket duplication until resolved
					_ = h.sessionMgr.SetSessionState(ctx, tenantSlug, senderPhone, "in_ticket", "pending")

				} else if state == "in_ticket" {
					// Auto-add comment event
					eventPayload := map[string]any{
						"tenant":    tenantSlug,
						"ticketId":  ticketID,
						"phone":     senderPhone,
						"message":   body,
						"timestamp": time.Now().Format(time.RFC3339),
					}
					jsonEvent, _ := json.Marshal(eventPayload)

					// Publish to Redis tickets:comment channel
					if err := h.rdb.Publish(ctx, "tickets:comment", jsonEvent).Err(); err != nil {
						logger.Error(ctx, "Failed to publish tickets:comment event", zap.Error(err))
					} else {
						logger.Info(ctx, "Published tickets:comment event", zap.String("ticketId", ticketID))
					}
				}
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "events processed",
	})
}

// validateSignature checks Meta's HMAC SHA256 signature
func validateSignature(body []byte, secret, signatureHeader string) bool {
	if !strings.HasPrefix(signatureHeader, "sha256=") {
		return false
	}
	actualSignature := strings.TrimPrefix(signatureHeader, "sha256=")

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(actualSignature), []byte(expectedSignature))
}

// resolveTenant maps Meta's receiving phone number ID to K2NET's internal tenantSlug
func (h *HTTPHandler) resolveTenant(ctx context.Context, phoneNumberID string) (string, error) {
	// Look up mapping from Redis key wa:tenant:mapping:{phoneNumberID}
	key := "wa:tenant:mapping:" + phoneNumberID
	val, err := h.rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		// Fallback to "default" tenant or lookup from configuration
		fallback := os.Getenv("DEFAULT_TENANT_SLUG")
		if fallback == "" {
			fallback = "garut"
		}
		return fallback, nil
	}
	return val, err
}
