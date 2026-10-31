package auth

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
)

// TenantContextResponse represents fast organization branding & tier auth metadata
// returned by GET /api/v1/auth/tenant-context?slug={slug}.
type TenantContextResponse struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	Slug            string   `json:"slug"`
	TargetSlug      string   `json:"targetSlug,omitempty"`
	IsAlias         bool     `json:"isAlias"`
	RealmKey        string   `json:"realmKey"`
	LogoURL         string   `json:"logoUrl,omitempty"`
	Plan            string   `json:"plan"`
	PlanDisplayName string   `json:"planDisplayName"`
	AuthMode        string   `json:"authMode"`
	Status          string   `json:"status"`
	HasSSO          bool     `json:"hasSso"`
	AllowedMethods  []string `json:"allowedMethods"`
	MFARequired     bool     `json:"mfaRequired"`
}

// LoginRequest is the payload submitted by native React AuthLoginForm to POST /api/v1/auth/login.
type LoginRequest struct {
	Plane          string `json:"plane"`          // "PLATFORM" or "TENANT"
	TenantSlug     string `json:"tenantSlug"`     // Required when Plane == "TENANT"
	Username       string `json:"username"`       // Email or username
	Password       string `json:"password"`       // Raw password (never logged)
	TOTP           string `json:"totp,omitempty"` // Optional 6-digit MFA OTP code
	RememberMe     bool   `json:"rememberMe"`
	TurnstileToken string `json:"turnstileToken,omitempty"`
}

// RefreshRequest is an optional fallback payload for POST /api/v1/auth/refresh when cookies are unavailable.
type RefreshRequest struct {
	RefreshToken string `json:"refreshToken,omitempty"`
	Plane        string `json:"plane,omitempty"`
	Realm        string `json:"realm,omitempty"`
}

// LogoutRequest is an optional payload for POST /api/v1/auth/logout.
type LogoutRequest struct {
	RefreshToken string `json:"refreshToken,omitempty"`
	Plane        string `json:"plane,omitempty"`
	Realm        string `json:"realm,omitempty"`
	TenantSlug   string `json:"tenantSlug,omitempty"`
}

// AuthenticatedUser summarizes the normalized identity returned to the React SPA.
type AuthenticatedUser struct {
	ID             string   `json:"id"`
	Username       string   `json:"username"`
	Email          string   `json:"email"`
	Name           string   `json:"name"`
	Roles          []string `json:"roles"`
	OrganizationID string   `json:"organizationId,omitempty"`
	TenantID       string   `json:"tenantId,omitempty"`
	TenantSlug     string   `json:"tenantSlug,omitempty"`
	Realm          string   `json:"realm"`
}

// LoginResponse is returned by POST /api/v1/auth/login, /api/v1/auth/mfa/verify, and /api/v1/auth/refresh.
type LoginResponse struct {
	MFARequired      bool               `json:"mfaRequired,omitempty"`
	Message          string             `json:"message,omitempty"`
	AccessToken      string             `json:"accessToken,omitempty"`
	RefreshToken     string             `json:"refreshToken,omitempty"`
	IDToken          string             `json:"idToken,omitempty"`
	TokenType        string             `json:"tokenType,omitempty"`
	ExpiresIn        int                `json:"expiresIn,omitempty"`
	RefreshExpiresIn int                `json:"refreshExpiresIn,omitempty"`
	Realm            string             `json:"realm,omitempty"`
	User             *AuthenticatedUser `json:"user,omitempty"`
}

// KeycloakTokenResponse maps Keycloak's /protocol/openid-connect/token JSON output.
type KeycloakTokenResponse struct {
	AccessToken      string `json:"access_token"`
	ExpiresIn        int    `json:"expires_in"`
	RefreshExpiresIn int    `json:"refresh_expires_in"`
	RefreshToken     string `json:"refresh_token"`
	TokenType        string `json:"token_type"`
	IDToken          string `json:"id_token"`
	SessionState     string `json:"session_state"`
	Scope            string `json:"scope"`
}

