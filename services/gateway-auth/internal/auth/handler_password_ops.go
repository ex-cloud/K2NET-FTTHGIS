package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// ValidatePasswordComplexity enforces minimum security constraints on passwords
func ValidatePasswordComplexity(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("Kata sandi harus terdiri dari minimal 8 karakter.")
	}
	var hasUpper, hasDigit, hasSpecial bool
	for _, ch := range password {
		switch {
		case ch >= 'A' && ch <= 'Z':
			hasUpper = true
		case ch >= '0' && ch <= '9':
			hasDigit = true
		case strings.ContainsRune("!@#$%^&*()_+-=[]{}|;:,.<>/?`~", ch):
			hasSpecial = true
		}
	}
	if !hasUpper {
		return fmt.Errorf("Kata sandi harus mengandung minimal 1 huruf kapital (A-Z).")
	}
	if !hasDigit {
		return fmt.Errorf("Kata sandi harus mengandung minimal 1 angka (0-9).")
	}
	if !hasSpecial {
		return fmt.Errorf("Kata sandi harus mengandung minimal 1 karakter khusus atau simbol (@, #, $, dll.).")
	}
	return nil
}

// maskEmail creates a privacy-preserving email display (e.g., ad***@kdua.net)
func maskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return email
	}
	name := parts[0]
	domain := parts[1]
	if len(name) <= 2 {
		return name + "***@" + domain
	}
	return name[:2] + "***@" + domain
}

