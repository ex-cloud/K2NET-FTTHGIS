package audit

import (
	"strings"
)

var sensitiveKeys = map[string]bool{
	"password":       true,
	"passwd":         true,
	"secret":         true,
	"token":          true,
	"accesstoken":    true,
	"refreshtoken":   true,
	"authorization":  true,
	"auth":           true,
	"apikey":         true,
	"api_key":        true,
	"creditcard":     true,
	"credit_card":    true,
	"cardnumber":     true,
	"cvv":            true,
	"cvc":            true,
	"nik":            true,
	"privatekey":     true,
	"private_key":    true,
	"client_secret":  true,
	"gateway_token":  true,
	"pin":            true,
}

// SanitizeMap recursively redacts sensitive fields from JSON maps
func SanitizeMap(input map[string]any) map[string]any {
	if input == nil {
		return nil
	}
	output := make(map[string]any, len(input))
	for k, v := range input {
		lowerKey := strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(k, "-", ""), "_", ""))
		if sensitiveKeys[lowerKey] {
			output[k] = "[REDACTED]"
			continue
		}

		switch val := v.(type) {
		case map[string]any:
			output[k] = SanitizeMap(val)
		case []any:
			output[k] = sanitizeSlice(val)
		case string:
			if isSensitiveStringPattern(val) {
				output[k] = "[REDACTED]"
			} else {
				output[k] = val
			}
		default:
			output[k] = val
		}
	}
	return output
}

func sanitizeSlice(slice []any) []any {
	out := make([]any, len(slice))
	for i, v := range slice {
		switch val := v.(type) {
		case map[string]any:
			out[i] = SanitizeMap(val)
		case []any:
			out[i] = sanitizeSlice(val)
		case string:
			if isSensitiveStringPattern(val) {
				out[i] = "[REDACTED]"
			} else {
				out[i] = val
			}
		default:
			out[i] = val
		}
	}
	return out
}

func isSensitiveStringPattern(s string) bool {
	// Redact bearer tokens in strings
	if strings.HasPrefix(strings.ToLower(s), "bearer eyj") {
		return true
	}
	return false
}
