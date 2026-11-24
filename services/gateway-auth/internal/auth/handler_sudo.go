package auth

import (
	"context"
	"crypto"
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/subtle"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"time"

	"gateways/gateway-auth/internal/config"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

const (
	sudoModeTTL              = 15 * time.Minute // 900s Sudo elevation window (ADR-0024 Opsi 1)
	loginFreshGraceTTL       = 15 * time.Minute // 900s fresh-login grace for regular non-Break-Glass logins
	sudoWebauthnChallengeTTL = 2 * time.Minute
	sudoEmailOtpTTL          = 5 * time.Minute
	sudoEmailCooldownTTL     = 60 * time.Second
	sudoLockoutTTL           = 10 * time.Minute
	sudoMaxFailures          = 5
)

type sudoCacheStore interface {
	Get(ctx context.Context, key string) (string, error)
	GetDel(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key, value string, ttl time.Duration) error
	SetNX(ctx context.Context, key, value string, ttl time.Duration) (bool, error)
	Del(ctx context.Context, keys ...string) error
	TTL(ctx context.Context, key string) (time.Duration, error)
	Exists(ctx context.Context, key string) (bool, error)
	Incr(ctx context.Context, key string) (int64, error)
	Expire(ctx context.Context, key string, ttl time.Duration) error
}

type redisSudoCache struct {
	rdb *redis.Client
}

func (r *redisSudoCache) Get(ctx context.Context, key string) (string, error) {
	return r.rdb.Get(ctx, key).Result()
}

func (r *redisSudoCache) GetDel(ctx context.Context, key string) (string, error) {
	return r.rdb.GetDel(ctx, key).Result()
}

func (r *redisSudoCache) Set(ctx context.Context, key, value string, ttl time.Duration) error {
	return r.rdb.Set(ctx, key, value, ttl).Err()
}

func (r *redisSudoCache) SetNX(ctx context.Context, key, value string, ttl time.Duration) (bool, error) {
	return r.rdb.SetNX(ctx, key, value, ttl).Result()
}

func (r *redisSudoCache) Del(ctx context.Context, keys ...string) error {
	return r.rdb.Del(ctx, keys...).Err()
}

func (r *redisSudoCache) TTL(ctx context.Context, key string) (time.Duration, error) {
	return r.rdb.TTL(ctx, key).Result()
}

func (r *redisSudoCache) Exists(ctx context.Context, key string) (bool, error) {
	cnt, err := r.rdb.Exists(ctx, key).Result()
	return cnt > 0, err
}

func (r *redisSudoCache) Incr(ctx context.Context, key string) (int64, error) {
	return r.rdb.Incr(ctx, key).Result()
}

func (r *redisSudoCache) Expire(ctx context.Context, key string, ttl time.Duration) error {
	return r.rdb.Expire(ctx, key, ttl).Err()
}

func (h *Handler) getSudoStore() sudoCacheStore {
	if h.sudoStore != nil {
		return h.sudoStore
	}
	if h.rdb != nil {
		return &redisSudoCache{rdb: h.rdb}
	}
	return nil
}

func sudoRedisKey(userID, sid string) string {
	uid := strings.TrimSpace(userID)
	s := strings.TrimSpace(sid)
	if s != "" {
		return "auth:sudo:" + uid + ":" + s
	}
	return "auth:sudo:" + uid
}

func loginFreshRedisKey(userID, sid string) string {
	uid := strings.TrimSpace(userID)
	s := strings.TrimSpace(sid)
	if s != "" {
		return "auth:login-fresh:" + uid + ":" + s
	}
	return "auth:login-fresh:" + uid
}

type sudoUserInfo struct {
	Sub               string `json:"sub"`
	Email             string `json:"email"`
	PreferredUsername string `json:"preferred_username"`
	Name              string `json:"name"`
}

type sudoCaller struct {
	UserID    string
	Email     string
	Username  string
	Name      string
	Realm     string
	SessionID string
}

type SudoVerifyRequest struct {
	Method            string `json:"method" binding:"required"`
	Code              string `json:"code,omitempty"`
	Password          string `json:"password,omitempty"`
	CredentialID      string `json:"credentialId,omitempty"`
	ClientDataJSON    string `json:"clientDataJSON,omitempty"`
	AuthenticatorData string `json:"authenticatorData,omitempty"`
	Signature         string `json:"signature,omitempty"`
}

func (h *Handler) verifyBearerWithKeycloak(ctx context.Context, realm, bearerToken string) (*sudoUserInfo, error) {
	if h.userinfoVerifier != nil {
		return h.userinfoVerifier(ctx, realm, bearerToken)
	}
	if h.cfg == nil || strings.TrimSpace(h.cfg.KeycloakInternalURL) == "" {
		return nil, errors.New("keycloak internal url unavailable")
	}

	endpoint := fmt.Sprintf("%s/realms/%s/protocol/openid-connect/userinfo", strings.TrimRight(h.cfg.KeycloakInternalURL, "/"), realm)
	reqCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+bearerToken)
	req.Header.Set("Accept", "application/json")

	client := h.httpClient
	if client == nil {
		client = &http.Client{Timeout: 5 * time.Second}
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("userinfo rejected token with status %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 1<<16))
	if err != nil {
		return nil, err
	}

	var ui sudoUserInfo
	if err := json.Unmarshal(bodyBytes, &ui); err != nil {
		return nil, err
	}
	if strings.TrimSpace(ui.Sub) == "" {
		return nil, errors.New("userinfo returned empty sub")
	}
	return &ui, nil
}

func extractRealmHint(iss string) string {
	trimmed := strings.TrimRight(strings.TrimSpace(iss), "/")
	if strings.HasSuffix(trimmed, "/realms/"+config.PlatformRealm) {
		return config.PlatformRealm
	}
	if strings.HasSuffix(trimmed, "/realms/"+config.TenantSharedRealm) {
		return config.TenantSharedRealm
	}
	return ""
}

func (h *Handler) resolveVerifiedSudoCaller(c *gin.Context) (*sudoCaller, int, string, string) {
	rawAuth := strings.TrimSpace(c.GetHeader("Authorization"))
	if len(rawAuth) <= 7 || !strings.EqualFold(rawAuth[:7], "Bearer ") {
		return nil, http.StatusUnauthorized, "UNAUTHORIZED", "Token autentikasi wajib disertakan."
	}
	bearerToken := strings.TrimSpace(rawAuth[7:])
	if bearerToken == "" {
		return nil, http.StatusUnauthorized, "UNAUTHORIZED", "Token autentikasi kosong."
	}

	// Read realm & sid hints from token structure, then AUTHORITATIVELY validate signature/revocation via Keycloak userinfo.
	claims, err := ParseJWTClaimsFromInternalToken(bearerToken)
	if err != nil || claims == nil {
		return nil, http.StatusUnauthorized, "INVALID_TOKEN", "Format token tidak valid."
	}

	targetRealm := extractRealmHint(claims.Issuer)
	if targetRealm == "" {
		if cookieRealm, cookieErr := c.Cookie(realmCookieName); cookieErr == nil {
			clean := strings.TrimSpace(cookieRealm)
			if clean == config.PlatformRealm || clean == config.TenantSharedRealm {
				targetRealm = clean
			}
		}
	}
	if targetRealm == "" {
		targetRealm = h.resolveRealmFromCookieOrBody(c, "", "")
	}
	if targetRealm != config.PlatformRealm && targetRealm != config.TenantSharedRealm {
		return nil, http.StatusUnauthorized, "INVALID_REALM", "Realm autentikasi tidak dikenali."
	}

	ui, verifyErr := h.verifyBearerWithKeycloak(c.Request.Context(), targetRealm, bearerToken)
	if verifyErr != nil || ui == nil || strings.TrimSpace(ui.Sub) == "" {
		return nil, http.StatusUnauthorized, "INVALID_TOKEN", "Sesi Anda tidak valid atau telah kedaluwarsa."
	}

	if claims.Sub != "" && strings.TrimSpace(claims.Sub) != strings.TrimSpace(ui.Sub) {
		return nil, http.StatusUnauthorized, "TOKEN_SUBJECT_MISMATCH", "Identitas token tidak konsisten."
	}

	sid := strings.TrimSpace(claims.Sid)
	if sid == "" {
		sid = strings.TrimSpace(claims.SessionState)
	}

	return &sudoCaller{
		UserID:    strings.TrimSpace(ui.Sub),
		Email:     strings.TrimSpace(ui.Email),
		Username:  strings.TrimSpace(ui.PreferredUsername),
		Name:      strings.TrimSpace(ui.Name),
		Realm:     targetRealm,
		SessionID: sid,
	}, 0, "", ""
}

func (h *Handler) resolveAvailableSudoMethods(ctx context.Context, caller *sudoCaller) ([]string, bool) {
	var mfaMethods []string

	if h.repo != nil {
		if creds, err := h.repo.GetUserWebauthnCredentials(ctx, caller.UserID); err == nil && len(creds) > 0 {
			mfaMethods = append(mfaMethods, "webauthn")
		}
	}

	totpEnabled := false
	emailOtpEnabled := false
	if h.totpConfigFetcher != nil {
		totpEnabled, _, emailOtpEnabled, _ = h.totpConfigFetcher(ctx, caller.Realm, caller.UserID)
	} else if h.kcAdmin != nil {
		kcTotp, secret, kcEmailOtp, err := h.kcAdmin.GetUserMFAConfig(ctx, caller.Realm, caller.UserID)
		if err == nil {
			totpEnabled = kcTotp && secret != ""
			emailOtpEnabled = kcEmailOtp
		}
	}

	if totpEnabled {
		mfaMethods = append(mfaMethods, "totp")
	}
	if emailOtpEnabled && caller.Email != "" {
		mfaMethods = append(mfaMethods, "email_otp")
	}
	if h.repo != nil {
		if hasBackup, err := h.repo.HasActiveBackupCodes(ctx, caller.UserID); err == nil && hasBackup {
			mfaMethods = append(mfaMethods, "backup_code")
		}
	}

	if len(mfaMethods) > 0 {
		// User has strong MFA enrolled: require MFA factors without downgrading to password-only
		return mfaMethods, true
	}

	// Account without enrolled MFA methods: allow password verification (and email OTP if email exists)
	var fallback []string
	fallback = append(fallback, "password")
	if caller.Email != "" {
		fallback = append(fallback, "email_otp")
	}
	return fallback, false
}

// GetSudoStatus handles GET /api/v1/auth/mfa/sudo/status.
func (h *Handler) GetSudoStatus(c *gin.Context) {
	caller, code, errKey, errMsg := h.resolveVerifiedSudoCaller(c)
	if caller == nil {
		c.JSON(code, gin.H{"error": errKey, "message": errMsg})
		return
	}

	store := h.getSudoStore()
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "CACHE_UNAVAILABLE",
			"message": "Layanan Sudo Mode sedang tidak tersedia.",
		})
		return
	}

	ctx := c.Request.Context()
	isBreakGlass, _ := store.Exists(ctx, "auth:break-glass-exp:"+caller.UserID)

	sudoTTL, err := store.TTL(ctx, sudoRedisKey(caller.UserID, caller.SessionID))
	if err != nil {
		sudoTTL = 0
	}
	freshTTL := time.Duration(0)
	if !isBreakGlass {
		if t, err := store.TTL(ctx, loginFreshRedisKey(caller.UserID, caller.SessionID)); err == nil && t > 0 {
			freshTTL = t
		}
	}

	sudoActive := sudoTTL > 0
	freshLoginActive := !isBreakGlass && freshTTL > 0
	elevated := sudoActive || freshLoginActive

	maxTTL := sudoTTL
	if freshTTL > maxTTL {
		maxTTL = freshTTL
	}
	remainingSeconds := 0
	expiresAt := ""
	if maxTTL > 0 {
		remainingSeconds = int(maxTTL.Seconds())
		expiresAt = time.Now().UTC().Add(maxTTL).Format(time.RFC3339)
	}

	source := "none"
	if sudoActive {
		source = "sudo"
	} else if freshLoginActive {
		source = "fresh_login"
	}

	methods, _ := h.resolveAvailableSudoMethods(ctx, caller)

	c.JSON(http.StatusOK, gin.H{
		"elevated":         elevated,
		"sudoActive":       sudoActive,
		"freshLoginActive": freshLoginActive,
		"isBreakGlass":     isBreakGlass,
		"source":           source,
		"remainingSeconds": remainingSeconds,
		"expiresAt":        expiresAt,
		"availableMethods": methods,
		"maskedEmail":      maskEmail(caller.Email),
	})
}

