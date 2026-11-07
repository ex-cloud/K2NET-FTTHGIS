package templates

import (
	"bytes"
	"fmt"
	"html/template"
	"strings"
)

// ActivationEmailData holds the template parameters for tenant workspace activation.
type ActivationEmailData struct {
	RecipientName string
	OrgName       string
	Subdomain     string
	ActivationURL string
	ExpiresIn     string
	Lang          string // "en" or "id"
}

// PasswordResetEmailData holds the template parameters for self-service password reset.
type PasswordResetEmailData struct {
	RecipientName string
	ResetURL      string
	ExpiresIn     string
	ClientIP      string
	Lang          string // "en" or "id"
}

const baseLayoutHTML = `<!DOCTYPE html>
<html lang="{{.Lang}}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{.Subject}}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #09090b;
      padding: 32px 16px;
    }
    .card {
      max-width: 580px;
      margin: 0 auto;
      background-color: #18181b;
      border: 1px solid #27272a;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    }
    .header {
      padding: 24px 32px;
      background: linear-gradient(180deg, #27272a 0%, #18181b 100%);
      border-bottom: 1px solid #27272a;
      display: flex;
      align-items: center;
    }
    .logo-badge {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #10b981;
      text-transform: uppercase;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .content {
      padding: 32px;
      color: #d4d4d8;
      font-size: 14px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 16px;
    }
    .cta-container {
      margin: 28px 0;
      text-align: center;
    }
    .btn {
      display: inline-block;
      background-color: #10b981;
      color: #09090b !important;
      font-weight: 600;
      font-size: 14px;
      padding: 12px 28px;
      border-radius: 8px;
      text-decoration: none;
      transition: background-color 0.15s ease;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
    }
    .info-box {
      background-color: #09090b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
      font-size: 13px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      color: #a1a1aa;
    }
    .info-label {
      color: #71717a;
    }
    .info-value {
      color: #ffffff;
      font-weight: 500;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .fallback-link {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid #27272a;
      font-size: 12px;
      color: #71717a;
      word-break: break-all;
    }
    .fallback-link a {
      color: #10b981;
      text-decoration: underline;
    }
    .security-notice {
      margin-top: 20px;
      font-size: 12px;
      color: #a1a1aa;
      background-color: rgba(245, 158, 11, 0.08);
      border-left: 3px solid #f59e0b;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
    }
    .footer {
      padding: 20px 32px;
      background-color: #09090b;
      border-top: 1px solid #27272a;
      text-align: center;
      font-size: 11px;
      color: #71717a;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <span class="logo-badge">K2NET &bull; FTTH GIS ENTERPRISE</span>
      </div>
      <div class="content">
        {{.Body}}
      </div>
      <div class="footer">
        {{.Footer}}
      </div>
    </div>
  </div>
</body>
</html>`

