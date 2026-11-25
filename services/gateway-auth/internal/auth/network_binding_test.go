package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"gateways/gateway-auth/internal/config"
	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
)

func TestNormalizeUserAgentFamily(t *testing.T) {
	cases := []struct {
		name string
		ua   string
		want string
	}{
		{
			name: "Chrome Windows v131",
			ua:   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
			want: "Chrome|Windows",
		},
		{
			name: "Chrome Windows v132 minor update invariant",
			ua:   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.12.99 Safari/537.36",
			want: "Chrome|Windows",
		},
		{
			name: "Edge Windows distinct from Chrome",
			ua:   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
			want: "Edge|Windows",
		},
		{
			name: "Firefox Linux",
			ua:   "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
			want: "Firefox|Linux",
		},
		{
			name: "Safari iOS (iPhone before macOS check)",
			ua:   "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
			want: "Safari|iOS",
		},
		{
			name: "Chrome Android",
			ua:   "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
			want: "Chrome|Android",
		},
		{
			name: "Safari macOS",
			ua:   "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
			want: "Safari|macOS",
		},
		{
			name: "Curl attacker CLI",
			ua:   "curl/8.5.0",
			want: "Curl|Other",
		},
		{
			name: "Python requests",
			ua:   "python-requests/2.32.3",
			want: "Python|Other",
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := normalizeUserAgentFamily(tc.ua); got != tc.want {
				t.Fatalf("normalizeUserAgentFamily(%q) = %q, want %q", tc.ua, got, tc.want)
			}
		})
	}
}

func TestExtractIPPrefix(t *testing.T) {
	if got := extractIPPrefix("103.145.22.87"); got != "103.145.22.0/24" {
		t.Fatalf("IPv4 prefix = %q, want 103.145.22.0/24", got)
	}
	if got := extractIPPrefix("103.145.22.199:54321"); got != "103.145.22.0/24" {
		t.Fatalf("IPv4:port prefix = %q, want 103.145.22.0/24", got)
	}
	if got := extractIPPrefix("2001:db8:abcd:0012::42"); got != "2001:db8:abcd::/48" {
		t.Fatalf("IPv6 prefix = %q, want 2001:db8:abcd::/48", got)
	}
}

func TestSignAndVerifyNetworkBinding(t *testing.T) {
	secret := "super-secret-binding-key"
	payload := networkBindingPayload{
		Sub:      "user-1",
		Sid:      "sid-1",
		UAFamily: hashNetworkSignal("ua", "Chrome|Windows"),
		Country:  "ID",
		IPPrefix: hashNetworkSignal("ip", "103.10.20.0/24"),
		IssuedAt: time.Now().UTC().Unix(),
	}

	tok, err := signNetworkBinding(secret, payload)
	if err != nil {
		t.Fatalf("signNetworkBinding failed: %v", err)
	}

	verified, err := verifyNetworkBinding(secret, tok)
	if err != nil {
		t.Fatalf("verifyNetworkBinding failed: %v", err)
	}
	if verified.Sub != "user-1" || verified.Sid != "sid-1" || verified.Country != "ID" {
		t.Fatalf("unexpected verified payload: %+v", verified)
	}

	if _, err := verifyNetworkBinding("wrong-secret", tok); err == nil {
		t.Fatal("expected wrong secret to fail HMAC verification")
	}

	tampered := tok[:len(tok)-2] + "aa"
	if _, err := verifyNetworkBinding(secret, tampered); err == nil {
		t.Fatal("expected tampered signature to fail HMAC verification")
	}
}

