package service

import (
	"context"
	"testing"
	"time"
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

	// Case 2: Empty token (fail-closed security)
	svcEmpty := NewPaymentService("key-1", "", "")
	if svcEmpty.VerifyWebhookToken("any-token") {
		t.Error("expected false (fail-closed) when webhook key is empty")
	}
}

func TestIdempotencyStore(t *testing.T) {
	ctx := context.Background()
	// Test in-memory fallback without redis
	store := NewIdempotencyStore(nil)

	// First occurrence
	dup, err := store.IsDuplicateOrMark(ctx, "tx-999:PAID", 100*time.Millisecond)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if dup {
		t.Errorf("expected first call to be non-duplicate")
	}

	// Immediate replay -> should be duplicate
	dupReplay, err := store.IsDuplicateOrMark(ctx, "tx-999:PAID", 100*time.Millisecond)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !dupReplay {
		t.Errorf("expected immediate replay to be duplicate")
	}

	// Different status or transaction -> should not be duplicate
	dupOther, err := store.IsDuplicateOrMark(ctx, "tx-888:PAID", 100*time.Millisecond)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if dupOther {
		t.Errorf("expected different key to be non-duplicate")
	}

	// After TTL expiration -> should not be duplicate
	time.Sleep(120 * time.Millisecond)
	dupExpired, err := store.IsDuplicateOrMark(ctx, "tx-999:PAID", 100*time.Millisecond)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if dupExpired {
		t.Errorf("expected expired key to be allowed again")
	}
}

func TestInquireInvoiceStatus(t *testing.T) {
	ctx := context.Background()
	svc := NewPaymentService("", "my-webhook-secret", "http://localhost:9090")

	// Empty invoice ID should fail
	_, err := svc.InquireInvoiceStatus(ctx, "")
	if err == nil {
		t.Errorf("expected error for empty invoice ID")
	}

	// Simulated invoice inquiry
	status, err := svc.InquireInvoiceStatus(ctx, "xen_inv_001")
	if err != nil {
		t.Fatalf("unexpected error on simulated inquiry: %v", err)
	}
	if status != "PAID" {
		t.Errorf("expected simulated status 'PAID', got %q", status)
	}
}

