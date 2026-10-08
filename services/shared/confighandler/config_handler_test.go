package confighandler

import (
	"testing"
)

func TestCensorValue(t *testing.T) {
	tests := []struct {
		name     string
		key      string
		value    string
		expected string
	}{
		{
			name:     "Empty value",
			key:      "SOME_KEY",
			value:    "",
			expected: "",
		},
		{
			name:     "Database URL postgres format",
			key:      "DATABASE_URL",
			value:    "postgres://postgres:secretpassword@ftth-postgres:5432/ftth_gis",
			expected: "postgres://postgres:••••••••@ftth-postgres:5432/ftth_gis",
		},
		{
			name:     "Sensitive short token (<= 8 chars)",
			key:      "GATEWAY_TOKEN",
			value:    "secret12",
			expected: "••••••••",
		},
		{
			name:     "Sensitive long token (> 8 chars)",
			key:      "WA_ACCESS_TOKEN",
			value:    "EAAB1234567890XYZ",
			expected: "EAAB••••••••0XYZ",
		},
		{
			name:     "Non-sensitive normal setting",
			key:      "APP_NAME",
			value:    "K2NET FTTH GIS",
			expected: "K2NET FTTH GIS",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := censorValue(tt.key, tt.value)
			if got != tt.expected {
				t.Errorf("censorValue(%q, %q) = %q; want %q", tt.key, tt.value, got, tt.expected)
			}
		})
	}
}

func TestAllowedKeysWhitelist(t *testing.T) {
	requiredKeys := []string{
		"DATABASE_URL",
		"GATEWAY_TOKEN",
		"REDIS_ADDR",
		"TWILIO_ACCOUNT_SID",
		"XENDIT_API_KEY",
		"WA_API_URL",
	}

	for _, k := range requiredKeys {
		if !allowedKeys[k] {
			t.Errorf("expected key %q to be in allowedKeys whitelist", k)
		}
	}

	forbiddenKeys := []string{
		"MALICIOUS_CMD",
		"ROOT_PASSWORD",
		"PATH",
	}

	for _, k := range forbiddenKeys {
		if allowedKeys[k] {
			t.Errorf("expected forbidden key %q to NOT be in allowedKeys whitelist", k)
		}
	}
}
