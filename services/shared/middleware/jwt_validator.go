package middleware

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// JWK represents a single JSON Web Key
type JWK struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Alg string `json:"alg"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
}

// JWKS represents a JSON Web Key Set
type JWKS struct {
	Keys []JWK `json:"keys"`
}

// CachedJWKS stores parsed RSA public keys per realm
type CachedJWKS struct {
	Keys      map[string]*rsa.PublicKey
	FetchedAt time.Time
}

var (
	jwksCache   = make(map[string]*CachedJWKS)
	jwksCacheMu sync.RWMutex
	cacheTTL    = 1 * time.Hour
)

// JWTHeader represents the header of a JWT
type JWTHeader struct {
	Alg string `json:"alg"`
	Kid string `json:"kid"`
	Typ string `json:"typ"`
}

// JWTClaims represents standard & Keycloak claims
type JWTClaims struct {
	Sub               string   `json:"sub"`
	Iss               string   `json:"iss"`
	Exp               int64    `json:"exp"`
	Email             string   `json:"email"`
	PreferredUsername string   `json:"preferred_username"`
	TenantID          string   `json:"tenant_id"`
	OrganizationID    string   `json:"organization_id"`
	TenantSlug        string   `json:"tenant_slug"`
	RealmAccess       struct {
		Roles []string `json:"roles"`
	} `json:"realm_access"`
}

func getKeycloakBaseURL() string {
	url := os.Getenv("KEYCLOAK_INTERNAL_URL")
	if url == "" {
		url = os.Getenv("AUTH_KEYCLOAK_INTERNAL_URL")
	}
	if url == "" {
		url = "http://keycloak:8081"
	}
	return strings.TrimRight(url, "/")
}

// decodeBase64URL safely decodes base64url encoded strings
func decodeBase64URL(seg string) ([]byte, error) {
	rem := len(seg) % 4
	if rem == 2 {
		seg += "=="
	} else if rem == 3 {
		seg += "="
	}
	return base64.URLEncoding.DecodeString(seg)
}

// parseRSAPublicKey converts JWK modulus (n) and exponent (e) to an rsa.PublicKey
func parseRSAPublicKey(nStr, eStr string) (*rsa.PublicKey, error) {
	nBytes, err := decodeBase64URL(nStr)
	if err != nil {
		return nil, fmt.Errorf("invalid n (modulus): %w", err)
	}

	eBytes, err := decodeBase64URL(eStr)
	if err != nil {
		return nil, fmt.Errorf("invalid e (exponent): %w", err)
	}

	var eInt int
	for _, b := range eBytes {
		eInt = (eInt << 8) | int(b)
	}

	n := new(big.Int).SetBytes(nBytes)
	return &rsa.PublicKey{
		N: n,
		E: eInt,
	}, nil
}

// fetchJWKS fetches and caches JWKS for a specific realm
func fetchJWKS(realm string) (*CachedJWKS, error) {
	jwksCacheMu.RLock()
	cached, ok := jwksCache[realm]
	if ok && time.Since(cached.FetchedAt) < cacheTTL {
		jwksCacheMu.RUnlock()
		return cached, nil
	}
	jwksCacheMu.RUnlock()

	jwksCacheMu.Lock()
	defer jwksCacheMu.Unlock()

	// Double check
	if cached, ok := jwksCache[realm]; ok && time.Since(cached.FetchedAt) < cacheTTL {
		return cached, nil
	}

	jwksURL := fmt.Sprintf("%s/realms/%s/protocol/openid-connect/certs", getKeycloakBaseURL(), realm)
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(jwksURL)
	if err != nil {
		return nil, fmt.Errorf("failed to reach Keycloak JWKS endpoint (%s): %w", jwksURL, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Keycloak JWKS endpoint returned status %d for realm %s", resp.StatusCode, realm)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read JWKS body: %w", err)
	}

	var jwks JWKS
	if err := json.Unmarshal(body, &jwks); err != nil {
		return nil, fmt.Errorf("failed to parse JWKS JSON: %w", err)
	}

	parsedKeys := make(map[string]*rsa.PublicKey)
	for _, key := range jwks.Keys {
		if key.Kty == "RSA" && key.Use == "sig" && key.Kid != "" {
			pubKey, err := parseRSAPublicKey(key.N, key.E)
			if err == nil {
				parsedKeys[key.Kid] = pubKey
			}
		}
	}

	newCached := &CachedJWKS{
		Keys:      parsedKeys,
		FetchedAt: time.Now(),
	}
	jwksCache[realm] = newCached
	return newCached, nil
}

// ExtractRealmFromIssuer parses the realm name from an issuer URL
func ExtractRealmFromIssuer(iss string) string {
	parts := strings.Split(strings.TrimRight(iss, "/"), "/")
	if len(parts) > 0 {
		return parts[len(parts)-1]
	}
	return "ftth-realm"
}

// VerifyJWT validates an RS256 JWT against dynamic Keycloak JWKS and returns verified claims
func VerifyJWT(tokenString string) (*JWTClaims, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("malformed JWT: expected 3 parts, got %d", len(parts))
	}

	// 1. Decode Header
	headerBytes, err := decodeBase64URL(parts[0])
	if err != nil {
		return nil, fmt.Errorf("failed to decode header: %w", err)
	}
	var header JWTHeader
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return nil, fmt.Errorf("failed to parse header JSON: %w", err)
	}

	if header.Alg != "RS256" {
		return nil, fmt.Errorf("unsupported algorithm: %s, only RS256 is permitted", header.Alg)
	}

	// 2. Decode Claims
	claimsBytes, err := decodeBase64URL(parts[1])
	if err != nil {
		return nil, fmt.Errorf("failed to decode claims: %w", err)
	}
	var claims JWTClaims
	if err := json.Unmarshal(claimsBytes, &claims); err != nil {
		return nil, fmt.Errorf("failed to parse claims JSON: %w", err)
	}

	// 3. Expiration Check
	now := time.Now().Unix()
	if claims.Exp > 0 && claims.Exp < now {
		return nil, fmt.Errorf("token expired at %d, current time is %d", claims.Exp, now)
	}

	// 4. Fetch JWKS for the Realm in Issuer
	realm := ExtractRealmFromIssuer(claims.Iss)
	cachedKeys, err := fetchJWKS(realm)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve public keys for realm %s: %w", realm, err)
	}

	pubKey, exists := cachedKeys.Keys[header.Kid]
	if !exists {
		// Try refreshing cache once in case key was recently rotated
		jwksCacheMu.Lock()
		delete(jwksCache, realm)
		jwksCacheMu.Unlock()

		refreshed, err := fetchJWKS(realm)
		if err == nil {
			pubKey, exists = refreshed.Keys[header.Kid]
		}
		if !exists {
			return nil, fmt.Errorf("key ID '%s' not found in realm '%s' JWKS", header.Kid, realm)
		}
	}

	// 5. Verify Cryptographic Signature RS256
	signedData := parts[0] + "." + parts[1]
	sigBytes, err := decodeBase64URL(parts[2])
	if err != nil {
		return nil, fmt.Errorf("failed to decode signature: %w", err)
	}

	hasher := sha256.New()
	hasher.Write([]byte(signedData))
	hashed := hasher.Sum(nil)

	if err := rsa.VerifyPKCS1v15(pubKey, crypto.SHA256, hashed, sigBytes); err != nil {
		return nil, fmt.Errorf("cryptographic signature verification failed: %w", err)
	}

	return &claims, nil
}

// ZeroTrustJWTAuthMiddleware provides cryptographic JWT verification for all Go microservices
func ZeroTrustJWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			// Check if X-Gateway-Token is provided for internal machine-to-machine calls
			gwToken := c.GetHeader("X-Gateway-Token")
			if gwToken != "" && gwToken == expectedToken {
				c.Next()
				return
			}

			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "UNAUTHORIZED",
				"message": "Missing or invalid Authorization header",
			})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := VerifyJWT(tokenStr)
		if err != nil {
			logger.Log.Warn("Zero-Trust JWT verification rejected request",
				zap.String("path", c.Request.URL.Path),
				zap.Error(err),
			)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error":   "UNAUTHORIZED",
				"message": "Invalid token signature or expired credentials",
			})
			return
		}

		// Extract Verified Tenant ID
		tenantID := claims.TenantID
		if tenantID == "" {
			tenantID = claims.OrganizationID
		}
		if tenantID == "" {
			tenantID = claims.TenantSlug
		}
		if tenantID == "" {
			realm := ExtractRealmFromIssuer(claims.Iss)
			if realm != "ftth-realm" && realm != "master" {
				tenantID = realm
			}
		}

		c.Set("tenant_id", tenantID)
		c.Set("user_id", claims.Sub)
		c.Set("user_email", claims.Email)
		c.Set("jwt_claims", claims)

		// Set upstream propagation headers
		if tenantID != "" {
			c.Request.Header.Set("X-Tenant-ID", tenantID)
		}
		if claims.Sub != "" {
			c.Request.Header.Set("X-Actor-ID", claims.Sub)
		}

		c.Next()
	}
}
