package delivery

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"net"
	"net/mail"
	"net/smtp"
	"os"
	"strconv"
	"strings"
	"time"

	"gateways/shared/logger"
	"go.uber.org/zap"
)

// EmailSender defines the interface for sending transactional emails via SMTP
type EmailSender interface {
	Send(ctx context.Context, to, subject, htmlBody string) error
	IsConfigured() bool
}

// loginAuth implements smtp.Auth for servers requesting the LOGIN auth mechanism (e.g. cPanel Exim)
type loginAuth struct {
	username, password string
}

func LoginAuth(username, password string) smtp.Auth {
	return &loginAuth{username: username, password: password}
}

func (a *loginAuth) Start(server *smtp.ServerInfo) (string, []byte, error) {
	return "LOGIN", []byte(a.username), nil
}

func (a *loginAuth) Next(fromServer []byte, more bool) ([]byte, error) {
	if more {
		challenge := strings.ToLower(strings.TrimSpace(string(fromServer)))
		if strings.HasPrefix(challenge, "username") {
			return []byte(a.username), nil
		} else if strings.HasPrefix(challenge, "password") {
			return []byte(a.password), nil
		}
		return []byte(a.password), nil
	}
	return nil, nil
}

// SMTPEmailSender implements EmailSender using standard SMTP with SSL/TLS support
type SMTPEmailSender struct {
	host     string
	port     int
	user     string
	password string
	from     string
	secure   bool
}

// getEnvWithFallback retrieves an environment setting from process env, falling back to the .env file
func getEnvWithFallback(key string) string {
	val := os.Getenv(key)
	if val != "" {
		return val
	}
	envPath := os.Getenv("ENV_FILE_PATH")
	if envPath == "" {
		envPath = "/opt/project5/services/.env"
	}
	content, err := os.ReadFile(envPath)
	if err != nil {
		content, err = os.ReadFile("/etc/ftth/gateways.env")
		if err != nil {
			return ""
		}
	}
	lines := strings.Split(string(content), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, key+"=") {
			return strings.TrimSpace(strings.TrimPrefix(line, key+"="))
		}
	}
	return ""
}

// NewSMTPEmailSender creates a new SMTPEmailSender reading configuration from environment
func NewSMTPEmailSender() *SMTPEmailSender {
	host := getEnvWithFallback("SMTP_HOST")
	portStr := getEnvWithFallback("SMTP_PORT")
	port := 465
	if p, err := strconv.Atoi(portStr); err == nil && p > 0 {
		port = p
	}
	user := getEnvWithFallback("SMTP_USER")
	password := getEnvWithFallback("SMTP_PASSWORD")
	from := getEnvWithFallback("SMTP_FROM")
	if from == "" {
		from = "K2NET Cloud Security <notify@kdua.net>"
	}
	secure := getEnvWithFallback("SMTP_SECURE") == "true" || port == 465

	return &SMTPEmailSender{
		host:     host,
		port:     port,
		user:     user,
		password: password,
		from:     from,
		secure:   secure,
	}
}

// IsConfigured returns true if minimum SMTP credentials are present
func (s *SMTPEmailSender) IsConfigured() bool {
	return s.host != "" && s.user != "" && s.password != ""
}

// extractEmailAddress parses an email address from formats like "Name <email@domain.com>" or "email@domain.com"
func extractEmailAddress(raw string) string {
	addr, err := mail.ParseAddress(raw)
	if err == nil {
		return addr.Address
	}
	return strings.TrimSpace(raw)
}

// dialSMTPClient opens a fresh SMTP/SMTPS connection and negotiates EHLO
func (s *SMTPEmailSender) dialSMTPClient(addr string) (*smtp.Client, error) {
	if s.port == 465 || s.secure {
		tlsConfig := &tls.Config{
			ServerName: s.host,
			MinVersion: tls.VersionTLS12,
		}
		dialer := &net.Dialer{Timeout: 15 * time.Second}
		conn, err := tls.DialWithDialer(dialer, "tcp", addr, tlsConfig)
		if err != nil {
			return nil, fmt.Errorf("SMTP TLS dial failed: %w", err)
		}
		c, err := smtp.NewClient(conn, s.host)
		if err != nil {
			_ = conn.Close()
			return nil, fmt.Errorf("SMTP client initialization failed: %w", err)
		}
		_ = c.Hello("kdua.net")
		return c, nil
	}

	conn, err := net.DialTimeout("tcp", addr, 15*time.Second)
	if err != nil {
		return nil, fmt.Errorf("SMTP dial failed: %w", err)
	}
	c, err := smtp.NewClient(conn, s.host)
	if err != nil {
		_ = conn.Close()
		return nil, fmt.Errorf("SMTP client initialization failed: %w", err)
	}
	_ = c.Hello("kdua.net")

	if ok, _ := c.Extension("STARTTLS"); ok {
		tlsConfig := &tls.Config{
			ServerName: s.host,
			MinVersion: tls.VersionTLS12,
		}
		if err := c.StartTLS(tlsConfig); err != nil {
			_ = c.Close()
			return nil, fmt.Errorf("STARTTLS negotiation failed: %w", err)
		}
	}
	return c, nil
}