// GetSudoWebauthnChallenge handles POST /api/v1/auth/mfa/sudo/webauthn/challenge.
func (h *Handler) GetSudoWebauthnChallenge(c *gin.Context) {
	caller, code, errKey, errMsg := h.resolveVerifiedSudoCaller(c)
	if caller == nil {
		c.JSON(code, gin.H{"error": errKey, "message": errMsg})
		return
	}

	store := h.getSudoStore()
	if store == nil || h.repo == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "SERVICE_UNAVAILABLE",
			"message": "Layanan verifikasi biometrik sedang tidak tersedia.",
		})
		return
	}

	ctx := c.Request.Context()
	creds, err := h.repo.GetUserWebauthnCredentials(ctx, caller.UserID)
	if err != nil || len(creds) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "NO_PASSKEY_REGISTERED",
			"message": "Tidak ada Passkey atau Security Key yang terdaftar pada akun Anda.",
		})
		return
	}

	type allowCred struct {
		Type string `json:"type"`
		ID   string `json:"id"`
	}
	allowCredentials := make([]allowCred, 0, len(creds))
	for _, cr := range creds {
		allowCredentials = append(allowCredentials, allowCred{
			Type: "public-key",
			ID:   cr.CredentialID,
		})
	}

	challengeBytes := make([]byte, 32)
	_, _ = rand.Read(challengeBytes)
	challengeStr := base64.RawURLEncoding.EncodeToString(challengeBytes)

	challengeKey := "auth:sudo-webauthn:" + caller.UserID
	if err := store.Set(ctx, challengeKey, challengeStr, sudoWebauthnChallengeTTL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "CHALLENGE_STORAGE_FAILED",
			"message": "Gagal menyimpan tantangan WebAuthn.",
		})
		return
	}

	rpID := "kdua.net"
	if strings.Contains(strings.ToLower(c.Request.Host), "localhost") || strings.Contains(c.Request.Host, "127.0.0.1") {
		rpID = "localhost"
	}

	c.JSON(http.StatusOK, gin.H{
		"challenge":        challengeStr,
		"rpId":             rpID,
		"allowCredentials": allowCredentials,
		"timeout":          120000,
		"userVerification": "preferred",
	})
}

