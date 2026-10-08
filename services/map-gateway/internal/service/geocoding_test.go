package service

import (
	"testing"
)

func TestGeocodingServiceInitialization(t *testing.T) {
	svc := NewGeocodingService(nil, "google-api-key-test", "here-api-key-test")

	if svc == nil {
		t.Fatal("expected non-nil GeocodingService instance")
	}

	if svc.googleAPIKey != "google-api-key-test" {
		t.Errorf("expected googleAPIKey to be set, got %q", svc.googleAPIKey)
	}

	if svc.hereAPIKey != "here-api-key-test" {
		t.Errorf("expected hereAPIKey to be set, got %q", svc.hereAPIKey)
	}

	if svc.httpClient == nil {
		t.Error("expected non-nil httpClient")
	}
}

func TestGeocodeResultDataStructure(t *testing.T) {
	res := GeocodeResult{
		Lat:          -6.9175,
		Lng:          107.6191,
		Formatted:    "Bandung, West Java, Indonesia",
		ProviderUsed: "Google Maps",
	}

	if res.Lat != -6.9175 || res.Lng != 107.6191 {
		t.Errorf("unexpected coordinates: (%v, %v)", res.Lat, res.Lng)
	}
	if res.Formatted != "Bandung, West Java, Indonesia" {
		t.Errorf("unexpected formatted address: %s", res.Formatted)
	}
}
