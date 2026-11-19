package delivery

import (
	"context"
	"net/smtp"
	"testing"
)

func TestExtractEmailAddress(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"notify@kdua.net", "notify@kdua.net"},
		{"K2NET Cloud Security <notify@kdua.net>", "notify@kdua.net"},
		{"<admin@isp.net>", "admin@isp.net"},
		{"  user@domain.com  ", "user@domain.com"},
	}

	for _, tt := range tests {
		got := extractEmailAddress(tt.input)
		if got != tt.expected {
			t.Errorf("extractEmailAddress(%q) = %q; want %q", tt.input, got, tt.expected)
		}
	}
}

func TestLoginAuth(t *testing.T) {
	auth := LoginAuth("notify@kdua.net", "secretpass")
	server := &smtp.ServerInfo{Name: "mail.kdua.net"}

	proto, resp, err := auth.Start(server)
	if err != nil {
		t.Fatalf("unexpected error on Start: %v", err)
	}
	if proto != "LOGIN" {
		t.Errorf("expected protocol LOGIN, got %q", proto)
	}
	if string(resp) != "notify@kdua.net" {
		t.Errorf("expected username in response, got %q", string(resp))
	}

	// Challenge for password
	resp, err = auth.Next([]byte("Password:"), true)
	if err != nil {
		t.Fatalf("unexpected error on Next: %v", err)
	}
	if string(resp) != "secretpass" {
		t.Errorf("expected password in response, got %q", string(resp))
	}

	// Terminate
	resp, err = auth.Next(nil, false)
	if err != nil {
		t.Fatalf("unexpected error on terminate: %v", err)
	}
	if resp != nil {
		t.Errorf("expected nil response on finish, got %v", resp)
	}
}

func TestSMTPEmailSender_IsConfigured(t *testing.T) {
	senderEmpty := &SMTPEmailSender{}
	if senderEmpty.IsConfigured() {
		t.Error("expected empty sender to not be configured")
	}

	senderComplete := &SMTPEmailSender{
		host:     "s11740.sgp1.stableserver.net",
		port:     465,
		user:     "notify@kdua.net",
		password: "secretpassword",
		from:     "notify@kdua.net",
	}
	if !senderComplete.IsConfigured() {
		t.Error("expected complete sender to be configured")
	}

	// Attempting to send on unconfigured sender should return an error
	err := senderEmpty.Send(context.Background(), "test@domain.com", "Test", "<p>Hello</p>")
	if err == nil {
		t.Error("expected error when sending via unconfigured SMTP sender")
	}
}

