package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"gateways/shared/logger"
	"go.uber.org/zap"
)

type InvoicePayload struct {
	ExternalID  string  `json:"external_id" binding:"required"`
	Amount      float64 `json:"amount" binding:"required"`
	Description string  `json:"description"`
	Email       string  `json:"email"`
}

type PaymentService struct {
	apiKey     string
	webhookKey string
	coreURL    string
	httpClient *http.Client
}

func NewPaymentService(apiKey, webhookKey, coreURL string) *PaymentService {
	return &PaymentService{
		apiKey:     apiKey,
		webhookKey: webhookKey,
		coreURL:    coreURL,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *PaymentService) CreateInvoice(ctx context.Context, p InvoicePayload) (string, string, error) {
	if s.apiKey == "" {
		logger.Warn(ctx, "Xendit API Key not set. Simulating invoice creation!", zap.String("id", p.ExternalID))
		return "xen_invoice_id_12345", "https://checkout.xendit.co/v2/simulated", nil
	}

	apiURL := "https://api.xendit.co/v2/invoices"
	
	bodyData, err := json.Marshal(map[string]interface{}{
		"external_id":       p.ExternalID,
		"amount":            p.Amount,
		"description":       p.Description,
		"payer_email":       p.Email,
		"should_send_email": true,
	})
	if err != nil {
		return "", "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewBuffer(bodyData))
	if err != nil {
		return "", "", err
	}

	req.SetBasicAuth(s.apiKey, "")
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", "", fmt.Errorf("xendit returned HTTP %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", "", err
	}

	id, _ := result["id"].(string)
	url, _ := result["invoice_url"].(string)
	return id, url, nil
}

func (s *PaymentService) VerifyWebhookToken(token string) bool {
	if s.webhookKey == "" {
		return true
	}
	return token == s.webhookKey
}

func (s *PaymentService) ReportPaymentToCore(ctx context.Context, extID, status string) error {
	if s.coreURL == "" {
		logger.Warn(ctx, "Core System URL not set. Skipping payment reporting.")
		return nil
	}

	payload := map[string]string{
		"external_id": extID,
		"status":      status,
		"timestamp":   time.Now().Format(time.RFC3339),
	}

	bodyBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.coreURL+"/api/payments/callback", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return err
	}

	mac := hmac.New(sha256.New, []byte(s.webhookKey))
	mac.Write(bodyBytes)
	signature := hex.EncodeToString(mac.Sum(nil))

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Signature", signature)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("core system returned HTTP %d", resp.StatusCode)
	}

	return nil
}