// RenderActivationEmail generates localized subject and HTML email for tenant onboarding.
func RenderActivationEmail(data ActivationEmailData) (string, string, error) {
	lang := strings.ToLower(strings.TrimSpace(data.Lang))
	if lang != "id" {
		lang = "en"
	}

	recipientName := strings.TrimSpace(data.RecipientName)
	if recipientName == "" {
		if lang == "id" {
			recipientName = "Administrator"
		} else {
			recipientName = "Administrator"
		}
	}

	orgName := strings.TrimSpace(data.OrgName)
	if orgName == "" {
		orgName = "ISP Organization"
	}

	expiresIn := strings.TrimSpace(data.ExpiresIn)
	if expiresIn == "" {
		if lang == "id" {
			expiresIn = "24 jam"
		} else {
			expiresIn = "24 hours"
		}
	}

	var subject string
	var bodyHTML string
	var footerHTML string

	if lang == "id" {
		subject = fmt.Sprintf("[K2NET] Aktivasi Workspace ISP: %s", orgName)
		bodyHTML = fmt.Sprintf(`
      <div class="greeting">Halo, %s</div>
      <p>Selamat datang di platform <strong>K2NET FTTH GIS Enterprise</strong>. Workspace organisasi Anda telah berhasil disiapkan dan siap untuk diaktifkan.</p>
      
      <div class="info-box">
        <div class="info-row"><span class="info-label">Nama Organisasi:</span> <span class="info-value">%s</span></div>
        <div class="info-row"><span class="info-label">Domain Portal:</span> <span class="info-value">%s</span></div>
        <div class="info-row"><span class="info-label">Masa Berlaku Tautan:</span> <span class="info-value">%s</span></div>
      </div>

      <p>Klik tombol di bawah ini untuk memverifikasi alamat email Anda dan mengatur kata sandi administrator pertama kali:</p>

      <div class="cta-container">
        <a href="%s" target="_blank" class="btn">Aktivasi Workspace Sekarang</a>
      </div>

      <div class="security-notice">
        <strong>Pemberitahuan Keamanan:</strong> Tautan aktivasi ini bersifat rahasia dan hanya berlaku selama %s. Jangan bagikan tautan ini kepada pihak lain.
      </div>

      <div class="fallback-link">
        Jika tombol di atas tidak dapat diklik, salin dan tempel URL berikut ke peramban web Anda:<br>
        <a href="%s" target="_blank">%s</a>
      </div>
    `,
			template.HTMLEscapeString(recipientName),
			template.HTMLEscapeString(orgName),
			template.HTMLEscapeString(data.Subdomain),
			template.HTMLEscapeString(expiresIn),
			template.HTMLEscapeString(data.ActivationURL),
			template.HTMLEscapeString(expiresIn),
			template.HTMLEscapeString(data.ActivationURL),
			template.HTMLEscapeString(data.ActivationURL),
		)

		footerHTML = `&copy; 2026 K2NET Enterprise SaaS Platform. Hak cipta dilindungi undang-undang.<br>Email otomatis dari sistem otentikasi K2NET (notify@kdua.net).`
	} else {
		subject = fmt.Sprintf("[K2NET] Activate Your ISP Workspace: %s", orgName)
		bodyHTML = fmt.Sprintf(`
      <div class="greeting">Hello, %s</div>
      <p>Welcome to <strong>K2NET FTTH GIS Enterprise Platform</strong>. Your organization workspace has been successfully provisioned and is ready for activation.</p>
      
      <div class="info-box">
        <div class="info-row"><span class="info-label">Organization Name:</span> <span class="info-value">%s</span></div>
        <div class="info-row"><span class="info-label">Portal Subdomain:</span> <span class="info-value">%s</span></div>
        <div class="info-row"><span class="info-label">Link Expiration:</span> <span class="info-value">%s</span></div>
      </div>

      <p>Click the button below to verify your email address and establish your master administrator password:</p>

      <div class="cta-container">
        <a href="%s" target="_blank" class="btn">Activate Workspace Now</a>
      </div>

      <div class="security-notice">
        <strong>Security Notice:</strong> This magic activation link is confidential and valid for %s. Never forward or share this link.
      </div>

      <div class="fallback-link">
        If the button above does not work, copy and paste this URL into your web browser:<br>
        <a href="%s" target="_blank">%s</a>
      </div>
    `,
			template.HTMLEscapeString(recipientName),
			template.HTMLEscapeString(orgName),
			template.HTMLEscapeString(data.Subdomain),
			template.HTMLEscapeString(expiresIn),
			template.HTMLEscapeString(data.ActivationURL),
			template.HTMLEscapeString(expiresIn),
			template.HTMLEscapeString(data.ActivationURL),
			template.HTMLEscapeString(data.ActivationURL),
		)

		footerHTML = `&copy; 2026 K2NET Enterprise SaaS Platform. All rights reserved.<br>Automated notification dispatched from K2NET Security Plane (notify@kdua.net).`
	}

	tmpl, err := template.New("base").Parse(baseLayoutHTML)
	if err != nil {
		return "", "", err
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, map[string]any{
		"Lang":    lang,
		"Subject": subject,
		"Body":    template.HTML(bodyHTML),
		"Footer":  template.HTML(footerHTML),
	})
	if err != nil {
		return "", "", err
	}

	return subject, buf.String(), nil
}

