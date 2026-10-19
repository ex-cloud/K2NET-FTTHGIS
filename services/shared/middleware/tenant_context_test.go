package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"

	"gateways/shared/logger"
)

func setupTestRouter() *gin.Engine {
	logger.InitLogger()
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(TenantContextMiddleware())
	return r
}

func TestTenantContextMiddleware_PlatformRealm(t *testing.T) {
	r := setupTestRouter()
	r.GET("/api/v1/test", func(c *gin.Context) {
		assert.True(t, IsPlatformScope(c))
		assert.Equal(t, "ftth-realm", GetTenantRealm(c))
		assert.Equal(t, "00000000-0000-0000-0000-000000000000", GetTenantID(c))
		// Platform scope should allow accessing any tenant target
		allowed := EnforceTenantAccess(c, "tenant-abc")
		assert.True(t, allowed)
		c.Status(http.StatusOK)
	})

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/test", nil)
	req.Header.Set(HeaderTenantRealm, "ftth-realm")
	req.Header.Set(HeaderTenantID, "00000000-0000-0000-0000-000000000000")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestTenantContextMiddleware_TenantRealm_SameTenant(t *testing.T) {
	r := setupTestRouter()
	r.GET("/api/v1/test", func(c *gin.Context) {
		assert.False(t, IsPlatformScope(c))
		assert.Equal(t, "tenant-realm-xyz", GetTenantRealm(c))
		assert.Equal(t, "tenant-123", GetTenantID(c))
		allowed := EnforceTenantAccess(c, "tenant-123")
		assert.True(t, allowed)
		c.Status(http.StatusOK)
	})

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/test", nil)
	req.Header.Set(HeaderTenantRealm, "tenant-realm-xyz")
	req.Header.Set(HeaderTenantID, "tenant-123")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestTenantContextMiddleware_TenantRealm_CrossTenantBlocked(t *testing.T) {
	r := setupTestRouter()
	r.GET("/api/v1/test", func(c *gin.Context) {
		allowed := EnforceTenantAccess(c, "tenant-other")
		if !allowed {
			return
		}
		c.Status(http.StatusOK)
	})

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/test", nil)
	req.Header.Set(HeaderTenantRealm, "tenant-realm-xyz")
	req.Header.Set(HeaderTenantID, "tenant-123")

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	assert.Equal(t, http.StatusForbidden, w.Code)
}