func TestEvaluateNetworkBinding_Balanced_AllScenarios(t *testing.T) {
	secret := "binding-secret-123"
	baseline := networkBindingPayload{
		Sub:      "user-1",
		Sid:      "sid-1",
		UAFamily: hashNetworkSignal("ua", "Chrome|Windows"),
		Country:  "ID",
		IPPrefix: hashNetworkSignal("ip", "114.10.20.0/24"),
		IssuedAt: 1700000000,
	}
	signedCookie, err := signNetworkBinding(secret, baseline)
	if err != nil {
		t.Fatalf("signNetworkBinding error: %v", err)
	}
	anchorJSON, _ := json.Marshal(baseline)

	t.Run("legacy backfill when neither cookie nor Redis anchor exist", func(t *testing.T) {
		dec := evaluateNetworkBinding("balanced", secret, "", "", baseline)
		if dec.Action != "backfill" || dec.Reason != "legacy_backfill" {
			t.Fatalf("got %+v, want backfill/legacy_backfill", dec)
		}
	})

	t.Run("exact match allows smoothly", func(t *testing.T) {
		dec := evaluateNetworkBinding("balanced", secret, signedCookie, string(anchorJSON), baseline)
		if dec.Action != "allow" || dec.Reason != "ok" {
			t.Fatalf("got %+v, want allow/ok", dec)
		}
	})

	t.Run("cookie stripped while Redis anchor exists triggers hard_freeze", func(t *testing.T) {
		dec := evaluateNetworkBinding("balanced", secret, "", string(anchorJSON), baseline)
		if dec.Action != "hard_freeze" || dec.Reason != "cookie_stripped" {
			t.Fatalf("got %+v, want hard_freeze/cookie_stripped", dec)
		}
	})

	t.Run("invalid HMAC triggers hard_freeze", func(t *testing.T) {
		dec := evaluateNetworkBinding("balanced", secret, "v1.Zm9v.YmFy", string(anchorJSON), baseline)
		if dec.Action != "hard_freeze" || dec.Reason != "cookie_invalid_hmac" {
			t.Fatalf("got %+v, want hard_freeze/cookie_invalid_hmac", dec)
		}
	})

	t.Run("session sid mismatch triggers hard_freeze", func(t *testing.T) {
		otherSid := baseline
		otherSid.Sid = "sid-victim-2"
		dec := evaluateNetworkBinding("balanced", secret, signedCookie, string(anchorJSON), otherSid)
		if dec.Action != "hard_freeze" || dec.Reason != "cookie_session_mismatch" {
			t.Fatalf("got %+v, want hard_freeze/cookie_session_mismatch", dec)
		}
	})

	t.Run("UA family change (Chrome Windows -> Curl) triggers hard_freeze", func(t *testing.T) {
		attackerUA := baseline
		attackerUA.UAFamily = hashNetworkSignal("ua", "Curl|Other")
		dec := evaluateNetworkBinding("balanced", secret, signedCookie, string(anchorJSON), attackerUA)
		if dec.Action != "hard_freeze" || dec.Reason != "ua_family_changed" {
			t.Fatalf("got %+v, want hard_freeze/ua_family_changed", dec)
		}
	})

	t.Run("cross-country jump (ID -> US) triggers hard_freeze", func(t *testing.T) {
		foreign := baseline
		foreign.Country = "US"
		dec := evaluateNetworkBinding("balanced", secret, signedCookie, string(anchorJSON), foreign)
		if dec.Action != "hard_freeze" || dec.Reason != "country_changed" {
			t.Fatalf("got %+v, want hard_freeze/country_changed", dec)
		}
	})

	t.Run("same-country IP /24 drift triggers soft_ip_drift and preserves baseline country", func(t *testing.T) {
		cellular := baseline
		cellular.Country = "" // simulate internal hop without CF-IPCountry header
		cellular.IPPrefix = hashNetworkSignal("ip", "182.1.88.0/24")
		dec := evaluateNetworkBinding("balanced", secret, signedCookie, string(anchorJSON), cellular)
		if dec.Action != "soft_ip_drift" || dec.Reason != "ip_prefix_changed" {
			t.Fatalf("got %+v, want soft_ip_drift/ip_prefix_changed", dec)
		}
		if dec.BaselineCountry != "ID" {
			t.Fatalf("expected preserved BaselineCountry ID, got %q", dec.BaselineCountry)
		}
	})
}

func TestEvaluateNetworkBinding_StrictAndAuditModes(t *testing.T) {
	secret := "binding-secret-456"
	baseline := networkBindingPayload{
		Sub:      "user-2",
		Sid:      "sid-2",
		UAFamily: hashNetworkSignal("ua", "Chrome|Windows"),
		Country:  "ID",
		IPPrefix: hashNetworkSignal("ip", "114.10.20.0/24"),
	}
	signedCookie, _ := signNetworkBinding(secret, baseline)
	anchorJSON, _ := json.Marshal(baseline)

	drift := baseline
	drift.IPPrefix = hashNetworkSignal("ip", "182.1.99.0/24")

	strictDec := evaluateNetworkBinding("strict", secret, signedCookie, string(anchorJSON), drift)
	if strictDec.Action != "hard_freeze" || strictDec.Reason != "ip_prefix_changed" {
		t.Fatalf("strict mode got %+v, want hard_freeze/ip_prefix_changed", strictDec)
	}

	auditDec := evaluateNetworkBinding("audit", secret, signedCookie, string(anchorJSON), drift)
	if auditDec.Action != "audit_only" || auditDec.Reason != "ip_prefix_changed" {
		t.Fatalf("audit mode got %+v, want audit_only/ip_prefix_changed", auditDec)
	}

	auditCountry := baseline
	auditCountry.Country = "SG"
	auditCountryDec := evaluateNetworkBinding("audit", secret, signedCookie, string(anchorJSON), auditCountry)
	if auditCountryDec.Action != "audit_only" || auditCountryDec.Reason != "country_changed" {
		t.Fatalf("audit country jump got %+v, want audit_only/country_changed", auditCountryDec)
	}
}

