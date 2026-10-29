package config

import (
	"os"
	"strings"
)

const (
	PlatformRealm     = "ftth-realm"
	TenantSharedRealm = "k2net-tenants"
)

// Config holds environment-driven settings for gateway-auth (Port 5014).
type Config struct {
	Port                 string
	DatabaseURL          string
	RedisAddr            string
	KeycloakInternalURL  string
	KeycloakClientID     string
	KeycloakClientSecret string
	BackendInternalURL   string
	AuditGatewayURL      string
	GatewayToken             string
	TurnstileSecretKey       string
	TurnstileTenantSecretKey string
	TurnstileVerifyURL       string
	CookieSecure             bool
}

// LoadConfig reads runtime configuration strictly from environment variables.
func LoadConfig() *Config {
	cookieSecure := true
	if strings.EqualFold(strings.TrimSpace(os.Getenv("COOKIE_SECURE")), "false") {
		cookieSecure = false
	}

	return &Config{
		Port:                 getEnv("PORT", "5014"),
		DatabaseURL:          strings.TrimSpace(os.Getenv("DATABASE_URL")),
		RedisAddr:            getEnv("REDIS_ADDR", "redis:6379"),
		KeycloakInternalURL:  strings.TrimRight(getEnv("KEYCLOAK_INTERNAL_URL", "http://keycloak:8081"), "/"),
		KeycloakClientID:     getEnv("KEYCLOAK_CLIENT_ID", "ftth-gis-frontend"),
		KeycloakClientSecret: strings.TrimSpace(os.Getenv("KEYCLOAK_CLIENT_SECRET")),
		BackendInternalURL:   strings.TrimRight(getEnv("BACKEND_INTERNAL_URL", "http://backend:9090"), "/"),
		AuditGatewayURL:      strings.TrimRight(getEnv("AUDIT_GATEWAY_URL", "http://ftth-audit-gateway:5009"), "/"),
		GatewayToken:             strings.TrimSpace(os.Getenv("GATEWAY_TOKEN")),
		TurnstileSecretKey:       strings.TrimSpace(os.Getenv("TURNSTILE_SECRET_KEY")),
		TurnstileTenantSecretKey: strings.TrimSpace(os.Getenv("TURNSTILE_TENANT_SECRET_KEY")),
		TurnstileVerifyURL:       getEnv("TURNSTILE_VERIFY_URL", "https://challenges.cloudflare.com/turnstile/v0/siteverify"),
		CookieSecure:             cookieSecure,
	}
}

func getEnv(key, fallback string) string {
	if val := strings.TrimSpace(os.Getenv(key)); val != "" {
		return val
	}
	return fallback
}

