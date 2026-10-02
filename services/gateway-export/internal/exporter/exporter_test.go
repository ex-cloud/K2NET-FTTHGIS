package exporter

import (
	"testing"
	"time"
)

func TestGenerateInvoicePDF(t *testing.T) {
	data := &InvoiceData{
		InvoiceNumber: "INV-TEST-123",
		InvoiceDate:   time.Now(),
		DueDate:       time.Now().Add(10 * 24 * time.Hour),
		CustomerName:  "Test Customer",
		CustomerAddr:  "Test Address",
		TenantName:    "test-tenant",
		Subtotal:      100000,
		Tax:           11000,
		Total:         111000,
	}

	pdfBytes, err := GenerateInvoicePDF(data)
	if err != nil {
		t.Fatalf("Failed to generate PDF: %v", err)
	}

	if len(pdfBytes) < 100 {
		t.Errorf("Generated PDF is too small (%d bytes), might be empty", len(pdfBytes))
	}
}

func TestGenerateBillingExcel(t *testing.T) {
	rows := []BillingRow{
		{CustomerName: "Customer A", InvoiceNumber: "INV-001", PackageName: "10M", Amount: 150000, Status: "lunas"},
		{CustomerName: "Customer B", InvoiceNumber: "INV-002", PackageName: "20M", Amount: 250000, Status: "belum bayar"},
	}

	excelBytes, err := GenerateBillingExcel("test-tenant", "2026-06", rows)
	if err != nil {
		t.Fatalf("Failed to generate Excel: %v", err)
	}

	if len(excelBytes) < 100 {
		t.Errorf("Generated Excel is too small (%d bytes), might be empty", len(excelBytes))
	}
}

func TestSignExportPayload(t *testing.T) {
	content := []byte("id,actor_id,action,occurred_at\n1,admin,LOGIN,2026-10-02T00:00:00Z\n")
	checksum, sig, signedAt := SignExportPayload(content, "garut", "admin@k2.net", "secret-key")

	if len(checksum) != 64 {
		t.Errorf("Expected SHA-256 checksum 64 chars, got: %s", checksum)
	}
	if len(sig) != 64 {
		t.Errorf("Expected HMAC-SHA256 signature 64 chars, got: %s", sig)
	}

	trailer := GenerateSignedCSVTrailer(checksum, sig, "garut", "admin@k2.net", signedAt)
	if len(trailer) == 0 {
		t.Errorf("Expected signed CSV trailer")
	}
}
