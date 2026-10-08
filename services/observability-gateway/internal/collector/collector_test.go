package collector

import (
	"context"
	"testing"

	"gateways/observability-gateway/internal/config"
)

func TestCollectorInitializationAndDnsCheck(t *testing.T) {
	cfg := &config.Config{
		GatewayToken: "test-token",
		BackendUrl:   "http://localhost:9090",
	}

	c := NewCollector(cfg)
	if c == nil {
		t.Fatal("expected non-nil Collector instance")
	}

	// Test CheckDns with valid domain
	res, err := c.CheckDns(context.Background(), "gis.kdua.net")
	if err != nil {
		t.Fatalf("expected nil error from CheckDns, got: %v", err)
	}

	if res["valid"] != true {
		t.Errorf("expected valid: true, got: %v", res["valid"])
	}

	// Test CheckDns with empty domain
	resEmpty, _ := c.CheckDns(context.Background(), "")
	if resEmpty["valid"] != false {
		t.Errorf("expected valid: false for empty domain, got: %v", resEmpty["valid"])
	}
}

func TestFetchNotificationAndMapStatsFallbacks(t *testing.T) {
	cfg := &config.Config{
		GatewayToken: "test-token",
	}
	c := NewCollector(cfg)

	// FetchNotificationStats with unreachable backend should return safe fallback
	notifStats, err := c.FetchNotificationStats(context.Background())
	if err != nil {
		t.Errorf("expected nil error (fallback returned), got %v", err)
	}
	if notifStats["status"] != "OPERATIONAL" {
		t.Errorf("expected operational fallback status, got %v", notifStats["status"])
	}

	// FetchMapStats with unreachable backend should return safe fallback
	mapStats, err := c.FetchMapStats(context.Background())
	if err != nil {
		t.Errorf("expected nil error (fallback returned), got %v", err)
	}
	if mapStats["status"] != "HEALTHY" {
		t.Errorf("expected healthy fallback status, got %v", mapStats["status"])
	}
}
