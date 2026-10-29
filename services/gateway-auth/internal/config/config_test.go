package config_test

import (
	"os"
	"testing"

	"gateways/gateway-auth/internal/config"
)

func TestLoadConfig_Defaults(t *testing.T) {
	// Clear relevant env vars
	os.Unsetenv("PORT")
	os.Unsetenv("COOKIE_SECURE")
	os.Unsetenv("KEYCLOAK_INTERNAL_URL")
	os.Unsetenv("REDIS_ADDR")

	cfg := config.LoadConfig()

	if cfg.Port != "5014" {
		t.Errorf("expected default port 5014, got %s", cfg.Port)
	}
	if !cfg.CookieSecure {
		t.Errorf("expected default CookieSecure to be true")
	}
	if cfg.KeycloakClientID != "ftth-gis-frontend" {
		t.Errorf("expected KeycloakClientID ftth-gis-frontend, got %s", cfg.KeycloakClientID)
	}
	if cfg.KeycloakInternalURL != "http://keycloak:8081" {
		t.Errorf("expected KeycloakInternalURL http://keycloak:8081, got %s", cfg.KeycloakInternalURL)
	}
	if cfg.RedisAddr != "redis:6379" {
		t.Errorf("expected RedisAddr redis:6379, got %s", cfg.RedisAddr)
	}
}

func TestLoadConfig_Overrides(t *testing.T) {
	os.Setenv("PORT", "5999")
	os.Setenv("COOKIE_SECURE", "false")
	os.Setenv("KEYCLOAK_INTERNAL_URL", "http://kc.custom:8080/")
	os.Setenv("REDIS_ADDR", "custom-redis:6380")
	defer func() {
		os.Unsetenv("PORT")
		os.Unsetenv("COOKIE_SECURE")
		os.Unsetenv("KEYCLOAK_INTERNAL_URL")
		os.Unsetenv("REDIS_ADDR")
	}()

	cfg := config.LoadConfig()

	if cfg.Port != "5999" {
		t.Errorf("expected overridden port 5999, got %s", cfg.Port)
	}
	if cfg.CookieSecure {
		t.Errorf("expected CookieSecure to be false when set to false")
	}
	if cfg.KeycloakInternalURL != "http://kc.custom:8080" {
		t.Errorf("expected trimmed KeycloakInternalURL, got %s", cfg.KeycloakInternalURL)
	}
	if cfg.RedisAddr != "custom-redis:6380" {
		t.Errorf("expected custom-redis:6380, got %s", cfg.RedisAddr)
	}
}

