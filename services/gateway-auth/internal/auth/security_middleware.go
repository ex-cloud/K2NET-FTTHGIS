package auth

import (
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// SecurityHeadersAndCSRFMiddleware hardens all /api/v1/auth/* responses against
// browser caching, MIME sniffing, clickjacking, and cross-site HTML form CSRF attacks.
func SecurityHeadersAndCSRFMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := c.Writer.Header()
		h.Set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
		h.Set("Pragma", "no-cache")
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		h.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

		if c.Request.Method == http.MethodPost || c.Request.Method == http.MethodPut || c.Request.Method == http.MethodDelete || c.Request.Method == http.MethodPatch {
			ct := strings.ToLower(strings.TrimSpace(c.GetHeader("Content-Type")))
			// Reject simple HTML <form> Content-Types to block cross-site form POST CSRF
			if strings.HasPrefix(ct, "application/x-www-form-urlencoded") ||
				strings.HasPrefix(ct, "multipart/form-data") ||
				strings.HasPrefix(ct, "text/plain") {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
					"error":   "CSRF_REJECTED",
					"message": "Permintaan lintas situs (form-encoded) ditolak.",
				})
				return
			}

			// Validate Origin header when sent by browsers
			if origin := strings.TrimSpace(c.GetHeader("Origin")); origin != "" {
				if !isTrustedOrigin(origin, c.Request.Host) {
					c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
						"error":   "CSRF_ORIGIN_MISMATCH",
						"message": "Asal permintaan (Origin) tidak diizinkan.",
					})
					return
				}
			}
		}

		c.Next()
	}
}

func isTrustedOrigin(rawOrigin, requestHost string) bool {
	parsed, err := url.Parse(rawOrigin)
	if err != nil || parsed.Host == "" {
		return false
	}
	originHost := strings.ToLower(parsed.Hostname())
	reqHostname := strings.ToLower(strings.Split(requestHost, ":")[0])

	if originHost == reqHostname {
		return true
	}
	if (originHost == "localhost" || originHost == "127.0.0.1") && (reqHostname == "localhost" || reqHostname == "127.0.0.1") {
		return true
	}
	if strings.HasSuffix(originHost, ".kdua.net") && (reqHostname == "kdua.net" || strings.HasSuffix(reqHostname, ".kdua.net")) {
		return true
	}
	return false
}

type ipBucket struct {
	count     int
	expiresAt time.Time
}

// PerIPRateLimitMiddleware enforces a sliding window per-IP rate limit on sensitive auth mutation endpoints.
func PerIPRateLimitMiddleware(maxRequests int, window time.Duration) gin.HandlerFunc {
	var (
		mu      sync.Mutex
		buckets = make(map[string]ipBucket)
		ops     uint64
	)

	return func(c *gin.Context) {
		ip := resolveClientIP(c)
		if ip == "" {
			ip = "unknown"
		}
		now := time.Now()

		mu.Lock()
		ops++
		if ops%256 == 0 {
			for k, b := range buckets {
				if now.After(b.expiresAt) {
					delete(buckets, k)
				}
			}
		}
		b, exists := buckets[ip]
		if !exists || now.After(b.expiresAt) {
			buckets[ip] = ipBucket{
				count:     1,
				expiresAt: now.Add(window),
			}
			mu.Unlock()
			c.Next()
			return
		}
		if b.count >= maxRequests {
			mu.Unlock()
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "RATE_LIMITED",
				"message": "Terlalu banyak percobaan autentikasi. Silakan tunggu beberapa saat.",
			})
			return
		}
		b.count++
		buckets[ip] = b
		mu.Unlock()

		c.Next()
	}
}

