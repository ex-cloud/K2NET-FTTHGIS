package whatsapp

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"gateways/shared/logger"
	"go.uber.org/zap"
)

type Client struct {
	apiURL        string
	accessToken   string
	phoneNumberID string
	httpClient    *http.Client
}

func NewClient(apiURL, accessToken, phoneNumberID string) *Client {
	return &Client{
		apiURL:        apiURL,
		accessToken:   accessToken,
		phoneNumberID: phoneNumberID,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type TextMessagePayload struct {
	MessagingProduct string `json:"messaging_product"`
	RecipientType    string `json:"recipient_type"`
	To               string `json:"to"`
	Type             string `json:"type"`
	Text             struct {
		PreviewURL bool   `json:"preview_url"`
		Body       string `json:"body"`
	} `json:"text"`
}

type TemplateMessagePayload struct {
	MessagingProduct string `json:"messaging_product"`
	RecipientType    string `json:"recipient_type"`
	To               string `json:"to"`
	Type             string `json:"type"`
	Template         struct {
		Name     string         `json:"name"`
		Language struct {
			Code string `json:"code"`
		} `json:"language"`
		Components []any `json:"components,omitempty"`
	} `json:"template"`
}

func (c *Client) SendText(ctx context.Context, to, body string) error {
	payload := TextMessagePayload{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               to,
		Type:             "text",
	}
	payload.Text.PreviewURL = false
	payload.Text.Body = body

	return c.send(ctx, payload)
}

func (c *Client) SendTemplate(ctx context.Context, to, name, langCode string, components []any) error {
	payload := TemplateMessagePayload{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               to,
		Type:             "template",
	}
	payload.Template.Name = name
	payload.Template.Language.Code = langCode
	payload.Template.Components = components

	return c.send(ctx, payload)
}

func (c *Client) send(ctx context.Context, payload any) error {
	if c.accessToken == "" || c.phoneNumberID == "" {
		logger.Warn(ctx, "WhatsApp integration is not fully configured (token or phone ID missing). Skipping real API call.")
		return nil
	}

	url := fmt.Sprintf("%s/%s/messages", c.apiURL, c.phoneNumberID)
	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal whatsapp payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create http request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.accessToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("whatsapp API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errResponse map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&errResponse)
		logger.Error(ctx, "WhatsApp Cloud API returned error status code", 
			zap.Int("status_code", resp.StatusCode), 
			zap.Any("error_response", errResponse),
		)
		return fmt.Errorf("whatsapp API returned status: %d", resp.StatusCode)
	}

	return nil
}