func TestEnforceNetworkBindingOnRefresh_EndToEndHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	logger.InitLogger()

	kcRevoked := false
	kcSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.Contains(r.URL.Path, "/protocol/openid-connect/logout") {
			kcRevoked = true
		}
		w.WriteHeader(http.StatusNoContent)
	}))
	defer kcSrv.Close()

	store := newMemorySudoStore()
	h := &Handler{
		cfg: &config.Config{
			KeycloakInternalURL:  kcSrv.URL,
			KeycloakClientID:     "ftth-gis-frontend",
			CookieSecure:         true,
			SessionBindingMode:   "balanced",
			SessionBindingSecret: "test-hmac-secret-key",
		},
		httpClient: kcSrv.Client(),
		sudoStore:  store,
	}

	userID := "user-123"
	sid := "sid-abc"
	claims := &JWTClaims{Sub: userID, Sid: sid, TenantSlug: "ops"}

	// Seed Sudo Mode + Fresh Login Grace keys
	_ = store.Set(context.Background(), sudoRedisKey(userID, sid), "totp", 15*time.Minute)
	_ = store.Set(context.Background(), loginFreshRedisKey(userID, sid), "1", 15*time.Minute)

	// 1. Issue initial binding at Chrome Windows + ID + 114.10.20.15
	wInit := httptest.NewRecorder()
	cInit, _ := gin.CreateTestContext(wInit)
	cInit.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	cInit.Request.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0 Safari/537.36")
	cInit.Request.Header.Set("CF-Connecting-IP", "114.10.20.15")
	cInit.Request.Header.Set("CF-IPCountry", "ID")
	h.issueNetworkBinding(cInit, userID, sid, 86400)

	initialCookies := wInit.Result().Cookies()
	var bindCookie *http.Cookie
	for _, ck := range initialCookies {
		if ck.Name == networkBindCookieName {
			bindCookie = ck
			break
		}
	}
	if bindCookie == nil || !bindCookie.HttpOnly || !bindCookie.Secure {
		t.Fatalf("expected secure HttpOnly %s cookie, got %+v", networkBindCookieName, bindCookie)
	}

	// 2. Simulate same-country IP /24 drift (Wi-Fi -> 4G ID) -> should keep session alive AND revoke Sudo keys!
	wDrift := httptest.NewRecorder()
	cDrift, _ := gin.CreateTestContext(wDrift)
	cDrift.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	cDrift.Request.AddCookie(bindCookie)
	cDrift.Request.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/132.0.0.0 Safari/537.36")
	cDrift.Request.Header.Set("CF-Connecting-IP", "182.1.55.99")
	cDrift.Request.Header.Set("CF-IPCountry", "ID")

	if ok := h.enforceNetworkBindingOnRefresh(cDrift, config.TenantSharedRealm, claims, sid, "rt-1", 86400); !ok {
		t.Fatal("expected same-country /24 IP drift in balanced mode to keep session alive")
	}

	if _, err := store.Get(context.Background(), sudoRedisKey(userID, sid)); err == nil {
		t.Fatal("expected sudo key to be revoked after same-country IP drift")
	}
	if _, err := store.Get(context.Background(), loginFreshRedisKey(userID, sid)); err == nil {
		t.Fatal("expected fresh-login grace key to be revoked after same-country IP drift")
	}

	var rotatedCookie *http.Cookie
	for _, ck := range wDrift.Result().Cookies() {
		if ck.Name == networkBindCookieName {
			rotatedCookie = ck
		}
	}
	if rotatedCookie == nil || rotatedCookie.Value == "" {
		t.Fatal("expected rotated k2net_net_bind cookie after IP drift")
	}

	// 3. Simulate cross-country hijack jump (ID -> US) -> must return HTTP 419 SESSION_NETWORK_ANOMALY and wipe cookies + anchor
	wHijack := httptest.NewRecorder()
	cHijack, _ := gin.CreateTestContext(wHijack)
	cHijack.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", nil)
	cHijack.Request.AddCookie(rotatedCookie)
	cHijack.Request.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/132.0.0.0 Safari/537.36")
	cHijack.Request.Header.Set("CF-Connecting-IP", "44.201.10.22")
	cHijack.Request.Header.Set("CF-IPCountry", "US")

	if ok := h.enforceNetworkBindingOnRefresh(cHijack, config.TenantSharedRealm, claims, sid, "rt-1", 86400); ok {
		t.Fatal("expected cross-country jump to hard-freeze session")
	}
	if wHijack.Code != 419 {
		t.Fatalf("expected HTTP 419, got %d", wHijack.Code)
	}
	if !strings.Contains(wHijack.Body.String(), "SESSION_NETWORK_ANOMALY") {
		t.Fatalf("expected SESSION_NETWORK_ANOMALY code in response body, got %s", wHijack.Body.String())
	}
	if _, err := store.Get(context.Background(), netBindRedisKey(userID, sid)); err == nil {
		t.Fatal("expected net-bind Redis anchor to be deleted after hard freeze")
	}
	if !kcRevoked {
		t.Fatal("expected Keycloak session logout endpoint to be called on hard freeze")
	}
}
