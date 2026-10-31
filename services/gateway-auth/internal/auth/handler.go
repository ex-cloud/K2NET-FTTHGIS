package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
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
		if req.TenantSlug != "" && req.TenantSlug != "system" && req.TenantSlug != "admin" && req.TenantSlug != "default" {
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

	// 1. Verify Cloudflare Turnstile token when TurnstileSecretKey or TurnstileTenantSecretKey is configured (skip on second-step TOTP retry if already verified or re-verify if provided)
	secretToUse := h.cfg.TurnstileSecretKey
	if plane == "TENANT" && h.cfg.TurnstileTenantSecretKey != "" {
		secretToUse = h.cfg.TurnstileTenantSecretKey
	}

	if secretToUse != "" {
		if req.TOTP == "" || req.TurnstileToken != "" {
			if !h.verifyTurnstile(c.Request.Context(), secretToUse, req.TurnstileToken, clientIP) {
				c.JSON(http.StatusForbidden, gin.H{
					"error":   "TURNSTILE_FAILED",
					"message": "Verifikasi keamanan anti-bot Cloudflare gagal. Silakan muat ulang dan coba lagi.",
				})
				return
			}
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
	} else {
		if resolvedOrgID == "" {
			resolvedOrgID = sentinelPlatformOrgID
		}
		if resolvedTenantSlug == "" {
			resolvedTenantSlug = "default"
		}
	}

	// 5. Parameterized JIT User Sync to PostgreSQL ftth_gis.users
	if syncErr := h.repo.SyncUserJIT(c.Request.Context(), JITUserSyncInput{
		UserID:         claims.Sub,
		Email:          claims.Email,
		Username:       claims.PreferredUsername,
		FullName:       claims.Name,
		OrganizationID: resolvedOrgID,
		Roles:          roles,
		MFAUsed:        req.TOTP != "",
		ClientIP:       clientIP,
	}); syncErr != nil {
		logger.Warn(c.Request.Context(), "Non-fatal JIT user sync warning", zap.String("userId", claims.Sub), zap.Error(syncErr))
	}

	// 6. Set HttpOnly; Secure; SameSite=Strict refresh token & realm cookies
	maxAge := 86400 // 24 hours default
	if req.RememberMe {
		maxAge = 2592000 // 30 days
	} else if kcTokens.RefreshExpiresIn > 0 {
		maxAge = kcTokens.RefreshExpiresIn
	}
	h.setSessionCookies(c, kcTokens.RefreshToken, targetRealm, maxAge)

	// 7. Async Audit Log to gateway-audit (:5009)
	h.emitAudit(c.Request.Context(), auditSlug, claims.Sub, joinRoles(roles), clientIP, "AUTH_LOGIN_SUCCESS", map[string]any{
		"plane":      plane,
		"realm":      targetRealm,
		"mfaUsed":    req.TOTP != "",
		"rememberMe": req.RememberMe,
	})

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
			TenantSlug:     resolvedTenantSlug,
			Realm:          targetRealm,
		},
	})
}

// VerifyMFA handles POST /api/v1/auth/mfa/verify by delegating to Login with TOTP validation.
func (h *Handler) VerifyMFA(c *gin.Context) {
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

	kcTokens, kcErr, _ := h.exchangeRefreshToken(c.Request.Context(), targetRealm, refreshToken)
	if kcErr != nil || kcTokens == nil {
		h.clearSessionCookies(c)
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":   "SESSION_EXPIRED",
			"message": "Sesi autentikasi telah berakhir. Silakan masuk kembali.",
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
