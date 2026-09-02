package delivery

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"gateways/observability-gateway/internal/collector"
	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type HTTPHandler struct {
	collector *collector.Collector
}

func NewHTTPHandler(collector *collector.Collector) *HTTPHandler {
	return &HTTPHandler{
		collector: collector,
	}
}

func (h *HTTPHandler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "UP",
		"service":   "observability-gateway",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *HTTPHandler) GetSummary(c *gin.Context) {
	tenantId := c.GetString("tenant_id")
	if tenantId == "" {
		tenantId = c.GetHeader("X-Tenant-ID")
	}

	summary, err := h.collector.FetchSummary(c.Request.Context(), tenantId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, summary)
}

func (h *HTTPHandler) StreamLiveMetrics(c *gin.Context) {
	tenantId := c.GetString("tenant_id")
	if tenantId == "" {
		tenantId = c.GetHeader("X-Tenant-ID")
	}

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Transfer-Encoding", "chunked")

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Streaming unsupported"})
		return
	}

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	// Initial message
	summary, _ := h.collector.FetchSummary(c.Request.Context(), tenantId)
	if data, err := json.Marshal(summary); err == nil {
		fmt.Fprintf(c.Writer, "data: %s\n\n", data)
		flusher.Flush()
	}

	for {
		select {
		case <-c.Request.Context().Done():
			logger.Info(c.Request.Context(), "Client closed live metrics SSE connection")
			return
		case <-ticker.C:
			summary, err := h.collector.FetchSummary(c.Request.Context(), tenantId)
			if err != nil {
				logger.Warn(c.Request.Context(), "Error fetching live metrics", zap.Error(err))
				continue
			}
			data, err := json.Marshal(summary)
			if err != nil {
				continue
			}
			fmt.Fprintf(c.Writer, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}

func (h *HTTPHandler) GetKongRoutes(c *gin.Context) {
	data, err := h.collector.FetchKongRoutes(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *HTTPHandler) GetKongTraffic(c *gin.Context) {
	data, err := h.collector.FetchKongTraffic(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *HTTPHandler) GetComputeMetrics(c *gin.Context) {
	data, err := h.collector.FetchComputeMetrics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *HTTPHandler) GetOltPollerMetrics(c *gin.Context) {
	data, err := h.collector.FetchOltPollerMetrics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *HTTPHandler) GetDbMetrics(c *gin.Context) {
	data, err := h.collector.FetchDbMetrics(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *HTTPHandler) GetNotificationStats(c *gin.Context) {
	data, err := h.collector.FetchNotificationStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *HTTPHandler) GetMapStats(c *gin.Context) {
	data, err := h.collector.FetchMapStats(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *HTTPHandler) CheckDns(c *gin.Context) {
	domain := c.Query("domain")
	data, err := h.collector.CheckDns(c.Request.Context(), domain)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, data)
}

func (h *HTTPHandler) LogServiceHealthEvent(c *gin.Context) {
	var payload map[string]interface{}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}
	logger.Info(c.Request.Context(), "Service health status transition recorded", zap.Any("event", payload))
	c.JSON(http.StatusOK, gin.H{"status": "RECORDED", "timestamp": time.Now().UTC().Format(time.RFC3339)})
}
