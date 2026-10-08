package httpclient

import (
	"testing"
	"time"
)

func TestHttpClientConfiguration(t *testing.T) {
	if Client == nil {
		t.Fatal("expected default Client to be initialized")
	}
	if Client.Timeout != 10*time.Second {
		t.Errorf("expected default timeout 10s, got %v", Client.Timeout)
	}

	customClient := NewClient(3 * time.Second)
	if customClient.Timeout != 3*time.Second {
		t.Errorf("expected custom timeout 3s, got %v", customClient.Timeout)
	}

	if customClient.Transport == nil {
		t.Error("expected shared transport to be non-nil")
	}
}
