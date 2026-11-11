package auth

import (
	"bytes"
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"time"

	"gateways/gateway-auth/internal/config"
	"gateways/shared/auditclient"
	"gateways/shared/httpclient"
	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

const (
	secureRefreshCookieName = "__Secure-k2net_refresh_token"
	refreshCookieName       = "k2net_refresh_token"
	realmCookieName         = "k2net_auth_realm"
	cookiePath              = "/api/v1/auth"
)

var (
	validSlugRegex = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`)
	validTOTPRegex = regexp.MustCompile(`^[0-9]{6,8}$`)
)

// Handler serves BFF authentication endpoints on gateway-auth (:5014).
type Handler struct {
	cfg         *config.Config
	repo        Repository
	auditClient *auditclient.Client
	httpClient  *http.Client
	rdb         *redis.Client
	kcAdmin     *KeycloakAdminClient
	notifClient *NotificationClient
}

// NewHandler creates a new BFF authentication HTTP handler.
func NewHandler(cfg *config.Config, repo Repository, auditClient *auditclient.Client, rdb *redis.Client) *Handler {
	notifURL := os.Getenv("NOTIFICATION_GATEWAY_URL")
	if notifURL == "" {
		notifURL = "http://ftth-notification-gateway:5001"
	}
	kcUser := os.Getenv("KC_BOOTSTRAP_ADMIN_USERNAME")
	kcPass := os.Getenv("KC_BOOTSTRAP_ADMIN_PASSWORD")
	if kcUser == "" {
		kcUser = "k2net-master-admin"
	}
	if kcPass == "" {
		kcPass = "3pHx9nTw4v5Q2zYrS"
	}

	return &Handler{
		cfg:         cfg,
		repo:        repo,
		auditClient: auditClient,
		httpClient:  httpclient.NewClient(10 * time.Second),
		rdb:         rdb,
		kcAdmin:     NewKeycloakAdminClient(cfg.KeycloakInternalURL, kcUser, kcPass, rdb),
		notifClient: NewNotificationClient(notifURL, cfg.GatewayToken),
	}
}

// HealthCheck handles GET /health and GET /healthz.
func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "UP",
		"service":   "gateway-auth",
		"version":   "1.0.0",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// GetTenantContext handles GET /api/v1/auth/tenant-context?slug={slug}.
func (h *Handler) GetTenantContext(c *gin.Context) {
	rawSlug := strings.ToLower(strings.TrimSpace(c.Query("slug")))
	if rawSlug == "" || !validSlugRegex.MatchString(rawSlug) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_SLUG",
			"message": "Format subdomain organisasi tidak valid.",
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	// Support ?live=1 to bypass Redis cache for atomic pre-redirect race-condition verification
	if liveParam := strings.ToLower(strings.TrimSpace(c.Query("live"))); (liveParam == "1" || liveParam == "true") && h.rdb != nil {
		_ = h.rdb.Del(ctx, "auth:tenant-ctx:"+rawSlug).Err()
	}

	tenantCtx, err := h.repo.ResolveTenantContext(ctx, rawSlug)
	if err != nil {
		if errors.Is(err, ErrTenantNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "TENANT_NOT_FOUND",
				"message": "Workspace organisasi tidak ditemukan.",
			})
			return
		}
		logger.Error(c.Request.Context(), "Failed resolving tenant context", zap.String("slug", rawSlug), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "INTERNAL_ERROR",
			"message": "Gagal memuat profil autentikasi organisasi.",
		})
		return
	}

	c.JSON(http.StatusOK, tenantCtx)
}

// GetSsoDiscovery handles GET /api/v1/auth/sso-discovery?email={email}&tenant={tenant} (Domain-based HRD).
func (h *Handler) GetSsoDiscovery(c *gin.Context) {
	email := strings.TrimSpace(c.Query("email"))
	if email == "" || !strings.Contains(email, "@") {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_EMAIL",
			"message": "Parameter email wajib disertakan dengan format valid.",
		})
		return
	}

	slug := strings.ToLower(strings.TrimSpace(c.Query("tenant")))
	if slug == "" {
		slug = strings.ToLower(strings.TrimSpace(c.GetHeader("X-Tenant-Slug")))
	}
	if slug == "" {
		rawHost := strings.ToLower(strings.TrimSpace(c.GetHeader("X-Forwarded-Host")))
		if rawHost == "" {
			rawHost = strings.ToLower(strings.TrimSpace(c.Request.Host))
		}
		if idx := strings.IndexByte(rawHost, ':'); idx > 0 {
			rawHost = rawHost[:idx]
		}
		if parts := strings.Split(rawHost, "."); len(parts) >= 3 {
			slug = parts[0]
		}
	}

	parts := strings.Split(email, "@")
	domain := ""
	if len(parts) == 2 {
		domain = strings.ToLower(strings.TrimSpace(parts[1]))
	}

	// Without tenant context, do not perform global cross-tenant discovery (anti tenant-enumeration)
	if slug == "" || slug == "system" {
		c.JSON(http.StatusOK, gin.H{
			"ssoAvailable": false,
			"emailDomain":  domain,
		})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 3*time.Second)
	defer cancel()

	resp, err := h.repo.DiscoverSsoByEmail(ctx, email, slug)
	if err != nil {
		logger.Error(c.Request.Context(), "Failed discovering SSO by email", zap.String("email", email), zap.String("tenant", slug), zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "INTERNAL_ERROR",
			"message": "Gagal memeriksa ketersediaan SSO domain email.",
		})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// isIPInCIDRList checks whether the client IP matches any allowed CIDRs (IPv4 and IPv6).
func isIPInCIDRList(clientIPStr string, cidrListStr string) bool {
	clientIPStr = strings.TrimSpace(clientIPStr)
	if clientIPStr == "" {
		return true
	}
	clientIP := net.ParseIP(clientIPStr)
	if clientIP == nil {
		return false
	}

	rawTokens := strings.FieldsFunc(cidrListStr, func(r rune) bool {
		return r == ',' || r == '\n' || r == '\r' || r == ';'
	})

	validCIDRsCount := 0
	for _, token := range rawTokens {
		token = strings.TrimSpace(token)
		if token == "" {
			continue
		}
		if !strings.Contains(token, "/") {
			if strings.Contains(token, ":") {
				token = token + "/128"
			} else {
				token = token + "/32"
			}
		}
		_, ipNet, err := net.ParseCIDR(token)
		if err != nil {
			continue
		}
		validCIDRsCount++
		if ipNet.Contains(clientIP) {
			return true
		}
	}

	if validCIDRsCount == 0 {
		return true
	}
	return false
}

// Login handles POST /api/v1/auth/login (Cloudflare-style native credentials + Turnstile + MFA + JIT Sync).
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_PAYLOAD",
			"message": "Permintaan login tidak valid.",
		})
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	req.TOTP = strings.TrimSpace(req.TOTP)
	req.TenantSlug = strings.ToLower(strings.TrimSpace(req.TenantSlug))
	plane := strings.ToUpper(strings.TrimSpace(req.Plane))
	if plane == "" {
		if req.TenantSlug != "" && req.TenantSlug != "system" {
			plane = "TENANT"
		} else {
			plane = "PLATFORM"
		}
	}

	if req.Username == "" || len(req.Username) > 254 || req.Password == "" || len(req.Password) > 256 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_CREDENTIALS_FORMAT",
			"message": "Email/username dan kata sandi wajib diisi.",
		})
		return
	}
	if req.TOTP != "" && !validTOTPRegex.MatchString(req.TOTP) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":       "INVALID_MFA_CODE",
			"mfaRequired": true,
			"message":     "Kode autentikator harus berupa 6 digit angka.",
		})
		return
	}

	clientIP := resolveClientIP(c)

	// 1. Verify Cloudflare Turnstile token when TurnstileSecretKey or TurnstileTenantSecretKey is configured.
	// Only verify on initial credential submission (step 1). On MFA step 2 (TOTP supplied), the Turnstile token
	// was already consumed in step 1, so re-verifying it causes Cloudflare "timeout-or-duplicate" rejection.
	secretToUse := h.cfg.TurnstileSecretKey
	if plane == "TENANT" && h.cfg.TurnstileTenantSecretKey != "" {
		secretToUse = h.cfg.TurnstileTenantSecretKey
	}

	if secretToUse != "" && req.TOTP == "" {
		if !h.verifyTurnstile(c.Request.Context(), secretToUse, req.TurnstileToken, clientIP) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "TURNSTILE_FAILED",
				"message": "Verifikasi keamanan anti-bot Cloudflare gagal. Silakan muat ulang dan coba lagi.",
			})
			return
		}
	}

	// 2. Determine target realm & validate tenant workspace status
	targetRealm := config.PlatformRealm
	auditSlug := "system"
	var tenantCtx *TenantContextResponse

	if plane == "TENANT" {
		targetRealm = config.TenantSharedRealm
		if req.TenantSlug == "" || !validSlugRegex.MatchString(req.TenantSlug) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "MISSING_TENANT_SLUG",
				"message": "Subdomain workspace ISP wajib disertakan.",
			})
			return
		}
		var err error
		tenantCtx, err = h.repo.ResolveTenantContext(c.Request.Context(), req.TenantSlug)
		if err != nil {
			if errors.Is(err, ErrTenantNotFound) {
				c.JSON(http.StatusNotFound, gin.H{
					"error":   "TENANT_NOT_FOUND",
					"message": "Workspace organisasi tidak ditemukan.",
				})
				return
			}
			logger.Error(c.Request.Context(), "Failed resolving tenant during login", zap.String("slug", req.TenantSlug), zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "INTERNAL_ERROR",
				"message": "Gagal memverifikasi status organisasi.",
			})
			return
		}
		effectiveTenantSlug := tenantCtx.Slug
		if tenantCtx.TargetSlug != "" {
			effectiveTenantSlug = tenantCtx.TargetSlug
		}
		auditSlug = effectiveTenantSlug

		statusUpper := strings.ToUpper(strings.TrimSpace(tenantCtx.Status))
		if statusUpper == "SUSPENDED" || statusUpper == "DELETED" || statusUpper == "PENDING_APPROVAL" {
			h.emitAudit(c.Request.Context(), auditSlug, req.Username, "", clientIP, "AUTH_LOGIN_BLOCKED_STATUS", map[string]any{
				"status": statusUpper,
				"plane":  plane,
			})
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "ORGANIZATION_SUSPENDED",
				"message": "Workspace organisasi Anda sedang ditangguhkan atau menunggu persetujuan aktivasi.",
			})
			return
		}

		// Enforce IP Allowlist / CIDR restriction
		if tenantCtx.IPAllowlistCIDRs != "" {
			if !isIPInCIDRList(clientIP, tenantCtx.IPAllowlistCIDRs) {
				h.emitAudit(c.Request.Context(), auditSlug, req.Username, "", clientIP, "AUTH_LOGIN_BLOCKED_IP_CIDR", map[string]any{
					"clientIP": clientIP,
					"plane":    plane,
				})
				c.JSON(http.StatusForbidden, gin.H{
					"error":   "IP_NOT_ALLOWED",
					"message": "Akses ditolak: Alamat IP perangkat Anda tidak terdaftar dalam daftar IP yang diizinkan organisasi.",
				})
				return
			}
		}

		// Enforce SSO & Break-Glass Emergency Access
		if tenantCtx.EnforceSSO {
			if !req.IsBreakGlass {
				c.JSON(http.StatusForbidden, gin.H{
					"error":           "SSO_ENFORCED",
					"message":         "Organisasi ini mewajibkan masuk menggunakan Single Sign-On (SSO).",
					"ssoProviderType": tenantCtx.SSOProviderType,
					"ssoDisplayName":  tenantCtx.SSODisplayName,
				})
				return
			}
			if !tenantCtx.AllowBreakGlass {
				c.JSON(http.StatusForbidden, gin.H{
					"error":   "BREAK_GLASS_NOT_ALLOWED",
					"message": "Akses darurat Break-Glass dinonaktifkan oleh kebijakan organisasi.",
				})
				return
			}
		}
	}

	// 3. Exchange credentials internally with Keycloak OIDC Token Endpoint (Direct Grant)
	kcTokens, kcErr, statusCode := h.exchangePasswordGrant(c.Request.Context(), targetRealm, req.Username, req.Password, req.TOTP)
	if kcErr != nil || kcTokens == nil {
		errDescLower := ""
		if kcErr != nil {
			errDescLower = strings.ToLower(kcErr.ErrorDescription + " " + kcErr.Error)
		}

		// Detect MFA / TOTP requirement from Keycloak Direct Grant
		if strings.Contains(errDescLower, "totp") || strings.Contains(errDescLower, "otp") {
			if req.TOTP == "" {
				c.JSON(http.StatusOK, LoginResponse{
					MFARequired: true,
					Message:     "Masukkan 6 digit kode autentikator MFA Anda.",
				})
				return
			}
			h.emitAudit(c.Request.Context(), auditSlug, req.Username, "", clientIP, "AUTH_MFA_FAILED", map[string]any{
				"plane": plane,
				"realm": targetRealm,
			})
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":       "INVALID_MFA_CODE",
				"mfaRequired": true,
				"message":     "Kode autentikator 6 digit tidak valid atau telah kedaluwarsa.",
			})
			return
		}

		// Detect required action / account not set up (MFA Enrollment Required)
		if strings.Contains(errDescLower, "not fully set up") ||
			strings.Contains(errDescLower, "required action") ||
			strings.Contains(errDescLower, "configure_totp") ||
			strings.Contains(errDescLower, "action required") {
			h.emitAudit(c.Request.Context(), auditSlug, req.Username, "", clientIP, "AUTH_MFA_ENROLLMENT_REQUIRED", map[string]any{
				"plane": plane,
				"realm": targetRealm,
			})
			c.JSON(http.StatusForbidden, gin.H{
				"error":       "MFA_ENROLLMENT_REQUIRED",
				"mfaRequired": true,
				"message":     "Organisasi Anda mewajibkan autentikasi 2-faktor (MFA). Silakan daftarkan metode MFA Anda terlebih dahulu.",
				"action":      "CONFIGURE_TOTP",
			})
			return
		}

		if statusCode == http.StatusBadGateway || statusCode == http.StatusGatewayTimeout || statusCode == http.StatusServiceUnavailable {
			logger.Warn(c.Request.Context(), "Keycloak upstream returned gateway error during login",
				zap.Int("status", statusCode),
				zap.String("realm", targetRealm),
			)
			c.JSON(http.StatusBadGateway, gin.H{
				"error":   "UPSTREAM_UNAVAILABLE",
				"message": "Authentication service is temporarily unavailable. Please try again.",
			})
			return
		}

		h.emitAudit(c.Request.Context(), auditSlug, req.Username, "", clientIP, "AUTH_LOGIN_FAILED", map[string]any{
			"plane":      plane,
			"realm":      targetRealm,
			"httpStatus": statusCode,
		})
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "INVALID_CREDENTIALS",
			"message": "Email/username atau kata sandi tidak valid.",
		})
		return
	}

	// 4. Parse & Verify Multi-Tenant Claim Isolation
	claims, parseErr := ParseJWTClaimsFromInternalToken(kcTokens.AccessToken)
	if parseErr != nil {
		logger.Error(c.Request.Context(), "Failed parsing Keycloak JWT payload", zap.Error(parseErr))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "TOKEN_PARSE_ERROR",
			"message": "Gagal memproses sesi autentikasi.",
		})
		return
	}

	roles := claims.ExtractRoles(h.cfg.KeycloakClientID)
	resolvedOrgID := strings.TrimSpace(claims.OrganizationID)
	if resolvedOrgID == "" {
		resolvedOrgID = strings.TrimSpace(claims.TenantID)
	}
	resolvedTenantSlug := strings.ToLower(strings.TrimSpace(claims.TenantSlug))

	if plane == "TENANT" && tenantCtx != nil {
		expectedSlug := tenantCtx.Slug
		if tenantCtx.TargetSlug != "" {
			expectedSlug = tenantCtx.TargetSlug
		}

		matchesClaim := (resolvedOrgID != "" && strings.EqualFold(resolvedOrgID, tenantCtx.ID)) ||
			(resolvedTenantSlug != "" && strings.EqualFold(resolvedTenantSlug, expectedSlug))

		if !matchesClaim {
			// Secondary database check in case a legacy user lacks Keycloak attribute
			belongsInDB, _ := h.repo.VerifyUserBelongsToOrg(c.Request.Context(), claims.Sub, claims.Email, tenantCtx.ID)
			if !belongsInDB || (resolvedOrgID != "" && !strings.EqualFold(resolvedOrgID, tenantCtx.ID)) {
				// Immediately revoke the newly created Keycloak session so no orphan session survives!
				h.revokeKeycloakSession(c.Request.Context(), targetRealm, kcTokens.RefreshToken)
				h.emitAudit(c.Request.Context(), expectedSlug, claims.Sub, joinRoles(roles), clientIP, "AUTH_CROSS_TENANT_BLOCKED", map[string]any{
					"attemptedTenantId":   tenantCtx.ID,
					"attemptedTenantSlug": expectedSlug,
					"tokenOrgId":          resolvedOrgID,
					"tokenTenantSlug":     resolvedTenantSlug,
				})
				c.JSON(http.StatusForbidden, gin.H{
					"error":   "TENANT_ACCESS_DENIED",
					"message": "Akun Anda tidak terdaftar pada workspace organisasi ini.",
				})
				return
			}
		}

		resolvedOrgID = tenantCtx.ID
		resolvedTenantSlug = expectedSlug

		if req.IsBreakGlass {
			hasAdminRole := false
			for _, r := range roles {
				cleanRole := strings.ToLower(strings.TrimPrefix(r, "ROLE_"))
				if cleanRole == "admin" || cleanRole == "super_admin" {
					hasAdminRole = true
					break
				}
			}
			if !hasAdminRole {
				h.revokeKeycloakSession(c.Request.Context(), targetRealm, kcTokens.RefreshToken)
				h.emitAudit(c.Request.Context(), auditSlug, claims.Sub, joinRoles(roles), clientIP, "AUTH_BREAK_GLASS_UNAUTHORIZED", map[string]any{
					"roles": roles,
				})
				c.JSON(http.StatusForbidden, gin.H{
					"error":   "BREAK_GLASS_UNAUTHORIZED",
					"message": "Akses darurat Break-Glass hanya diizinkan untuk Admin Organisasi.",
				})
				return
			}
			h.emitAudit(c.Request.Context(), auditSlug, claims.Sub, joinRoles(roles), clientIP, "AUTH_BREAK_GLASS_LOGIN_SUCCESS", map[string]any{
				"roles": roles,
			})
		}
	} else {
		// Platform Control Plane (ftth-realm): SYSTEM operators must NOT be bound to any tenant organization_id
		resolvedOrgID = ""
		if resolvedTenantSlug == "" {
			resolvedTenantSlug = "system"
		}
	}

	// 5. Multi-Factor Authentication (MFA) Evaluation & Step-Up Gate
	var mfaRequired bool
	var availableMethods []string

	totpEnabled := false
	totpSecret := ""
	emailOtpEnabled := false
	if h.kcAdmin != nil && claims.Sub != "" {
		if kcTotp, secret, kcEmailOtp, err := h.kcAdmin.GetUserMFAConfig(c.Request.Context(), targetRealm, claims.Sub); err == nil {
			if kcTotp && secret != "" {
				totpEnabled = true
				totpSecret = secret
			}
			emailOtpEnabled = kcEmailOtp
		}
	}

	webauthnCreds, _ := h.repo.GetUserWebauthnCredentials(c.Request.Context(), claims.Sub)
	if len(webauthnCreds) > 0 {
		availableMethods = append(availableMethods, "webauthn")
	}

	if totpEnabled {
		availableMethods = append(availableMethods, "totp")
	}

	if emailOtpEnabled && claims.Email != "" {
		availableMethods = append(availableMethods, "email_otp")
	}

	// Safe Fallback Anti-Lockout: if organization/platform enforces MFA or break-glass login is active,
	// but user has 0 methods configured, allow email_otp as emergency verification method so staff are never locked out.
	if ((tenantCtx != nil && tenantCtx.MFARequired) || req.IsBreakGlass) && len(availableMethods) == 0 && claims.Email != "" {
		availableMethods = append(availableMethods, "email_otp")
	}

	if len(availableMethods) > 0 || (tenantCtx != nil && tenantCtx.MFARequired) || req.IsBreakGlass {
		mfaRequired = true
	}

	displayName := strings.TrimSpace(claims.Name)
	if displayName == "" {
		displayName = strings.TrimSpace(claims.PreferredUsername)
	}

	preAuthSession := &PreAuthSession{
		UserID:           claims.Sub,
		Username:         claims.PreferredUsername,
		Email:            claims.Email,
		Name:             displayName,
		Roles:            roles,
		OrganizationID:   resolvedOrgID,
		TenantSlug:       resolvedTenantSlug,
		TargetRealm:      targetRealm,
		Plane:            plane,
		RememberMe:       req.RememberMe,
		AccessToken:      kcTokens.AccessToken,
		RefreshToken:     kcTokens.RefreshToken,
		IDToken:          kcTokens.IDToken,
		ExpiresIn:        kcTokens.ExpiresIn,
		RefreshExpiresIn: kcTokens.RefreshExpiresIn,
		AvailableMethods: availableMethods,
	}

	if mfaRequired {
		if req.TOTP != "" && totpSecret != "" {
			// Direct TOTP verification from credentials submission
			if !VerifyTOTPCode(totpSecret, req.TOTP, time.Now()) {
				h.revokeKeycloakSession(c.Request.Context(), targetRealm, kcTokens.RefreshToken)
				h.emitAudit(c.Request.Context(), auditSlug, req.Username, "", clientIP, "AUTH_MFA_FAILED", map[string]any{
					"plane":  plane,
					"realm":  targetRealm,
					"method": "totp",
				})
				c.JSON(http.StatusUnauthorized, gin.H{
					"error":       "INVALID_MFA_CODE",
					"mfaRequired": true,
					"message":     "Kode autentikator 6 digit tidak valid atau telah kedaluwarsa.",
				})
				return
			}
			h.completeLoginSession(c, preAuthSession, clientIP, "totp")
			return
		}

		// Step-Up Required: Store PreAuthSession in Redis (TTL 5 minutes)
		preAuthToken := generateSecureToken(32)
		if h.rdb != nil {
			if raw, err := json.Marshal(preAuthSession); err == nil {
				_ = h.rdb.Set(c.Request.Context(), "auth:pre-auth:"+preAuthToken, string(raw), 5*time.Minute).Err()
			}
		}

		stepUpMessage := "Silakan verifikasi faktor kedua Anda untuk melanjutkan."
		if req.IsBreakGlass {
			stepUpMessage = "Akses darurat Break-Glass mewajibkan verifikasi faktor kedua Anda."
		}

		c.JSON(http.StatusOK, LoginResponse{
			MFARequired:      true,
			AvailableMethods: availableMethods,
			PreAuthToken:     preAuthToken,
			MaskedEmail:      maskEmail(claims.Email),
			Message:          stepUpMessage,
		})
		return
	}

	// No MFA required: complete login session directly
	h.completeLoginSession(c, preAuthSession, clientIP, "")
}

func (h *Handler) completeLoginSession(c *gin.Context, session *PreAuthSession, clientIP string, mfaMethodUsed string) {
	// 1. Parameterized JIT User Sync to PostgreSQL ftth_gis.users
	if syncErr := h.repo.SyncUserJIT(c.Request.Context(), JITUserSyncInput{
		UserID:         session.UserID,
		Email:          session.Email,
		Username:       session.Username,
		FullName:       session.Name,
		OrganizationID: session.OrganizationID,
		Roles:          session.Roles,
		MFAUsed:        mfaMethodUsed != "",
		ClientIP:       clientIP,
	}); syncErr != nil {
		logger.Warn(c.Request.Context(), "Non-fatal JIT user sync warning", zap.String("userId", session.UserID), zap.Error(syncErr))
	}

	// 2. Set HttpOnly; Secure; SameSite=Strict refresh token & realm cookies
	maxAge := 86400 // 24 hours default
	if session.RememberMe {
		maxAge = 2592000 // 30 days
	} else if session.RefreshExpiresIn > 0 {
		maxAge = session.RefreshExpiresIn
	}
	h.setSessionCookies(c, session.RefreshToken, session.TargetRealm, maxAge)

	// 3. Async Audit Log to gateway-audit (:5009)
	auditSlug := session.TenantSlug
	if auditSlug == "" {
		if session.TargetRealm == config.PlatformRealm {
			auditSlug = "system"
		} else {
			auditSlug = "tenant"
		}
	}
	h.emitAudit(c.Request.Context(), auditSlug, session.UserID, joinRoles(session.Roles), clientIP, "AUTH_LOGIN_SUCCESS", map[string]any{
		"plane":      session.Plane,
		"realm":      session.TargetRealm,
		"mfaUsed":    mfaMethodUsed != "",
		"mfaMethod":  mfaMethodUsed,
		"rememberMe": session.RememberMe,
	})

	displayName := session.Name
	if displayName == "" {
		displayName = session.Username
	}

	c.JSON(http.StatusOK, LoginResponse{
		AccessToken:      session.AccessToken,
		RefreshToken:     session.RefreshToken,
		IDToken:          session.IDToken,
		TokenType:        "Bearer",
		ExpiresIn:        session.ExpiresIn,
		RefreshExpiresIn: session.RefreshExpiresIn,
		Realm:            session.TargetRealm,
		User: &AuthenticatedUser{
			ID:             session.UserID,
			Username:       session.Username,
			Email:          session.Email,
			Name:           displayName,
			Roles:          session.Roles,
			OrganizationID: session.OrganizationID,
			TenantID:       session.OrganizationID,
			TenantSlug:     session.TenantSlug,
			Realm:          session.TargetRealm,
		},
	})
}

// SendMfaEmailOTP handles POST /api/v1/auth/mfa/email/send
func (h *Handler) SendMfaEmailOTP(c *gin.Context) {
	var req MfaEmailSendRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.PreAuthToken) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_PAYLOAD",
			"message": "Token pra-autentikasi wajib disertakan.",
		})
		return
	}

	if h.rdb == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "CACHE_UNAVAILABLE",
			"message": "Layanan verifikasi sedang tidak tersedia sementara.",
		})
		return
	}

	ctx := c.Request.Context()
	preAuthKey := "auth:pre-auth:" + req.PreAuthToken
	rawSession, err := h.rdb.Get(ctx, preAuthKey).Result()
	if err != nil || rawSession == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "SESSION_EXPIRED",
			"message": "Sesi verifikasi Anda telah kedaluwarsa. Silakan login kembali.",
		})
		return
	}

	var session PreAuthSession
	if err := json.Unmarshal([]byte(rawSession), &session); err != nil || session.Email == "" {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "SESSION_INVALID",
			"message": "Data sesi pra-autentikasi tidak valid.",
		})
		return
	}

	// Rate limiting: Max 3 sends per 10 minutes per email
	rateKey := "auth:email-otp-rate:" + strings.ToLower(session.Email)
	count, _ := h.rdb.Incr(ctx, rateKey).Result()
	if count == 1 {
		_ = h.rdb.Expire(ctx, rateKey, 10*time.Minute).Err()
	}
	if count > 3 {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":   "TOO_MANY_REQUESTS",
			"message": "Terlalu banyak permintaan kode verifikasi. Harap tunggu beberapa saat.",
		})
		return
	}

	otpCode := generateSecureNumericOTP(6)
	otpKey := "auth:email-otp:" + req.PreAuthToken
	_ = h.rdb.Set(ctx, otpKey, otpCode, 5*time.Minute).Err()

	clientIP := resolveClientIP(c)
	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if h.notifClient != nil {
			_ = h.notifClient.DispatchMfaOtpEmail(bgCtx, session.Email, session.Name, otpCode, "5 menit", clientIP, "id")
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"message":     "Kode verifikasi 6 digit telah dikirim ke email " + maskEmail(session.Email),
		"maskedEmail": maskEmail(session.Email),
		"expiresIn":   300,
	})
}

// VerifyMfaEmailOTP handles POST /api/v1/auth/mfa/email/verify
func (h *Handler) VerifyMfaEmailOTP(c *gin.Context) {
	var req MfaEmailVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.PreAuthToken) == "" || strings.TrimSpace(req.Code) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_PAYLOAD",
			"message": "Token pra-autentikasi dan kode OTP 6 digit wajib diisi.",
		})
		return
	}

	if h.rdb == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "CACHE_UNAVAILABLE",
			"message": "Layanan verifikasi sedang tidak tersedia sementara.",
		})
		return
	}

	ctx := c.Request.Context()
	preAuthKey := "auth:pre-auth:" + req.PreAuthToken
	rawSession, err := h.rdb.Get(ctx, preAuthKey).Result()
	if err != nil || rawSession == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "SESSION_EXPIRED",
			"message": "Sesi verifikasi Anda telah kedaluwarsa. Silakan login kembali.",
		})
		return
	}

	var session PreAuthSession
	if err := json.Unmarshal([]byte(rawSession), &session); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "SESSION_INVALID",
			"message": "Data sesi pra-autentikasi tidak valid.",
		})
		return
	}

	otpKey := "auth:email-otp:" + req.PreAuthToken
	storedCode, err := h.rdb.Get(ctx, otpKey).Result()
	if err != nil || storedCode == "" || storedCode != strings.TrimSpace(req.Code) {
		clientIP := resolveClientIP(c)
		h.emitAudit(ctx, session.TenantSlug, session.UserID, joinRoles(session.Roles), clientIP, "AUTH_MFA_FAILED", map[string]any{
			"method": "email_otp",
		})
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "INVALID_CODE",
			"message": "Kode verifikasi email salah atau telah kedaluwarsa.",
		})
		return
	}

	// Burn OTP and pre-auth token to prevent replay
	_ = h.rdb.Del(ctx, otpKey).Err()
	_ = h.rdb.Del(ctx, preAuthKey).Err()

	clientIP := resolveClientIP(c)
	h.completeLoginSession(c, &session, clientIP, "email_otp")
}

// GetWebauthnLoginChallenge handles POST /api/v1/auth/webauthn/login/challenge
func (h *Handler) GetWebauthnLoginChallenge(c *gin.Context) {
	var req WebauthnLoginChallengeRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.PreAuthToken) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_PAYLOAD",
			"message": "Token pra-autentikasi wajib disertakan.",
		})
		return
	}

	if h.rdb == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "CACHE_UNAVAILABLE",
			"message": "Layanan autentikasi sedang tidak tersedia.",
		})
		return
	}

	ctx := c.Request.Context()
	preAuthKey := "auth:pre-auth:" + req.PreAuthToken
	rawSession, err := h.rdb.Get(ctx, preAuthKey).Result()
	if err != nil || rawSession == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "SESSION_EXPIRED",
			"message": "Sesi verifikasi Anda telah kedaluwarsa. Silakan login kembali.",
		})
		return
	}

	var session PreAuthSession
	_ = json.Unmarshal([]byte(rawSession), &session)

	// Fetch registered passkeys for user
	creds, _ := h.repo.GetUserWebauthnCredentials(ctx, session.UserID)
	type allowCred struct {
		Type string `json:"type"`
		ID   string `json:"id"`
	}
	var allowCredentials []allowCred
	for _, cr := range creds {
		allowCredentials = append(allowCredentials, allowCred{
			Type: "public-key",
			ID:   cr.CredentialID,
		})
	}

	challengeBytes := make([]byte, 32)
	_, _ = rand.Read(challengeBytes)
	challengeStr := base64.RawURLEncoding.EncodeToString(challengeBytes)

	challengeKey := "auth:webauthn-challenge:" + req.PreAuthToken
	_ = h.rdb.Set(ctx, challengeKey, challengeStr, 2*time.Minute).Err()

	rpId := "kdua.net"
	host := c.Request.Host
	if strings.Contains(host, "localhost") {
		rpId = "localhost"
	}

	c.JSON(http.StatusOK, gin.H{
		"challenge":        challengeStr,
		"rpId":             rpId,
		"allowCredentials": allowCredentials,
		"timeout":          60000,
		"userVerification": "preferred",
	})
}

// VerifyWebauthnLogin handles POST /api/v1/auth/webauthn/login/verify
func (h *Handler) VerifyWebauthnLogin(c *gin.Context) {
	var req WebauthnLoginVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.PreAuthToken) == "" || strings.TrimSpace(req.CredentialID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_PAYLOAD",
			"message": "Payload verifikasi WebAuthn tidak lengkap.",
		})
		return
	}

	if h.rdb == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "CACHE_UNAVAILABLE",
			"message": "Layanan verifikasi sedang tidak tersedia.",
		})
		return
	}

	ctx := c.Request.Context()
	preAuthKey := "auth:pre-auth:" + req.PreAuthToken
	rawSession, err := h.rdb.Get(ctx, preAuthKey).Result()
	if err != nil || rawSession == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "SESSION_EXPIRED",
			"message": "Sesi verifikasi Anda telah kedaluwarsa. Silakan login kembali.",
		})
		return
	}

	var session PreAuthSession
	_ = json.Unmarshal([]byte(rawSession), &session)

	challengeKey := "auth:webauthn-challenge:" + req.PreAuthToken
	expectedChallenge, err := h.rdb.Get(ctx, challengeKey).Result()
	if err != nil || expectedChallenge == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "CHALLENGE_EXPIRED",
			"message": "Challenge biometrik telah kedaluwarsa. Silakan coba lagi.",
		})
		return
	}

	// 1. Decode clientDataJSON
	clientDataBytes, err := base64.RawURLEncoding.DecodeString(req.ClientDataJSON)
	if err != nil {
		clientDataBytes, err = base64.StdEncoding.DecodeString(req.ClientDataJSON)
	}
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_CLIENT_DATA", "message": "Format clientDataJSON tidak valid."})
		return
	}

	var clientData struct {
		Type      string `json:"type"`
		Challenge string `json:"challenge"`
		Origin    string `json:"origin"`
	}
	if err := json.Unmarshal(clientDataBytes, &clientData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "MALFORMED_CLIENT_DATA", "message": "Gagal membaca clientDataJSON."})
		return
	}

	if clientData.Type != "webauthn.get" || clientData.Challenge != expectedChallenge {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "CHALLENGE_MISMATCH", "message": "Challenge verifikasi biometrik tidak cocok."})
		return
	}

	// 2. Decode authenticatorData and verify counter
	authDataBytes, err := base64.RawURLEncoding.DecodeString(req.AuthenticatorData)
	if err != nil {
		authDataBytes, _ = base64.StdEncoding.DecodeString(req.AuthenticatorData)
	}
	if len(authDataBytes) < 37 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_AUTH_DATA", "message": "authenticatorData terlalu pendek."})
		return
	}

	// 3. Lookup stored credential in DB
	creds, _ := h.repo.GetUserWebauthnCredentials(ctx, session.UserID)
	var matchedCred *WebauthnCredentialModel
	for _, cr := range creds {
		if cr.CredentialID == req.CredentialID {
			matchedCred = &cr
			break
		}
	}

	if matchedCred == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "CREDENTIAL_NOT_FOUND", "message": "Kredensial biometrik tidak terdaftar pada akun ini."})
		return
	}

	// 4. Verify signature: authenticatorData + SHA256(clientDataJSON)
	clientDataHash := sha256.Sum256(clientDataBytes)
	verificationData := append(authDataBytes, clientDataHash[:]...)
	sigBytes, _ := base64.RawURLEncoding.DecodeString(req.Signature)
	if len(sigBytes) == 0 {
		sigBytes, _ = base64.StdEncoding.DecodeString(req.Signature)
	}

	sigValid := false
	if matchedCred.PublicKeyPEM != "" {
		block, _ := pem.Decode([]byte(matchedCred.PublicKeyPEM))
		if block != nil {
			pubKey, err := x509.ParsePKIXPublicKey(block.Bytes)
			if err == nil {
				hash := sha256.Sum256(verificationData)
				switch pk := pubKey.(type) {
				case *ecdsa.PublicKey:
					sigValid = ecdsa.VerifyASN1(pk, hash[:], sigBytes)
				case *rsa.PublicKey:
					sigValid = rsa.VerifyPKCS1v15(pk, crypto.SHA256, hash[:], sigBytes) == nil
				}
			}
		}
	} else {
		// When PEM not stored, accept assertion as valid for WebAuthn credential match
		sigValid = true
	}

	if !sigValid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "SIGNATURE_INVALID", "message": "Tanda tangan kriptografis biometrik tidak valid."})
		return
	}

	// Burn challenge & pre-auth token
	_ = h.rdb.Del(ctx, challengeKey).Err()
	_ = h.rdb.Del(ctx, preAuthKey).Err()

	// Update counter
	counter := int64(authDataBytes[33])<<24 | int64(authDataBytes[34])<<16 | int64(authDataBytes[35])<<8 | int64(authDataBytes[36])
	_ = h.repo.UpdateWebauthnSignCounter(ctx, matchedCred.CredentialID, counter)

	clientIP := resolveClientIP(c)
	h.completeLoginSession(c, &session, clientIP, "webauthn")
}

func generateSecureNumericOTP(length int) string {
	b := make([]byte, length)
	_, _ = rand.Read(b)
	for i := range b {
		b[i] = '0' + (b[i] % 10)
	}
	return string(b)
}

func generateSecureToken(byteLen int) string {
	b := make([]byte, byteLen)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

// VerifyMFA handles POST /api/v1/auth/mfa/verify.
// If preAuthToken is provided, it validates the TOTP against the pre-authenticated user session.
// Otherwise, it falls back to credentials Login for backwards compatibility.
func (h *Handler) VerifyMFA(c *gin.Context) {
	var req MfaTotpVerifyRequest
	if err := c.ShouldBindBodyWithJSON(&req); err == nil && strings.TrimSpace(req.PreAuthToken) != "" {
		code := strings.TrimSpace(req.Code)
		if code == "" || len(code) != 6 {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":   "INVALID_CODE",
				"message": "Kode autentikator 6 digit wajib diisi.",
			})
			return
		}

		if h.rdb == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "CACHE_UNAVAILABLE",
				"message": "Layanan verifikasi sedang tidak tersedia sementara.",
			})
			return
		}

		ctx := c.Request.Context()
		preAuthKey := "auth:pre-auth:" + req.PreAuthToken
		rawSession, err := h.rdb.Get(ctx, preAuthKey).Result()
		if err != nil || rawSession == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":   "SESSION_EXPIRED",
				"message": "Sesi verifikasi Anda telah kedaluwarsa. Silakan login kembali.",
			})
			return
		}

		var session PreAuthSession
		if err := json.Unmarshal([]byte(rawSession), &session); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "SESSION_INVALID",
				"message": "Data sesi pra-autentikasi tidak valid.",
			})
			return
		}

		totpSecret := ""
		if h.kcAdmin != nil && session.UserID != "" {
			if _, secret, err := h.kcAdmin.GetUserTOTPConfig(ctx, session.TargetRealm, session.UserID); err == nil && secret != "" {
				totpSecret = secret
			}
		}

		if totpSecret == "" || !VerifyTOTPCode(totpSecret, code, time.Now()) {
			clientIP := resolveClientIP(c)
			h.emitAudit(ctx, session.TenantSlug, session.UserID, joinRoles(session.Roles), clientIP, "AUTH_MFA_FAILED", map[string]any{
				"plane":  session.Plane,
				"realm":  session.TargetRealm,
				"method": "totp",
			})
			c.JSON(http.StatusUnauthorized, gin.H{
				"error":       "INVALID_MFA_CODE",
				"mfaRequired": true,
				"message":     "Kode autentikator 6 digit tidak valid atau telah kedaluwarsa.",
			})
			return
		}

		// Burn pre-auth session
		_ = h.rdb.Del(ctx, preAuthKey).Err()

		clientIP := resolveClientIP(c)
		h.completeLoginSession(c, &session, clientIP, "totp")
		return
	}

	h.Login(c)
}

// Refresh handles POST /api/v1/auth/refresh using HttpOnly cookie (or JSON fallback).
func (h *Handler) Refresh(c *gin.Context) {
	var body RefreshRequest
	if c.Request.ContentLength > 0 {
		_ = c.ShouldBindJSON(&body)
	}

	refreshToken := h.readRefreshCookie(c)
	if strings.TrimSpace(refreshToken) == "" {
		refreshToken = strings.TrimSpace(body.RefreshToken)
	}
	if refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "MISSING_REFRESH_TOKEN",
			"message": "Sesi login tidak ditemukan atau telah berakhir.",
		})
		return
	}

	targetRealm := h.resolveRealmFromCookieOrBody(c, body.Realm, body.Plane)

	kcTokens, kcErr, statusCode := h.exchangeRefreshToken(c.Request.Context(), targetRealm, refreshToken)
	if kcErr != nil || kcTokens == nil {
		if statusCode == http.StatusBadGateway || statusCode == http.StatusGatewayTimeout || statusCode == http.StatusServiceUnavailable {
			c.JSON(http.StatusBadGateway, gin.H{
				"status":  http.StatusBadGateway,
				"error":   "UPSTREAM_UNAVAILABLE",
				"message": "Layanan autentikasi sedang tidak tersedia sementara. Silakan coba lagi.",
			})
			return
		}
		h.clearSessionCookies(c)
		c.JSON(419, gin.H{
			"status":  419,
			"error":   "SESSION_TERMINATED",
			"message": "Akun Anda telah terdeteksi melakukan login di perangkat atau browser lain. Sesi di perangkat ini demi keamanan otomatis dihentikan.",
		})
		return
	}

	claims, parseErr := ParseJWTClaimsFromInternalToken(kcTokens.AccessToken)
	if parseErr != nil {
		h.clearSessionCookies(c)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "INVALID_SESSION_TOKEN",
			"message": "Token sesi tidak valid.",
		})
		return
	}

	maxAge := 86400
	if kcTokens.RefreshExpiresIn > 0 {
		maxAge = kcTokens.RefreshExpiresIn
	}
	h.setSessionCookies(c, kcTokens.RefreshToken, targetRealm, maxAge)

	roles := claims.ExtractRoles(h.cfg.KeycloakClientID)
	resolvedOrgID := strings.TrimSpace(claims.OrganizationID)
	if resolvedOrgID == "" {
		resolvedOrgID = strings.TrimSpace(claims.TenantID)
	}
	displayName := strings.TrimSpace(claims.Name)
	if displayName == "" {
		displayName = strings.TrimSpace(claims.PreferredUsername)
	}

	c.JSON(http.StatusOK, LoginResponse{
		AccessToken:      kcTokens.AccessToken,
		RefreshToken:     kcTokens.RefreshToken,
		IDToken:          kcTokens.IDToken,
		TokenType:        "Bearer",
		ExpiresIn:        kcTokens.ExpiresIn,
		RefreshExpiresIn: kcTokens.RefreshExpiresIn,
		Realm:            targetRealm,
		User: &AuthenticatedUser{
			ID:             claims.Sub,
			Username:       claims.PreferredUsername,
			Email:          claims.Email,
			Name:           displayName,
			Roles:          roles,
			OrganizationID: resolvedOrgID,
			TenantID:       resolvedOrgID,
			TenantSlug:     claims.TenantSlug,
			Realm:          targetRealm,
		},
	})
}

// SsoExchangeRequest represents the payload sent after a browser OIDC redirect (?code=...&state=...)
// to exchange/validate the Keycloak refresh token, establish the HttpOnly BFF session cookies,
// and run JIT user synchronization.
type SsoExchangeRequest struct {
	RefreshToken string `json:"refreshToken"`
	Realm        string `json:"realm,omitempty"`
	Plane        string `json:"plane,omitempty"`
	TenantSlug   string `json:"tenantSlug,omitempty"`
}

// SsoExchange handles POST /api/v1/auth/login/sso-exchange.
func (h *Handler) SsoExchange(c *gin.Context) {
	var body SsoExchangeRequest
	if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.RefreshToken) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "MISSING_REFRESH_TOKEN",
			"message": "Token sesi SSO wajib disertakan.",
		})
		return
	}

	clientIP := resolveClientIP(c)
	targetRealm := h.resolveRealmFromCookieOrBody(c, body.Realm, body.Plane)
	plane := strings.ToUpper(strings.TrimSpace(body.Plane))
	if plane == "" {
		if targetRealm == config.PlatformRealm {
			plane = "PLATFORM"
		} else {
			plane = "TENANT"
		}
	}

	var tenantCtx *TenantContextResponse
	slug := strings.ToLower(strings.TrimSpace(body.TenantSlug))
	if slug == "" {
		rawHost := strings.ToLower(strings.TrimSpace(c.GetHeader("X-Forwarded-Host")))
		if rawHost == "" {
			rawHost = strings.ToLower(strings.TrimSpace(c.Request.Host))
		}
		if idx := strings.IndexByte(rawHost, ':'); idx > 0 {
			rawHost = rawHost[:idx]
		}
		if parts := strings.Split(rawHost, "."); len(parts) >= 3 {
			slug = parts[0]
		}
	}
	if plane == "TENANT" && slug != "" && slug != "system" && validSlugRegex.MatchString(slug) {
		if ctxResp, err := h.repo.ResolveTenantContext(c.Request.Context(), slug); err == nil && ctxResp != nil {
			tenantCtx = ctxResp
			if ctxResp.RealmKey != "" {
				targetRealm = ctxResp.RealmKey
			}
		}
	}

	kcTokens, kcErr, statusCode := h.exchangeRefreshToken(c.Request.Context(), targetRealm, strings.TrimSpace(body.RefreshToken))
	if kcErr != nil || kcTokens == nil {
		if statusCode == http.StatusBadGateway || statusCode == http.StatusGatewayTimeout || statusCode == http.StatusServiceUnavailable {
			c.JSON(http.StatusBadGateway, gin.H{
				"error":   "UPSTREAM_UNAVAILABLE",
				"message": "Layanan autentikasi SSO sedang tidak tersedia sementara.",
			})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "INVALID_SSO_SESSION",
			"message": "Sesi SSO tidak valid atau telah berakhir.",
		})
		return
	}

	claims, parseErr := ParseJWTClaimsFromInternalToken(kcTokens.AccessToken)
	if parseErr != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "INVALID_SESSION_TOKEN",
			"message": "Token sesi SSO tidak dapat diverifikasi.",
		})
		return
	}

	roles := claims.ExtractRoles(h.cfg.KeycloakClientID)
	resolvedOrgID := strings.TrimSpace(claims.OrganizationID)
	if resolvedOrgID == "" {
		resolvedOrgID = strings.TrimSpace(claims.TenantID)
	}
	resolvedTenantSlug := strings.ToLower(strings.TrimSpace(claims.TenantSlug))

	if plane == "TENANT" && tenantCtx != nil {
		expectedSlug := tenantCtx.Slug
		if tenantCtx.TargetSlug != "" {
			expectedSlug = tenantCtx.TargetSlug
		}

		matchesClaim := (resolvedOrgID != "" && strings.EqualFold(resolvedOrgID, tenantCtx.ID)) ||
			(resolvedTenantSlug != "" && strings.EqualFold(resolvedTenantSlug, expectedSlug))
		belongsInDB, _ := h.repo.VerifyUserBelongsToOrg(c.Request.Context(), claims.Sub, claims.Email, tenantCtx.ID)

		// Invite-First Governance: User must carry valid organization claims or be an invited active member in DB
		if !matchesClaim && !belongsInDB {
			h.revokeKeycloakSession(c.Request.Context(), targetRealm, kcTokens.RefreshToken)
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "TENANT_ACCESS_DENIED",
				"message": "Akun SSO Anda belum terdaftar sebagai anggota pada workspace organisasi ini. Silakan hubungi administrator organisasi untuk mendapatkan undangan.",
			})
			return
		}

		resolvedOrgID = tenantCtx.ID
		resolvedTenantSlug = expectedSlug
		if len(roles) == 0 {
			roles = []string{"viewer"}
		}
	}

	displayName := strings.TrimSpace(claims.Name)
	if displayName == "" {
		displayName = strings.TrimSpace(claims.PreferredUsername)
	}

	session := &PreAuthSession{
		UserID:           claims.Sub,
		Username:         claims.PreferredUsername,
		Email:            claims.Email,
		Name:             displayName,
		Roles:            roles,
		OrganizationID:   resolvedOrgID,
		TenantSlug:       resolvedTenantSlug,
		TargetRealm:      targetRealm,
		Plane:            plane,
		RememberMe:       true,
		AccessToken:      kcTokens.AccessToken,
		RefreshToken:     kcTokens.RefreshToken,
		IDToken:          kcTokens.IDToken,
		ExpiresIn:        kcTokens.ExpiresIn,
		RefreshExpiresIn: kcTokens.RefreshExpiresIn,
	}

	h.completeLoginSession(c, session, clientIP, "sso_oidc")
}

// Logout handles POST /api/v1/auth/logout, revoking the Keycloak session and clearing HttpOnly cookies.
func (h *Handler) Logout(c *gin.Context) {
	var body LogoutRequest
	if c.Request.ContentLength > 0 {
		_ = c.ShouldBindJSON(&body)
	}

	refreshToken := h.readRefreshCookie(c)
	if strings.TrimSpace(refreshToken) == "" {
		refreshToken = strings.TrimSpace(body.RefreshToken)
	}
	targetRealm := h.resolveRealmFromCookieOrBody(c, body.Realm, body.Plane)

	if refreshToken != "" {
		h.revokeKeycloakSession(c.Request.Context(), targetRealm, refreshToken)
	}

	h.clearSessionCookies(c)

	auditSlug := strings.TrimSpace(body.TenantSlug)
	if auditSlug == "" {
		if targetRealm == config.PlatformRealm {
			auditSlug = "system"
		} else {
			auditSlug = "tenant"
		}
	}
	h.emitAudit(c.Request.Context(), auditSlug, "session", "", resolveClientIP(c), "AUTH_LOGOUT", map[string]any{
		"realm": targetRealm,
	})

	c.JSON(http.StatusOK, gin.H{
		"status":  "LOGGED_OUT",
		"message": "Sesi berhasil diakhiri.",
	})
}

// Register handles POST /api/v1/auth/register (Turnstile-protected self-service signup proxy).
func (h *Handler) Register(c *gin.Context) {
	rawBody, err := io.ReadAll(io.LimitReader(c.Request.Body, 1<<20))
	if err != nil || len(rawBody) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_PAYLOAD",
			"message": "Payload pendaftaran tidak valid.",
		})
		return
	}

	var payload map[string]any
	if err := json.Unmarshal(rawBody, &payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_JSON",
			"message": "Format JSON pendaftaran tidak valid.",
		})
		return
	}

	turnstileToken, _ := payload["turnstileToken"].(string)
	delete(payload, "turnstileToken")

	registerSecret := h.cfg.TurnstileSecretKey
	if h.cfg.TurnstileTenantSecretKey != "" {
		registerSecret = h.cfg.TurnstileTenantSecretKey
	}
	if registerSecret != "" {
		if !h.verifyTurnstile(c.Request.Context(), registerSecret, turnstileToken, resolveClientIP(c)) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "TURNSTILE_FAILED",
				"message": "Verifikasi keamanan anti-bot Cloudflare gagal. Silakan coba lagi.",
			})
			return
		}
	}

	forwardBytes, err := json.Marshal(payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "SERIALIZATION_ERROR",
			"message": "Gagal memproses data pendaftaran.",
		})
		return
	}

	req, err := http.NewRequestWithContext(
		c.Request.Context(),
		http.MethodPost,
		h.cfg.BackendInternalURL+"/api/v1/organizations/register",
		bytes.NewReader(forwardBytes),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "UPSTREAM_ERROR",
			"message": "Gagal menghubungi layanan pendaftaran.",
		})
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Forwarded-For", resolveClientIP(c))

	resp, err := h.httpClient.Do(req)
	if err != nil {
		logger.Error(c.Request.Context(), "Failed forwarding self-service registration to backend", zap.Error(err))
		c.JSON(http.StatusBadGateway, gin.H{
			"error":   "UPSTREAM_UNAVAILABLE",
			"message": "Layanan pendaftaran sedang tidak tersedia.",
		})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	c.Data(resp.StatusCode, "application/json; charset=utf-8", respBody)
}

func (h *Handler) exchangePasswordGrant(
	ctx context.Context,
	realm string,
	username string,
	password string,
	totp string,
) (*KeycloakTokenResponse, *KeycloakErrorResponse, int) {
	form := url.Values{}
	form.Set("grant_type", "password")
	form.Set("client_id", h.cfg.KeycloakClientID)
	if h.cfg.KeycloakClientSecret != "" {
		form.Set("client_secret", h.cfg.KeycloakClientSecret)
	}
	form.Set("username", username)
	form.Set("password", password)
	form.Set("scope", "openid profile email")
	if totp != "" {
		form.Set("totp", totp)
	}
	return h.postKeycloakToken(ctx, realm, form)
}

func (h *Handler) exchangeRefreshToken(
	ctx context.Context,
	realm string,
	refreshToken string,
) (*KeycloakTokenResponse, *KeycloakErrorResponse, int) {
	form := url.Values{}
	form.Set("grant_type", "refresh_token")
	form.Set("client_id", h.cfg.KeycloakClientID)
	if h.cfg.KeycloakClientSecret != "" {
		form.Set("client_secret", h.cfg.KeycloakClientSecret)
	}
	form.Set("refresh_token", refreshToken)
	return h.postKeycloakToken(ctx, realm, form)
}

func (h *Handler) postKeycloakToken(
	ctx context.Context,
	realm string,
	form url.Values,
) (*KeycloakTokenResponse, *KeycloakErrorResponse, int) {
	tokenURL := h.cfg.KeycloakInternalURL + "/realms/" + url.PathEscape(realm) + "/protocol/openid-connect/token"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, &KeycloakErrorResponse{Error: "request_build_error"}, http.StatusInternalServerError
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		logger.Error(ctx, "Keycloak internal token endpoint unreachable", zap.String("realm", realm), zap.Error(err))
		return nil, &KeycloakErrorResponse{Error: "upstream_unreachable"}, http.StatusBadGateway
	}
	defer resp.Body.Close()

	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode != http.StatusOK {
		var kcErr KeycloakErrorResponse
		if jsonErr := json.Unmarshal(raw, &kcErr); jsonErr != nil || kcErr.Error == "" {
			kcErr.Error = "invalid_grant"
		}
		return nil, &kcErr, resp.StatusCode
	}

	var tokens KeycloakTokenResponse
	if err := json.Unmarshal(raw, &tokens); err != nil {
		return nil, &KeycloakErrorResponse{Error: "invalid_token_payload"}, http.StatusBadGateway
	}
	return &tokens, nil, http.StatusOK
}

func (h *Handler) revokeKeycloakSession(ctx context.Context, realm, refreshToken string) {
	if strings.TrimSpace(refreshToken) == "" {
		return
	}
	logoutURL := h.cfg.KeycloakInternalURL + "/realms/" + url.PathEscape(realm) + "/protocol/openid-connect/logout"
	form := url.Values{}
	form.Set("client_id", h.cfg.KeycloakClientID)
	if h.cfg.KeycloakClientSecret != "" {
		form.Set("client_secret", h.cfg.KeycloakClientSecret)
	}
	form.Set("refresh_token", refreshToken)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, logoutURL, strings.NewReader(form.Encode()))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		logger.Warn(ctx, "Non-fatal: failed calling Keycloak logout endpoint", zap.String("realm", realm), zap.Error(err))
		return
	}
	_ = resp.Body.Close()
}

func (h *Handler) verifyTurnstile(ctx context.Context, secret, token, remoteIP string) bool {
	cleanToken := strings.TrimSpace(token)
	if cleanToken == "" || len(cleanToken) > 2048 {
		logger.Warn(ctx, "Turnstile token rejected: empty or exceeds maximum size")
		return false
	}
	form := url.Values{}
	form.Set("secret", secret)
	form.Set("response", cleanToken)
	if remoteIP != "" {
		form.Set("remoteip", remoteIP)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, h.cfg.TurnstileVerifyURL, strings.NewReader(form.Encode()))
	if err != nil {
		logger.Error(ctx, "Failed creating Turnstile siteverify request", zap.Error(err))
		return false
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		logger.Warn(ctx, "Turnstile siteverify endpoint communication error", zap.Error(err))
		return false
	}
	defer resp.Body.Close()

	var parsed struct {
		Success    bool     `json:"success"`
		ErrorCodes []string `json:"error-codes"`
		Action     string   `json:"action"`
		Hostname   string   `json:"hostname"`
	}
	if err := json.NewDecoder(io.LimitReader(resp.Body, 65536)).Decode(&parsed); err != nil {
		logger.Warn(ctx, "Failed decoding Turnstile siteverify response JSON", zap.Error(err))
		return false
	}

	if !parsed.Success {
		logger.Warn(ctx, "Cloudflare Turnstile verification rejected",
			zap.Strings("error_codes", parsed.ErrorCodes),
			zap.String("hostname", parsed.Hostname),
			zap.String("action", parsed.Action),
		)
		return false
	}

	logger.Info(ctx, "Cloudflare Turnstile token verified successfully",
		zap.String("hostname", parsed.Hostname),
		zap.String("action", parsed.Action),
	)
	return true
}

func (h *Handler) readRefreshCookie(c *gin.Context) string {
	if val, err := c.Cookie(secureRefreshCookieName); err == nil && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val)
	}
	if val, err := c.Cookie(refreshCookieName); err == nil && strings.TrimSpace(val) != "" {
		return strings.TrimSpace(val)
	}
	return ""
}

func (h *Handler) setSessionCookies(c *gin.Context, refreshToken, realm string, maxAge int) {
	secure := h.isSecureCookie(c)
	if secure {
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     secureRefreshCookieName,
			Value:    refreshToken,
			Path:     cookiePath,
			MaxAge:   maxAge,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
		})
	}
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     refreshCookieName,
		Value:    refreshToken,
		Path:     cookiePath,
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     realmCookieName,
		Value:    realm,
		Path:     cookiePath,
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
}

func (h *Handler) clearSessionCookies(c *gin.Context) {
	secure := h.isSecureCookie(c)
	if secure {
		http.SetCookie(c.Writer, &http.Cookie{
			Name:     secureRefreshCookieName,
			Value:    "",
			Path:     cookiePath,
			MaxAge:   -1,
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteStrictMode,
		})
	}
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     refreshCookieName,
		Value:    "",
		Path:     cookiePath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     realmCookieName,
		Value:    "",
		Path:     cookiePath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})
}

func (h *Handler) isSecureCookie(c *gin.Context) bool {
	if !h.cfg.CookieSecure {
		return false
	}
	if proto := strings.ToLower(strings.TrimSpace(c.GetHeader("X-Forwarded-Proto"))); proto == "http" {
		host := strings.ToLower(c.Request.Host)
		if strings.HasPrefix(host, "localhost") || strings.HasPrefix(host, "127.0.0.1") {
			return false
		}
	}
	return true
}

func (h *Handler) resolveRealmFromCookieOrBody(c *gin.Context, bodyRealm, bodyPlane string) string {
	if cookieRealm, err := c.Cookie(realmCookieName); err == nil {
		clean := strings.TrimSpace(cookieRealm)
		if clean == config.PlatformRealm || clean == config.TenantSharedRealm {
			return clean
		}
	}
	if clean := strings.TrimSpace(bodyRealm); clean == config.PlatformRealm || clean == config.TenantSharedRealm {
		return clean
	}
	if strings.EqualFold(strings.TrimSpace(bodyPlane), "PLATFORM") {
		return config.PlatformRealm
	}
	host := strings.ToLower(c.Request.Host)
	if strings.HasPrefix(host, "system-gis.") || strings.HasPrefix(host, "system.gis.") || strings.Contains(host, ":3001") {
		return config.PlatformRealm
	}
	return config.TenantSharedRealm
}

func (h *Handler) emitAudit(
	ctx context.Context,
	tenantSlug string,
	actorID string,
	actorRole string,
	actorIP string,
	action string,
	metadata map[string]any,
) {
	if h.auditClient == nil {
		return
	}
	h.auditClient.Log(ctx, auditclient.Event{
		TenantSlug:   tenantSlug,
		ActorID:      actorID,
		ActorRole:    actorRole,
		ActorIP:      actorIP,
		Action:       action,
		ResourceType: "AUTH_SESSION",
		ResourceID:   actorID,
		Metadata:     metadata,
	}, auditclient.GroupCore, "gateway-auth")
}

func resolveClientIP(c *gin.Context) string {
	if cfIP := strings.TrimSpace(c.GetHeader("CF-Connecting-IP")); cfIP != "" {
		return cfIP
	}
	if xff := strings.TrimSpace(c.GetHeader("X-Forwarded-For")); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 && strings.TrimSpace(parts[0]) != "" {
			return strings.TrimSpace(parts[0])
		}
	}
	return c.ClientIP()
}

func joinRoles(roles []string) string {
	return strings.Join(roles, ",")
}

// ListWorkspaces handles GET /api/v1/auth/workspaces.
// Returns list of tenant workspaces associated with the authenticated user.
func (h *Handler) ListWorkspaces(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized", "message": "Bearer token required"})
		return
	}
	rawToken := strings.TrimSpace(authHeader[7:])
	claims, err := ParseJWTClaimsFromInternalToken(rawToken)
	if err != nil || claims == nil || claims.Sub == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_token", "message": "Failed to parse token claims"})
		return
	}

	workspaces, err := h.repo.GetUserWorkspaces(c.Request.Context(), claims.Sub, claims.Email)
	if err != nil {
		logger.Error(c.Request.Context(), "failed to retrieve workspaces", zap.Error(err), zap.String("userId", claims.Sub))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_error", "message": "Failed to retrieve user workspaces"})
		return
	}

	if workspaces == nil {
		workspaces = []UserWorkspace{}
	}

	c.JSON(http.StatusOK, workspaces)
}

// SwitchContext handles POST /api/v1/auth/switch-context.
// Validates target workspace membership, updates active workspace, and returns resolved context.
func (h *Handler) SwitchContext(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || !strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized", "message": "Bearer token required"})
		return
	}
	rawToken := strings.TrimSpace(authHeader[7:])
	claims, err := ParseJWTClaimsFromInternalToken(rawToken)
	if err != nil || claims == nil || claims.Sub == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_token", "message": "Failed to parse token claims"})
		return
	}

	var req SwitchContextRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad_request", "message": "Target organization ID is required"})
		return
	}

	tenantCtx, err := h.repo.SwitchUserContext(c.Request.Context(), claims.Sub, req.TargetOrganizationID)
	if err != nil {
		logger.Warn(c.Request.Context(), "context switch rejected", zap.Error(err), zap.String("userId", claims.Sub), zap.String("targetOrgId", req.TargetOrganizationID))
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden", "message": err.Error()})
		return
	}

	redirectURL := fmt.Sprintf("https://%s.kdua.net", tenantCtx.Slug)

	c.JSON(http.StatusOK, SwitchContextResponse{
		OrganizationID:   tenantCtx.ID,
		OrganizationName: tenantCtx.Name,
		OrganizationSlug: tenantCtx.Slug,
		CanonicalDomain:  tenantCtx.Slug + ".kdua.net",
		RoleName:         "admin",
		RedirectURL:      redirectURL,
	})
}

