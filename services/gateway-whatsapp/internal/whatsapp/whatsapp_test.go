package whatsapp

import (
	"context"
	"testing"
)

func TestWhatsAppClientUnconfigured(t *testing.T) {
	c := NewClient("https://graph.facebook.com/v19.0", "", "")

	// When token or phone ID is empty, SendText should gracefully skip without error
	err := c.SendText(context.Background(), "628123456789", "Halo pelanggan K2NET")
	if err != nil {
		t.Fatalf("expected nil error when unconfigured, got: %v", err)
	}

	// SendTemplate should also gracefully skip without error
	err2 := c.SendTemplate(context.Background(), "628123456789", "otp_notification", "id", nil)
	if err2 != nil {
		t.Fatalf("expected nil error when unconfigured, got: %v", err2)
	}
}

func TestWhatsAppPayloadStructures(t *testing.T) {
	textPayload := TextMessagePayload{
		MessagingProduct: "whatsapp",
		RecipientType:    "individual",
		To:               "628123456789",
		Type:             "text",
	}
	textPayload.Text.Body = "Test message"

	if textPayload.MessagingProduct != "whatsapp" || textPayload.Text.Body != "Test message" {
		t.Errorf("unexpected text payload structure: %+v", textPayload)
	}
}
