package snmp

import (
	"testing"
	"time"
)

func TestSnmpClientInitialization(t *testing.T) {
	client := NewClient("192.168.1.1", 161, "public", 2*time.Second, 3)

	if client == nil {
		t.Fatal("expected non-nil SNMP client")
	}

	if client.target != "192.168.1.1" || client.port != 161 {
		t.Errorf("unexpected target or port: %s:%d", client.target, client.port)
	}

	if client.community != "public" {
		t.Errorf("expected community public, got %q", client.community)
	}
}

func TestPollResultStructure(t *testing.T) {
	now := time.Now()
	res := PollResult{
		DeviceCode: "OLT-01",
		Status:     "DOWN",
		Metrics:    map[string]interface{}{"oid1": "val1"},
		Timestamp:  now,
	}

	if res.DeviceCode != "OLT-01" || res.Status != "DOWN" {
		t.Errorf("unexpected PollResult: %+v", res)
	}
}
