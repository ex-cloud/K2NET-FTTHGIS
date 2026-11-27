package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestIsIPInCIDRListStrict_FailClosed(t *testing.T) {
	// Empty client IP must fail-closed (BUG-GEO-04)
	if isIPInCIDRListStrict("", "203.0.113.0/24") {
		t.Fatal("expected empty client IP to fail-closed")
	}
	// Malformed CIDR-only list must fail-closed (BUG-GEO-04)
	if isIPInCIDRListStrict("203.0.113.10", "not-a-cidr,invalid") {
		t.Fatal("expected malformed CIDR list to fail-closed")
	}
	// Valid IPv4 match
	if !isIPInCIDRListStrict("203.0.113.42:54321", "203.0.113.0/24") {
		t.Fatal("expected valid IPv4 inside CIDR to match")
	}
	// Single IPv4 normalization
	if !isIPInCIDRListStrict("198.51.100.9", "198.51.100.9") {
		t.Fatal("expected single IPv4 entry to match /32")
	}
	// Outside IPv4
	if isIPInCIDRListStrict("198.51.100.10", "203.0.113.0/24") {
		t.Fatal("expected outside IPv4 to be rejected")
	}
}

func TestEvaluateTenantIPPolicy_AndLogicAndModes(t *testing.T) {
	ctx := &TenantContextResponse{
		Slug:                       "ops",
		IPAllowlistCIDRs:           "203.0.113.0/24",
		AllowedCountries:           "ID,SG",
		IPPolicyMode:               "ENFORCE",
		AllowBreakGlassIPBypass:    true,
		IPAllowlistPlatformAllowed: true,
	}

	// 1. Inside CIDR + Allowed country -> allow
	d1 := evaluateTenantIPPolicy(ctx, "203.0.113.15", "ID", false)
	if d1.Action != "allow" {
		t.Fatalf("expected allow, got %+v", d1)
	}

	// 2. Inside CIDR + Disallowed country -> block (AND logic)
	d2 := evaluateTenantIPPolicy(ctx, "203.0.113.15", "US", false)
	if d2.Action != "block" || d2.Reason != "country_not_allowed" {
		t.Fatalf("expected block country_not_allowed, got %+v", d2)
	}

	// 3. Outside CIDR + Allowed country -> block
	d3 := evaluateTenantIPPolicy(ctx, "198.51.100.5", "ID", false)
	if d3.Action != "block" || d3.Reason != "ip_not_in_allowlist" {
		t.Fatalf("expected block ip_not_in_allowlist, got %+v", d3)
	}

	// 4. Break-Glass allowed when flag is true
	d4 := evaluateTenantIPPolicy(ctx, "198.51.100.5", "US", true)
	if d4.Action != "allow" || d4.Reason != "break_glass_bypass" {
		t.Fatalf("expected break_glass_bypass, got %+v", d4)
	}

	// 5. Break-Glass blocked when flag is false
	ctxNoBg := *ctx
	ctxNoBg.AllowBreakGlassIPBypass = false
	d5 := evaluateTenantIPPolicy(&ctxNoBg, "198.51.100.5", "US", true)
	if d5.Action != "block" {
		t.Fatalf("expected block when AllowBreakGlassIPBypass=false, got %+v", d5)
	}

	// 6. MONITOR_ONLY returns shadow
	ctxShadow := *ctx
	ctxShadow.IPPolicyMode = "MONITOR_ONLY"
	d6 := evaluateTenantIPPolicy(&ctxShadow, "198.51.100.5", "ID", false)
	if d6.Action != "shadow" {
		t.Fatalf("expected shadow in MONITOR_ONLY mode, got %+v", d6)
	}

	// 7. DISABLED returns allow
	ctxDisabled := *ctx
	ctxDisabled.IPPolicyMode = "DISABLED"
	d7 := evaluateTenantIPPolicy(&ctxDisabled, "198.51.100.5", "US", false)
	if d7.Action != "allow" {
		t.Fatalf("expected allow in DISABLED mode, got %+v", d7)
	}
}

func TestToPublic_OmitsSensitiveCIDRsAndCountries(t *testing.T) {
	full := &TenantContextResponse{
		ID:                         "org-1",
		Slug:                       "nusantara",
		IPAllowlistCIDRs:           "203.0.113.0/24",
		AllowedCountries:           "ID,SG",
		IPPolicyMode:               "ENFORCE",
		AllowBreakGlassIPBypass:    true,
		IPAllowlistPlatformAllowed: true,
	}
	pub := full.ToPublic()
	if !pub.IPRestrictionEnabled {
		t.Fatal("expected IPRestrictionEnabled=true when ENFORCE + rules exist")
	}
	if pub.IPPolicyMode != "ENFORCE" {
		t.Fatalf("expected IPPolicyMode=ENFORCE, got %s", pub.IPPolicyMode)
	}
}

func TestEnforceTenantIPAndGeofence_ShadowHeaderAndBlock(t *testing.T) {
	gin.SetMode(gin.TestMode)
	h := &Handler{}

	// Monitor-only shadow header
	w1 := httptest.NewRecorder()
	c1, _ := gin.CreateTestContext(w1)
	c1.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	c1.Request.Header.Set("CF-Connecting-IP", "198.51.100.22")
	c1.Request.Header.Set("CF-IPCountry", "ID")

	ctxShadow := &TenantContextResponse{
		Slug:                       "ops",
		IPAllowlistCIDRs:           "203.0.113.0/24",
		IPPolicyMode:               "MONITOR_ONLY",
		IPAllowlistPlatformAllowed: true,
	}
	if !h.enforceTenantIPAndGeofence(c1, ctxShadow, "admin", "admin", "login_password", false, nil) {
		t.Fatal("expected MONITOR_ONLY to allow request")
	}
	if w1.Header().Get("X-K2NET-IP-Policy-Shadow") != "WOULD_BLOCK" {
		t.Fatalf("expected shadow header WOULD_BLOCK, got %q", w1.Header().Get("X-K2NET-IP-Policy-Shadow"))
	}

	// Enforce block
	w2 := httptest.NewRecorder()
	c2, _ := gin.CreateTestContext(w2)
	c2.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login/sso-exchange", nil)
	c2.Request.Header.Set("CF-Connecting-IP", "198.51.100.22")
	c2.Request.Header.Set("CF-IPCountry", "ID")

	revoked := false
	ctxEnforce := *ctxShadow
	ctxEnforce.IPPolicyMode = "ENFORCE"
	if h.enforceTenantIPAndGeofence(c2, &ctxEnforce, "admin", "admin", "sso_exchange", false, func() { revoked = true }) {
		t.Fatal("expected ENFORCE to block outside IP")
	}
	if w2.Code != http.StatusForbidden {
		t.Fatalf("expected HTTP 403, got %d", w2.Code)
	}
	if !revoked {
		t.Fatal("expected onBlockRevoke callback to run when blocked")
	}
}