// RenderPasswordResetEmail generates localized subject and HTML email for password recovery.
func RenderPasswordResetEmail(data PasswordResetEmailData) (string, string, error) {
	lang := strings.ToLower(strings.TrimSpace(data.Lang))
	if lang != "id" {
		lang = "en"
	}

	recipientName := strings.TrimSpace(data.RecipientName)
	if recipientName == "" {
		if lang == "id" {
			recipientName = "Pengguna"
		} else {
			recipientName = "User"
		}
	}

	expiresIn := strings.TrimSpace(data.ExpiresIn)
	if expiresIn == "" {
		if lang == "id" {
			expiresIn = "15 menit"
		} else {
			expiresIn = "15 minutes"
		}
	}

	var subject string
	var bodyHTML string
	var footerHTML string

	if lang == "id" {
		subject = "[K2NET] Atur Ulang Kata Sandi Akun Anda"
		ipRow := ""
		if data.ClientIP != "" {
			ipRow = fmt.Sprintf(`<div class="info-row"><span class="info-label">Alamat IP Pemohon:</span> <span class="info-value">%s</span></div>`, template.HTMLEscapeString(data.ClientIP))
		}

		bodyHTML = fmt.Sprintf(`
      <div class="greeting">Halo, %s</div>
      <p>Kami menerima permintaan untuk mengatur ulang kata sandi akun K2NET Anda.</p>
      
      <div class="info-box">
        <div class="info-row"><span class="info-label">Masa Berlaku Tautan:</span> <span class="info-value">%s</span></div>
        %s
      </div>

      <p>Klik tombol di bawah ini untuk membuat kata sandi baru:</p>

      <div class="cta-container">
        <a href="%s" target="_blank" class="btn">Atur Ulang Kata Sandi</a>
      </div>

      <div class="security-notice">
        <strong>Pemberitahuan Keamanan:</strong> Tautan ini hanya berlaku selama %s dan akan otomatis kedaluwarsa setelah digunakan. Jika Anda tidak merasa meminta pengaturan ulang kata sandi, abaikan email ini &mdash; akun Anda tetap aman.
      </div>

      <div class="fallback-link">
        Jika tombol di atas tidak dapat diklik, salin dan tempel tautan berikut ke peramban web Anda:<br>
        <a href="%s" target="_blank">%s</a>
      </div>
    `,
			template.HTMLEscapeString(recipientName),
			template.HTMLEscapeString(expiresIn),
			ipRow,
			template.HTMLEscapeString(data.ResetURL),
			template.HTMLEscapeString(expiresIn),
			template.HTMLEscapeString(data.ResetURL),
			template.HTMLEscapeString(data.ResetURL),
		)

		footerHTML = `&copy; 2026 K2NET Enterprise SaaS Platform. Hak cipta dilindungi undang-undang.<br>Email otomatis dari sistem otentikasi K2NET (notify@kdua.net).`
	} else {
		subject = "[K2NET] Reset Your Account Password"
		ipRow := ""
		if data.ClientIP != "" {
			ipRow = fmt.Sprintf(`<div class="info-row"><span class="info-label">Requesting IP:</span> <span class="info-value">%s</span></div>`, template.HTMLEscapeString(data.ClientIP))
		}

		bodyHTML = fmt.Sprintf(`
      <div class="greeting">Hello, %s</div>
      <p>We received a request to reset the password for your K2NET account.</p>
      
      <div class="info-box">
        <div class="info-row"><span class="info-label">Link Validity:</span> <span class="info-value">%s</span></div>
        %s
      </div>

      <p>Click the button below to choose a new password:</p>

      <div class="cta-container">
        <a href="%s" target="_blank" class="btn">Reset Password</a>
      </div>

      <div class="security-notice">
        <strong>Security Notice:</strong> This link is valid for %s and will expire immediately after use. If you did not request a password reset, you can safely ignore this email &mdash; your account remains secure.
      </div>

      <div class="fallback-link">
        If the button above does not work, copy and paste this URL into your web browser:<br>
        <a href="%s" target="_blank">%s</a>
      </div>
    `,
			template.HTMLEscapeString(recipientName),
			template.HTMLEscapeString(expiresIn),
			ipRow,
			template.HTMLEscapeString(data.ResetURL),
			template.HTMLEscapeString(expiresIn),
			template.HTMLEscapeString(data.ResetURL),
			template.HTMLEscapeString(data.ResetURL),
		)

		footerHTML = `&copy; 2026 K2NET Enterprise SaaS Platform. All rights reserved.<br>Automated notification dispatched from K2NET Security Plane (notify@kdua.net).`
	}

	tmpl, err := template.New("base").Parse(baseLayoutHTML)
	if err != nil {
		return "", "", err
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, map[string]any{
		"Lang":    lang,
		"Subject": subject,
		"Body":    template.HTML(bodyHTML),
		"Footer":  template.HTML(footerHTML),
	})
	if err != nil {
		return "", "", err
	}

	return subject, buf.String(), nil
}

// MfaOtpEmailData holds parameters for rendering MFA 6-digit OTP verification email
type MfaOtpEmailData struct {
	RecipientName string
	OtpCode       string
	ExpiresIn     string
	ClientIP      string
	Lang          string
}

