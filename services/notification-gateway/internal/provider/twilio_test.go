package provider

import (
	"context"
	"testing"
)

func TestTwilioProviderSimulatedMode(t *testing.T) {
	// When sid or authToken is empty, TwilioProvider should simulate delivery safely
	provider := NewTwilioProvider("", "", "")
	
	payload := NotificationPayload{
		Type: TypeSMS,
		To:   "+628123456789",
		Body: "Your OTP is 123456",
	}

	msgID, err := provider.Send(context.Background(), payload)
	if err != nil {
		t.Fatalf("expected no error in simulated mode, got: %v", err)
	}

	if msgID != "SIMULATED-MSG-ID-12345" {
		t.Errorf("expected simulated msgID SIMULATED-MSG-ID-12345, got %q", msgID)
	}
}

func TestTwilioProviderWhatsAppFormatting(t *testing.T) {
	provider := NewTwilioProvider("", "", "whatsapp:+14155238886")

	payload := NotificationPayload{
		Type: TypeWhatsApp,
		To:   "081234567890",
		Body: "Tagihan internet Anda telah terbit",
	}

	msgID, err := provider.Send(context.Background(), payload)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if msgID == "" {
		t.Error("expected non-empty msgID")
	}
}
