package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"gateways/gateway-auth/internal/config"
	"github.com/gin-gonic/gin"
)

const (
	networkBindCookieName  = "k2net_net_bind"
	networkBindVersion     = "v1"
	networkBindRedisPrefix = "auth:net-bind:"
)

type networkBindingPayload struct {
	Ver      string `json:"v"`
	Sub      string `json:"sub"`
	Sid      string `json:"sid,omitempty"`
	UAFamily string `json:"ua"`
	Country  string `json:"cc,omitempty"`
	IPPrefix string `json:"ip"`
	IssuedAt int64  `json:"iat"`
}

type networkBindingDecision struct {
	Action          string // "allow" | "backfill" | "soft_ip_drift" | "hard_freeze" | "audit_only"
	Reason          string // "ok" | "legacy_backfill" | "cookie_stripped" | "cookie_invalid_hmac" | "cookie_session_mismatch" | "ua_family_changed" | "country_changed" | "ip_prefix_changed"
	BaselineCountry string
}

func netBindRedisKey(userID, sid string) string {
	cleanUID := strings.TrimSpace(userID)
	cleanSID := strings.TrimSpace(sid)
	if cleanSID == "" {
		return networkBindRedisPrefix + cleanUID
	}
	return networkBindRedisPrefix + cleanUID + ":" + cleanSID
}

func (h *Handler) networkBindingSecret() string {
	if h.cfg != nil {
		if sec := strings.TrimSpace(h.cfg.SessionBindingSecret); sec != "" {
			return sec
		}
		if tok := strings.TrimSpace(h.cfg.GatewayToken); tok != "" {
			return tok
		}
		if kcSec := strings.TrimSpace(h.cfg.KeycloakClientSecret); kcSec != "" {
			return kcSec
		}
	}
	return "k2net-local-net-bind-secret"
}

func (h *Handler) networkBindingMode() string {
	if h.cfg != nil {
		switch strings.ToLower(strings.TrimSpace(h.cfg.SessionBindingMode)) {
		case "strict":
			return "strict"
		case "audit":
			return "audit"
		case "balanced", "":
			return "balanced"
		}
	}
	return "balanced"
}

// normalizeUserAgentFamily extracts coarse browser+OS engine family so minor browser upgrades
// do not cause false session invalidation, while switching device/OS/CLI tools triggers detection.
func normalizeUserAgentFamily(ua string) string {
	low := strings.ToLower(strings.TrimSpace(ua))
	if low == "" {
		return "Unknown|Unknown"
	}

	osFamily := "Other"
	switch {
	case strings.Contains(low, "iphone") || strings.Contains(low, "ipad") || strings.Contains(low, "ipod") || strings.Contains(low, "cpu os"):
		osFamily = "iOS"
	case strings.Contains(low, "android"):
		osFamily = "Android"
	case strings.Contains(low, "cros"):
		osFamily = "ChromeOS"
	case strings.Contains(low, "windows"):
		osFamily = "Windows"
	case strings.Contains(low, "mac os x") || strings.Contains(low, "macintosh") || strings.Contains(low, "macos"):
		osFamily = "macOS"
	case strings.Contains(low, "linux") || strings.Contains(low, "x11"):
		osFamily = "Linux"
	}

	browser := "Other"
	switch {
	case strings.Contains(low, "edg/") || strings.Contains(low, "edge/") || strings.Contains(low, "edgios/") || strings.Contains(low, "edga/"):
		browser = "Edge"
	case strings.Contains(low, "opr/") || strings.Contains(low, "opera"):
		browser = "Opera"
	case strings.Contains(low, "firefox/") || strings.Contains(low, "fxios/"):
		browser = "Firefox"
	case strings.Contains(low, "chrome/") || strings.Contains(low, "crios/") || strings.Contains(low, "chromium/"):
		browser = "Chrome"
	case strings.Contains(low, "safari/"):
		browser = "Safari"
	case strings.Contains(low, "curl/"):
		browser = "Curl"
	case strings.Contains(low, "python") || strings.Contains(low, "httpx"):
		browser = "Python"
	case strings.Contains(low, "go-http-client") || strings.Contains(low, "postman") || strings.Contains(low, "insomnia"):
		browser = "CLI"
	}

	return browser + "|" + osFamily
}