func isTransientNetworkError(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "connection reset by peer") ||
		strings.Contains(msg, "broken pipe") ||
		strings.Contains(msg, "eof") ||
		strings.Contains(msg, "i/o timeout") ||
		strings.Contains(msg, "connection refused")
}

// Send dispatches an HTML email to the specified recipient with automatic retry on transient socket resets
func (s *SMTPEmailSender) Send(ctx context.Context, to, subject, htmlBody string) error {
	if !s.IsConfigured() {
		return errors.New("SMTP gateway is not configured (missing SMTP_HOST, SMTP_USER, or SMTP_PASSWORD)")
	}

	fromAddr := extractEmailAddress(s.from)
	toAddr := extractEmailAddress(to)
	if toAddr == "" {
		return errors.New("recipient email address is invalid")
	}

	addr := net.JoinHostPort(s.host, strconv.Itoa(s.port))
	logger.Info(ctx, "Connecting to SMTP server",
		zap.String("host", s.host),
		zap.Int("port", s.port),
		zap.String("to", toAddr),
		zap.Bool("secure", s.secure))

	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		if attempt > 1 {
			time.Sleep(time.Duration(attempt*600) * time.Millisecond)
		}
		err := s.sendOnce(ctx, addr, fromAddr, toAddr, to, subject, htmlBody)
		if err == nil {
			logger.Info(ctx, "Email delivered successfully via SMTP",
				zap.String("host", s.host),
				zap.String("to", toAddr),
				zap.String("subject", subject),
				zap.Int("attempt", attempt))
			return nil
		}
		lastErr = err
		if !isTransientNetworkError(err) {
			break
		}
		logger.Warn(ctx, "Transient SMTP network error detected, retrying with fresh connection",
			zap.Int("attempt", attempt),
			zap.Error(err))
	}
	return lastErr
}

func (s *SMTPEmailSender) sendOnce(ctx context.Context, addr, fromAddr, toAddr, rawTo, subject, htmlBody string) error {
	client, err := s.dialSMTPClient(addr)
	if err != nil {
		logger.Error(ctx, "Failed connection to SMTP server", zap.Error(err))
		return err
	}
	defer func() {
		if client != nil {
			_ = client.Quit()
		}
	}()

	// Authenticate (with fresh connection fallback if PlainAuth closes or resets the socket)
	if s.user != "" && s.password != "" {
		auth := smtp.PlainAuth("", s.user, s.password, s.host)
		if plainErr := client.Auth(auth); plainErr != nil {
			logger.Warn(ctx, "Plain auth failed, dialing fresh connection for LOGIN auth fallback", zap.Error(plainErr))
			_ = client.Close()
			client = nil

			time.Sleep(300 * time.Millisecond)
			freshClient, dialErr := s.dialSMTPClient(addr)
			if dialErr != nil {
				return fmt.Errorf("SMTP authentication failed (Plain: %v, Re-dial: %w)", plainErr, dialErr)
			}
			client = freshClient

			loginAuth := LoginAuth(s.user, s.password)
			if loginErr := client.Auth(loginAuth); loginErr != nil {
				return fmt.Errorf("SMTP authentication failed (Plain: %v, Login: %w)", plainErr, loginErr)
			}
		}
	}

	// Set sender and recipient
	if err := client.Mail(fromAddr); err != nil {
		return fmt.Errorf("SMTP MAIL FROM failed: %w", err)
	}
	if err := client.Rcpt(toAddr); err != nil {
		return fmt.Errorf("SMTP RCPT TO failed: %w", err)
	}

	// Write Email Headers and Body (RFC 5322 format)
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("SMTP DATA command failed: %w", err)
	}

	headers := make(map[string]string)
	headers["From"] = s.from
	headers["To"] = rawTo
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = `text/html; charset="UTF-8"`
	headers["Date"] = time.Now().Format(time.RFC1123Z)
	headers["Message-ID"] = fmt.Sprintf("<%d.%d@%s>", time.Now().UnixNano(), os.Getpid(), s.host)

	var message strings.Builder
	for k, v := range headers {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	message.WriteString("\r\n")
	message.WriteString(htmlBody)

	if _, err := w.Write([]byte(message.String())); err != nil {
		_ = w.Close()
		return fmt.Errorf("failed to write email body: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("failed to finalize SMTP DATA block: %w", err)
	}

	return nil
}
