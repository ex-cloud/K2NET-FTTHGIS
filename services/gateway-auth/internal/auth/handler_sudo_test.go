package auth

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"gateways/gateway-auth/internal/config"
	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type memoryEntry struct {
	val       string
	expiresAt time.Time
}

type memorySudoStore struct {
	mu   sync.Mutex
	data map[string]memoryEntry
}

func newMemorySudoStore() *memorySudoStore {
	return &memorySudoStore{data: make(map[string]memoryEntry)}
}

func (m *memorySudoStore) purgeExpiredLocked(key string) {
	if e, ok := m.data[key]; ok && !e.expiresAt.IsZero() && time.Now().After(e.expiresAt) {
		delete(m.data, key)
	}
}

func (m *memorySudoStore) Get(_ context.Context, key string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.purgeExpiredLocked(key)
	e, ok := m.data[key]
	if !ok {
		return "", redis.Nil
	}
	return e.val, nil
}

func (m *memorySudoStore) GetDel(_ context.Context, key string) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.purgeExpiredLocked(key)
	e, ok := m.data[key]
	if !ok {
		return "", redis.Nil
	}
	delete(m.data, key)
	return e.val, nil
}

func (m *memorySudoStore) Set(_ context.Context, key, value string, ttl time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	var exp time.Time
	if ttl > 0 {
		exp = time.Now().Add(ttl)
	}
	m.data[key] = memoryEntry{val: value, expiresAt: exp}
	return nil
}

func (m *memorySudoStore) SetNX(_ context.Context, key, value string, ttl time.Duration) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.purgeExpiredLocked(key)
	if _, ok := m.data[key]; ok {
		return false, nil
	}
	var exp time.Time
	if ttl > 0 {
		exp = time.Now().Add(ttl)
	}
	m.data[key] = memoryEntry{val: value, expiresAt: exp}
	return true, nil
}

func (m *memorySudoStore) Del(_ context.Context, keys ...string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, k := range keys {
		delete(m.data, k)
	}
	return nil
}

func (m *memorySudoStore) TTL(_ context.Context, key string) (time.Duration, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.purgeExpiredLocked(key)
	e, ok := m.data[key]
	if !ok {
		return -2 * time.Second, nil
	}
	if e.expiresAt.IsZero() {
		return -1 * time.Second, nil
	}
	return time.Until(e.expiresAt), nil
}

func (m *memorySudoStore) Exists(_ context.Context, key string) (bool, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.purgeExpiredLocked(key)
	_, ok := m.data[key]
	return ok, nil
}

func (m *memorySudoStore) Incr(_ context.Context, key string) (int64, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.purgeExpiredLocked(key)
	var cur int64
	if e, ok := m.data[key]; ok {
		_, _ = fmt.Sscanf(e.val, "%d", &cur)
		cur++
		e.val = fmt.Sprintf("%d", cur)
		m.data[key] = e
		return cur, nil
	}
	m.data[key] = memoryEntry{val: "1"}
	return 1, nil
}

func (m *memorySudoStore) Expire(_ context.Context, key string, ttl time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.purgeExpiredLocked(key)
	if e, ok := m.data[key]; ok {
		e.expiresAt = time.Now().Add(ttl)
		m.data[key] = e
	}
	return nil
}

func generateTestTOTPCode(base32Secret string, now time.Time) string {
	clean := strings.ToUpper(strings.TrimRight(base32Secret, "="))
	key, _ := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(clean)
	counter := uint64(now.Unix() / 30)
	var buf [8]byte
	binary.BigEndian.PutUint64(buf[:], counter)
	mac := hmac.New(sha1.New, key)
	mac.Write(buf[:])
	sum := mac.Sum(nil)
	offset := sum[len(sum)-1] & 0x0f
	code := (int(sum[offset]&0x7f) << 24) |
		(int(sum[offset+1]&0xff) << 16) |
		(int(sum[offset+2]&0xff) << 8) |
		int(sum[offset+3]&0xff)
	return fmt.Sprintf("%06d", code%1000000)
}

func setupSudoTestRouter(h *Handler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	v1 := r.Group("/api/v1/auth")
	v1.GET("/mfa/sudo/status", h.GetSudoStatus)
	v1.POST("/mfa/sudo/webauthn/challenge", h.GetSudoWebauthnChallenge)
	v1.POST("/mfa/sudo/email/send", h.SendSudoEmailOTP)
	v1.POST("/mfa/sudo/verify", h.VerifySudo)
	v1.POST("/mfa/sudo/revoke", h.RevokeSudo)
	return r
}