// ForgotPassword handles POST /api/v1/auth/forgot-password with anti-enumeration protection
func (h *Handler) ForgotPassword(c *gin.Context) {
	ctx := c.Request.Context()
	startTime := time.Now()

	// Normalize response latency to mitigate timing attacks (minimum 250ms)
	defer func() {
		elapsed := time.Since(startTime)
		if elapsed < 250*time.Millisecond {
			time.Sleep(250*time.Millisecond - elapsed)
		}
	}()

	var req ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_PAYLOAD",
			"message": "Permintaan tidak valid.",
		})
		return
	}

	identifier := strings.TrimSpace(req.Username)
	if identifier == "" || len(identifier) > 254 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_IDENTIFIER",
			"message": "Email atau username wajib diisi.",
		})
		return
	}

	clientIP := resolveClientIP(c)
	plane := strings.ToUpper(strings.TrimSpace(req.Plane))
	if plane == "" {
		if req.TenantSlug != "" && req.TenantSlug != "system" && req.TenantSlug != "admin" {
			plane = "TENANT"
		} else {
			plane = "PLATFORM"
		}
	}

	// 1. Verify Cloudflare Turnstile if token is provided or secret is present
	secretToUse := h.cfg.TurnstileSecretKey
	if plane == "TENANT" && h.cfg.TurnstileTenantSecretKey != "" {
		secretToUse = h.cfg.TurnstileTenantSecretKey
	}
	if secretToUse != "" && req.TurnstileToken != "" {
		if !h.verifyTurnstile(ctx, secretToUse, req.TurnstileToken, clientIP) {
			c.JSON(http.StatusForbidden, gin.H{
				"error":   "TURNSTILE_FAILED",
				"message": "Verifikasi keamanan anti-bot gagal. Silakan muat ulang dan coba lagi.",
			})
			return
		}
	}

	// 2. Sliding window rate limit per IP: max 5 requests per 15 minutes
	if h.rdb != nil {
		ipRateKey := fmt.Sprintf("ratelimit:forgot:ip:%s", clientIP)
		val, _ := h.rdb.Incr(ctx, ipRateKey).Result()
		if val == 1 {
			_ = h.rdb.Expire(ctx, ipRateKey, 15*time.Minute).Err()
		}
		if val > 5 {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":   "RATE_LIMIT_EXCEEDED",
				"message": "Terlalu banyak permintaan reset kata sandi. Silakan tunggu 15 menit.",
			})
			return
		}
	}

	genericSuccessMsg := "Jika email atau username terdaftar pada sistem, instruksi pengaturan ulang kata sandi telah dikirimkan ke kotak masuk Anda."
	if strings.ToLower(req.Lang) == "en" {
		genericSuccessMsg = "If this email or username is registered in our system, password reset instructions have been dispatched to your inbox."
	}

	// 3. Lookup user in PostgreSQL
	user, err := h.repo.FindUserForPasswordReset(ctx, identifier, req.TenantSlug, plane)
	if err != nil || user == nil || user.Email == "" {
		logger.Info(ctx, "Password reset requested for non-existent or inactive identity",
			zap.String("identifier", identifier),
			zap.String("plane", plane))
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": genericSuccessMsg,
		})
		return
	}

	// 4. Rate limit per user email (max 3 reset requests per 15 min)
	if h.rdb != nil {
		userRateKey := fmt.Sprintf("ratelimit:forgot:user:%s", strings.ToLower(user.Email))
		uVal, _ := h.rdb.Incr(ctx, userRateKey).Result()
		if uVal == 1 {
			_ = h.rdb.Expire(ctx, userRateKey, 15*time.Minute).Err()
		}
		if uVal > 3 {
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": genericSuccessMsg,
			})
			return
		}
	}

	// 5. Generate secure 64-hex-character token
	tokenBytes := make([]byte, 32)
	if _, randErr := rand.Read(tokenBytes); randErr != nil {
		logger.Error(ctx, "Failed generating cryptographically secure token", zap.Error(randErr))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "INTERNAL_ERROR",
			"message": "Gagal memproses permintaan reset kata sandi.",
		})
		return
	}
	resetToken := hex.EncodeToString(tokenBytes)

	// 6. Save token to Redis with 15-minute TTL
	tokenData := ResetTokenData{
		UserID:     user.UserID,
		Email:      user.Email,
		Username:   user.Username,
		FullName:   user.FullName,
		Realm:      user.Realm,
		TenantSlug: user.TenantSlug,
	}
	tokenJSON, _ := json.Marshal(tokenData)

	if h.rdb != nil {
		redisKey := fmt.Sprintf("auth:reset:%s", resetToken)
		if setErr := h.rdb.Set(ctx, redisKey, tokenJSON, 15*time.Minute).Err(); setErr != nil {
			logger.Error(ctx, "Failed storing reset token in Redis", zap.Error(setErr))
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "INTERNAL_ERROR",
				"message": "Gagal menyimpan token reset.",
			})
			return
		}
	}

	// 7. Build Reset URL based on realm/subdomain
	var resetURL string
	if user.Realm == "ftth-realm" || user.TenantSlug == "system" {
		resetURL = fmt.Sprintf("https://system-gis.kdua.net/reset-password?token=%s", resetToken)
	} else if user.TenantSlug != "" {
		resetURL = fmt.Sprintf("https://%s.kdua.net/reset-password?token=%s", user.TenantSlug, resetToken)
	} else {
		resetURL = fmt.Sprintf("https://gis.kdua.net/reset-password?token=%s", resetToken)
	}

	// 8. Dispatch Email via Notification Gateway asynchronously
	lang := strings.ToLower(req.Lang)
	if lang != "en" {
		lang = "id"
	}
	expiresIn := "15 menit"
	if lang == "en" {
		expiresIn = "15 minutes"
	}

	if h.notifClient != nil {
		go func() {
			bgCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			if dispatchErr := h.notifClient.DispatchPasswordResetEmail(
				bgCtx, user.Email, user.FullName, resetURL, expiresIn, clientIP, lang,
			); dispatchErr != nil {
				logger.Error(bgCtx, "Failed dispatching password reset email",
					zap.String("to", user.Email),
					zap.Error(dispatchErr))
			}
		}()
	}

	h.emitAudit(ctx, user.TenantSlug, user.UserID, "user", clientIP, "AUTH_PASSWORD_RESET_REQUESTED", map[string]any{
		"email": user.Email,
		"realm": user.Realm,
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": genericSuccessMsg,
	})
}

