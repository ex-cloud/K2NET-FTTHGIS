package middleware

import (
	"net/http"
	"strings"

	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

const (
	ContextKeyTenantID      = "tenant_id"
	ContextKeyTenantRealm   = "tenant_realm"
	ContextKeyIsPlatform    = "is_platform"
	HeaderTenantID          = "X-Tenant-ID"
	HeaderTenantIdAlt       = "X-Tenant-Id"
	HeaderTenantRealm       = "X-Tenant-Realm"
	HeaderGatewayToken      = "X-Gateway-Token"
	PlatformRealmName       = "ftth-realm"
)

// TenantContextMiddleware extracts, validates, and normalizes tenant and realm headers forwarded by Kong
func TenantContextMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Extract Realm forwarded by Kong post-function
		realm := c.GetHeader(HeaderTenantRealm)
		if realm == "" {
			// Fallback: check query or context
			realm = c.GetString(ContextKeyTenantRealm)
		}
		realm = strings.TrimSpace(realm)

		// 2. Determine if caller operates with Platform-level privileges
		isPlatform := realm == PlatformRealmName

		// 3. Extract Tenant ID forwarded by Kong
		tenantID := c.GetHeader(HeaderTenantID)
		if tenantID == "" {
			tenantID = c.GetHeader(HeaderTenantIdAlt)
		}
		if tenantID == "" {
			tenantID = c.GetString(ContextKeyTenantID)
		}
		tenantID = strings.TrimSpace(tenantID)

		// 4. Store resolved context in Gin context
		c.Set(ContextKeyTenantID, tenantID)
		c.Set(ContextKeyTenantRealm, realm)
		c.Set(ContextKeyIsPlatform, isPlatform)

		c.Next()
	}
}

// GetTenantID extracts the active tenant ID from Gin context or request headers
func GetTenantID(c *gin.Context) string {
	if tid, exists := c.Get(ContextKeyTenantID); exists {
		if s, ok := tid.(string); ok && s != "" {
			return s
		}
	}
	tid := c.GetHeader(HeaderTenantID)
	if tid == "" {
		tid = c.GetHeader(HeaderTenantIdAlt)
	}
	return strings.TrimSpace(tid)
}

// GetTenantRealm extracts the active Keycloak realm from Gin context or request headers
func GetTenantRealm(c *gin.Context) string {
	if r, exists := c.Get(ContextKeyTenantRealm); exists {
		if s, ok := r.(string); ok && s != "" {
			return s
		}
	}
	return strings.TrimSpace(c.GetHeader(HeaderTenantRealm))
}

// IsPlatformScope returns true if the authenticated request originates from the dedicated platform realm
func IsPlatformScope(c *gin.Context) bool {
	if p, exists := c.Get(ContextKeyIsPlatform); exists {
		if b, ok := p.(bool); ok {
			return b
		}
	}
	return GetTenantRealm(c) == PlatformRealmName
}

// EnforceTenantAccess ensures that the caller only accesses resources belonging to their own tenant.
// If caller originates from the platform realm (super_admin), access is granted across tenants.
// If cross-tenant access is attempted, the request is aborted with HTTP 403 Forbidden.
func EnforceTenantAccess(c *gin.Context, targetTenantID string) bool {
	targetTenantID = strings.TrimSpace(targetTenantID)
	if targetTenantID == "" {
		return true // No specific target constraint
	}

	if IsPlatformScope(c) {
		return true // Platform realm users have super-admin visibility
	}

	callerTenantID := GetTenantID(c)
	if callerTenantID == "" || callerTenantID != targetTenantID {
		if logger.Log != nil {
			logger.Log.Warn("🚨 Cross-tenant access attempt blocked by EnforceTenantAccess",
				zap.String("caller_tenant", callerTenantID),
				zap.String("target_tenant", targetTenantID),
				zap.String("path", c.Request.URL.Path),
				zap.String("client_ip", c.ClientIP()),
			)
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error":   "FORBIDDEN",
			"message": "Cross-tenant access forbidden: you cannot access resources of another organization",
		})
		return false
	}

	return true
}

// RequireTenantID ensures that a tenant ID is present on the request.
// If absent and caller is not platform scope, aborts with HTTP 400 Bad Request.
func RequireTenantID() gin.HandlerFunc {
	return func(c *gin.Context) {
		tenantID := GetTenantID(c)
		if tenantID == "" && !IsPlatformScope(c) {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
				"error":   "BAD_REQUEST",
				"message": "Missing required X-Tenant-ID header",
			})
			return
		}
		c.Next()
	}
}
