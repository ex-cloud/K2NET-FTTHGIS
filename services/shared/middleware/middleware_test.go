package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCorrelationIDMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(CorrelationIDMiddleware())

	var capturedID string
	r.GET("/test", func(c *gin.Context) {
		capturedID = c.GetString("correlation_id")
		c.Status(http.StatusOK)
	})

	// Case 1: Header provided
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("X-Correlation-ID", "custom-trace-123")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Header().Get("X-Correlation-ID") != "custom-trace-123" {
		t.Errorf("expected header X-Correlation-ID to be custom-trace-123, got %q", w.Header().Get("X-Correlation-ID"))
	}
	if capturedID != "custom-trace-123" {
		t.Errorf("expected context correlation_id to be custom-trace-123, got %q", capturedID)
	}

	// Case 2: Header absent -> generated automatically
	req2 := httptest.NewRequest(http.MethodGet, "/test", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)

	generatedID := w2.Header().Get("X-Correlation-ID")
	if generatedID == "" {
		t.Errorf("expected non-empty generated X-Correlation-ID header")
	}
	if capturedID == "" || capturedID != generatedID {
		t.Errorf("expected matching generated correlation_id in context, got %q", capturedID)
	}
}

func TestInternalAuthMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)
	os.Setenv("GATEWAY_TOKEN", "test-secret-token")
	InitAuthToken()

	r := gin.New()
	r.Use(InternalAuthMiddleware())
	r.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Case 1: Missing Token -> 401 Unauthorized
	req1 := httptest.NewRequest(http.MethodGet, "/protected", nil)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 for missing token, got %d", w1.Code)
	}

	// Case 2: Wrong Token -> 401 Unauthorized
	req2 := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req2.Header.Set("X-Gateway-Token", "wrong-token")
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusUnauthorized {
		t.Errorf("expected status 401 for wrong token, got %d", w2.Code)
	}

	// Case 3: Valid Token -> 200 OK
	req3 := httptest.NewRequest(http.MethodGet, "/protected", nil)
	req3.Header.Set("X-Gateway-Token", "test-secret-token")
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Errorf("expected status 200 for valid token, got %d", w3.Code)
	}
}

func TestExtractRealmFromIssuer(t *testing.T) {
	tests := []struct {
		issuer   string
		expected string
	}{
		{
			issuer:   "http://keycloak:8081/realms/isp-bandung",
			expected: "isp-bandung",
		},
		{
			issuer:   "https://auth.kdua.net/realms/master/",
			expected: "master",
		},
		{
			issuer:   "https://auth.kdua.net/realms/ftth-realm",
			expected: "ftth-realm",
		},
		{
			issuer:   "",
			expected: "ftth-realm",
		},
	}

	for _, tt := range tests {
		got := ExtractRealmFromIssuer(tt.issuer)
		if got != tt.expected {
			t.Errorf("ExtractRealmFromIssuer(%q) = %q; want %q", tt.issuer, got, tt.expected)
		}
	}
}