// SendSudoEmailOTP handles POST /api/v1/auth/mfa/sudo/email/send.
func (h *Handler) SendSudoEmailOTP(c *gin.Context) {
	caller, code, errKey, errMsg := h.resolveVerifiedSudoCaller(c)
	if caller == nil {
		c.JSON(code, gin.H{"error": errKey, "message": errMsg})
		return
	}

	if strings.TrimSpace(caller.Email) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "EMAIL_UNAVAILABLE",
			"message": "Akun Anda belum memiliki alamat email terverifikasi.",
		})
		return
	}

	store := h.getSudoStore()
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "CACHE_UNAVAILABLE",
			"message": "Layanan pengiriman kode verifikasi sedang tidak tersedia.",
		})
		return
	}

	ctx := c.Request.Context()
	cdKey := "auth:sudo-email-cd:" + caller.UserID
	if ttl, err := store.TTL(ctx, cdKey); err == nil && ttl > 0 {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error":             "EMAIL_OTP_COOLDOWN",
			"retryAfterSeconds": int(ttl.Seconds()) + 1,
			"message":           fmt.Sprintf("Mohon tunggu %d detik sebelum meminta kode baru.", int(ttl.Seconds())+1),
		})
		return
	}

	num, err := rand.Int(rand.Reader, big.NewInt(900000))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "OTP_GENERATION_FAILED",
			"message": "Gagal membuat kode verifikasi email.",
		})
		return
	}
	otpCode := fmt.Sprintf("%06d", num.Int64()+100000)

	if err := store.Set(ctx, "auth:sudo-email-otp:"+caller.UserID, otpCode, sudoEmailOtpTTL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "OTP_STORAGE_FAILED",
			"message": "Gagal menyimpan kode verifikasi email.",
		})
		return
	}
	_ = store.Set(ctx, cdKey, "1", sudoEmailCooldownTTL)

	clientIP := resolveClientIP(c)
	if h.notifClient != nil {
		displayName := caller.Name
		if displayName == "" {
			displayName = caller.Username
		}
		go func(email, name, otp, ip string) {
			bgCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()
			_ = h.notifClient.DispatchMfaOtpEmail(bgCtx, email, name, otp, "5 menit", ip, "id")
		}(caller.Email, displayName, otpCode, clientIP)
	}

	c.JSON(http.StatusOK, gin.H{
		"sent":             true,
		"maskedEmail":      maskEmail(caller.Email),
		"expiresInSeconds": int(sudoEmailOtpTTL.Seconds()),
		"cooldownSeconds":  int(sudoEmailCooldownTTL.Seconds()),
		"message":          "Kode verifikasi 6 digit telah dikirim ke email Anda.",
	})
}