// ValidateResetToken handles GET /api/v1/auth/reset-password/validate?token=...
func (h *Handler) ValidateResetToken(c *gin.Context) {
	token := strings.TrimSpace(c.Query("token"))
	if token == "" || len(token) > 128 {
		c.JSON(http.StatusBadRequest, gin.H{"valid": false, "error": "INVALID_TOKEN"})
		return
	}

	if h.rdb == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"valid": false, "error": "SERVICE_UNAVAILABLE"})
		return
	}

	redisKey := fmt.Sprintf("auth:reset:%s", token)
	raw, err := h.rdb.Get(c.Request.Context(), redisKey).Result()
	if err != nil || raw == "" {
		c.JSON(http.StatusOK, gin.H{"valid": false, "error": "TOKEN_EXPIRED"})
		return
	}

	var data ResetTokenData
	if jsonErr := json.Unmarshal([]byte(raw), &data); jsonErr != nil {
		c.JSON(http.StatusOK, gin.H{"valid": false, "error": "MALFORMED_TOKEN"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":       true,
		"maskedEmail": maskEmail(data.Email),
		"tenantSlug":  data.TenantSlug,
	})
}

// ResetPassword handles POST /api/v1/auth/reset-password
func (h *Handler) ResetPassword(c *gin.Context) {
	ctx := c.Request.Context()

	var req ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_PAYLOAD",
			"message": "Permintaan tidak valid.",
		})
		return
	}

	token := strings.TrimSpace(req.Token)
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "MISSING_TOKEN",
			"message": "Token reset kata sandi wajib disertakan.",
		})
		return
	}

	if err := ValidatePasswordComplexity(req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "WEAK_PASSWORD",
			"message": err.Error(),
		})
		return
	}

	if h.rdb == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "SERVICE_UNAVAILABLE",
			"message": "Sistem penyimpanan sementara tidak tersedia.",
		})
		return
	}

	redisKey := fmt.Sprintf("auth:reset:%s", token)
	raw, err := h.rdb.Get(ctx, redisKey).Result()
	if err != nil || raw == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_OR_EXPIRED_TOKEN",
			"message": "Tautan reset kata sandi tidak valid atau telah kedaluwarsa. Silakan ajukan permohonan baru.",
		})
		return
	}

	var data ResetTokenData
	if jsonErr := json.Unmarshal([]byte(raw), &data); jsonErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "MALFORMED_TOKEN",
			"message": "Data token rusak.",
		})
		return
	}

	// 1. Update password in Keycloak via Admin API
	realm := data.Realm
	if realm == "" {
		realm = "k2net-tenants"
	}
	if h.kcAdmin != nil {
		if updateErr := h.kcAdmin.SetUserPassword(ctx, realm, data.UserID, req.NewPassword); updateErr != nil {
			logger.Error(ctx, "Failed resetting password in Keycloak", zap.Error(updateErr))
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "KEYCLOAK_UPDATE_FAILED",
				"message": "Gagal memperbarui kata sandi di sistem identitas.",
			})
			return
		}
		// Revoke active user sessions
		_ = h.kcAdmin.LogoutUserSessions(ctx, realm, data.UserID)
	}

	// 2. Delete single-use reset token from Redis
	_ = h.rdb.Del(ctx, redisKey).Err()

	clientIP := resolveClientIP(c)
	h.emitAudit(ctx, data.TenantSlug, data.UserID, "user", clientIP, "AUTH_PASSWORD_RESET_COMPLETED", map[string]any{
		"email": data.Email,
		"realm": realm,
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Kata sandi Anda berhasil diperbarui. Silakan masuk kembali dengan kata sandi baru Anda.",
	})
}

