package telemetry

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	HttpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_http_requests_total",
			Help: "Total number of HTTP requests processed.",
		},
		[]string{"path", "method", "status"},
	)
	HttpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "gateway_http_request_duration_seconds",
			Help:    "Histogram of response latencies for HTTP requests.",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"path", "method"},
	)
)

func InitTelemetry(serviceName string) {
	// Attempt to register, ignore if already registered
	_ = prometheus.Register(HttpRequestsTotal)
	_ = prometheus.Register(HttpRequestDuration)
}

func TelemetryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.FullPath()
		if path == "" {
			path = "unknown"
		}
		method := c.Request.Method
		
		timer := prometheus.NewTimer(HttpRequestDuration.WithLabelValues(path, method))
		defer timer.ObserveDuration()
		
		c.Next()
		
		status := strconv.Itoa(c.Writer.Status())
		HttpRequestsTotal.WithLabelValues(path, method, status).Inc()
	}
}

func GetMetricsHandler() gin.HandlerFunc {
	h := promhttp.Handler()
	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}
