package worker

import (
	"testing"
	"time"

	"ftth-gis-poller/internal/config"
)

func TestWorkerPoolInitialization(t *testing.T) {
	cfg := &config.Config{
		WorkerCount:  4,
		PollInterval: 30 * time.Second,
		Devices: []config.DeviceConfig{
			{Code: "OLT-01", IP: "10.0.0.1", Port: 161},
		},
	}

	p := NewPool(cfg, nil)
	if p == nil {
		t.Fatal("expected non-nil worker Pool")
	}

	if cap(p.jobs) != 1 {
		t.Errorf("expected jobs channel capacity 1, got %d", cap(p.jobs))
	}
}