func TestSudoModeSecurityAndLifecycle(t *testing.T) {
	logger.InitLogger()
	store := newMemorySudoStore()
	repo := &mockRepo{backupCodes: map[string]bool{"user-1:ABCD-EFGH": true}}
	cfg := &config.Config{Port: "5014", CookieSecure: false}
	h := NewHandler(cfg, repo, nil, nil)
	h.sudoStore = store

	totpSecret := "JBSWY3DPEHPK3PXP"
	validJWT := buildTestJWT(map[string]any{
		"sub":                "user-1",
		"sid":                "sess-abc",
		"email":              "admin@kdua.net",
		"preferred_username": "admin_ops",
		"iss":                "https://auth-gis.kdua.net/realms/" + config.TenantSharedRealm,
	})

	h.userinfoVerifier = func(_ context.Context, realm, bearerToken string) (*sudoUserInfo, error) {
		if bearerToken != validJWT {
			return nil, errors.New("invalid signature")
		}
		return &sudoUserInfo{
			Sub:               "user-1",
			Email:             "admin@kdua.net",
			PreferredUsername: "admin_ops",
			Name:              "Ops Admin",
		}, nil
	}
	h.totpConfigFetcher = func(_ context.Context, _, _ string) (bool, string, bool, error) {
		return true, totpSecret, true, nil
	}
	h.passwordVerifier = func(_ context.Context, _, _, password string) (bool, error) {
		return password == "correct-pass", nil
	}

	r := setupSudoTestRouter(h)

	t.Run("rejects missing and forged bearer tokens authoritatively", func(t *testing.T) {
		req1 := httptest.NewRequest(http.MethodGet, "/api/v1/auth/mfa/sudo/status", nil)
		w1 := httptest.NewRecorder()
		r.ServeHTTP(w1, req1)
		if w1.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for missing bearer token, got %d", w1.Code)
		}

		forgedJWT := buildTestJWT(map[string]any{
			"sub": "user-1",
			"sid": "sess-abc",
			"iss": "https://auth-gis.kdua.net/realms/" + config.TenantSharedRealm,
		})
		req2 := httptest.NewRequest(http.MethodGet, "/api/v1/auth/mfa/sudo/status", nil)
		req2.Header.Set("Authorization", "Bearer "+forgedJWT)
		w2 := httptest.NewRecorder()
		r.ServeHTTP(w2, req2)
		if w2.Code != http.StatusUnauthorized {
			t.Fatalf("expected 401 for forged JWT, got %d", w2.Code)
		}
	})

	t.Run("grants fresh_login grace when non-break-glass and blocks it for break-glass", func(t *testing.T) {
		_ = store.Set(context.Background(), loginFreshRedisKey("user-1", "sess-abc"), "1", loginFreshGraceTTL)

		req := httptest.NewRequest(http.MethodGet, "/api/v1/auth/mfa/sudo/status", nil)
		req.Header.Set("Authorization", "Bearer "+validJWT)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
		}
		var body map[string]any
		_ = json.Unmarshal(w.Body.Bytes(), &body)
		if body["elevated"] != true || body["freshLoginActive"] != true || body["source"] != "fresh_login" {
			t.Fatalf("unexpected fresh login status: %+v", body)
		}

		// Enable break-glass flag for user-1 -> fresh_login must be suppressed!
		_ = store.Set(context.Background(), "auth:break-glass-exp:user-1", "1", time.Hour)
		defer func() { _ = store.Del(context.Background(), "auth:break-glass-exp:user-1") }()

		reqBG := httptest.NewRequest(http.MethodGet, "/api/v1/auth/mfa/sudo/status", nil)
		reqBG.Header.Set("Authorization", "Bearer "+validJWT)
		wBG := httptest.NewRecorder()
		r.ServeHTTP(wBG, reqBG)
		var bgBody map[string]any
		_ = json.Unmarshal(wBG.Body.Bytes(), &bgBody)
		if bgBody["elevated"] != false || bgBody["isBreakGlass"] != true || bgBody["freshLoginActive"] != false {
			t.Fatalf("expected Break-Glass session to have NO fresh-login grace: %+v", bgBody)
		}
	})

	t.Run("verifies TOTP, enforces replay protection, elevates session, and revokes cleanly", func(t *testing.T) {
		totpCode := generateTestTOTPCode(totpSecret, time.Now())
		payload, _ := json.Marshal(SudoVerifyRequest{Method: "totp", Code: totpCode})

		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/sudo/verify", bytes.NewReader(payload))
		req.Header.Set("Authorization", "Bearer "+validJWT)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Fatalf("expected 200 on valid TOTP sudo verify, got %d: %s", w.Code, w.Body.String())
		}

		var res map[string]any
		_ = json.Unmarshal(w.Body.Bytes(), &res)
		if res["elevated"] != true || res["sudoActive"] != true {
			t.Fatalf("unexpected verify response: %+v", res)
		}

		// Replay exact same TOTP code -> must be rejected with TOTP_REPLAY_DETECTED!
		reqReplay := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/sudo/verify", bytes.NewReader(payload))
		reqReplay.Header.Set("Authorization", "Bearer "+validJWT)
		reqReplay.Header.Set("Content-Type", "application/json")
		wReplay := httptest.NewRecorder()
		r.ServeHTTP(wReplay, reqReplay)
		if wReplay.Code != http.StatusUnauthorized || !strings.Contains(wReplay.Body.String(), "TOTP_REPLAY_DETECTED") {
			t.Fatalf("expected 401 TOTP_REPLAY_DETECTED, got %d: %s", wReplay.Code, wReplay.Body.String())
		}

		// Explicit Lock / Revoke Sudo Mode -> wipes sudo & fresh keys immediately
		reqRevoke := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/sudo/revoke", nil)
		reqRevoke.Header.Set("Authorization", "Bearer "+validJWT)
		wRevoke := httptest.NewRecorder()
		r.ServeHTTP(wRevoke, reqRevoke)
		if wRevoke.Code != http.StatusOK {
			t.Fatalf("expected 200 on revoke, got %d", wRevoke.Code)
		}

		reqAfter := httptest.NewRequest(http.MethodGet, "/api/v1/auth/mfa/sudo/status", nil)
		reqAfter.Header.Set("Authorization", "Bearer "+validJWT)
		wAfter := httptest.NewRecorder()
		r.ServeHTTP(wAfter, reqAfter)
		var afterBody map[string]any
		_ = json.Unmarshal(wAfter.Body.Bytes(), &afterBody)
		if afterBody["elevated"] != false || afterBody["sudoActive"] != false || afterBody["freshLoginActive"] != false {
			t.Fatalf("expected locked state after revoke, got %+v", afterBody)
		}
	})

	t.Run("locks out after 5 consecutive failures", func(t *testing.T) {
		_ = store.Del(context.Background(), "auth:sudo-fail:user-1")
		badPayload, _ := json.Marshal(SudoVerifyRequest{Method: "totp", Code: "000000"})

		for i := 0; i < sudoMaxFailures; i++ {
			req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/sudo/verify", bytes.NewReader(badPayload))
			req.Header.Set("Authorization", "Bearer "+validJWT)
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			r.ServeHTTP(w, req)
			if w.Code != http.StatusUnauthorized {
				t.Fatalf("attempt %d: expected 401, got %d", i+1, w.Code)
			}
		}

		reqLocked := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/sudo/verify", bytes.NewReader(badPayload))
		reqLocked.Header.Set("Authorization", "Bearer "+validJWT)
		reqLocked.Header.Set("Content-Type", "application/json")
		wLocked := httptest.NewRecorder()
		r.ServeHTTP(wLocked, reqLocked)
		if wLocked.Code != http.StatusTooManyRequests || !strings.Contains(wLocked.Body.String(), "SUDO_RATE_LIMITED") {
			t.Fatalf("expected 429 SUDO_RATE_LIMITED on 6th attempt, got %d: %s", wLocked.Code, wLocked.Body.String())
		}
	})

	t.Run("password fallback blocked when user has MFA enrolled and allowed when MFA absent", func(t *testing.T) {
		_ = store.Del(context.Background(), "auth:sudo-fail:user-1")
		pwPayload, _ := json.Marshal(SudoVerifyRequest{Method: "password", Password: "correct-pass"})

		// With MFA active -> password rejected (no MFA downgrade)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/sudo/verify", bytes.NewReader(pwPayload))
		req.Header.Set("Authorization", "Bearer "+validJWT)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusUnauthorized || !strings.Contains(w.Body.String(), "MFA_REQUIRED_FOR_SUDO") {
			t.Fatalf("expected MFA_REQUIRED_FOR_SUDO when MFA active, got %d: %s", w.Code, w.Body.String())
		}

		// Disable MFA enrollment -> password verification succeeds
		h.totpConfigFetcher = func(_ context.Context, _, _ string) (bool, string, bool, error) {
			return false, "", false, nil
		}
		repo.backupCodes = nil
		_ = store.Del(context.Background(), "auth:sudo-fail:user-1")

		req2 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/sudo/verify", bytes.NewReader(pwPayload))
		req2.Header.Set("Authorization", "Bearer "+validJWT)
		req2.Header.Set("Content-Type", "application/json")
		w2 := httptest.NewRecorder()
		r.ServeHTTP(w2, req2)
		if w2.Code != http.StatusOK {
			t.Fatalf("expected 200 when no MFA enrolled and valid password submitted, got %d: %s", w2.Code, w2.Body.String())
		}
	})
}