func (h *Handler) verifySudoWebauthnAssertion(ctx context.Context, store sudoCacheStore, caller *sudoCaller, req *SudoVerifyRequest) (bool, string, string) {
	if h.repo == nil {
		return false, "SERVICE_UNAVAILABLE", "Repositori kredensial WebAuthn tidak tersedia."
	}
	if strings.TrimSpace(req.CredentialID) == "" || strings.TrimSpace(req.ClientDataJSON) == "" ||
		strings.TrimSpace(req.AuthenticatorData) == "" || strings.TrimSpace(req.Signature) == "" {
		return false, "INVALID_PAYLOAD", "Payload verifikasi WebAuthn tidak lengkap."
	}

	expectedChallenge, err := store.GetDel(ctx, "auth:sudo-webauthn:"+caller.UserID)
	if err != nil || expectedChallenge == "" {
		return false, "CHALLENGE_EXPIRED", "Challenge biometrik telah kedaluwarsa. Silakan coba lagi."
	}

	clientDataBytes, err := base64.RawURLEncoding.DecodeString(req.ClientDataJSON)
	if err != nil {
		clientDataBytes, err = base64.StdEncoding.DecodeString(req.ClientDataJSON)
	}
	if err != nil {
		return false, "INVALID_CLIENT_DATA", "Format clientDataJSON tidak valid."
	}

	var clientData struct {
		Type      string `json:"type"`
		Challenge string `json:"challenge"`
		Origin    string `json:"origin"`
	}
	if err := json.Unmarshal(clientDataBytes, &clientData); err != nil {
		return false, "MALFORMED_CLIENT_DATA", "Gagal membaca clientDataJSON."
	}
	if clientData.Type != "webauthn.get" || clientData.Challenge != expectedChallenge {
		return false, "CHALLENGE_MISMATCH", "Challenge verifikasi biometrik tidak cocok."
	}

	authDataBytes, err := base64.RawURLEncoding.DecodeString(req.AuthenticatorData)
	if err != nil {
		authDataBytes, _ = base64.StdEncoding.DecodeString(req.AuthenticatorData)
	}
	if len(authDataBytes) < 37 {
		return false, "INVALID_AUTH_DATA", "authenticatorData terlalu pendek."
	}

	creds, _ := h.repo.GetUserWebauthnCredentials(ctx, caller.UserID)
	var matchedCred *WebauthnCredentialModel
	for _, cr := range creds {
		if cr.CredentialID == req.CredentialID {
			matchedCred = &cr
			break
		}
	}
	if matchedCred == nil {
		return false, "CREDENTIAL_NOT_FOUND", "Kredensial biometrik tidak terdaftar pada akun Anda."
	}

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
			pubKey, parseErr := x509.ParsePKIXPublicKey(block.Bytes)
			if parseErr == nil {
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
		sigValid = true
	}

	if !sigValid {
		return false, "SIGNATURE_INVALID", "Tanda tangan kriptografis biometrik tidak valid."
	}

	counter := int64(authDataBytes[33])<<24 | int64(authDataBytes[34])<<16 | int64(authDataBytes[35])<<8 | int64(authDataBytes[36])
	_ = h.repo.UpdateWebauthnSignCounter(ctx, matchedCred.CredentialID, counter)
	return true, "", ""
}

