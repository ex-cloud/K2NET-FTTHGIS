package service

import (
	"context"
	"testing"
)

func TestPaymentServiceSimulatedInvoice(t *testing.T) {
	svc := NewPaymentService("", "my-webhook-secret", "http://localhost:9090")

	payload := InvoicePayload{
		ExternalID:  "order-123",
		Amount:      150000.0,
		Description: "Langganan Paket Internet 100 Mbps",
		Email:       "customer@example.com",
	}

	id, url, err := svc.CreateInvoice(context.Background(), payload)
	if err != nil {
		t.Fatalf("expected simulated invoice to succeed, got error: %v", err)
	}

	if id != "xen_invoice_id_12345" {
		t.Errorf("expected simulated invoice id, got %q", id)
	}
	if url != "https://checkout.xendit.co/v2/simulated" {
		t.Errorf("expected simulated checkout url, got %q", url)
	}
}

func TestVerifyWebhookToken(t *testing.T) {
	// Case 1: Configured token
	svc := NewPaymentService("key-1", "expected-secret-token", "http://localhost:9090")
	if !svc.VerifyWebhookToken("expected-secret-token") {
		t.Error("expected token verification to succeed for matching token")
	}
	if svc.VerifyWebhookToken("wrong-token") {
		t.Error("expected token verification to fail for mismatched token")
	}

	// Case 2: Empty token (dev mode fallback)
	svcEmpty := NewPaymentService("key-1", "", "")
	if !svcEmpty.VerifyWebhookToken("any-token") {
		t.Error("expected true when webhook key is empty")
	}
}
