package olt

import (
	"context"
	"testing"
)

func TestNewOLTDriver_ZTE(t *testing.T) {
	o := &OLT{
		Vendor:    "zte",
		Host:      "localhost",
		Port:      161,
		Community: "public",
	}

	driver, err := NewOLTDriver(o)
	if err != nil {
		t.Fatalf("Failed to create driver: %v", err)
	}

	if _, ok := driver.(*ZTEDriver); !ok {
		t.Errorf("Expected driver of type *ZTEDriver, got %T", driver)
	}

	// Test Ping (should fallback or connect)
	ctx := context.Background()
	_, _ = driver.Ping(ctx)

	// Test GetPorts
	ports, err := driver.GetPorts(ctx)
	if err != nil {
		t.Errorf("GetPorts returned error: %v", err)
	}
	if len(ports) != 16 {
		t.Errorf("Expected 16 ports, got %d", len(ports))
	}
}

func TestNewOLTDriver_Huawei(t *testing.T) {
	o := &OLT{
		Vendor:    "huawei",
		Host:      "localhost",
		Port:      161,
		Community: "public",
	}

	driver, err := NewOLTDriver(o)
	if err != nil {
		t.Fatalf("Failed to create driver: %v", err)
	}

	if _, ok := driver.(*HuaweiDriver); !ok {
		t.Errorf("Expected driver of type *HuaweiDriver, got %T", driver)
	}
}

func TestNewOLTDriver_Unsupported(t *testing.T) {
	o := &OLT{
		Vendor: "invalid",
	}

	_, err := NewOLTDriver(o)
	if err == nil {
		t.Errorf("Expected error for unsupported vendor, got nil")
	}
}