func normalizeCountryCode(raw string) string {
	cc := strings.ToUpper(strings.TrimSpace(raw))
	switch cc {
	case "", "XX", "UNK", "UNKNOWN":
		return ""
	default:
		return cc
	}
}

// extractIPPrefix reduces an IPv4 address to /24 or IPv6 to /48 so same-subnet NAT/carrier rotation stays tolerant.
func extractIPPrefix(rawIP string) string {
	clean := strings.TrimSpace(rawIP)
	if clean == "" {
		return ""
	}
	if host, _, err := net.SplitHostPort(clean); err == nil {
		clean = host
	}
	ip := net.ParseIP(clean)
	if ip == nil {
		return ""
	}
	if v4 := ip.To4(); v4 != nil {
		mask := net.CIDRMask(24, 32)
		return fmt.Sprintf("%s/24", v4.Mask(mask).String())
	}
	v6 := ip.To16()
	if v6 == nil {
		return ""
	}
	mask := net.CIDRMask(48, 128)
	return fmt.Sprintf("%s/48", v6.Mask(mask).String())
}

func hashNetworkSignal(domain, raw string) string {
	clean := strings.TrimSpace(raw)
	if clean == "" {
		return ""
	}
	sum := sha256.Sum256([]byte(domain + ":" + clean))
	return hex.EncodeToString(sum[:8])
}

