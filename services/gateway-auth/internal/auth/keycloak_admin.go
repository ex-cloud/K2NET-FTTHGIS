package auth

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"encoding/base32"
	"encoding/binary"
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

// GetUserTOTPConfig fetches the user's k2net_totp_enabled and k2net_totp_secret attributes from Keycloak.
func (k *KeycloakAdminClient) GetUserTOTPConfig(ctx context.Context, realm, userID string) (bool, string, error) {
	totpEnabled, secret, _, err := k.GetUserMFAConfig(ctx, realm, userID)
	return totpEnabled, secret, err
}

// GetUserMFAConfig fetches the user's k2net_totp_enabled, k2net_totp_secret, and k2net_email_otp_enabled attributes from Keycloak.
func (k *KeycloakAdminClient) GetUserMFAConfig(ctx context.Context, realm, userID string) (bool, string, bool, error) {
	if k == nil || k.baseURL == "" || userID == "" {
		return false, "", false, nil
	}
	adminToken, err := k.getAdminToken(ctx)
	if err != nil {
		return false, "", false, err
	}

	userURL := fmt.Sprintf("%s/admin/realms/%s/users/%s",
		k.baseURL, url.PathEscape(realm), url.PathEscape(userID))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, userURL, nil)
	if err != nil {
		return false, "", false, err
	}
	req.Header.Set("Authorization", "Bearer "+adminToken)

	resp, err := k.httpClient.Do(req)
	if err != nil {
		return false, "", false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, "", false, fmt.Errorf("keycloak get user returned HTTP %d", resp.StatusCode)
	}

	var parsed struct {
		Attributes map[string][]string `json:"attributes"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return false, "", false, err
	}
	if parsed.Attributes == nil {
		return false, "", false, nil
	}

	enabledVals := parsed.Attributes["k2net_totp_enabled"]
	secretVals := parsed.Attributes["k2net_totp_secret"]
	emailOtpVals := parsed.Attributes["k2net_email_otp_enabled"]
	enabled := false
	for _, v := range enabledVals {
		if strings.EqualFold(strings.TrimSpace(v), "true") {
			enabled = true
			break
		}
	}
	secret := ""
	if len(secretVals) > 0 {
		secret = strings.TrimSpace(secretVals[0])
	}
	emailOtpEnabled := false
	for _, v := range emailOtpVals {
		if strings.EqualFold(strings.TrimSpace(v), "true") {
			emailOtpEnabled = true
			break
		}
	}
	return enabled && secret != "", secret, emailOtpEnabled, nil
}

// VerifyTOTPCode validates a 6-digit RFC 6238 TOTP code against a Base32 secret (±1 time step window).
func VerifyTOTPCode(base32Secret, code string, now time.Time) bool {
	cleanSecret := strings.ToUpper(strings.ReplaceAll(strings.TrimSpace(base32Secret), " ", ""))
	cleanCode := strings.TrimSpace(code)
	if len(cleanCode) != 6 || cleanSecret == "" {
		return false
	}

	decoder := base32.StdEncoding.WithPadding(base32.NoPadding)
	keyBytes, err := decoder.DecodeString(strings.TrimRight(cleanSecret, "="))
	if err != nil || len(keyBytes) == 0 {
		return false
	}

	currentStep := now.Unix() / 30
	for offset := int64(-1); offset <= 1; offset++ {
		if generateTOTPAtStep(keyBytes, currentStep+offset) == cleanCode {
			return true
		}
	}
	return false
}

func generateTOTPAtStep(key []byte, step int64) string {
	var buf [8]byte
	binary.BigEndian.PutUint64(buf[:], uint64(step))
	mac := hmac.New(sha1.New, key)
	_, _ = mac.Write(buf[:])
	sum := mac.Sum(nil)
	offset := sum[len(sum)-1] & 0x0f
	binCode := (int(sum[offset]&0x7f) << 24) |
		(int(sum[offset+1]&0xff) << 16) |
		(int(sum[offset+2]&0xff) << 8) |
		int(sum[offset+3]&0xff)
	otp := binCode % 1000000
	return fmt.Sprintf("%06d", otp)
}