// ValidateActivationToken handles GET /api/v1/auth/activate/validate?token=...
func (h *Handler) ValidateActivationToken(c *gin.Context) {
	token := strings.TrimSpace(c.Query("token"))
	if token == "" || len(token) > 128 {
		c.JSON(http.StatusBadRequest, gin.H{"valid": false, "error": "INVALID_TOKEN"})
		return
	}

	if h.rdb == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"valid": false, "error": "SERVICE_UNAVAILABLE"})
		return
	}

	redisKey := fmt.Sprintf("auth:activate:%s", token)
	raw, err := h.rdb.Get(c.Request.Context(), redisKey).Result()
	if err != nil || raw == "" {
		c.JSON(http.StatusOK, gin.H{"valid": false, "error": "TOKEN_EXPIRED"})
		return
	}

	var data ActivationTokenData
	if jsonErr := json.Unmarshal([]byte(raw), &data); jsonErr != nil {
		c.JSON(http.StatusOK, gin.H{"valid": false, "error": "MALFORMED_TOKEN"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"valid":         true,
		"orgName":       data.OrgName,
		"orgSlug":       data.OrgSlug,
		"subdomain":     data.OrgSlug + ".kdua.net",
		"adminEmail":    maskEmail(data.AdminEmail),
		"adminUsername": data.AdminUsername,
	})
}

// ActivateAccount handles POST /api/v1/auth/activate
func (h *Handler) ActivateAccount(c *gin.Context) {
	ctx := c.Request.Context()

	var req ActivateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_PAYLOAD",
			"message": "Permintaan tidak valid.",
		})
		return
	}

	token := strings.TrimSpace(req.Token)
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "MISSING_TOKEN",
			"message": "Token aktivasi wajib disertakan.",
		})
		return
	}

	if err := ValidatePasswordComplexity(req.Password); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "WEAK_PASSWORD",
			"message": err.Error(),
		})
		return
	}

	if h.rdb == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "SERVICE_UNAVAILABLE",
			"message": "Sistem penyimpanan sementara tidak tersedia.",
		})
		return
	}

	redisKey := fmt.Sprintf("auth:activate:%s", token)
	raw, err := h.rdb.Get(ctx, redisKey).Result()
	if err != nil || raw == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_OR_EXPIRED_TOKEN",
			"message": "Tautan aktivasi tidak valid atau telah kedaluwarsa. Silakan hubungi tim administrator platform.",
		})
		return
	}

	var data ActivationTokenData
	if jsonErr := json.Unmarshal([]byte(raw), &data); jsonErr != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "MALFORMED_TOKEN",
			"message": "Data token rusak.",
		})
		return
	}

	realm := "k2net-tenants"

	// 1. Update password in Keycloak
	if h.kcAdmin != nil {
		if pwdErr := h.kcAdmin.SetUserPassword(ctx, realm, data.UserID, req.Password); pwdErr != nil {
			logger.Error(ctx, "Failed setting password in Keycloak during activation", zap.Error(pwdErr))
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "KEYCLOAK_SET_PASSWORD_FAILED",
				"message": "Gagal menyimpan kata sandi administrator.",
			})
			return
		}

		// 2. Set emailVerified = true in Keycloak (Single-Source of Truth)
		if verifyErr := h.kcAdmin.SetUserEmailVerified(ctx, realm, data.UserID, true); verifyErr != nil {
			logger.Warn(ctx, "Non-fatal: failed setting emailVerified in Keycloak", zap.Error(verifyErr))
		}
	}

	// 3. Mark User and Organization ACTIVE in PostgreSQL
	if dbErr := h.repo.CompleteAccountActivation(ctx, data.UserID, data.OrgID); dbErr != nil {
		logger.Error(ctx, "Failed updating database records during activation", zap.Error(dbErr))
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "DATABASE_UPDATE_FAILED",
			"message": "Gagal mengaktifkan data profil di basis data.",
		})
		return
	}

	// 4. Delete activation token and org active link from Redis
	_ = h.rdb.Del(ctx, redisKey).Err()
	if data.OrgSlug != "" {
		_ = h.rdb.Del(ctx, fmt.Sprintf("auth:org-activate-token:%s", data.OrgSlug)).Err()
	}

	clientIP := resolveClientIP(c)
	h.emitAudit(ctx, data.OrgSlug, data.UserID, "admin", clientIP, "TENANT_ACTIVATION_COMPLETED", map[string]any{
		"orgId":   data.OrgID,
		"orgSlug": data.OrgSlug,
		"email":   data.AdminEmail,
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"slug":    data.OrgSlug,
		"message": "Akun administrator dan workspace organisasi Anda telah berhasil diaktifkan. Silakan masuk.",
	})
}
