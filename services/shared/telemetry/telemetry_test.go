package telemetry

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestTelemetryMiddlewareAndMetricsHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	InitTelemetry("test-gateway")

	r := gin.New()
	r.Use(TelemetryMiddleware())
	r.GET("/api/v1/ping", func(c *gin.Context) {
		c.String(http.StatusOK, "pong")
	})
	r.GET("/metrics", GetMetricsHandler())

	// Send a request to ping
	reqPing := httptest.NewRequest(http.MethodGet, "/api/v1/ping", nil)
	wPing := httptest.NewRecorder()
	r.ServeHTTP(wPing, reqPing)

	if wPing.Code != http.StatusOK {
		t.Errorf("expected status 200 from /ping, got %d", wPing.Code)
	}

	// Send a request to /metrics
	reqMetrics := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	wMetrics := httptest.NewRecorder()
	r.ServeHTTP(wMetrics, reqMetrics)

	if wMetrics.Code != http.StatusOK {
		t.Errorf("expected status 200 from /metrics, got %d", wMetrics.Code)
	}

	body := wMetrics.Body.String()
	if body == "" {
		t.Error("expected non-empty metrics output from Prometheus handler")
	}
}
