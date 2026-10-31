package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"gateways/shared/logger"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

// KeycloakAdminClient performs administrative user management in Keycloak
type KeycloakAdminClient struct {
	baseURL    string
	username   string
	password   string
	httpClient *http.Client
	rdb        *redis.Client
}

// NewKeycloakAdminClient creates a new KeycloakAdminClient instance
func NewKeycloakAdminClient(baseURL, username, password string, rdb *redis.Client) *KeycloakAdminClient {
	if username == "" {
		username = "k2net-master-admin"
	}
	if password == "" {
		password = "3pHx9nTw4v5Q2zYrS"
	}
	return &KeycloakAdminClient{
		baseURL:    strings.TrimRight(baseURL, "/"),
		username:   username,
		password:   password,
		httpClient: &http.Client{Timeout: 10 * time.Second},
		rdb:        rdb,
	}
}

// getAdminToken retrieves an OAuth2 access token for master realm admin-cli
func (k *KeycloakAdminClient) getAdminToken(ctx context.Context) (string, error) {
	cacheKey := "keycloak:master:admin_token"
	if k.rdb != nil {
		if token, err := k.rdb.Get(ctx, cacheKey).Result(); err == nil && token != "" {
			return token, nil
		}
	}

	tokenURL := fmt.Sprintf("%s/realms/master/protocol/openid-connect/token", k.baseURL)
	form := url.Values{}
	form.Set("grant_type", "password")
	form.Set("client_id", "admin-cli")
	form.Set("username", k.username)
	form.Set("password", k.password)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("keycloak token endpoint unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return "", fmt.Errorf("failed to obtain master admin token (HTTP %d): %s", resp.StatusCode, string(body))
	}

	var parsed struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return "", err
	}

	if k.rdb != nil && parsed.AccessToken != "" {
		ttl := time.Duration(parsed.ExpiresIn-10) * time.Second
		if ttl > 0 {
			_ = k.rdb.Set(ctx, cacheKey, parsed.AccessToken, ttl).Err()
		}
	}

	return parsed.AccessToken, nil
}

// SetUserPassword updates a user's password in Keycloak
func (k *KeycloakAdminClient) SetUserPassword(ctx context.Context, realm, userID, newPassword string) error {
	adminToken, err := k.getAdminToken(ctx)
	if err != nil {
		return err
	}

	resetURL := fmt.Sprintf("%s/admin/realms/%s/users/%s/reset-password",
		k.baseURL, url.PathEscape(realm), url.PathEscape(userID))

	payload := map[string]any{
		"type":      "password",
		"value":     newPassword,
		"temporary": false,
	}
	jsonBody, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, resetURL, bytes.NewReader(jsonBody))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+adminToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed calling reset-password endpoint: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("keycloak reset-password failed (HTTP %d): %s", resp.StatusCode, string(body))
	}

	logger.Info(ctx, "Keycloak user password successfully updated via Admin API",
		zap.String("realm", realm),
		zap.String("userId", userID))
	return nil
}

// SetUserEmailVerified sets the emailVerified attribute of a Keycloak user
func (k *KeycloakAdminClient) SetUserEmailVerified(ctx context.Context, realm, userID string, verified bool) error {
	adminToken, err := k.getAdminToken(ctx)
	if err != nil {
		return err
	}

	updateURL := fmt.Sprintf("%s/admin/realms/%s/users/%s",
		k.baseURL, url.PathEscape(realm), url.PathEscape(userID))

	payload := map[string]any{
		"emailVerified": verified,
	}
	jsonBody, _ := json.Marshal(payload)

	req, err := http.NewRequestWithContext(ctx, http.MethodPut, updateURL, bytes.NewReader(jsonBody))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+adminToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed calling user update endpoint: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("keycloak user update failed (HTTP %d): %s", resp.StatusCode, string(body))
	}

	logger.Info(ctx, "Keycloak user emailVerified flag updated",
		zap.String("realm", realm),
		zap.String("userId", userID),
		zap.Bool("emailVerified", verified))
	return nil
}

// LogoutUserSessions terminates all active Keycloak sessions for a user
func (k *KeycloakAdminClient) LogoutUserSessions(ctx context.Context, realm, userID string) error {
	adminToken, err := k.getAdminToken(ctx)
	if err != nil {
		return err
	}

	logoutURL := fmt.Sprintf("%s/admin/realms/%s/users/%s/logout",
		k.baseURL, url.PathEscape(realm), url.PathEscape(userID))

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, logoutURL, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed calling user logout endpoint: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("keycloak user logout failed (HTTP %d): %s", resp.StatusCode, string(body))
	}

	logger.Info(ctx, "Keycloak user sessions revoked",
		zap.String("realm", realm),
		zap.String("userId", userID))
	return nil
}