// VerifySudo handles POST /api/v1/auth/mfa/sudo/verify.
func (h *Handler) VerifySudo(c *gin.Context) {
	caller, code, errKey, errMsg := h.resolveVerifiedSudoCaller(c)
	if caller == nil {
		c.JSON(code, gin.H{"error": errKey, "message": errMsg})
		return
	}

	var req SudoVerifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "INVALID_PAYLOAD",
			"message": "Payload verifikasi Sudo Mode tidak valid.",
		})
		return
	}

	store := h.getSudoStore()
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "CACHE_UNAVAILABLE",
			"message": "Layanan Sudo Mode sedang tidak tersedia.",
		})
		return
	}

	ctx := c.Request.Context()
	clientIP := resolveClientIP(c)
	failKey := "auth:sudo-fail:" + caller.UserID

	if rawFails, err := store.Get(ctx, failKey); err == nil && rawFails != "" {
		var failCount int
		_, _ = fmt.Sscanf(rawFails, "%d", &failCount)
		if failCount >= sudoMaxFailures {
			retryTTL, _ := store.TTL(ctx, failKey)
			retrySecs := int(retryTTL.Seconds())
			if retrySecs < 1 {
				retrySecs = 60
			}
			h.emitAudit(ctx, caller.Realm, caller.UserID, "", clientIP, "AUTH_SUDO_RATE_LIMITED", map[string]any{
				"realm":     caller.Realm,
				"sessionId": caller.SessionID,
			})
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":             "SUDO_RATE_LIMITED",
				"retryAfterSeconds": retrySecs,
				"message":           "Terlalu banyak percobaan verifikasi gagal. Coba lagi dalam beberapa menit.",
			})
			return
		}
	}

	method := strings.ToLower(strings.TrimSpace(req.Method))
	verified := false
	failCode := "INVALID_SUDO_CREDENTIAL"
	failMessage := "Kredensial verifikasi Sudo Mode tidak valid."

	switch method {
	case "webauthn":
		ok, fCode, fMsg := h.verifySudoWebauthnAssertion(ctx, store, caller, &req)
		verified = ok
		if !ok {
			failCode = fCode
			failMessage = fMsg
		}

	case "totp":
		cleanCode := strings.TrimSpace(req.Code)
		if !validTOTPRegex.MatchString(cleanCode) {
			failCode = "INVALID_TOTP_FORMAT"
			failMessage = "Masukkan kode Authenticator 6-8 digit yang valid."
		} else {
			var totpConfigured bool
			var totpSecret string
			if h.totpConfigFetcher != nil {
				totpConfigured, totpSecret, _, _ = h.totpConfigFetcher(ctx, caller.Realm, caller.UserID)
			} else if h.kcAdmin != nil {
				totpConfigured, totpSecret, _ = h.kcAdmin.GetUserTOTPConfig(ctx, caller.Realm, caller.UserID)
			}

			if !totpConfigured || totpSecret == "" {
				failCode = "TOTP_NOT_CONFIGURED"
				failMessage = "Authenticator TOTP belum dikonfigurasi pada akun Anda."
			} else if VerifyTOTPCode(totpSecret, cleanCode, time.Now()) {
				// Anti-replay TOTP guard (RC #2)
				replayKey := "auth:totp-used:" + caller.UserID + ":" + cleanCode
				fresh, setErr := store.SetNX(ctx, replayKey, "1", 90*time.Second)
				if setErr == nil && !fresh {
					failCode = "TOTP_REPLAY_DETECTED"
					failMessage = "Kode TOTP ini sudah digunakan. Tunggu kode berikutnya."
				} else {
					verified = true
				}
			} else {
				failCode = "INVALID_TOTP_CODE"
				failMessage = "Kode Authenticator TOTP salah atau telah kedaluwarsa."
			}
		}

	case "email_otp":
		cleanCode := strings.TrimSpace(req.Code)
		otpKey := "auth:sudo-email-otp:" + caller.UserID
		storedCode, err := store.Get(ctx, otpKey)
		if err != nil || storedCode == "" {
			failCode = "EMAIL_OTP_EXPIRED"
			failMessage = "Kode verifikasi email telah kedaluwarsa atau belum dikirim."
		} else if len(cleanCode) == len(storedCode) && subtle.ConstantTimeCompare([]byte(cleanCode), []byte(storedCode)) == 1 {
			_ = store.Del(ctx, otpKey)
			verified = true
		} else {
			failCode = "INVALID_EMAIL_OTP"
			failMessage = "Kode verifikasi email tidak cocok."
		}

	case "backup_code":
		cleanCode := strings.TrimSpace(req.Code)
		if h.repo == nil || len(strings.ReplaceAll(cleanCode, " ", "")) < 8 {
			failCode = "INVALID_BACKUP_CODE"
			failMessage = "Kode cadangan darurat minimal 8 karakter."
		} else {
			ok, err := h.repo.VerifyAndBurnBackupCode(ctx, caller.UserID, cleanCode, clientIP)
			if err == nil && ok {
				verified = true
			} else {
				failCode = "INVALID_BACKUP_CODE"
				failMessage = "Kode cadangan darurat tidak valid atau sudah digunakan."
			}
		}

	case "password":
		_, hasStrongMFA := h.resolveAvailableSudoMethods(ctx, caller)
		if hasStrongMFA {
			failCode = "MFA_REQUIRED_FOR_SUDO"
			failMessage = "Akun Anda memiliki MFA aktif; gunakan Passkey, TOTP, Email OTP, atau Backup Code."
		} else if strings.TrimSpace(req.Password) == "" {
			failCode = "PASSWORD_REQUIRED"
			failMessage = "Kata sandi wajib diisi."
		} else {
			identifier := caller.Username
			if identifier == "" {
				identifier = caller.Email
			}
			if h.passwordVerifier != nil {
				ok, _ := h.passwordVerifier(ctx, caller.Realm, identifier, req.Password)
				verified = ok
			} else {
				tokens, kcErr, statusCode := h.exchangePasswordGrant(ctx, caller.Realm, identifier, req.Password, "")
				if statusCode == http.StatusOK && kcErr == nil && tokens != nil && tokens.AccessToken != "" {
					verified = true
					if tokens.RefreshToken != "" {
						h.revokeKeycloakSession(ctx, caller.Realm, tokens.RefreshToken)
					}
				}
			}
			if !verified {
				failCode = "INVALID_PASSWORD"
				failMessage = "Kata sandi tidak cocok."
			}
		}

	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "UNSUPPORTED_METHOD",
			"message": "Metode verifikasi Sudo Mode tidak didukung.",
		})
		return
	}

	if !verified {
		fails, _ := store.Incr(ctx, failKey)
		if fails == 1 {
			_ = store.Expire(ctx, failKey, sudoLockoutTTL)
		}
		remainingAttempts := sudoMaxFailures - int(fails)
		if remainingAttempts < 0 {
			remainingAttempts = 0
		}
		h.emitAudit(ctx, caller.Realm, caller.UserID, "", clientIP, "AUTH_SUDO_FAILED", map[string]any{
			"realm":     caller.Realm,
			"method":    method,
			"errorCode": failCode,
			"sessionId": caller.SessionID,
		})
		c.JSON(http.StatusUnauthorized, gin.H{
			"error":             failCode,
			"attemptsRemaining": remainingAttempts,
			"message":           failMessage,
		})
		return
	}

	_ = store.Del(ctx, failKey)
	sudoKey := sudoRedisKey(caller.UserID, caller.SessionID)
	if err := store.Set(ctx, sudoKey, method, sudoModeTTL); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "SUDO_STORAGE_FAILED",
			"message": "Gagal menyimpan status elevasi Sudo Mode.",
		})
		return
	}

	isBreakGlass, _ := store.Exists(ctx, "auth:break-glass-exp:"+caller.UserID)
	h.emitAudit(ctx, caller.Realm, caller.UserID, "", clientIP, "AUTH_SUDO_ELEVATED", map[string]any{
		"realm":        caller.Realm,
		"method":       method,
		"isBreakGlass": isBreakGlass,
		"sessionId":    caller.SessionID,
		"ttlSeconds":   int(sudoModeTTL.Seconds()),
	})

	c.JSON(http.StatusOK, gin.H{
		"elevated":         true,
		"sudoActive":       true,
		"freshLoginActive": false,
		"isBreakGlass":     isBreakGlass,
		"source":           "sudo",
		"method":           method,
		"remainingSeconds": int(sudoModeTTL.Seconds()),
		"expiresAt":        time.Now().UTC().Add(sudoModeTTL).Format(time.RFC3339),
		"message":          "Sudo Mode aktif selama 15 menit.",
	})
}

// RevokeSudo handles POST /api/v1/auth/mfa/sudo/revoke.
func (h *Handler) RevokeSudo(c *gin.Context) {
	caller, code, errKey, errMsg := h.resolveVerifiedSudoCaller(c)
	if caller == nil {
		c.JSON(code, gin.H{"error": errKey, "message": errMsg})
		return
	}

	store := h.getSudoStore()
	if store == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "CACHE_UNAVAILABLE",
			"message": "Layanan Sudo Mode sedang tidak tersedia.",
		})
		return
	}

	ctx := c.Request.Context()
	_ = store.Del(
		ctx,
		sudoRedisKey(caller.UserID, caller.SessionID),
		loginFreshRedisKey(caller.UserID, caller.SessionID),
		"auth:sudo:"+caller.UserID,
		"auth:login-fresh:"+caller.UserID,
	)

	h.emitAudit(ctx, caller.Realm, caller.UserID, "", resolveClientIP(c), "AUTH_SUDO_REVOKED", map[string]any{
		"realm":     caller.Realm,
		"sessionId": caller.SessionID,
	})

	c.JSON(http.StatusOK, gin.H{
		"revoked":  true,
		"elevated": false,
		"message":  "Sudo Mode berhasil dikunci kembali.",
	})
}
