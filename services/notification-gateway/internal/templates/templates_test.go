package templates

import (
	"strings"
	"testing"
)

func TestRenderActivationEmail_EN(t *testing.T) {
	data := ActivationEmailData{
		RecipientName: "John Doe",
		OrgName:       "Garut Fiber Net",
		Subdomain:     "garut.kdua.net",
		ActivationURL: "https://garut.kdua.net/activate?token=test-token-123",
		ExpiresIn:     "24 hours",
		Lang:          "en",
	}

	subject, html, err := RenderActivationEmail(data)
	if err != nil {
		t.Fatalf("unexpected error rendering activation email EN: %v", err)
	}

	if !strings.Contains(subject, "Garut Fiber Net") {
		t.Errorf("expected subject to contain org name, got: %s", subject)
	}
	if !strings.Contains(html, "John Doe") {
		t.Errorf("expected html to contain recipient name")
	}
	if !strings.Contains(html, "garut.kdua.net") {
		t.Errorf("expected html to contain subdomain")
	}
	if !strings.Contains(html, "https://garut.kdua.net/activate?token=test-token-123") {
		t.Errorf("expected html to contain activation link")
	}
	if !strings.Contains(html, "24 hours") {
		t.Errorf("expected html to contain expiration info")
	}
}

func TestRenderActivationEmail_ID(t *testing.T) {
	data := ActivationEmailData{
		RecipientName: "Budi Santoso",
		OrgName:       "Nusantara Fiber",
		Subdomain:     "nusantara.kdua.net",
		ActivationURL: "https://nusantara.kdua.net/activate?token=token-id-456",
		ExpiresIn:     "24 jam",
		Lang:          "id",
	}

	subject, html, err := RenderActivationEmail(data)
	if err != nil {
		t.Fatalf("unexpected error rendering activation email ID: %v", err)
	}

	if !strings.Contains(subject, "Aktivasi Workspace ISP: Nusantara Fiber") {
		t.Errorf("expected ID subject, got: %s", subject)
	}
	if !strings.Contains(html, "Halo, Budi Santoso") {
		t.Errorf("expected ID greeting")
	}
	if !strings.Contains(html, "Aktivasi Workspace Sekarang") {
		t.Errorf("expected ID CTA button")
	}
}

func TestRenderPasswordResetEmail_EN(t *testing.T) {
	data := PasswordResetEmailData{
		RecipientName: "Alice Smith",
		ResetURL:      "https://system-gis.kdua.net/reset-password?token=reset-abc",
		ExpiresIn:     "15 minutes",
		ClientIP:      "103.14.22.5",
		Lang:          "en",
	}

	subject, html, err := RenderPasswordResetEmail(data)
	if err != nil {
		t.Fatalf("unexpected error rendering reset email EN: %v", err)
	}

	if !strings.Contains(subject, "Reset Your Account Password") {
		t.Errorf("expected EN reset subject, got: %s", subject)
	}
	if !strings.Contains(html, "Alice Smith") {
		t.Errorf("expected recipient name in html")
	}
	if !strings.Contains(html, "103.14.22.5") {
		t.Errorf("expected client IP in html")
	}
	if !strings.Contains(html, "https://system-gis.kdua.net/reset-password?token=reset-abc") {
		t.Errorf("expected reset link in html")
	}
}

func TestRenderPasswordResetEmail_ID(t *testing.T) {
	data := PasswordResetEmailData{
		RecipientName: "Ahmad Dahlan",
		ResetURL:      "https://garut.kdua.net/reset-password?token=reset-id",
		ExpiresIn:     "15 menit",
		ClientIP:      "180.252.10.1",
		Lang:          "id",
	}

	subject, html, err := RenderPasswordResetEmail(data)
	if err != nil {
		t.Fatalf("unexpected error rendering reset email ID: %v", err)
	}

	if !strings.Contains(subject, "Atur Ulang Kata Sandi Akun Anda") {
		t.Errorf("expected ID reset subject, got: %s", subject)
	}
	if !strings.Contains(html, "Halo, Ahmad Dahlan") {
		t.Errorf("expected ID greeting")
	}
	if !strings.Contains(html, "Atur Ulang Kata Sandi") {
		t.Errorf("expected ID CTA button")
	}
}

func TestRenderMfaOtpEmail_EN(t *testing.T) {
	data := MfaOtpEmailData{
		RecipientName: "John Doe",
		OtpCode:       "849201",
		ExpiresIn:     "5 minutes",
		ClientIP:      "192.168.1.100",
		Lang:          "en",
	}

	subject, html, err := RenderMfaOtpEmail(data)
	if err != nil {
		t.Fatalf("unexpected error rendering MFA OTP email EN: %v", err)
	}

	if !strings.Contains(subject, "849201") {
		t.Errorf("expected subject to contain OTP code, got: %s", subject)
	}
	if !strings.Contains(html, "John Doe") {
		t.Errorf("expected html to contain recipient name")
	}
	if !strings.Contains(html, "849201") {
		t.Errorf("expected html to contain OTP code")
	}
	if !strings.Contains(html, "192.168.1.100") {
		t.Errorf("expected html to contain requesting IP")
	}
}

func TestRenderMfaOtpEmail_ID(t *testing.T) {
	data := MfaOtpEmailData{
		RecipientName: "Andiansyah",
		OtpCode:       "572190",
		ExpiresIn:     "5 menit",
		ClientIP:      "103.111.20.5",
		Lang:          "id",
	}

	subject, html, err := RenderMfaOtpEmail(data)
	if err != nil {
		t.Fatalf("unexpected error rendering MFA OTP email ID: %v", err)
	}

	if !strings.Contains(subject, "Kode Verifikasi Masuk (MFA OTP): 572190") {
		t.Errorf("expected ID subject with OTP, got: %s", subject)
	}
	if !strings.Contains(html, "Andiansyah") {
		t.Errorf("expected ID recipient name in greeting")
	}
	if !strings.Contains(html, "572190") {
		t.Errorf("expected ID OTP code in box")
	}
	if !strings.Contains(html, "103.111.20.5") {
		t.Errorf("expected ID client IP in detail table")
	}
}
