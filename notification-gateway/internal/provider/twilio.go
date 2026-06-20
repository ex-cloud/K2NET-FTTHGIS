package provider

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"gateways/shared/logger"
	"go.uber.org/zap"
)

type MessageType string

const (
	TypeSMS      MessageType = "sms"
	TypeWhatsApp MessageType = "whatsapp"
)

type NotificationPayload struct {
	Type        MessageType `json:"type" binding:"required"`
	To          string      `json:"to" binding:"required"`
	Body        string      `json:"body" binding:"required"`
	CallbackURL string      `json:"callback_url"`
}

type SMSProvider interface {
	Send(ctx context.Context, payload NotificationPayload) (string, error)
}

type TwilioProvider struct {
	sid       string
	authToken string
	from      string
	client    *http.Client
}

func NewTwilioProvider(sid, authToken, from string) *TwilioProvider {
	return &TwilioProvider{
		sid:       sid,
		authToken: authToken,
		from:      from,
		client:    &http.Client{Timeout: 10 * time.Second},
	}
}

func (t *TwilioProvider) Send(ctx context.Context, payload NotificationPayload) (string, error) {
	if t.sid == "" || t.authToken == "" {
		logger.Warn(ctx, "Twilio credentials not configured. Simulating delivery!", 
			zap.String("to", payload.To), 
			zap.String("type", string(payload.Type)),
			zap.String("body", payload.Body))
		return "SIMULATED-MSG-ID-12345", nil
	}

	fromNum := t.from
	toNum := payload.To

	if payload.Type == TypeWhatsApp {
		if !strings.HasPrefix(fromNum, "whatsapp:") {
			fromNum = "whatsapp:" + fromNum
		}
		if !strings.HasPrefix(toNum, "whatsapp:") {
			toNum = "whatsapp:" + toNum
		}
	}

	apiURL := "https://api.twilio.com/2010-04-01/Accounts/" + t.sid + "/Messages.json"
	
	form := url.Values{}
	form.Set("To", toNum)
	form.Set("From", fromNum)
	form.Set("Body", payload.Body)
	if payload.CallbackURL != "" {
		form.Set("StatusCallback", payload.CallbackURL)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", err
	}

	req.SetBasicAuth(t.sid, t.authToken)
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	resp, err := t.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		errStr, _ := json.Marshal(result)
		return "", errors.New("twilio api error: " + string(errStr))
	}

	sid, _ := result["sid"].(string)
	return sid, nil
}
