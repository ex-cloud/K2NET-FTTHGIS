package auth

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"

	"gateways/gateway-auth/internal/config"
	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
)

type mockRepo struct {
	tenants      map[string]*TenantContextResponse
	userOrgMatch map[string]bool
	syncedUsers  []JITUserSyncInput
}

func (m *mockRepo) ResolveTenantContext(_ context.Context, slug string) (*TenantContextResponse, error) {
	if t, ok := m.tenants[slug]; ok {
		return t, nil
	}
	return nil, ErrTenantNotFound
}

func (m *mockRepo) VerifyUserBelongsToOrg(_ context.Context, userID, _, orgID string) (bool, error) {
	return m.userOrgMatch[userID+":"+orgID], nil
}

func (m *mockRepo) SyncUserJIT(_ context.Context, in JITUserSyncInput) error {
	m.syncedUsers = append(m.syncedUsers, in)
	return nil
}

func (m *mockRepo) FindUserForPasswordReset(_ context.Context, identifier, tenantSlug, plane string) (*ResetTokenData, error) {
	if strings.Contains(identifier, "notfound") {
		return nil, ErrTenantNotFound
	}
	return &ResetTokenData{
		UserID:     "11111111-1111-1111-1111-111111111111",
		Email:      identifier,
		Username:   "owner_kircon",
		FullName:   "Kircon Owner",
		Realm:      "k2net-tenants",
		TenantSlug: "kircon-bandung",
	}, nil
}

func (m *mockRepo) CompleteAccountActivation(_ context.Context, userID, orgID string) error {
	return nil
}