func computeNetworkBindingHMAC(secret, encodedPayload string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(networkBindVersion + "." + encodedPayload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func signNetworkBinding(secret string, payload networkBindingPayload) (string, error) {
	if strings.TrimSpace(secret) == "" {
		return "", errors.New("empty HMAC secret")
	}
	payload.Ver = networkBindVersion
	rawJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	encoded := base64.RawURLEncoding.EncodeToString(rawJSON)
	sig := computeNetworkBindingHMAC(secret, encoded)
	return networkBindVersion + "." + encoded + "." + sig, nil
}

func verifyNetworkBinding(secret, cookieVal string) (*networkBindingPayload, error) {
	if strings.TrimSpace(secret) == "" {
		return nil, errors.New("empty HMAC secret")
	}
	parts := strings.Split(strings.TrimSpace(cookieVal), ".")
	if len(parts) != 3 || parts[0] != networkBindVersion {
		return nil, errors.New("invalid binding token format")
	}
	expectedSig := computeNetworkBindingHMAC(secret, parts[1])
	if !hmac.Equal([]byte(parts[2]), []byte(expectedSig)) {
		return nil, errors.New("invalid binding signature")
	}
	rawJSON, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("invalid payload encoding")
	}
	var payload networkBindingPayload
	if err := json.Unmarshal(rawJSON, &payload); err != nil {
		return nil, errors.New("invalid payload json")
	}
	if payload.Ver != networkBindVersion || strings.TrimSpace(payload.Sub) == "" {
		return nil, errors.New("incomplete binding payload")
	}
	return &payload, nil
}

func evaluateNetworkBinding(
	mode string,
	secret string,
	cookieVal string,
	redisAnchorRaw string,
	current networkBindingPayload,
) networkBindingDecision {
	cleanMode := strings.ToLower(strings.TrimSpace(mode))
	if cleanMode == "" {
		cleanMode = "balanced"
	}

	rejectOrAudit := func(reason, baselineCountry string) networkBindingDecision {
		if cleanMode == "audit" {
			return networkBindingDecision{
				Action:          "audit_only",
				Reason:          reason,
				BaselineCountry: baselineCountry,
			}
		}
		return networkBindingDecision{
			Action:          "hard_freeze",
			Reason:          reason,
			BaselineCountry: baselineCountry,
		}
	}

	cleanCookie := strings.TrimSpace(cookieVal)
	cleanAnchor := strings.TrimSpace(redisAnchorRaw)

	// Legacy session gracefully backfills when neither cookie nor Redis anchor exists yet.
	if cleanCookie == "" && cleanAnchor == "" {
		return networkBindingDecision{
			Action:          "backfill",
			Reason:          "legacy_backfill",
			BaselineCountry: current.Country,
		}
	}

	// Cookie stripping defense: Redis shadow anchor proves binding was previously issued.
	if cleanCookie == "" && cleanAnchor != "" {
		return rejectOrAudit("cookie_stripped", current.Country)
	}

	parsed, err := verifyNetworkBinding(secret, cleanCookie)
	if err != nil {
		return rejectOrAudit("cookie_invalid_hmac", current.Country)
	}

	baselineCountry := current.Country
	if baselineCountry == "" {
		baselineCountry = parsed.Country
	}

	if strings.TrimSpace(parsed.Sub) != strings.TrimSpace(current.Sub) ||
		(parsed.Sid != "" && current.Sid != "" && parsed.Sid != current.Sid) {
		return rejectOrAudit("cookie_session_mismatch", baselineCountry)
	}

	if parsed.UAFamily != "" && current.UAFamily != "" && parsed.UAFamily != current.UAFamily {
		return rejectOrAudit("ua_family_changed", baselineCountry)
	}

	if parsed.Country != "" && current.Country != "" && parsed.Country != current.Country {
		return rejectOrAudit("country_changed", baselineCountry)
	}

	if parsed.IPPrefix != "" && current.IPPrefix != "" && parsed.IPPrefix != current.IPPrefix {
		switch cleanMode {
		case "strict":
			return networkBindingDecision{
				Action:          "hard_freeze",
				Reason:          "ip_prefix_changed",
				BaselineCountry: baselineCountry,
			}
		case "audit":
			return networkBindingDecision{
				Action:          "audit_only",
				Reason:          "ip_prefix_changed",
				BaselineCountry: baselineCountry,
			}
		default:
			return networkBindingDecision{
				Action:          "soft_ip_drift",
				Reason:          "ip_prefix_changed",
				BaselineCountry: baselineCountry,
			}
		}
	}

	return networkBindingDecision{
		Action:          "allow",
		Reason:          "ok",
		BaselineCountry: baselineCountry,
	}
}

func (h *Handler) buildCurrentNetworkBinding(c *gin.Context, userID, sid string) (networkBindingPayload, map[string]string) {
	uaFamily := normalizeUserAgentFamily(c.Request.UserAgent())
	country := normalizeCountryCode(c.GetHeader("CF-IPCountry"))
	ipPrefix := extractIPPrefix(resolveClientIP(c))

	payload := networkBindingPayload{
		Ver:      networkBindVersion,
		Sub:      strings.TrimSpace(userID),
		Sid:      strings.TrimSpace(sid),
		UAFamily: hashNetworkSignal("ua", uaFamily),
		Country:  country,
		IPPrefix: hashNetworkSignal("ip", ipPrefix),
		IssuedAt: time.Now().UTC().Unix(),
	}
	meta := map[string]string{
		"uaFamily": uaFamily,
		"country":  country,
		"ipPrefix": ipPrefix,
	}
	return payload, meta
}

func (h *Handler) issueNetworkBinding(c *gin.Context, userID, sid string, maxAge int, overrideCountry ...string) {
	cleanUID := strings.TrimSpace(userID)
	if cleanUID == "" {
		return
	}
	payload, _ := h.buildCurrentNetworkBinding(c, cleanUID, sid)
	if len(overrideCountry) > 0 && strings.TrimSpace(overrideCountry[0]) != "" && payload.Country == "" {
		payload.Country = strings.TrimSpace(overrideCountry[0])
	}

	cookieToken, err := signNetworkBinding(h.networkBindingSecret(), payload)
	if err != nil {
		return
	}

	ttlSeconds := maxAge
	if ttlSeconds < 60 {
		ttlSeconds = 86400
	}
	secure := h.isSecureCookie(c)
	http.SetCookie(c.Writer, &http.Cookie{
		Name:     networkBindCookieName,
		Value:    cookieToken,
		Path:     cookiePath,
		MaxAge:   ttlSeconds,
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteStrictMode,
	})

	if store := h.getSudoStore(); store != nil {
		if anchorBytes, err := json.Marshal(payload); err == nil {
			_ = store.Set(c.Request.Context(), netBindRedisKey(cleanUID, sid), string(anchorBytes), time.Duration(ttlSeconds)*time.Second)
		}
	}
}

func (h *Handler) enforceNetworkBindingOnRefresh(
	c *gin.Context,
	targetRealm string,
	claims *JWTClaims,
	sid string,
	refreshToken string,
	maxAge int,
) bool {
	if claims == nil || strings.TrimSpace(claims.Sub) == "" {
		return true
	}

	userID := strings.TrimSpace(claims.Sub)
	currentPayload, rawMeta := h.buildCurrentNetworkBinding(c, userID, sid)
	cookieVal, _ := c.Cookie(networkBindCookieName)

	redisAnchorRaw := ""
	if store := h.getSudoStore(); store != nil {
		if val, err := store.Get(c.Request.Context(), netBindRedisKey(userID, sid)); err == nil {
			redisAnchorRaw = val
		} else if valFallback, errFB := store.Get(c.Request.Context(), "auth:net-bind:"+userID); errFB == nil {
			redisAnchorRaw = valFallback
		}
	}

	decision := evaluateNetworkBinding(
		h.networkBindingMode(),
		h.networkBindingSecret(),
		cookieVal,
		redisAnchorRaw,
		currentPayload,
	)

	auditSlug := resolveAuditSlugForBinding(targetRealm, claims)
	clientIP := resolveClientIP(c)
	rolesJoined := joinRoles(claims.ExtractRoles(h.cfg.KeycloakClientID))

	switch decision.Action {
	case "hard_freeze":
		h.revokeKeycloakSession(c.Request.Context(), targetRealm, refreshToken)
		if store := h.getSudoStore(); store != nil {
			_ = store.Del(
				c.Request.Context(),
				netBindRedisKey(userID, sid),
				sudoRedisKey(userID, sid),
				loginFreshRedisKey(userID, sid),
				"auth:net-bind:"+userID,
				"auth:sudo:"+userID,
				"auth:login-fresh:"+userID,
				"auth:break-glass-exp:"+userID,
			)
		}
		h.clearSessionCookies(c)
		h.emitAudit(c.Request.Context(), auditSlug, userID, rolesJoined, clientIP, "SECURITY_SESSION_HIJACK_DETECTED", map[string]any{
			"severity": "CRITICAL",
			"reason":   decision.Reason,
			"mode":     h.networkBindingMode(),
			"uaFamily": rawMeta["uaFamily"],
			"country":  rawMeta["country"],
			"ipPrefix": rawMeta["ipPrefix"],
			"realm":    targetRealm,
		})
		c.JSON(419, gin.H{
			"status":  419,
			"error":   "SESSION_TERMINATED",
			"code":    "SESSION_NETWORK_ANOMALY",
			"reason":  decision.Reason,
			"message": "Sesi Anda dihentikan demi keamanan karena terdeteksi perubahan perangkat atau negara secara tiba-tiba. Silakan masuk kembali.",
		})
		return false

	case "soft_ip_drift":
		if store := h.getSudoStore(); store != nil {
			_ = store.Del(
				c.Request.Context(),
				sudoRedisKey(userID, sid),
				loginFreshRedisKey(userID, sid),
				"auth:sudo:"+userID,
				"auth:login-fresh:"+userID,
			)
		}
		h.emitAudit(c.Request.Context(), auditSlug, userID, rolesJoined, clientIP, "SECURITY_SESSION_IP_DRIFT", map[string]any{
			"severity":    "WARNING",
			"reason":      decision.Reason,
			"sudoRevoked": true,
			"uaFamily":    rawMeta["uaFamily"],
			"country":     decision.BaselineCountry,
			"ipPrefix":    rawMeta["ipPrefix"],
			"realm":       targetRealm,
		})
		h.issueNetworkBinding(c, userID, sid, maxAge, decision.BaselineCountry)
		return true

	case "audit_only":
		h.emitAudit(c.Request.Context(), auditSlug, userID, rolesJoined, clientIP, "SECURITY_SESSION_ANOMALY_SHADOW", map[string]any{
			"severity": "WARNING",
			"reason":   decision.Reason,
			"uaFamily": rawMeta["uaFamily"],
			"country":  rawMeta["country"],
			"ipPrefix": rawMeta["ipPrefix"],
			"realm":    targetRealm,
		})
		return true

	default:
		// "backfill" or "allow": ensure cookie + anchor stay fresh for rolling sessions
		h.issueNetworkBinding(c, userID, sid, maxAge, decision.BaselineCountry)
		return true
	}
}

func resolveAuditSlugForBinding(targetRealm string, claims *JWTClaims) string {
	if claims != nil && strings.TrimSpace(claims.TenantSlug) != "" {
		return strings.TrimSpace(claims.TenantSlug)
	}
	if targetRealm == config.PlatformRealm {
		return "system"
	}
	return "tenant"
}
