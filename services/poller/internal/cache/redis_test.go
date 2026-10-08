package cache

import (
	"encoding/json"
	"testing"
	"time"
)

func TestDeviceStatusSerialization(t *testing.T) {
	now := time.Now().UTC()
	status := &DeviceStatus{
		Code:   "OLT-BDG-01",
		Status: "UP",
		Metrics: map[string]interface{}{
			"temperature": 42.5,
			"onu_count":   128,
		},
		Timestamp: now,
	}

	data, err := json.Marshal(status)
	if err != nil {
		t.Fatalf("failed to marshal DeviceStatus: %v", err)
	}

	var decoded DeviceStatus
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("failed to unmarshal DeviceStatus: %v", err)
	}

	if decoded.Code != "OLT-BDG-01" {
		t.Errorf("expected code OLT-BDG-01, got %q", decoded.Code)
	}
	if decoded.Status != "UP" {
		t.Errorf("expected status UP, got %q", decoded.Status)
	}
}
