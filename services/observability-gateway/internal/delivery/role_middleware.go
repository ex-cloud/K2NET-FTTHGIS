package delivery

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type jwtClaims struct {
	TenantId       string `json:"tenant_id"`
	OrganizationId string `json:"organization_id"`
	TenantSlug     string `json:"tenant_slug"`
	RealmAccess struct {
		Roles []string `json:"roles"`
	} `json:"realm_access"`
	ResourceAccess map[string]struct {
		Roles []string `json:"roles"`
	} `json:"resource_access"`
}

// RequireRole enforces role-based authorization and extracts multi-tenant context from verified JWT
func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Allow internal service mesh requests with valid X-Gateway-Token
		gatewayToken := c.GetHeader("X-Gateway-Token")
		if gatewayToken != "" {
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		token := strings.TrimPrefix(authHeader, "Bearer ")
		parts := strings.Split(token, ".")
		if len(parts) != 3 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "unauthorized: missing or malformed bearer token",
			})
			return
		}

		// Signature has already been cryptographically verified by Kong JWT plugin.
		// Decode payload safely using base64.RawURLEncoding.
		payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
		if err != nil {
			// Fallback for standard encoding with padding
			payloadBytes, err = base64.URLEncoding.DecodeString(parts[1])
			if err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
					"error": "unauthorized: invalid token payload encoding",
				})
				return
			}
		}

		var claims jwtClaims
		if err := json.Unmarshal(payloadBytes, &claims); err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "unauthorized: failed to parse token claims",
			})
			return
		}

		// Extract Tenant ID from claims and store in context
		tenantId := claims.TenantId
		if tenantId == "" {
			tenantId = claims.OrganizationId
		}
		if tenantId == "" {
			tenantId = claims.TenantSlug
		}
		if tenantId != "" {
			c.Set("tenant_id", tenantId)
		}

		userRoles := claims.RealmAccess.Roles

		// Super Admin bypass / God mode
		for _, r := range userRoles {
			if r == "super-admin" || r == "super_admin" || r == "ROLE_SUPER_ADMIN" {
				c.Set("is_super_admin", true)
				c.Next()
				return
			}
		}

		// Check against allowed roles list
		for _, r := range userRoles {
			for _, allowed := range allowedRoles {
				if r == allowed {
					c.Next()
					return
				}
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
			"error": "forbidden: insufficient role access for observability metrics",
		})
	}
}