func buildTestJWT(claims map[string]any) string {
	header := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"RS256","typ":"JWT"}`))
	bodyBytes, _ := json.Marshal(claims)
	payload := base64.RawURLEncoding.EncodeToString(bodyBytes)
	sig := base64.RawURLEncoding.EncodeToString([]byte("test-signature"))
	return header + "." + payload + "." + sig
}

func setupTestRouter(h *Handler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/health", h.HealthCheck)
	v1 := r.Group("/api/v1/auth")
	v1.Use(SecurityHeadersAndCSRFMiddleware())
	{
		v1.GET("/tenant-context", h.GetTenantContext)
		v1.POST("/login", h.Login)
		v1.POST("/mfa/verify", h.VerifyMFA)
		v1.POST("/refresh", h.Refresh)
		v1.POST("/logout", h.Logout)
	}
	return r
}

func TestTenantContextAnd2RealmLoginFlows(t *testing.T) {
	logger.InitLogger()

	var logoutCalls int32
	// httptest.NewServer binds strictly to loopback 127.0.0.1
	mockKC := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_ = r.ParseForm()
		if strings.HasSuffix(r.URL.Path, "/logout") {
			atomic.AddInt32(&logoutCalls, 1)
			w.WriteHeader(http.StatusNoContent)
			return
		}

		grantType := r.FormValue("grant_type")
		username := r.FormValue("username")
		totp := r.FormValue("totp")

		if grantType == "refresh_token" {
			if r.FormValue("refresh_token") == "valid-refresh-token" {
				jwt := buildTestJWT(map[string]any{
					"sub":                "11111111-1111-1111-1111-111111111111",
					"email":              "owner@kircon.id",
					"preferred_username": "owner@kircon.id",
					"name":               "Kircon Owner",
					"organization_id":    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
					"tenant_id":          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
					"tenant_slug":        "kircon-bandung",
					"realm_access":       map[string]any{"roles": []string{"admin"}},
				})
				w.Header().Set("Content-Type", "application/json")
				_ = json.NewEncoder(w).Encode(KeycloakTokenResponse{
					AccessToken:      jwt,
					RefreshToken:     "rotated-refresh-token",
					IDToken:          jwt,
					ExpiresIn:        300,
					RefreshExpiresIn: 86400,
					TokenType:        "Bearer",
				})
				return
			}
			w.WriteHeader(http.StatusBadRequest)
			_, _ = w.Write([]byte(`{"error":"invalid_grant","error_description":"Token is not active"}`))
			return
		}

		if username == "mfa@kircon.id" && totp == "" {
			w.WriteHeader(http.StatusUnauthorized)
			_, _ = w.Write([]byte(`{"error":"invalid_grant","error_description":"Invalid totp"}`))
			return
		}

		if username == "owner@kircon.id" || (username == "mfa@kircon.id" && totp == "123456") {
			jwt := buildTestJWT(map[string]any{
				"sub":                "11111111-1111-1111-1111-111111111111",
				"email":              username,
				"preferred_username": username,
				"name":               "Kircon Owner",
				"organization_id":    "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				"tenant_id":          "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				"tenant_slug":        "kircon-bandung",
				"realm_access":       map[string]any{"roles": []string{"admin"}},
			})
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(KeycloakTokenResponse{
				AccessToken:      jwt,
				RefreshToken:     "valid-refresh-token",
				IDToken:          jwt,
				ExpiresIn:        300,
				RefreshExpiresIn: 86400,
				TokenType:        "Bearer",
			})
			return
		}

		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":"invalid_grant","error_description":"Invalid user credentials"}`))
	}))
	defer mockKC.Close()

	repo := &mockRepo{
		tenants: map[string]*TenantContextResponse{
			"kircon-bandung": {
				ID:              "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				Name:            "PT Kircon Bandung",
				Slug:            "kircon-bandung",
				RealmKey:        config.TenantSharedRealm,
				Plan:            "PRO",
				PlanDisplayName: "PROFESSIONAL ISP",
				AuthMode:        "HYBRID_SSO",
				Status:          "ACTIVE",
				HasSSO:          true,
				AllowedMethods:  []string{"password", "google", "github"},
			},
			"cicadas": {
				ID:              "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
				Name:            "Cicadas Fiber",
				Slug:            "cicadas",
				RealmKey:        config.TenantSharedRealm,
				Plan:            "FREE",
				PlanDisplayName: "STARTER TRIAL",
				AuthMode:        "PASSWORD_ONLY",
				Status:          "TRIAL",
				HasSSO:          false,
				AllowedMethods:  []string{"password"},
			},
			"suspended-isp": {
				ID:     "cccccccc-cccc-cccc-cccc-cccccccccccc",
				Name:   "Suspended ISP",
				Slug:   "suspended-isp",
				Status: "SUSPENDED",
			},
		},
		userOrgMatch: map[string]bool{},
	}

	cfg := &config.Config{
		Port:                "5014",
		KeycloakInternalURL: mockKC.URL,
		KeycloakClientID:    "ftth-gis-frontend",
		CookieSecure:        true,
	}
	handler := NewHandler(cfg, repo, nil, nil)
	router := setupTestRouter(handler)

	// 1. GET /api/v1/auth/tenant-context?slug=kircon-bandung
	wCtx := httptest.NewRecorder()
	reqCtx := httptest.NewRequest(http.MethodGet, "/api/v1/auth/tenant-context?slug=kircon-bandung", nil)
	router.ServeHTTP(wCtx, reqCtx)
	if wCtx.Code != http.StatusOK {
		t.Fatalf("expected 200 for tenant-context, got %d", wCtx.Code)
	}

	// 2. Successful Tenant Login -> sets HttpOnly; Secure; SameSite=Strict cookie + JIT sync
	loginPayload, _ := json.Marshal(LoginRequest{
		Plane:      "TENANT",
		TenantSlug: "kircon-bandung",
		Username:   "owner@kircon.id",
		Password:   "test-credential-input",
		RememberMe: true,
	})
	wLogin := httptest.NewRecorder()
	reqLogin := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginPayload))
	reqLogin.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wLogin, reqLogin)
	if wLogin.Code != http.StatusOK {
		t.Fatalf("expected 200 on valid tenant login, got %d: %s", wLogin.Code, wLogin.Body.String())
	}

	cookies := wLogin.Result().Cookies()
	var foundRefreshCookie bool
	for _, ck := range cookies {
		if ck.Name == refreshCookieName {
			foundRefreshCookie = true
			if !ck.HttpOnly || !ck.Secure || ck.SameSite != http.SameSiteStrictMode {
				t.Fatalf("refresh cookie must be HttpOnly, Secure, and SameSite=Strict: %+v", ck)
			}
		}
	}
	if !foundRefreshCookie {
		t.Fatalf("expected %s cookie to be set", refreshCookieName)
	}
	if len(repo.syncedUsers) != 1 {
		t.Fatalf("expected 1 JIT user sync call, got %d", len(repo.syncedUsers))
	}

	// 3. MFA Challenge Detection (mfaRequired: true)
	mfaPayload, _ := json.Marshal(LoginRequest{
		Plane:      "TENANT",
		TenantSlug: "kircon-bandung",
		Username:   "mfa@kircon.id",
		Password:   "test-credential-input",
	})
	wMFA := httptest.NewRecorder()
	reqMFA := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(mfaPayload))
	reqMFA.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wMFA, reqMFA)
	if wMFA.Code != http.StatusOK || !strings.Contains(wMFA.Body.String(), `"mfaRequired":true`) {
		t.Fatalf("expected mfaRequired:true response, got %d: %s", wMFA.Code, wMFA.Body.String())
	}

	// 4. Cross-Tenant Login Block -> Kircon user attempting login on Cicadas workspace must get 403 & session revoked
	crossPayload, _ := json.Marshal(LoginRequest{
		Plane:      "TENANT",
		TenantSlug: "cicadas",
		Username:   "owner@kircon.id",
		Password:   "test-credential-input",
	})
	wCross := httptest.NewRecorder()
	reqCross := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(crossPayload))
	reqCross.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wCross, reqCross)
	if wCross.Code != http.StatusForbidden {
		t.Fatalf("expected 403 on cross-tenant login attempt, got %d", wCross.Code)
	}
	if atomic.LoadInt32(&logoutCalls) == 0 {
		t.Fatalf("expected Keycloak session to be revoked immediately on cross-tenant block")
	}

	// 5. Suspended Tenant Block -> 403 ORGANIZATION_SUSPENDED
	suspPayload, _ := json.Marshal(LoginRequest{
		Plane:      "TENANT",
		TenantSlug: "suspended-isp",
		Username:   "owner@kircon.id",
		Password:   "test-credential-input",
	})
	wSusp := httptest.NewRecorder()
	reqSusp := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(suspPayload))
	reqSusp.Header.Set("Content-Type", "application/json")
	router.ServeHTTP(wSusp, reqSusp)
	if wSusp.Code != http.StatusForbidden {
		t.Fatalf("expected 403 on suspended org login, got %d", wSusp.Code)
	}

	// 6. Silent Refresh via HttpOnly cookie -> rotates cookie
	wRefresh := httptest.NewRecorder()
	reqRefresh := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	reqRefresh.AddCookie(&http.Cookie{Name: refreshCookieName, Value: "valid-refresh-token"})
	reqRefresh.AddCookie(&http.Cookie{Name: realmCookieName, Value: config.TenantSharedRealm})
	router.ServeHTTP(wRefresh, reqRefresh)
	if wRefresh.Code != http.StatusOK {
		t.Fatalf("expected 200 on silent refresh, got %d: %s", wRefresh.Code, wRefresh.Body.String())
	}

	// 7. Logout -> revokes session & clears HttpOnly cookie (MaxAge < 0)
	wLogout := httptest.NewRecorder()
	reqLogout := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", nil)
	reqLogout.AddCookie(&http.Cookie{Name: refreshCookieName, Value: "rotated-refresh-token"})
	reqLogout.AddCookie(&http.Cookie{Name: realmCookieName, Value: config.TenantSharedRealm})
	router.ServeHTTP(wLogout, reqLogout)
	if wLogout.Code != http.StatusOK {
		t.Fatalf("expected 200 on logout, got %d", wLogout.Code)
	}
	for _, ck := range wLogout.Result().Cookies() {
		if (ck.Name == refreshCookieName || ck.Name == secureRefreshCookieName) && ck.MaxAge >= 0 {
			t.Fatalf("expected logout to expire refresh cookie with MaxAge < 0, got %d", ck.MaxAge)
		}
	}

	// 8. Cross-Site Form POST CSRF Defense -> 403 CSRF_REJECTED
	wCSRF := httptest.NewRecorder()
	reqCSRF := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", strings.NewReader("refreshToken=x"))
	reqCSRF.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	router.ServeHTTP(wCSRF, reqCSRF)
	if wCSRF.Code != http.StatusForbidden {
		t.Fatalf("expected 403 on form-encoded CSRF attempt, got %d", wCSRF.Code)
	}
}