// RenderMfaOtpEmail generates localized subject and HTML email for MFA step-up verification.
func RenderMfaOtpEmail(data MfaOtpEmailData) (string, string, error) {
	lang := strings.ToLower(strings.TrimSpace(data.Lang))
	if lang != "id" {
		lang = "en"
	}

	recipientName := strings.TrimSpace(data.RecipientName)
	if recipientName == "" {
		if lang == "id" {
			recipientName = "Pengguna K2NET"
		} else {
			recipientName = "K2NET User"
		}
	}

	expiresIn := strings.TrimSpace(data.ExpiresIn)
	if expiresIn == "" {
		if lang == "id" {
			expiresIn = "5 menit"
		} else {
			expiresIn = "5 minutes"
		}
	}

	otpCode := strings.TrimSpace(data.OtpCode)
	if otpCode == "" {
		otpCode = "000000"
	}

	var subject string
	var bodyHTML string
	var footerHTML string

	var ipRow string
	if strings.TrimSpace(data.ClientIP) != "" {
		label := "Alamat IP Peminta"
		if lang != "id" {
			label = "Requesting IP Address"
		}
		ipRow = fmt.Sprintf(`
      <table class="detail-table">
        <tr>
          <td class="detail-label">%s</td>
          <td class="detail-value mono">%s</td>
        </tr>
      </table>`, label, template.HTMLEscapeString(data.ClientIP))
	}

	if lang == "id" {
		subject = fmt.Sprintf("[K2NET FTTH] Kode Verifikasi Masuk (MFA OTP): %s", otpCode)
		bodyHTML = fmt.Sprintf(`
      <h1>Verifikasi Dua Langkah (MFA)</h1>
      <p>Halo <strong>%s</strong>,</p>
      <p>Kami mendeteksi permintaan masuk ke akun Anda. Gunakan kode verifikasi 6 digit di bawah ini untuk melanjutkan:</p>

      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #10b981; background-color: #18181b; border: 1px solid #27272a; padding: 14px 28px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
          %s
        </div>
      </div>

      %s

      <div class="security-notice">
        <strong>Pemberitahuan Keamanan:</strong> Kode ini hanya berlaku selama <strong>%s</strong> dan langsung hangus setelah digunakan 1x. Jangan pernah membagikan kode verifikasi ini kepada siapa pun, termasuk staf K2NET. Jika Anda tidak merasa mencoba masuk, segera amankan kata sandi akun Anda.
      </div>
    `,
			template.HTMLEscapeString(recipientName),
			template.HTMLEscapeString(otpCode),
			ipRow,
			template.HTMLEscapeString(expiresIn),
		)

		footerHTML = `&copy; 2026 K2NET Enterprise SaaS Platform. Hak cipta dilindungi undang-undang.<br>Pemberitahuan otomatis dikirim dari K2NET Security Plane (notify@kdua.net).`
	} else {
		subject = fmt.Sprintf("[K2NET FTTH] Login Verification Code (MFA OTP): %s", otpCode)
		bodyHTML = fmt.Sprintf(`
      <h1>Two-Factor Verification (MFA)</h1>
      <p>Hello <strong>%s</strong>,</p>
      <p>We received a sign-in request to your account. Enter the 6-digit verification code below to complete your login:</p>

      <div style="margin: 28px 0; text-align: center;">
        <div style="display: inline-block; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #10b981; background-color: #18181b; border: 1px solid #27272a; padding: 14px 28px; border-radius: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
          %s
        </div>
      </div>

      %s

      <div class="security-notice">
        <strong>Security Notice:</strong> This code is valid for <strong>%s</strong> and expires immediately after use. Never share this code with anyone, including K2NET staff. If you did not initiate this login, please secure your password immediately.
      </div>
    `,
			template.HTMLEscapeString(recipientName),
			template.HTMLEscapeString(otpCode),
			ipRow,
			template.HTMLEscapeString(expiresIn),
		)

		footerHTML = `&copy; 2026 K2NET Enterprise SaaS Platform. All rights reserved.<br>Automated notification dispatched from K2NET Security Plane (notify@kdua.net).`
	}

	tmpl, err := template.New("base").Parse(baseLayoutHTML)
	if err != nil {
		return "", "", err
	}

	var buf bytes.Buffer
	err = tmpl.Execute(&buf, map[string]any{
		"Lang":    lang,
		"Subject": subject,
		"Body":    template.HTML(bodyHTML),
		"Footer":  template.HTML(footerHTML),
	})
	if err != nil {
		return "", "", err
	}

	return subject, buf.String(), nil
}
