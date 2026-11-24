package auth

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/base32"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"gateways/shared/logger"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

const (
	PasskeyBrokerClientID       = "k2net-passkey-broker"
	PasskeyDirectGrantFlowAlias = "k2net-passkey-direct-grant"
)

// KeycloakAdminClient performs administrative user management in Keycloak
type KeycloakAdminClient struct {
	baseURL            string
	username           string
	password           string
	httpClient         *http.Client
	rdb                *redis.Client
	passkeyBrokerReady sync.Map
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

// PasskeyBrokerSecret returns the confidential client secret for the internal Passkey broker client.
func (k *KeycloakAdminClient) PasskeyBrokerSecret() string {
	if envSecret := strings.TrimSpace(os.Getenv("KC_PASSKEY_BROKER_SECRET")); envSecret != "" {
		return envSecret
	}
	seed := "k2net-default-passkey-seed"
	if k != nil && k.password != "" {
		seed = k.password
	}
	mac := hmac.New(sha256.New, []byte(seed))
	_, _ = mac.Write([]byte("k2net-passkey-broker-fido2-v1"))
	return hex.EncodeToString(mac.Sum(nil))
}

// EnsurePasskeyBrokerSetup idempotently provisions the internal k2net-passkey-direct-grant flow
// and confidential k2net-passkey-broker client in the target Keycloak realm so gateway-auth
// can mint genuine OIDC tokens after verifying a cryptographic FIDO2 Passkey assertion.
func (k *KeycloakAdminClient) EnsurePasskeyBrokerSetup(ctx context.Context, realm string) error {
	if k == nil || k.baseURL == "" || strings.TrimSpace(realm) == "" {
		return nil
	}
	cleanRealm := strings.TrimSpace(realm)
	if _, ok := k.passkeyBrokerReady.Load(cleanRealm); ok {
		return nil
	}

	adminToken, err := k.getAdminToken(ctx)
	if err != nil {
		return err
	}

	// 1. Ensure custom Direct Grant flow (k2net-passkey-direct-grant) with direct-grant-validate-username REQUIRED
	flowsURL := fmt.Sprintf("%s/admin/realms/%s/authentication/flows", k.baseURL, url.PathEscape(cleanRealm))
	flowID, err := k.findAuthFlowID(ctx, adminToken, flowsURL, PasskeyDirectGrantFlowAlias)
	if err != nil {
		return err
	}
	if flowID == "" {
		createFlowPayload, _ := json.Marshal(map[string]any{
			"alias":       PasskeyDirectGrantFlowAlias,
			"description": "Internal BFF Passkey FIDO2 Verified Direct Grant",
			"providerId":  "basic-flow",
			"topLevel":    true,
			"builtIn":     false,
		})
		req, _ := http.NewRequestWithContext(ctx, http.MethodPost, flowsURL, bytes.NewReader(createFlowPayload))
		req.Header.Set("Authorization", "Bearer "+adminToken)
		req.Header.Set("Content-Type", "application/json")
		if resp, doErr := k.httpClient.Do(req); doErr == nil {
			_ = resp.Body.Close()
		}
		flowID, err = k.findAuthFlowID(ctx, adminToken, flowsURL, PasskeyDirectGrantFlowAlias)
		if err != nil || flowID == "" {
			return fmt.Errorf("failed to resolve created auth flow %s in realm %s", PasskeyDirectGrantFlowAlias, cleanRealm)
		}
	}

	// Ensure direct-grant-validate-username execution is present and REQUIRED
	execsURL := fmt.Sprintf("%s/admin/realms/%s/authentication/flows/%s/executions",
		k.baseURL, url.PathEscape(cleanRealm), url.PathEscape(PasskeyDirectGrantFlowAlias))
	if err := k.ensureUsernameExecutionRequired(ctx, adminToken, execsURL); err != nil {
		return err
	}

	// 2. Fetch protocolMappers from ftth-gis-frontend so custom claims (organization_id, tenant_id, tenant_slug) match 100%
	var cleanMappers []map[string]any
	frontendClientsURL := fmt.Sprintf("%s/admin/realms/%s/clients?clientId=ftth-gis-frontend", k.baseURL, url.PathEscape(cleanRealm))
	if feReq, reqErr := http.NewRequestWithContext(ctx, http.MethodGet, frontendClientsURL, nil); reqErr == nil {
		feReq.Header.Set("Authorization", "Bearer "+adminToken)
		if feResp, doErr := k.httpClient.Do(feReq); doErr == nil {
			var feClients []map[string]any
			_ = json.NewDecoder(feResp.Body).Decode(&feClients)
			_ = feResp.Body.Close()
			if len(feClients) > 0 {
				if rawMappers, ok := feClients[0]["protocolMappers"].([]any); ok {
					for _, rm := range rawMappers {
						if mMap, ok := rm.(map[string]any); ok {
							copied := make(map[string]any, len(mMap))
							for mk, mv := range mMap {
								if mk != "id" {
									copied[mk] = mv
								}
							}
							cleanMappers = append(cleanMappers, copied)
						}
					}
				}
			}
		}
	}

	// 3. Create or update confidential client k2net-passkey-broker
	brokerQueryURL := fmt.Sprintf("%s/admin/realms/%s/clients?clientId=%s",
		k.baseURL, url.PathEscape(cleanRealm), url.QueryEscape(PasskeyBrokerClientID))
	var existingClients []map[string]any
	if bReq, reqErr := http.NewRequestWithContext(ctx, http.MethodGet, brokerQueryURL, nil); reqErr == nil {
		bReq.Header.Set("Authorization", "Bearer "+adminToken)
		if bResp, doErr := k.httpClient.Do(bReq); doErr == nil {
			_ = json.NewDecoder(bResp.Body).Decode(&existingClients)
			_ = bResp.Body.Close()
		}
	}

	clientRep := map[string]any{
		"clientId":                  PasskeyBrokerClientID,
		"name":                      "K2NET Internal Passkey FIDO2 Broker",
		"enabled":                   true,
		"publicClient":              false,
		"clientAuthenticatorType":   "client-secret",
		"secret":                    k.PasskeyBrokerSecret(),
		"directAccessGrantsEnabled": true,
		"standardFlowEnabled":       false,
		"serviceAccountsEnabled":    false,
		"fullScopeAllowed":          true,
		"authenticationFlowBindingOverrides": map[string]string{
			"direct_grant": flowID,
		},
	}
	if len(cleanMappers) > 0 {
		clientRep["protocolMappers"] = cleanMappers
	}

	if len(existingClients) == 0 {
		createClientURL := fmt.Sprintf("%s/admin/realms/%s/clients", k.baseURL, url.PathEscape(cleanRealm))
		bodyBytes, _ := json.Marshal(clientRep)
		req, _ := http.NewRequestWithContext(ctx, http.MethodPost, createClientURL, bytes.NewReader(bodyBytes))
		req.Header.Set("Authorization", "Bearer "+adminToken)
		req.Header.Set("Content-Type", "application/json")
		resp, doErr := k.httpClient.Do(req)
		if doErr != nil {
			return doErr
		}
		_ = resp.Body.Close()
		if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusConflict {
			return fmt.Errorf("failed creating %s in realm %s (HTTP %d)", PasskeyBrokerClientID, cleanRealm, resp.StatusCode)
		}
	} else {
		clientUUID, _ := existingClients[0]["id"].(string)
		if clientUUID != "" {
			clientRep["id"] = clientUUID
			// Preserve existing protocolMappers on update so we do not duplicate mapper names
			delete(clientRep, "protocolMappers")
			updateClientURL := fmt.Sprintf("%s/admin/realms/%s/clients/%s",
				k.baseURL, url.PathEscape(cleanRealm), url.PathEscape(clientUUID))
			bodyBytes, _ := json.Marshal(clientRep)
			req, _ := http.NewRequestWithContext(ctx, http.MethodPut, updateClientURL, bytes.NewReader(bodyBytes))
			req.Header.Set("Authorization", "Bearer "+adminToken)
			req.Header.Set("Content-Type", "application/json")
			if resp, doErr := k.httpClient.Do(req); doErr == nil {
				_ = resp.Body.Close()
			}
		}
	}

	k.passkeyBrokerReady.Store(cleanRealm, true)
	logger.Info(ctx, "Keycloak internal Passkey FIDO2 broker client ready",
		zap.String("realm", cleanRealm),
		zap.String("clientId", PasskeyBrokerClientID),
		zap.String("flowId", flowID))
	return nil
}

func (k *KeycloakAdminClient) findAuthFlowID(ctx context.Context, adminToken, flowsURL, targetAlias string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, flowsURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+adminToken)
	resp, err := k.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", nil
	}
	var flows []struct {
		ID    string `json:"id"`
		Alias string `json:"alias"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&flows); err != nil {
		return "", err
	}
	for _, f := range flows {
		if f.Alias == targetAlias {
			return f.ID, nil
		}
	}
	return "", nil
}

func (k *KeycloakAdminClient) ensureUsernameExecutionRequired(ctx context.Context, adminToken, execsURL string) error {
	getExecs := func() ([]map[string]any, error) {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, execsURL, nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Authorization", "Bearer "+adminToken)
		resp, err := k.httpClient.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return nil, nil
		}
		var list []map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&list)
		return list, nil
	}

	execs, err := getExecs()
	if err != nil {
		return err
	}

	found := false
	for _, ex := range execs {
		if pid, _ := ex["providerId"].(string); pid == "direct-grant-validate-username" {
			found = true
			if reqVal, _ := ex["requirement"].(string); reqVal != "REQUIRED" {
				ex["requirement"] = "REQUIRED"
				bodyBytes, _ := json.Marshal(ex)
				putReq, _ := http.NewRequestWithContext(ctx, http.MethodPut, execsURL, bytes.NewReader(bodyBytes))
				putReq.Header.Set("Authorization", "Bearer "+adminToken)
				putReq.Header.Set("Content-Type", "application/json")
				if resp, doErr := k.httpClient.Do(putReq); doErr == nil {
					_ = resp.Body.Close()
				}
			}
			break
		}
	}

	if !found {
		addURL := execsURL + "/execution"
		addPayload, _ := json.Marshal(map[string]string{
			"provider": "direct-grant-validate-username",
		})
		addReq, _ := http.NewRequestWithContext(ctx, http.MethodPost, addURL, bytes.NewReader(addPayload))
		addReq.Header.Set("Authorization", "Bearer "+adminToken)
		addReq.Header.Set("Content-Type", "application/json")
		if resp, doErr := k.httpClient.Do(addReq); doErr == nil {
			_ = resp.Body.Close()
		}

		execs, _ = getExecs()
		for _, ex := range execs {
			if pid, _ := ex["providerId"].(string); pid == "direct-grant-validate-username" {
				ex["requirement"] = "REQUIRED"
				bodyBytes, _ := json.Marshal(ex)
				putReq, _ := http.NewRequestWithContext(ctx, http.MethodPut, execsURL, bytes.NewReader(bodyBytes))
				putReq.Header.Set("Authorization", "Bearer "+adminToken)
				putReq.Header.Set("Content-Type", "application/json")
				if resp, doErr := k.httpClient.Do(putReq); doErr == nil {
					_ = resp.Body.Close()
				}
				break
			}
		}
	}
	return nil
}