func TestValidatePasswordComplexity(t *testing.T) {
	tests := []struct {
		name    string
		pwd     string
		wantErr bool
	}{
		{"Too short", "Ab1!", true},
		{"No uppercase", "abcdef123!", true},
		{"No number", "Abcdefgh!", true},
		{"No special", "Abcdefgh12", true},
		{"Valid password", "SecureP@ss2026", false},
		{"Valid password 2", "K2net#Admin99", false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidatePasswordComplexity(tc.pwd)
			if (err != nil) != tc.wantErr {
				t.Errorf("ValidatePasswordComplexity(%q) error = %v, wantErr = %v", tc.pwd, err, tc.wantErr)
			}
		})
	}
}

func TestMaskEmail(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"admin@kdua.net", "ad***@kdua.net"},
		{"pic@isp.com", "pi***@isp.com"},
		{"a@b.com", "a***@b.com"},
	}

	for _, tc := range tests {
		result := maskEmail(tc.input)
		if result != tc.expected {
			t.Errorf("maskEmail(%q) = %q, expected %q", tc.input, result, tc.expected)
		}
	}
}

func TestForgotPasswordAntiEnumeration(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &mockRepo{
		tenants:      map[string]*TenantContextResponse{},
		userOrgMatch: map[string]bool{},
	}
	cfg := &config.Config{
		Port: "5014",
	}
	handler := NewHandler(cfg, repo, nil, nil)
	r := gin.New()
	r.POST("/api/v1/auth/forgot-password", handler.ForgotPassword)

	// Test 1: User does not exist ("notfound@kdua.net")
	payload1, _ := json.Marshal(ForgotPasswordRequest{
		Username: "notfound@kdua.net",
		Lang:     "id",
	})
	w1 := httptest.NewRecorder()
	req1 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/forgot-password", bytes.NewReader(payload1))
	req1.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w1, req1)

	if w1.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200 generic response, got %d", w1.Code)
	}

	var resp1 map[string]any
	_ = json.Unmarshal(w1.Body.Bytes(), &resp1)
	if resp1["success"] != true {
		t.Errorf("expected success: true, got %v", resp1["success"])
	}

	// Test 2: User exists ("owner@kircon.id")
	payload2, _ := json.Marshal(ForgotPasswordRequest{
		Username: "owner@kircon.id",
		Lang:     "id",
	})
	w2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/auth/forgot-password", bytes.NewReader(payload2))
	req2.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w2, req2)

	if w2.Code != http.StatusOK {
		t.Fatalf("expected HTTP 200 generic response, got %d", w2.Code)
	}

	var resp2 map[string]any
	_ = json.Unmarshal(w2.Body.Bytes(), &resp2)
	// Responses must be completely indistinguishable to prevent account enumeration
	if resp1["message"] != resp2["message"] {
		t.Errorf("expected identical generic message for found and not found users. got %v vs %v",
			resp1["message"], resp2["message"])
	}
}

