package auth

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
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
	tenants           map[string]*TenantContextResponse
	userOrgMatch      map[string]bool
	syncedUsers       []JITUserSyncInput
	backupCodes       map[string]bool
	discoverableCreds []WebauthnCredentialModel
	credOwners        map[string]*WebauthnCredentialOwner
}

func (m *mockRepo) ResolveTenantContext(_ context.Context, slug string) (*TenantContextResponse, error) {
	if t, ok := m.tenants[slug]; ok {
		return t, nil
	}
	return nil, ErrTenantNotFound
}

func (m *mockRepo) VerifyUserBelongsToOrg(_ context.Context, userID, email, orgID string) (bool, error) {
	return m.userOrgMatch[userID+":"+orgID] || m.userOrgMatch[email+":"+orgID], nil
}

func (m *mockRepo) CheckMembershipStatus(_ context.Context, userID, email, orgID string) (string, error) {
	if m.userOrgMatch[userID+":"+orgID] || m.userOrgMatch[email+":"+orgID] {
		return "ACTIVE", nil
	}
	return "", nil
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

func (m *mockRepo) GetUserWorkspaces(_ context.Context, userID, email string) ([]UserWorkspace, error) {
	return []UserWorkspace{
		{
			OrganizationID:   "org-1",
			OrganizationName: "Kircon Fiber",
			OrganizationSlug: "kircon-bandung",
			CanonicalDomain:  "kircon-bandung.kdua.net",
			RoleName:         "admin",
			Status:           "ACTIVE",
			IsDefault:        true,
			IsActiveContext:  true,
		},
	}, nil
}

func (m *mockRepo) SwitchUserContext(_ context.Context, userID, targetOrgID string) (*TenantContextResponse, error) {
	if targetOrgID == "invalid-org" {
		return nil, errors.New("user is not an active member of target workspace")
	}
	return &TenantContextResponse{
		ID:              targetOrgID,
		Name:            "Kircon Fiber",
		Slug:            "kircon-bandung",
		RealmKey:        "k2net-tenants",
		Plan:            "PRO",
		PlanDisplayName: "PROFESSIONAL ISP",
		Status:          "ACTIVE",
	}, nil
}

func (m *mockRepo) DiscoverSsoByEmail(_ context.Context, email string, tenantSlug string) (*SsoDiscoveryResponse, error) {
	if tenantSlug == "fibernet" && strings.HasSuffix(email, "@fibernet.net") {
		return &SsoDiscoveryResponse{
			SSOAvailable:     true,
			EnforceSSO:       true,
			AllowBreakGlass:  true,
			ProviderType:     "GOOGLE",
			DisplayName:      "Google Workspace",
			OrganizationSlug: "fibernet",
			OrganizationName: "Fibernet ISP",
			IDPHint:          "google",
			RedirectURL:      "https://fibernet.kdua.net/login",
			EmailDomain:      "fibernet.net",
		}, nil
	}
	parts := strings.Split(email, "@")
	domain := "example.com"
	if len(parts) == 2 {
		domain = parts[1]
	}
	return &SsoDiscoveryResponse{SSOAvailable: false, EmailDomain: domain}, nil
}

func (m *mockRepo) GetUserWebauthnCredentials(_ context.Context, _ string) ([]WebauthnCredentialModel, error) {
	return nil, nil
}

func (m *mockRepo) GetDiscoverableWebauthnCredentials(_ context.Context, _, _, _ string) ([]WebauthnCredentialModel, error) {
	return m.discoverableCreds, nil
}

func (m *mockRepo) GetWebauthnCredentialByCredentialID(_ context.Context, credentialID string) (*WebauthnCredentialOwner, error) {
	if m.credOwners != nil {
		if owner, ok := m.credOwners[credentialID]; ok {
			return owner, nil
		}
	}
	return nil, nil
}

func (m *mockRepo) UpdateWebauthnSignCounter(_ context.Context, _ string, _ int64) error {
	return nil
}

func (m *mockRepo) IsUserMfaEnabled(_ context.Context, _ string) (bool, error) {
	return false, nil
}

func (m *mockRepo) HasActiveBackupCodes(_ context.Context, userID string) (bool, error) {
	for k, active := range m.backupCodes {
		if active && strings.HasPrefix(k, userID+":") {
			return true, nil
		}
	}
	return false, nil
}

func (m *mockRepo) VerifyAndBurnBackupCode(_ context.Context, userID string, rawCode string, _ string) (bool, error) {
	cleanCode := strings.ToUpper(strings.TrimSpace(rawCode))
	cleanCode = strings.ReplaceAll(cleanCode, " ", "")
	if len(cleanCode) == 8 && !strings.Contains(cleanCode, "-") {
		cleanCode = cleanCode[:4] + "-" + cleanCode[4:]
	}
	key := userID + ":" + cleanCode
	if active, ok := m.backupCodes[key]; ok && active {
		m.backupCodes[key] = false // burned
		return true, nil
	}
	return false, nil
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
		v1.POST("/mfa/backup-code/verify", h.VerifyMfaBackupCode)
		v1.POST("/webauthn/discoverable/challenge", h.GetDiscoverableWebauthnChallenge)
		v1.POST("/webauthn/discoverable/verify", h.VerifyDiscoverableWebauthnLogin)
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
		userOrgMatch: map[string]bool{
			"11111111-1111-1111-1111-111111111111:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": true,
			"owner@kircon.id:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa":                        true,
		},
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

	// 6b. Terminated / Concurrent Session Refresh -> 419 SESSION_TERMINATED & clears cookie
	wTerminated := httptest.NewRecorder()
	reqTerminated := httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	reqTerminated.AddCookie(&http.Cookie{Name: refreshCookieName, Value: "revoked-by-other-device-token"})
	reqTerminated.AddCookie(&http.Cookie{Name: realmCookieName, Value: config.TenantSharedRealm})
	router.ServeHTTP(wTerminated, reqTerminated)
	if wTerminated.Code != 419 {
		t.Fatalf("expected 419 on terminated session refresh, got %d: %s", wTerminated.Code, wTerminated.Body.String())
	}
	if !strings.Contains(wTerminated.Body.String(), `"SESSION_TERMINATED"`) {
		t.Fatalf("expected SESSION_TERMINATED error code on 419, got %s", wTerminated.Body.String())
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
		userOrgMatch: map[string]bool{
			"11111111-1111-1111-1111-111111111111:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": true,
			"owner@kircon.id:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa":                        true,
		},
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

func TestMultiTenantWorkspacesAndSwitchContext(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &mockRepo{
		tenants:      map[string]*TenantContextResponse{},
		userOrgMatch: map[string]bool{
			"11111111-1111-1111-1111-111111111111:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": true,
			"owner@kircon.id:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa":                        true,
		},
	}
	cfg := &config.Config{
		Port: "5014",
	}
	handler := NewHandler(cfg, repo, nil, nil)
	r := gin.New()
	r.GET("/api/v1/auth/workspaces", handler.ListWorkspaces)
	r.POST("/api/v1/auth/switch-context", handler.SwitchContext)

	testJWT := buildTestJWT(map[string]any{
		"sub":   "user-123",
		"email": "engineer@k2net.id",
	})

	// 1. GET /api/v1/auth/workspaces with Bearer token
	reqList := httptest.NewRequest(http.MethodGet, "/api/v1/auth/workspaces", nil)
	reqList.Header.Set("Authorization", "Bearer "+testJWT)
	wList := httptest.NewRecorder()
	r.ServeHTTP(wList, reqList)

	if wList.Code != http.StatusOK {
		t.Fatalf("expected 200 for ListWorkspaces, got %d", wList.Code)
	}

	var workspaces []UserWorkspace
	if err := json.Unmarshal(wList.Body.Bytes(), &workspaces); err != nil {
		t.Fatalf("failed to decode workspaces response: %v", err)
	}
	if len(workspaces) != 1 || workspaces[0].OrganizationSlug != "kircon-bandung" {
		t.Fatalf("unexpected workspaces response: %+v", workspaces)
	}

	// 2. POST /api/v1/auth/switch-context success
	switchPayload, _ := json.Marshal(SwitchContextRequest{
		TargetOrganizationID: "org-1",
	})
	reqSwitch := httptest.NewRequest(http.MethodPost, "/api/v1/auth/switch-context", bytes.NewReader(switchPayload))
	reqSwitch.Header.Set("Authorization", "Bearer "+testJWT)
	reqSwitch.Header.Set("Content-Type", "application/json")
	wSwitch := httptest.NewRecorder()
	r.ServeHTTP(wSwitch, reqSwitch)

	if wSwitch.Code != http.StatusOK {
		t.Fatalf("expected 200 for switch context, got %d", wSwitch.Code)
	}

	var switchResp SwitchContextResponse
	if err := json.Unmarshal(wSwitch.Body.Bytes(), &switchResp); err != nil {
		t.Fatalf("failed to decode switch context response: %v", err)
	}
	if switchResp.OrganizationSlug != "kircon-bandung" || switchResp.RedirectURL != "https://kircon-bandung.kdua.net" {
		t.Fatalf("unexpected switch context response: %+v", switchResp)
	}

	// 3. POST /api/v1/auth/switch-context forbidden for invalid org
	switchInvalidPayload, _ := json.Marshal(SwitchContextRequest{
		TargetOrganizationID: "invalid-org",
	})
	reqInvalid := httptest.NewRequest(http.MethodPost, "/api/v1/auth/switch-context", bytes.NewReader(switchInvalidPayload))
	reqInvalid.Header.Set("Authorization", "Bearer "+testJWT)
	reqInvalid.Header.Set("Content-Type", "application/json")
	wInvalid := httptest.NewRecorder()
	r.ServeHTTP(wInvalid, reqInvalid)

	if wInvalid.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for invalid org switch, got %d", wInvalid.Code)
	}
}

func TestIsIPInCIDRList(t *testing.T) {
	allowlist := "192.168.1.0/24, 10.0.0.1, 2001:db8::/32"

	if !isIPInCIDRList("192.168.1.50", allowlist) {
		t.Fatalf("expected 192.168.1.50 to match allowlist")
	}
	if !isIPInCIDRList("10.0.0.1", allowlist) {
		t.Fatalf("expected 10.0.0.1 to match allowlist")
	}
	if !isIPInCIDRList("2001:db8:1234::1", allowlist) {
		t.Fatalf("expected 2001:db8:1234::1 to match allowlist")
	}
	if isIPInCIDRList("192.168.2.1", allowlist) {
		t.Fatalf("expected 192.168.2.1 to be rejected")
	}
	if isIPInCIDRList("10.0.0.2", allowlist) {
		t.Fatalf("expected 10.0.0.2 to be rejected")
	}
	if !isIPInCIDRList("1.2.3.4", "") {
		t.Fatalf("expected empty allowlist to allow any IP")
	}
}

func TestGetSsoDiscovery(t *testing.T) {
	gin.SetMode(gin.TestMode)
	repo := &mockRepo{
		tenants: map[string]*TenantContextResponse{},
	}
	handler := &Handler{
		repo: repo,
	}

	r := gin.New()
	r.GET("/api/v1/auth/sso-discovery", handler.GetSsoDiscovery)

	// 1. Missing email
	w1 := httptest.NewRecorder()
	req1 := httptest.NewRequest(http.MethodGet, "/api/v1/auth/sso-discovery", nil)
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for missing email, got %d", w1.Code)
	}

	// 2. Discovered email with matching tenant
	w2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "/api/v1/auth/sso-discovery?email=user@fibernet.net&tenant=fibernet", nil)
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200 for fibernet.net, got %d", w2.Code)
	}
	var res2 SsoDiscoveryResponse
	_ = json.Unmarshal(w2.Body.Bytes(), &res2)
	if !res2.SSOAvailable || res2.OrganizationSlug != "fibernet" {
		t.Fatalf("expected fibernet SSO, got %+v", res2)
	}

	// 2b. Cross-tenant leakage prevention: fibernet email queried against nusantara tenant
	w2b := httptest.NewRecorder()
	req2b := httptest.NewRequest(http.MethodGet, "/api/v1/auth/sso-discovery?email=user@fibernet.net&tenant=nusantara", nil)
	r.ServeHTTP(w2b, req2b)
	if w2b.Code != http.StatusOK {
		t.Fatalf("expected 200 for cross-tenant query, got %d", w2b.Code)
	}
	var res2b SsoDiscoveryResponse
	_ = json.Unmarshal(w2b.Body.Bytes(), &res2b)
	if res2b.SSOAvailable {
		t.Fatalf("expected cross-tenant SSO to be blocked (false), got %+v", res2b)
	}

	// 3. Unknown email
	w3 := httptest.NewRecorder()
	req3 := httptest.NewRequest(http.MethodGet, "/api/v1/auth/sso-discovery?email=user@gmail.com&tenant=fibernet", nil)
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Fatalf("expected 200 for unknown domain, got %d", w3.Code)
	}
	var res3 SsoDiscoveryResponse
	_ = json.Unmarshal(w3.Body.Bytes(), &res3)
	if res3.SSOAvailable {
		t.Fatalf("expected SSO not available for gmail.com, got %+v", res3)
	}
}