// KeycloakErrorResponse maps OAuth2 error payloads from Keycloak.
type KeycloakErrorResponse struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

// JWTClaims extracts identity & multi-tenant attributes from a Keycloak-issued access token.
type JWTClaims struct {
	Sub               string `json:"sub"`
	Email             string `json:"email"`
	PreferredUsername string `json:"preferred_username"`
	Name              string `json:"name"`
	GivenName         string `json:"given_name"`
	FamilyName        string `json:"family_name"`
	Issuer            string `json:"iss"`
	OrganizationID    string `json:"organization_id"`
	TenantID          string `json:"tenant_id"`
	TenantSlug        string `json:"tenant_slug"`
	RealmAccess       struct {
		Roles []string `json:"roles"`
	} `json:"realm_access"`
	ResourceAccess map[string]struct {
		Roles []string `json:"roles"`
	} `json:"resource_access"`
}

// ParseJWTClaimsFromInternalToken decodes the payload of a JWT just obtained directly
// over the internal network from Keycloak's OIDC token endpoint.
func ParseJWTClaimsFromInternalToken(rawJWT string) (*JWTClaims, error) {
	parts := strings.Split(rawJWT, ".")
	if len(parts) != 3 {
		return nil, errors.New("malformed jwt token")
	}
	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, err
	}
	var claims JWTClaims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, err
	}
	if strings.TrimSpace(claims.Sub) == "" {
		return nil, errors.New("jwt missing sub claim")
	}
	return &claims, nil
}

// ExtractRoles normalizes realm and frontend client roles from JWTClaims.
func (c *JWTClaims) ExtractRoles(clientID string) []string {
	seen := make(map[string]struct{})
	var roles []string
	add := func(r string) {
		clean := strings.TrimSpace(r)
		if clean == "" {
			return
		}
		// Skip internal Keycloak composite housekeeping roles
		if strings.HasPrefix(clean, "default-roles-") || clean == "offline_access" || clean == "uma_authorization" {
			return
		}
		if _, ok := seen[clean]; !ok {
			seen[clean] = struct{}{}
			roles = append(roles, clean)
		}
	}
	for _, r := range c.RealmAccess.Roles {
		add(r)
	}
	if clientID != "" && c.ResourceAccess != nil {
		if ca, ok := c.ResourceAccess[clientID]; ok {
			for _, r := range ca.Roles {
				add(r)
			}
		}
	}
	return roles
}

// ForgotPasswordRequest is submitted to POST /api/v1/auth/forgot-password.
type ForgotPasswordRequest struct {
	Username       string `json:"username" binding:"required"`
	TurnstileToken string `json:"turnstileToken,omitempty"`
	Plane          string `json:"plane,omitempty"`
	TenantSlug     string `json:"tenantSlug,omitempty"`
	Lang           string `json:"lang,omitempty"`
}

// ResetPasswordRequest is submitted to POST /api/v1/auth/reset-password.
type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"newPassword" binding:"required"`
}

// ActivateAccountRequest is submitted to POST /api/v1/auth/activate.
type ActivateAccountRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// ResetTokenData stores token state in Redis auth:reset:<token>.
type ResetTokenData struct {
	UserID     string `json:"userId"`
	Email      string `json:"email"`
	Username   string `json:"username"`
	FullName   string `json:"fullName"`
	Realm      string `json:"realm"`
	TenantSlug string `json:"tenantSlug"`
}

// ActivationTokenData stores token state in Redis auth:activate:<token>.
type ActivationTokenData struct {
	OrgID         string `json:"orgId"`
	OrgSlug       string `json:"orgSlug"`
	UserID        string `json:"userId"`
	AdminEmail    string `json:"adminEmail"`
	AdminUsername string `json:"adminUsername"`
	OrgName       string `json:"orgName"`
}


