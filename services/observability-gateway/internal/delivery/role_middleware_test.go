package delivery

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func createTestJWT(claims jwtClaims) string {
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"RS256","typ":"JWT"}`))
	claimsBytes, _ := json.Marshal(claims)
	payload := base64.RawURLEncoding.EncodeToString(claimsBytes)
	signature := base64.RawURLEncoding.EncodeToString([]byte("dummy-signature"))
	return header + "." + payload + "." + signature
}

func TestRequireRoleMiddleware(t *testing.T) {
	gin.SetMode(gin.TestMode)

	r := gin.New()
	r.Use(RequireRole("admin", "tenant_admin"))
	r.GET("/api/v1/metrics", func(c *gin.Context) {
		tenantID := c.GetString("tenant_id")
		c.JSON(http.StatusOK, gin.H{"status": "ok", "tenant_id": tenantID})
	})

	// Case 1: Internal Gateway Token Bypass -> 200 OK
	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/metrics", nil)
	req1.Header.Set("X-Gateway-Token", "some-token")
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Errorf("expected 200 for internal gateway token, got %d", w1.Code)
	}

	// Case 2: Missing Token -> 401 Unauthorized
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/metrics", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for missing token, got %d", w2.Code)
	}

	// Case 3: Valid JWT with Super Admin -> 200 OK
	var superAdminClaims jwtClaims
	superAdminClaims.TenantId = "isp-bandung"
	superAdminClaims.RealmAccess.Roles = []string{"super_admin"}
	jwtSuper := createTestJWT(superAdminClaims)

	req3 := httptest.NewRequest(http.MethodGet, "/api/v1/metrics", nil)
	req3.Header.Set("Authorization", "Bearer "+jwtSuper)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Errorf("expected 200 for super_admin role, got %d", w3.Code)
	}

	// Case 4: Insufficient Role -> 403 Forbidden
	var userClaims jwtClaims
	userClaims.RealmAccess.Roles = []string{"viewer"}
	jwtUser := createTestJWT(userClaims)

	req4 := httptest.NewRequest(http.MethodGet, "/api/v1/metrics", nil)
	req4.Header.Set("Authorization", "Bearer "+jwtUser)
	w4 := httptest.NewRecorder()
	r.ServeHTTP(w4, req4)
	if w4.Code != http.StatusForbidden {
		t.Errorf("expected 403 for insufficient role, got %d", w4.Code)
	}
}