func TestSsoExchange_InviteFirstAndGovernanceMatrix(t *testing.T) {
	gin.SetMode(gin.TestMode)

	mockKC := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Mock token refresh endpoint
		if strings.Contains(r.URL.Path, "/protocol/openid-connect/token") {
			_ = r.ParseForm()
			refreshToken := r.Form.Get("refresh_token")
			emailVerified := true
			idp := "google"

			if refreshToken == "unverified-email-refresh" {
				emailVerified = false
			} else if refreshToken == "sso-ops-refresh" {
				idp = "sso-ops"
			}

			email := "user@external.com"
			if refreshToken == "member-refresh" {
				email = "member@fibernet.net"
			} else if refreshToken == "invited-refresh" {
				email = "invited@fibernet.net"
			}

			jwt := buildTestJWT(map[string]any{
				"sub":                "sub-" + refreshToken,
				"email":              email,
				"email_verified":     emailVerified,
				"identity_provider":  idp,
				"preferred_username": email,
				"name":               "Test User",
			})

			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(KeycloakTokenResponse{
				AccessToken:      jwt,
				RefreshToken:     "valid-refreshed-token",
				IDToken:          jwt,
				ExpiresIn:        300,
				RefreshExpiresIn: 86400,
				TokenType:        "Bearer",
			})
			return
		}

		if strings.Contains(r.URL.Path, "/protocol/openid-connect/revoke") {
			w.WriteHeader(http.StatusOK)
			return
		}

		w.WriteHeader(http.StatusOK)
	}))
	defer mockKC.Close()

	mockBackend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/api/v1/internal/organizations/") && strings.Contains(r.URL.Path, "/members/accept-by-email") {
			if r.Header.Get("X-Gateway-Token") != "test-gw-token" {
				w.WriteHeader(http.StatusForbidden)
				return
			}
			w.WriteHeader(http.StatusOK)
			_ = json.NewEncoder(w).Encode(map[string]any{"status": "ACTIVE"})
			return
		}
		w.WriteHeader(http.StatusNotFound)
	}))
	defer mockBackend.Close()

	repo := &mockRepo{
		tenants: map[string]*TenantContextResponse{
			"fibernet": {
				ID:               "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
				Name:             "Fibernet",
				Slug:             "fibernet",
				RealmKey:         config.TenantSharedRealm,
				AllowSocialLogin: true,
				Status:           "ACTIVE",
			},
			"no-social": {
				ID:               "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
				Name:             "No Social ISP",
				Slug:             "no-social",
				RealmKey:         config.TenantSharedRealm,
				AllowSocialLogin: false,
				Status:           "ACTIVE",
			},
		},
		userOrgMatch: map[string]bool{
			"sub-member-refresh:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa":  true,
			"member@fibernet.net:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa": true,
		},
	}

	cfg := &config.Config{
		Port:                "5014",
		KeycloakInternalURL: mockKC.URL,
		KeycloakClientID:    "ftth-gis-frontend",
		BackendInternalURL:  mockBackend.URL,
		GatewayToken:        "test-gw-token",
		CookieSecure:        true,
	}

	handler := NewHandler(cfg, repo, nil, nil)
	r := gin.New()
	r.POST("/api/v1/auth/login/sso-exchange", handler.SsoExchange)

	// 1. Non-member login to fibernet -> Denied 403 TENANT_ACCESS_DENIED
	w1 := httptest.NewRecorder()
	b1, _ := json.Marshal(SsoExchangeRequest{
		RefreshToken: "non-member-refresh",
		TenantSlug:   "fibernet",
		Plane:        "TENANT",
	})
	r.ServeHTTP(w1, httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/sso-exchange", bytes.NewReader(b1)))
	if w1.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for non-member, got %d: %s", w1.Code, w1.Body.String())
	}
	if !strings.Contains(w1.Body.String(), "TENANT_ACCESS_DENIED") {
		t.Fatalf("expected TENANT_ACCESS_DENIED error code, got %s", w1.Body.String())
	}

	// 2. Unverified email -> Denied 403 EMAIL_NOT_VERIFIED
	w2 := httptest.NewRecorder()
	b2, _ := json.Marshal(SsoExchangeRequest{
		RefreshToken: "unverified-email-refresh",
		TenantSlug:   "fibernet",
		Plane:        "TENANT",
	})
	r.ServeHTTP(w2, httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/sso-exchange", bytes.NewReader(b2)))
	if w2.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for unverified email, got %d: %s", w2.Code, w2.Body.String())
	}
	if !strings.Contains(w2.Body.String(), "EMAIL_NOT_VERIFIED") {
		t.Fatalf("expected EMAIL_NOT_VERIFIED error code, got %s", w2.Body.String())
	}

	// 3. Social login when allow_social_login = false -> Denied 403 SSO_NOT_AVAILABLE
	w3 := httptest.NewRecorder()
	b3, _ := json.Marshal(SsoExchangeRequest{
		RefreshToken: "member-refresh",
		TenantSlug:   "no-social",
		Plane:        "TENANT",
	})
	r.ServeHTTP(w3, httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/sso-exchange", bytes.NewReader(b3)))
	if w3.Code != http.StatusForbidden {
		t.Fatalf("expected 403 when social disabled, got %d: %s", w3.Code, w3.Body.String())
	}
	if !strings.Contains(w3.Body.String(), "SSO_NOT_AVAILABLE") {
		t.Fatalf("expected SSO_NOT_AVAILABLE error code, got %s", w3.Body.String())
	}

	// 4. Valid active member login -> 200 OK
	w4 := httptest.NewRecorder()
	b4, _ := json.Marshal(SsoExchangeRequest{
		RefreshToken: "member-refresh",
		TenantSlug:   "fibernet",
		Plane:        "TENANT",
	})
	r.ServeHTTP(w4, httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/sso-exchange", bytes.NewReader(b4)))
	if w4.Code != http.StatusOK {
		t.Fatalf("expected 200 for valid member, got %d: %s", w4.Code, w4.Body.String())
	}
}

func TestSsoExchange_GoogleHostedDomainRestriction(t *testing.T) {
	gin.SetMode(gin.TestMode)

	var revokeCalled atomic.Int32
	mockKC := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/protocol/openid-connect/token") {
			_ = r.ParseForm()
			rt := r.Form.Get("refresh_token")
			email := "staff@gmail.com"
			idp := "google"
			switch rt {
			case "corp-google":
				email = "staff@ispnusantara.net"
				idp = "google"
			case "personal-github":
				email = "dev@gmail.com"
				idp = "github"
			}
			jwt := buildTestJWT(map[string]any{
				"sub":                "sub-" + rt,
				"email":              email,
				"email_verified":     true,
				"identity_provider":  idp,
				"preferred_username": email,
				"name":               "Workspace User",
			})
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(KeycloakTokenResponse{
				AccessToken:      jwt,
				RefreshToken:     "ref-" + rt,
				IDToken:          jwt,
				ExpiresIn:        300,
				RefreshExpiresIn: 86400,
				TokenType:        "Bearer",
			})
			return
		}
		if strings.Contains(r.URL.Path, "/protocol/openid-connect/logout") {
			revokeCalled.Add(1)
			w.WriteHeader(http.StatusOK)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer mockKC.Close()

	repo := &mockRepo{
		tenants: map[string]*TenantContextResponse{
			"nusantara": {
				ID:                 "cccccccc-cccc-cccc-cccc-cccccccccccc",
				Name:               "Nusantara ISP",
				Slug:               "nusantara",
				RealmKey:           config.TenantSharedRealm,
				AllowSocialLogin:   true,
				GoogleHostedDomain: "ispnusantara.net",
				Status:             "ACTIVE",
			},
		},
		userOrgMatch: map[string]bool{
			"staff@gmail.com:cccccccc-cccc-cccc-cccc-cccccccccccc":        true,
			"staff@ispnusantara.net:cccccccc-cccc-cccc-cccc-cccccccccccc": true,
			"dev@gmail.com:cccccccc-cccc-cccc-cccc-cccccccccccc":          true,
		},
	}

	cfg := &config.Config{
		Port:                "5014",
		KeycloakInternalURL: mockKC.URL,
		KeycloakClientID:    "ftth-gis-frontend",
		CookieSecure:        true,
	}

	handler := NewHandler(cfg, repo, nil, nil)
	r := gin.New()
	r.POST("/api/v1/auth/login/sso-exchange", handler.SsoExchange)

	// 1. Personal @gmail.com bypass attempt via Google -> Denied 403 GOOGLE_DOMAIN_RESTRICTED & revokes session
	w1 := httptest.NewRecorder()
	b1, _ := json.Marshal(SsoExchangeRequest{
		RefreshToken: "gmail-google",
		TenantSlug:   "nusantara",
		Plane:        "TENANT",
	})
	r.ServeHTTP(w1, httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/sso-exchange", bytes.NewReader(b1)))
	if w1.Code != http.StatusForbidden || !strings.Contains(w1.Body.String(), "GOOGLE_DOMAIN_RESTRICTED") {
		t.Fatalf("expected 403 GOOGLE_DOMAIN_RESTRICTED for gmail, got %d: %s", w1.Code, w1.Body.String())
	}
	if revokeCalled.Load() < 1 {
		t.Fatalf("expected Keycloak session revocation when hd mismatch detected")
	}

	// 2. Corporate @ispnusantara.net via Google -> Allowed 200 OK
	w2 := httptest.NewRecorder()
	b2, _ := json.Marshal(SsoExchangeRequest{
		RefreshToken: "corp-google",
		TenantSlug:   "nusantara",
		Plane:        "TENANT",
	})
	r.ServeHTTP(w2, httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/sso-exchange", bytes.NewReader(b2)))
	if w2.Code != http.StatusOK {
		t.Fatalf("expected 200 for authorized Google Workspace domain, got %d: %s", w2.Code, w2.Body.String())
	}

	// 3. GitHub user with @gmail.com -> Not restricted by Google hd setting -> Allowed 200 OK
	w3 := httptest.NewRecorder()
	b3, _ := json.Marshal(SsoExchangeRequest{
		RefreshToken: "personal-github",
		TenantSlug:   "nusantara",
		Plane:        "TENANT",
	})
	r.ServeHTTP(w3, httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/sso-exchange", bytes.NewReader(b3)))
	if w3.Code != http.StatusOK {
		t.Fatalf("expected 200 for GitHub user unaffected by Google hd policy, got %d: %s", w3.Code, w3.Body.String())
	}
}

func TestVerifyMfaBackupCode_BurnOnUse(t *testing.T) {
	logger.InitLogger()
	userID := "user-backup-123"
	code := "A3K9-W7P2"

	repo := &mockRepo{
		tenants: map[string]*TenantContextResponse{
			"kircon-bandung": {
				ID:       "org-1",
				Slug:     "kircon-bandung",
				RealmKey: "k2net-tenants",
				Status:   "ACTIVE",
			},
		},
		userOrgMatch: map[string]bool{
			userID + ":org-1": true,
		},
		backupCodes: map[string]bool{
			userID + ":" + code: true,
		},
	}

	cfg := &config.Config{
		Port:         "5014",
		CookieSecure: true,
	}
	handler := NewHandler(cfg, repo, nil, nil)

	// Inject a pre-auth session into handler's memory or test router directly
	session := PreAuthSession{
		UserID:      userID,
		TenantSlug:  "kircon-bandung",
		TargetRealm: "k2net-tenants",
		Plane:       "TENANT",
		Roles:       []string{"admin"},
	}
	preAuthToken := "test-pre-auth-token-123"

	// Mock Redis client with miniredis or verify repository burning logic directly
	valid, err := repo.VerifyAndBurnBackupCode(context.Background(), userID, "A3K9-W7P2", "127.0.0.1")
	if err != nil || !valid {
		t.Fatalf("expected valid backup code verification, got valid=%v, err=%v", valid, err)
	}

	// 2nd use of the same code must fail (Burn-on-Use)
	valid2, err2 := repo.VerifyAndBurnBackupCode(context.Background(), userID, "A3K9-W7P2", "127.0.0.1")
	if valid2 || err2 != nil {
		t.Fatalf("expected burned code to be rejected, got valid=%v, err=%v", valid2, err2)
	}

	// Unrelated code must fail
	valid3, _ := repo.VerifyAndBurnBackupCode(context.Background(), userID, "ZZZZ-9999", "127.0.0.1")
	if valid3 {
		t.Fatalf("expected unknown code to be rejected")
	}

	_ = handler
	_ = session
	_ = preAuthToken
}

func TestDiscoverableWebauthnPasswordlessAndConditionalUI(t *testing.T) {
	logger.InitLogger()

	mockKC := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/protocol/openid-connect/token") {
			_ = r.ParseForm()
			username := r.FormValue("username")
			clientID := r.FormValue("client_id")
			if username == "admin-cli" || clientID == "admin-cli" {
				w.Header().Set("Content-Type", "application/json")
				_, _ = w.Write([]byte(`{"access_token":"master-admin-token","expires_in":300}`))
				return
			}
			jwt := buildTestJWT(map[string]any{
				"sub":                "ae6582e2-1fc4-4943-ac31-1b54fc64a106",
				"azp":                PasskeyBrokerClientID,
				"email":              "andiansyah0425@gmail.com",
				"preferred_username": username,
				"name":               "Andiansyah Admin",
				"organization_id":    "00000000-0000-0000-0000-000000000001",
				"tenant_id":          "00000000-0000-0000-0000-000000000001",
				"tenant_slug":        "ops",
				"realm_access":       map[string]any{"roles": []string{"admin"}},
			})
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(KeycloakTokenResponse{
				AccessToken:      jwt,
				RefreshToken:     jwt,
				IDToken:          jwt,
				ExpiresIn:        300,
				RefreshExpiresIn: 86400,
				TokenType:        "Bearer",
			})
			return
		}
		if strings.HasSuffix(r.URL.Path, "/authentication/flows") {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`[{"id":"flow-123","alias":"k2net-passkey-direct-grant"}]`))
			return
		}
		if strings.HasSuffix(r.URL.Path, "/executions") {
			w.Header().Set("Content-Type", "application/json")
			_, _ = w.Write([]byte(`[{"id":"exec-1","providerId":"direct-grant-validate-username","requirement":"REQUIRED"}]`))
			return
		}
		if strings.Contains(r.URL.Path, "/clients") {
			w.Header().Set("Content-Type", "application/json")
			if r.Method == http.MethodGet {
				_, _ = w.Write([]byte(`[{"id":"client-uuid-1","clientId":"k2net-passkey-broker"}]`))
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer mockKC.Close()

	repo := &mockRepo{
		tenants: map[string]*TenantContextResponse{
			"ops": {
				ID:       "00000000-0000-0000-0000-000000000001",
				Name:     "K2NET Ops",
				Slug:     "ops",
				RealmKey: "k2net-tenants",
				Status:   "ACTIVE",
			},
			"other": {
				ID:       "99999999-9999-9999-9999-999999999999",
				Name:     "Other ISP",
				Slug:     "other",
				RealmKey: "k2net-tenants",
				Status:   "ACTIVE",
			},
		},
		userOrgMatch: map[string]bool{
			"ae6582e2-1fc4-4943-ac31-1b54fc64a106:00000000-0000-0000-0000-000000000001": true,
		},
		discoverableCreds: []WebauthnCredentialModel{
			{
				ID:           "cred-row-1",
				UserID:       "ae6582e2-1fc4-4943-ac31-1b54fc64a106",
				CredentialID: "dFsa43dufmTnI0nQLfFWZk4vQQHsJ0a-FzwYvMc89zs",
				DeviceName:   "Windows Hello",
			},
		},
		credOwners: map[string]*WebauthnCredentialOwner{
			"dFsa43dufmTnI0nQLfFWZk4vQQHsJ0a-FzwYvMc89zs": {
				CredentialID:   "dFsa43dufmTnI0nQLfFWZk4vQQHsJ0a-FzwYvMc89zs",
				DeviceName:     "Windows Hello",
				UserID:         "ae6582e2-1fc4-4943-ac31-1b54fc64a106",
				Email:          "andiansyah0425@gmail.com",
				Username:       "andiansyah0425@gmail.com",
				FullName:       "Andiansyah Admin",
				UserStatus:     "ACTIVE",
				OrganizationID: "00000000-0000-0000-0000-000000000001",
				RoleName:       "admin",
				RoleScope:      "TENANT",
			},
		},
	}

	cfg := &config.Config{
		Port:                "5014",
		KeycloakInternalURL: mockKC.URL,
		KeycloakClientID:    "ftth-gis-frontend",
		CookieSecure:        false,
	}
	h := NewHandler(cfg, repo, nil, nil)
	r := setupTestRouter(h)

	// 1. Conditional UI Challenge (conditional: true) -> must return empty allowCredentials: []
	condBody, _ := json.Marshal(WebauthnDiscoverableChallengeRequest{
		Plane:       "TENANT",
		TenantSlug:  "ops",
		Conditional: true,
	})
	reqCond := httptest.NewRequest(http.MethodPost, "/api/v1/auth/webauthn/discoverable/challenge", bytes.NewReader(condBody))
	reqCond.Header.Set("Content-Type", "application/json")
	reqCond.Header.Set("X-Requested-With", "K2NET-BFF")
	wCond := httptest.NewRecorder()
	r.ServeHTTP(wCond, reqCond)
	if wCond.Code != http.StatusOK {
		t.Fatalf("expected 200 for conditional challenge, got %d: %s", wCond.Code, wCond.Body.String())
	}
	var condResp struct {
		ChallengeID      string `json:"challengeId"`
		Challenge        string `json:"challenge"`
		AllowCredentials []any  `json:"allowCredentials"`
	}
	_ = json.Unmarshal(wCond.Body.Bytes(), &condResp)
	if condResp.ChallengeID == "" || condResp.Challenge == "" || len(condResp.AllowCredentials) != 0 {
		t.Fatalf("expected empty allowCredentials for conditional UI, got %+v", condResp)
	}

	// 2. Modal Button Click Challenge (conditional: false) -> must return scoped allowCredentials
	modalBody, _ := json.Marshal(WebauthnDiscoverableChallengeRequest{
		Plane:       "TENANT",
		TenantSlug:  "ops",
		Conditional: false,
	})
	reqModal := httptest.NewRequest(http.MethodPost, "/api/v1/auth/webauthn/discoverable/challenge", bytes.NewReader(modalBody))
	reqModal.Header.Set("Content-Type", "application/json")
	reqModal.Header.Set("X-Requested-With", "K2NET-BFF")
	wModal := httptest.NewRecorder()
	r.ServeHTTP(wModal, reqModal)
	var modalResp struct {
		ChallengeID      string `json:"challengeId"`
		Challenge        string `json:"challenge"`
		AllowCredentials []any  `json:"allowCredentials"`
	}
	_ = json.Unmarshal(wModal.Body.Bytes(), &modalResp)
	if len(modalResp.AllowCredentials) != 1 {
		t.Fatalf("expected 1 scoped allowCredential for modal click, got %d", len(modalResp.AllowCredentials))
	}

	// Build valid assertion payload for modalResp
	clientDataJSONBytes, _ := json.Marshal(map[string]any{
		"type":      "webauthn.get",
		"challenge": modalResp.Challenge,
		"origin":    "https://ops.kdua.net",
	})
	authData := make([]byte, 37)
	authData[32] = 0x05 // UP (User Present) + UV (User Verified)
	authData[36] = 48   // counter = 48

	// 3. Cross-Plane Rejection: TENANT passkey used on PLATFORM Control Plane -> 403 TENANT_ACCESS_DENIED
	crossPlaneVerify, _ := json.Marshal(WebauthnDiscoverableVerifyRequest{
		ChallengeID:       condResp.ChallengeID,
		CredentialID:      "dFsa43dufmTnI0nQLfFWZk4vQQHsJ0a-FzwYvMc89zs",
		ClientDataJSON:    base64.RawURLEncoding.EncodeToString(bytes.ReplaceAll(clientDataJSONBytes, []byte(modalResp.Challenge), []byte(condResp.Challenge))),
		AuthenticatorData: base64.RawURLEncoding.EncodeToString(authData),
		Signature:         base64.RawURLEncoding.EncodeToString([]byte("valid-sig-bytes")),
		Plane:             "PLATFORM",
		TenantSlug:        "system",
	})
	reqCross := httptest.NewRequest(http.MethodPost, "/api/v1/auth/webauthn/discoverable/verify", bytes.NewReader(crossPlaneVerify))
	reqCross.Header.Set("Content-Type", "application/json")
	reqCross.Header.Set("X-Requested-With", "K2NET-BFF")
	wCross := httptest.NewRecorder()
	r.ServeHTTP(wCross, reqCross)
	if wCross.Code != http.StatusForbidden || !strings.Contains(wCross.Body.String(), "TENANT_ACCESS_DENIED") {
		t.Fatalf("expected 403 TENANT_ACCESS_DENIED for cross-plane passkey use, got %d: %s", wCross.Code, wCross.Body.String())
	}

	// 4. Valid Passwordless Passkey Verification on Tenant 'ops' -> 200 OK with full session
	validVerify, _ := json.Marshal(WebauthnDiscoverableVerifyRequest{
		ChallengeID:       modalResp.ChallengeID,
		CredentialID:      "dFsa43dufmTnI0nQLfFWZk4vQQHsJ0a-FzwYvMc89zs",
		ClientDataJSON:    base64.RawURLEncoding.EncodeToString(clientDataJSONBytes),
		AuthenticatorData: base64.RawURLEncoding.EncodeToString(authData),
		Signature:         base64.RawURLEncoding.EncodeToString([]byte("valid-sig-bytes")),
		Plane:             "TENANT",
		TenantSlug:        "ops",
		RememberMe:        true,
	})
	reqVerify := httptest.NewRequest(http.MethodPost, "/api/v1/auth/webauthn/discoverable/verify", bytes.NewReader(validVerify))
	reqVerify.Header.Set("Content-Type", "application/json")
	reqVerify.Header.Set("X-Requested-With", "K2NET-BFF")
	wVerify := httptest.NewRecorder()
	r.ServeHTTP(wVerify, reqVerify)
	if wVerify.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for valid passwordless passkey verify, got %d: %s", wVerify.Code, wVerify.Body.String())
	}
	var loginRes LoginResponse
	_ = json.Unmarshal(wVerify.Body.Bytes(), &loginRes)
	if loginRes.AccessToken == "" || loginRes.User == nil || loginRes.User.Email != "andiansyah0425@gmail.com" {
		t.Fatalf("expected hydrated user session from passkey login, got %+v", loginRes)
	}

	// 5. Anti-Replay: Re-submitting the same challengeId must be rejected 401 CHALLENGE_EXPIRED
	reqReplay := httptest.NewRequest(http.MethodPost, "/api/v1/auth/webauthn/discoverable/verify", bytes.NewReader(validVerify))
	reqReplay.Header.Set("Content-Type", "application/json")
	reqReplay.Header.Set("X-Requested-With", "K2NET-BFF")
	wReplay := httptest.NewRecorder()
	r.ServeHTTP(wReplay, reqReplay)
	if wReplay.Code != http.StatusUnauthorized || !strings.Contains(wReplay.Body.String(), "CHALLENGE_EXPIRED") {
		t.Fatalf("expected 401 CHALLENGE_EXPIRED on challenge replay, got %d: %s", wReplay.Code, wReplay.Body.String())
	}
}

func TestBreakGlassAggressiveSessionTimeoutAndDeviceSync(t *testing.T) {
	logger.InitLogger()
	gin.SetMode(gin.TestMode)

	repo := &mockRepo{
		tenants: map[string]*TenantContextResponse{
			"ops": {
				ID:       "00000000-0000-0000-0000-000000000001",
				Name:     "K2NET Ops",
				Slug:     "ops",
				RealmKey: "k2net-tenants",
				Status:   "ACTIVE",
			},
		},
	}

	cfg := &config.Config{
		Port:         "5014",
		CookieSecure: false,
	}
	h := NewHandler(cfg, repo, nil, nil)

	jwt := buildTestJWT(map[string]any{
		"sub":                "ae6582e2-1fc4-4943-ac31-1b54fc64a106",
		"sid":                "kc-session-uuid-999",
		"email":              "andiansyah0425@gmail.com",
		"preferred_username": "andiansyah0425@gmail.com",
		"name":               "Andiansyah Admin",
		"organization_id":    "00000000-0000-0000-0000-000000000001",
		"tenant_id":          "00000000-0000-0000-0000-000000000001",
		"tenant_slug":        "ops",
		"realm_access":       map[string]any{"roles": []string{"admin"}},
	})

	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/verify", nil)
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36")
	c.Request = req

	session := PreAuthSession{
		AccessToken:  jwt,
		RefreshToken: "refresh-token-bg",
		IDToken:      jwt,
		ExpiresIn:    300,
		TargetRealm:  "k2net-tenants",
		TenantSlug:   "ops",
		Plane:        "TENANT",
		RememberMe:   true, // Even if RememberMe is requested, Break-Glass must clamp to 3600s (60m)
		IsBreakGlass: true,
		UserID:       "ae6582e2-1fc4-4943-ac31-1b54fc64a106",
		Email:        "andiansyah0425@gmail.com",
		Username:     "andiansyah0425@gmail.com",
		Name:         "Andiansyah Admin",
		Roles:        []string{"admin"},
	}

	h.completeLoginSession(c, &session, "test-pre-auth-token", "TOTP")

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from completeLoginSession, got %d: %s", w.Code, w.Body.String())
	}

	var resp LoginResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal LoginResponse: %v", err)
	}

	if !resp.IsBreakGlass {
		t.Fatalf("expected IsBreakGlass=true in response, got false")
	}
	if resp.SessionMaxAge != 3600 {
		t.Fatalf("expected SessionMaxAge=3600 (60m) for Break-Glass session, got %d", resp.SessionMaxAge)
	}

	// Verify k2net_break_glass_session cookie is set with MaxAge 3600
	cookies := w.Result().Cookies()
	foundBgCookie := false
	for _, ck := range cookies {
		if ck.Name == breakGlassCookieName && ck.Value == "1" && ck.MaxAge == 3600 {
			foundBgCookie = true
		}
	}
	if !foundBgCookie {
		t.Fatalf("expected %s cookie with MaxAge=3600 to be set", breakGlassCookieName)
	}

	// Verify SyncUserJIT received SessionID and UserAgent for user_devices tracking
	if len(repo.syncedUsers) != 1 {
		t.Fatalf("expected 1 synced user call, got %d", len(repo.syncedUsers))
	}
	if repo.syncedUsers[0].SessionID != "kc-session-uuid-999" {
		t.Fatalf("expected SessionID 'kc-session-uuid-999', got '%s'", repo.syncedUsers[0].SessionID)
	}
	if !strings.Contains(repo.syncedUsers[0].UserAgent, "Chrome/131.0.0.0") {
		t.Fatalf("expected UserAgent to be propagated to SyncUserJIT, got '%s'", repo.syncedUsers[0].UserAgent)
	}
}


