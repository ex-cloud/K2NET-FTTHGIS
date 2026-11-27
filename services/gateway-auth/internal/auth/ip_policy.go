package auth

import (
	"net"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

type ipPolicyDecision struct {
	Action string // "allow" | "shadow" | "block"
	Reason string
}

func cleanClientIPString(raw string) string {
	clean := strings.TrimSpace(raw)
	if clean == "" {
		return ""
	}
	if host, _, err := net.SplitHostPort(clean); err == nil {
		clean = host
	}
	clean = strings.TrimPrefix(strings.TrimSuffix(clean, "]"), "[")
	return clean
}

// isIPInCIDRListStrict evaluates IP membership strictly (fail-closed on empty/invalid IP or 0 valid CIDRs).
func isIPInCIDRListStrict(clientIPStr string, cidrListStr string) bool {
	cleanIP := cleanClientIPString(clientIPStr)
	if cleanIP == "" {
		return false
	}
	clientIP := net.ParseIP(cleanIP)
	if clientIP == nil {
		return false
	}

	rawTokens := strings.FieldsFunc(cidrListStr, func(r rune) bool {
		return r == ',' || r == '\n' || r == '\r' || r == ';' || r == ' ' || r == '\t'
	})

	validCIDRsCount := 0
	for _, token := range rawTokens {
		token = strings.TrimSpace(token)
		if token == "" {
			continue
		}
		if !strings.Contains(token, "/") {
			parsed := net.ParseIP(token)
			if parsed == nil {
				continue
			}
			if parsed.To4() != nil {
				token = token + "/32"
			} else {
				token = token + "/128"
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
		return false
	}
	return false
}

func parseCountriesList(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	tokens := strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || r == '\n' || r == '\r' || r == ';' || r == ' ' || r == '\t'
	})
	seen := make(map[string]struct{}, len(tokens))
	var out []string
	for _, tok := range tokens {
		cc := normalizeCountryCode(tok)
		if len(cc) != 2 {
			continue
		}
		if _, ok := seen[cc]; !ok {
			seen[cc] = struct{}{}
			out = append(out, cc)
		}
	}
	return out
}

func containsCountry(allowed []string, cc string) bool {
	for _, item := range allowed {
		if strings.EqualFold(item, cc) {
			return true
		}
	}
	return false
}

func evaluateTenantIPPolicy(
	tenantCtx *TenantContextResponse,
	clientIP string,
	country string,
	isBreakGlass bool,
) ipPolicyDecision {
	if tenantCtx == nil {
		return ipPolicyDecision{Action: "allow", Reason: "no_tenant_context"}
	}
	if !tenantCtx.IPAllowlistPlatformAllowed {
		return ipPolicyDecision{Action: "allow", Reason: "platform_disabled"}
	}
	mode := strings.ToUpper(strings.TrimSpace(tenantCtx.IPPolicyMode))
	if mode == "" {
		mode = "ENFORCE"
	}
	if mode == "DISABLED" {
		return ipPolicyDecision{Action: "allow", Reason: "policy_disabled"}
	}

	hasCIDR := strings.TrimSpace(tenantCtx.IPAllowlistCIDRs) != ""
	countries := parseCountriesList(tenantCtx.AllowedCountries)
	hasCountries := len(countries) > 0
	if !hasCIDR && !hasCountries {
		return ipPolicyDecision{Action: "allow", Reason: "no_rules_configured"}
	}

	if isBreakGlass && tenantCtx.AllowBreakGlassIPBypass {
		return ipPolicyDecision{Action: "allow", Reason: "break_glass_bypass"}
	}

	violationReason := ""
	if hasCIDR && !isIPInCIDRListStrict(clientIP, tenantCtx.IPAllowlistCIDRs) {
		violationReason = "ip_not_in_allowlist"
	} else if hasCountries {
		normCC := normalizeCountryCode(country)
		if normCC != "" && !containsCountry(countries, normCC) {
			violationReason = "country_not_allowed"
		}
	}

	if violationReason == "" {
		return ipPolicyDecision{Action: "allow", Reason: "allowed"}
	}
	if mode == "MONITOR_ONLY" {
		return ipPolicyDecision{Action: "shadow", Reason: violationReason}
	}
	return ipPolicyDecision{Action: "block", Reason: violationReason}
}

func (h *Handler) enforceTenantIPAndGeofence(
	c *gin.Context,
	tenantCtx *TenantContextResponse,
	actor string,
	role string,
	entrypoint string,
	isBreakGlass bool,
	onBlockRevoke func(),
) bool {
	if tenantCtx == nil {
		return true
	}
	auditSlug := tenantCtx.Slug
	if tenantCtx.TargetSlug != "" {
		auditSlug = tenantCtx.TargetSlug
	}
	clientIP := resolveClientIP(c)
	country := normalizeCountryCode(c.GetHeader("CF-IPCountry"))

	decision := evaluateTenantIPPolicy(tenantCtx, clientIP, country, isBreakGlass)
	switch decision.Action {
	case "shadow":
		c.Header("X-K2NET-IP-Policy-Shadow", "WOULD_BLOCK")
		h.emitAudit(c.Request.Context(), auditSlug, actor, role, clientIP, "SECURITY_IP_POLICY_SHADOW_HIT", map[string]any{
			"severity":   "WARNING",
			"reason":     decision.Reason,
			"clientIP":   clientIP,
			"country":    country,
			"entrypoint": entrypoint,
		})
		return true

	case "block":
		if onBlockRevoke != nil {
			onBlockRevoke()
		}
		h.emitAudit(c.Request.Context(), auditSlug, actor, role, clientIP, "SECURITY_IP_POLICY_BLOCKED", map[string]any{
			"severity":   "CRITICAL",
			"reason":     decision.Reason,
			"clientIP":   clientIP,
			"country":    country,
			"entrypoint": entrypoint,
		})

		msg := "Akses ditolak: Alamat IP perangkat Anda tidak terdaftar dalam daftar IP yang diizinkan organisasi."
		if decision.Reason == "country_not_allowed" {
			msg = "Akses ditolak: Negara asal koneksi perangkat Anda tidak termasuk dalam daftar geofencing organisasi."
		}

		httpStatus := http.StatusForbidden
		if entrypoint == "token_refresh" {
			httpStatus = 419
		}
		c.JSON(httpStatus, gin.H{
			"status":   httpStatus,
			"error":    "IP_NOT_ALLOWED",
			"code":     "TENANT_IP_GEOFENCE_DENIED",
			"reason":   decision.Reason,
			"clientIp": clientIP,
			"country":  country,
			"message":  msg,
		})
		return false

	default:
		return true
	}
}
