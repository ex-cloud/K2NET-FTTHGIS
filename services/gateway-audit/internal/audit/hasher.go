package audit

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

type TenantChainState struct {
	mu           sync.RWMutex
	lastHash     map[string]string // tenantSlug -> lastHash
	lastSequence map[string]int64  // tenantSlug -> lastSeq
}

var globalChainState = &TenantChainState{
	lastHash:     make(map[string]string),
	lastSequence: make(map[string]int64),
}

// ComputeEventHash computes a tamper-evident SHA-256 hash for an audit event
func ComputeEventHash(prevHash, tenantSlug, actorID, action, resourceType, resourceID string, occurredAt time.Time, oldValue, newValue, metadata map[string]any) (string, string) {
	oldJSON, _ := json.Marshal(oldValue)
	newJSON, _ := json.Marshal(newValue)
	metaJSON, _ := json.Marshal(metadata)

	payloadBytes := append(append(oldJSON, newJSON...), metaJSON...)
	payloadChecksum := sha256.Sum256(payloadBytes)
	payloadHex := hex.EncodeToString(payloadChecksum[:])

	if prevHash == "" {
		prevHash = "GENESIS_ROOT_" + tenantSlug
	}

	raw := fmt.Sprintf("%s|%s|%s|%s|%s|%s|%s|%s",
		prevHash,
		tenantSlug,
		actorID,
		action,
		resourceType,
		resourceID,
		occurredAt.UTC().Format(time.RFC3339Nano),
		payloadHex,
	)

	hash := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(hash[:]), prevHash
}

// ComputeBatchMerkleRoot computes a Merkle root hash for a slice of event hashes
func ComputeBatchMerkleRoot(hashes []string) string {
	if len(hashes) == 0 {
		return ""
	}
	if len(hashes) == 1 {
		return hashes[0]
	}

	var currentLevel = hashes
	for len(currentLevel) > 1 {
		var nextLevel []string
		for i := 0; i < len(currentLevel); i += 2 {
			if i+1 < len(currentLevel) {
				combined := currentLevel[i] + currentLevel[i+1]
				h := sha256.Sum256([]byte(combined))
				nextLevel = append(nextLevel, hex.EncodeToString(h[:]))
			} else {
				nextLevel = append(nextLevel, currentLevel[i])
			}
		}
		currentLevel = nextLevel
	}
	return currentLevel[0]
}
