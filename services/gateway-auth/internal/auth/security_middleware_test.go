package auth

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
)

func TestIsTrustedOrigin(t *testing.T) {
	tests := []struct {
		origin        string
		requestHost   string
		forwardedHost []string
		expected      bool
	}{
		{"https://system-gis.kdua.net", "system-gis.kdua.net", nil, true},
		{"https://system-gis.kdua.net", "ftth-auth-gateway", nil, true},
		{"https://system-gis.kdua.net:8000", "system-gis.kdua.net:8000", nil, true},
		{"https://kircon-bandung-gis.kdua.net", "kdua.net", nil, true},
		{"https://kircon-bandung-gis.kdua.net", "ftth-auth-gateway", nil, true},
		{"https://custom-isp.com", "ftth-auth-gateway", []string{"custom-isp.com"}, true},
		{"http://localhost:3000", "localhost:8000", nil, true},
		{"http://127.0.0.1:3001", "127.0.0.1:8000", nil, true},
		{"https://malicious.com", "system-gis.kdua.net", nil, false},
		{"https://kdua.net.attacker.com", "system-gis.kdua.net", nil, false},
		{"invalid-uri", "system-gis.kdua.net", nil, false},
		{"", "system-gis.kdua.net", nil, false},
	}

	for _, tt := range tests {
		got := isTrustedOrigin(tt.origin, tt.requestHost, tt.forwardedHost...)
		if got != tt.expected {
			t.Errorf("isTrustedOrigin(%q, %q, %v) = %v; want %v", tt.origin, tt.requestHost, tt.forwardedHost, got, tt.expected)
		}
	}
}

func TestSecurityHeadersAndCSRFMiddleware_Rejection(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(SecurityHeadersAndCSRFMiddleware())
	router.POST("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 1. Simple HTML Form POST should be rejected
	reqForm := httptest.NewRequest(http.MethodPost, "/test", strings.NewReader("user=admin"))
	reqForm.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	recForm := httptest.NewRecorder()
	router.ServeHTTP(recForm, reqForm)

	if recForm.Code != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden for form-urlencoded, got %d", recForm.Code)
	}

	// 2. Untrusted Origin should be rejected
	reqOrigin := httptest.NewRequest(http.MethodPost, "/test", strings.NewReader(`{"user":"admin"}`))
	reqOrigin.Header.Set("Content-Type", "application/json")
	reqOrigin.Header.Set("Origin", "https://evil-phishing.org")
	reqOrigin.Host = "system-gis.kdua.net"
	recOrigin := httptest.NewRecorder()
	router.ServeHTTP(recOrigin, reqOrigin)

	if recOrigin.Code != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden for untrusted origin, got %d", recOrigin.Code)
	}

	// 3. Valid JSON request with trusted origin passes with security headers
	reqValid := httptest.NewRequest(http.MethodPost, "/test", strings.NewReader(`{"user":"admin"}`))
	reqValid.Header.Set("Content-Type", "application/json")
	reqValid.Header.Set("Origin", "https://system-gis.kdua.net")
	reqValid.Host = "system-gis.kdua.net"
	recValid := httptest.NewRecorder()
	router.ServeHTTP(recValid, reqValid)

	if recValid.Code != http.StatusOK {
		t.Errorf("expected 200 OK for valid request, got %d", recValid.Code)
	}
	if recValid.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Errorf("missing nosniff header")
	}
	if recValid.Header().Get("X-Frame-Options") != "DENY" {
		t.Errorf("missing DENY header")
	}
}

func TestPerIPRateLimitMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(PerIPRateLimitMiddleware(2, 500*time.Millisecond))
	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"pong": true})
	})

	// Request 1: OK
	req1 := httptest.NewRequest(http.MethodGet, "/ping", nil)
	req1.RemoteAddr = "192.168.1.100:12345"
	rec1 := httptest.NewRecorder()
	router.ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusOK {
		t.Errorf("req1 failed: %d", rec1.Code)
	}

	// Request 2: OK (reaches max 2)
	req2 := httptest.NewRequest(http.MethodGet, "/ping", nil)
	req2.RemoteAddr = "192.168.1.100:12345"
	rec2 := httptest.NewRecorder()
	router.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusOK {
		t.Errorf("req2 failed: %d", rec2.Code)
	}

	// Request 3: Blocked (exceeds 2)
	req3 := httptest.NewRequest(http.MethodGet, "/ping", nil)
	req3.RemoteAddr = "192.168.1.100:12345"
	rec3 := httptest.NewRecorder()
	router.ServeHTTP(rec3, req3)
	if rec3.Code != http.StatusTooManyRequests {
		t.Errorf("req3 should be rate limited, got %d", rec3.Code)
	}

	// Different IP should still be allowed
	reqOther := httptest.NewRequest(http.MethodGet, "/ping", nil)
	reqOther.RemoteAddr = "192.168.1.200:12345"
	recOther := httptest.NewRecorder()
	router.ServeHTTP(recOther, reqOther)
	if recOther.Code != http.StatusOK {
		t.Errorf("different IP should succeed, got %d", recOther.Code)
	}
}

