package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"gateways/shared/logger"
	"go.uber.org/zap"
)

// NotificationClient calls notification-gateway for transactional email dispatch
type NotificationClient struct {
	baseURL      string
	gatewayToken string
	httpClient   *http.Client
}

// NewNotificationClient creates a new NotificationClient
func NewNotificationClient(baseURL, gatewayToken string) *NotificationClient {
	if baseURL == "" {
		baseURL = "http://ftth-notification-gateway:5001"
	}
	return &NotificationClient{
		baseURL:      strings.TrimRight(baseURL, "/"),
		gatewayToken: gatewayToken,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

// DispatchActivationEmail triggers sending an onboarding workspace activation email
func (n *NotificationClient) DispatchActivationEmail(
	ctx context.Context,
	to, recipientName, orgName, subdomain, activationURL, lang string,
) error {
	endpoint := fmt.Sprintf("%s/api/v1/notification/email/activation", n.baseURL)

	payload := map[string]string{
		"to":             to,
		"recipient_name": recipientName,
		"org_name":       orgName,
		"subdomain":      subdomain,
		"activation_url": activationURL,
		"expires_in":     "24 hours",
		"lang":           lang,
	}
	if lang == "id" {
		payload["expires_in"] = "24 jam"
	}

	jsonBytes, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(jsonBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	if n.gatewayToken != "" {
		req.Header.Set("X-Gateway-Token", n.gatewayToken)
	}

	resp, err := n.httpClient.Do(req)
	if err != nil {
		logger.Error(ctx, "Failed contacting notification-gateway for activation email", zap.Error(err))
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("notification-gateway returned HTTP %d: %s", resp.StatusCode, string(body))
	}

	logger.Info(ctx, "Activation email successfully dispatched via notification-gateway",
		zap.String("to", to),
		zap.String("org", orgName))
	return nil
}

// DispatchPasswordResetEmail triggers sending a self-service password reset email
func (n *NotificationClient) DispatchPasswordResetEmail(
	ctx context.Context,
	to, recipientName, resetURL, expiresIn, clientIP, lang string,
) error {
	endpoint := fmt.Sprintf("%s/api/v1/notification/email/reset-password", n.baseURL)

	payload := map[string]string{
		"to":             to,
		"recipient_name": recipientName,
		"reset_url":      resetURL,
		"expires_in":     expiresIn,
		"client_ip":      clientIP,
		"lang":           lang,
	}

	jsonBytes, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(jsonBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	if n.gatewayToken != "" {
		req.Header.Set("X-Gateway-Token", n.gatewayToken)
	}

	resp, err := n.httpClient.Do(req)
	if err != nil {
		logger.Error(ctx, "Failed contacting notification-gateway for password reset email", zap.Error(err))
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("notification-gateway returned HTTP %d: %s", resp.StatusCode, string(body))
	}

	logger.Info(ctx, "Password reset email successfully dispatched via notification-gateway",
		zap.String("to", to))
	return nil
}
