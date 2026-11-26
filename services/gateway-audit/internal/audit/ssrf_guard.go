package audit

import (
	"context"
	"errors"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

var blockedInternalHosts = map[string]bool{
	"localhost":           true,
	"host.docker.internal": true,
	"backend":             true,
	"ftth-backend":        true,
	"postgres":            true,
	"ftth-postgres":       true,
	"keycloak":            true,
	"redis":               true,
	"ftth-redis":          true,
	"kong":                true,
	"traefik":             true,
	"prometheus":          true,
	"grafana":             true,
	"poller":              true,
	"minio":               true,
	"minio-api":           true,
	"minio-console":       true,
	"studio-admin":        true,
	"studio-tenant":       true,
}

var blockedHostPatterns = []string{
	"-gateway",
	"gateway-",
	"ftth-",
}

// ValidateWebhookURL enforces HTTPS, rejects Docker/internal hostnames, and rejects
// private/loopback/link-local/cloud-metadata IP addresses to prevent SSRF attacks.
func ValidateWebhookURL(rawURL string) error {
	trimmed := strings.TrimSpace(rawURL)
	if trimmed == "" {
		return errors.New("webhook URL cannot be empty")
	}

	parsed, err := url.Parse(trimmed)
	if err != nil {
		return fmt.Errorf("invalid webhook URL format: %w", err)
	}

	if !strings.EqualFold(parsed.Scheme, "https") {
		return fmt.Errorf("SSRF guard: only HTTPS scheme is permitted (got %q)", parsed.Scheme)
	}

	if parsed.User != nil {
		return errors.New("SSRF guard: credentials inside webhook URL are not permitted")
	}

	host := strings.ToLower(strings.TrimSpace(parsed.Hostname()))
	if host == "" {
		return errors.New("SSRF guard: empty hostname in webhook URL")
	}

	if blockedInternalHosts[host] || strings.HasSuffix(host, ".local") || strings.HasSuffix(host, ".internal") {
		return fmt.Errorf("SSRF guard: internal host %q is forbidden", host)
	}
	for _, pat := range blockedHostPatterns {
		if strings.Contains(host, pat) {
			return fmt.Errorf("SSRF guard: internal service host %q is forbidden", host)
		}
	}

	// Literal IP check
	if literalIP := net.ParseIP(host); literalIP != nil {
		if isRestrictedIP(literalIP) {
			return fmt.Errorf("SSRF guard: restricted IP %q is forbidden", literalIP.String())
		}
		return nil
	}

	if !strings.Contains(host, ".") {
		return fmt.Errorf("SSRF guard: single-label hostname %q is not a valid FQDN", host)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	ips, err := net.DefaultResolver.LookupIP(ctx, "ip", host)
	if err != nil {
		return fmt.Errorf("DNS lookup failed for %q: %w", host, err)
	}
	if len(ips) == 0 {
		return fmt.Errorf("DNS lookup returned no IP addresses for %q", host)
	}
	for _, ip := range ips {
		if isRestrictedIP(ip) {
			return fmt.Errorf("SSRF guard: host %q resolved to restricted IP %s", host, ip.String())
		}
	}

	return nil
}

func isRestrictedIP(ip net.IP) bool {
	if ip == nil {
		return true
	}
	if ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast() || ip.IsLinkLocalMulticast() || ip.IsMulticast() || ip.IsUnspecified() {
		return true
	}
	if ip4 := ip.To4(); ip4 != nil {
		// 0.0.0.0/8, 100.64.0.0/10 (CGNAT), 169.254.0.0/16 (Metadata), 224.0.0.0/4+
		if ip4[0] == 0 || ip4[0] == 127 || ip4[0] == 10 {
			return true
		}
		if ip4[0] == 172 && ip4[1] >= 16 && ip4[1] <= 31 {
			return true
		}
		if ip4[0] == 192 && ip4[1] == 168 {
			return true
		}
		if ip4[0] == 169 && ip4[1] == 254 {
			return true
		}
		if ip4[0] == 100 && ip4[1] >= 64 && ip4[1] <= 127 {
			return true
		}
		if ip4[0] >= 224 {
			return true
		}
	}
	return false
}

// NewSafeWebhookHTTPClient builds an HTTP client that prevents DNS rebinding
// (by validating the resolved IP at dial time) and blocks HTTP redirects.
func NewSafeWebhookHTTPClient(timeout time.Duration) *http.Client {
	dialer := &net.Dialer{
		Timeout:   3 * time.Second,
		KeepAlive: 15 * time.Second,
	}

	transport := &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			host, port, err := net.SplitHostPort(addr)
			if err != nil {
				return nil, err
			}
			ips, err := net.DefaultResolver.LookupIP(ctx, "ip", host)
			if err != nil {
				return nil, err
			}
			for _, ip := range ips {
				if isRestrictedIP(ip) {
					return nil, fmt.Errorf("SSRF dial guard: restricted IP %s rejected for %s", ip.String(), host)
				}
			}
			if len(ips) == 0 {
				return nil, fmt.Errorf("SSRF dial guard: no IP resolved for %s", host)
			}
			return dialer.DialContext(ctx, network, net.JoinHostPort(ips[0].String(), port))
		},
	}

	return &http.Client{
		Timeout:   timeout,
		Transport: transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return errors.New("SSRF guard: HTTP redirects are disabled for security webhooks")
		},
	}
}
