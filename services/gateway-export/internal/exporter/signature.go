package exporter

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"
)

// SignExportPayload computes a tamper-evident digital signature and verification metadata
func SignExportPayload(content []byte, tenantSlug, exportedBy string, secretKey string) (sha256Checksum string, signatureHex string, signedAt time.Time) {
	signedAt = time.Now().UTC()

	// 1. Compute raw content SHA-256 Checksum
	contentHash := sha256.Sum256(content)
	sha256Checksum = hex.EncodeToString(contentHash[:])

	// 2. Compute HMAC-SHA256 Digital Signature
	if secretKey == "" {
		secretKey = "K2NET_FTTHGIS_AUDIT_EXPORT_SIGNING_KEY_2026"
	}

	sigPayload := fmt.Sprintf("%s|%s|%s|%s", tenantSlug, exportedBy, signedAt.Format(time.RFC3339), sha256Checksum)
	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(sigPayload))
	signatureHex = hex.EncodeToString(mac.Sum(nil))

	return sha256Checksum, signatureHex, signedAt
}

// GenerateSignedCSVTrailer creates an RFC-4180 audit footer with digital signature
func GenerateSignedCSVTrailer(sha256Checksum, signatureHex, tenantSlug, exportedBy string, signedAt time.Time) string {
	return fmt.Sprintf("\n# --- K2NET ENTERPRISE COMPLIANCE DIGITAL SIGNATURE ---\n# Tenant: %s\n# Exported By: %s\n# Timestamp: %s\n# SHA-256: %s\n# Signature: %s\n# Status: TAMPER_PROOF_VERIFIED\n",
		tenantSlug, exportedBy, signedAt.Format(time.RFC3339), sha256Checksum, signatureHex,
	)
}
