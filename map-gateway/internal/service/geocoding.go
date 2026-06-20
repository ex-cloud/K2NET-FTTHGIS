package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"gateways/shared/logger"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type GeocodeResult struct {
	Lat          float64 `json:"lat"`
	Lng          float64 `json:"lng"`
	Formatted    string  `json:"formatted_address"`
	ProviderUsed string  `json:"provider_used"`
}

type GeocodingService struct {
	rdb          *redis.Client
	googleAPIKey string
	hereAPIKey   string
	httpClient   *http.Client
}

func NewGeocodingService(rdb *redis.Client, googleKey, hereKey string) *GeocodingService {
	return &GeocodingService{
		rdb:          rdb,
		googleAPIKey: googleKey,
		hereAPIKey:   hereKey,
		httpClient:   &http.Client{Timeout: 5 * time.Second},
	}
}

func (s *GeocodingService) ForwardGeocode(ctx context.Context, address string) (*GeocodeResult, error) {
	cacheKey := "geocache:forward:" + url.QueryEscape(address)
	
	cachedData, err := s.rdb.Get(ctx, cacheKey).Result()
	if err == nil && cachedData != "" {
		var cachedResult GeocodeResult
		if err := json.Unmarshal([]byte(cachedData), &cachedResult); err == nil {
			cachedResult.ProviderUsed = cachedResult.ProviderUsed + " (Cache Hit)"
			logger.Info(ctx, "Geocoding Cache HIT", zap.String("address", address))
			return &cachedResult, nil
		}
	}

	logger.Info(ctx, "Geocoding Cache MISS, fetching from providers", zap.String("address", address))

	var result *GeocodeResult
	if s.googleAPIKey != "" {
		result, err = s.fetchFromGoogle(ctx, address)
		if err == nil {
			s.saveToCache(ctx, cacheKey, result)
			return result, nil
		}
		logger.Warn(ctx, "Google Maps Geocoding failed, trying OSM failover", zap.Error(err))
	} else {
		logger.Warn(ctx, "Google Maps API Key not configured. Trying OSM failover.")
	}

	result, err = s.fetchFromOSM(ctx, address)
	if err == nil {
		s.saveToCache(ctx, cacheKey, result)
		return result, nil
	}

	return nil, fmt.Errorf("all geocoding providers failed: last error: %w", err)
}

func (s *GeocodingService) saveToCache(ctx context.Context, key string, result *GeocodeResult) {
	data, err := json.Marshal(result)
	if err == nil {
		_ = s.rdb.Set(ctx, key, data, 30*24*time.Hour).Err()
	}
}

func (s *GeocodingService) fetchFromGoogle(ctx context.Context, address string) (*GeocodeResult, error) {
	apiURL := fmt.Sprintf("https://maps.googleapis.com/maps/api/geocode/json?address=%s&key=%s", url.QueryEscape(address), s.googleAPIKey)
	
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("google maps returned HTTP %d", resp.StatusCode)
	}

	var data struct {
		Status string `json:"status"`
		Results []struct {
			FormattedAddress string `json:"formatted_address"`
			Geometry struct {
				Location struct {
					Lat float64 `json:"lat"`
					Lng float64 `json:"lng"`
				} `json:"location"`
			} `json:"geometry"`
		} `json:"results"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	if data.Status != "OK" || len(data.Results) == 0 {
		return nil, fmt.Errorf("google maps geocoding status: %s", data.Status)
	}

	return &GeocodeResult{
		Lat:          data.Results[0].Geometry.Location.Lat,
		Lng:          data.Results[0].Geometry.Location.Lng,
		Formatted:    data.Results[0].FormattedAddress,
		ProviderUsed: "Google Maps",
	}, nil
}

func (s *GeocodingService) fetchFromOSM(ctx context.Context, address string) (*GeocodeResult, error) {
	apiURL := fmt.Sprintf("https://nominatim.openstreetmap.org/search?q=%s&format=json&limit=1", url.QueryEscape(address))
	
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "SaaSFTTHGISApp/1.0 (contact@k2net.id)")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("openstreetmap returned HTTP %d", resp.StatusCode)
	}

	var data []struct {
		Lat         string `json:"lat"`
		Lon         string `json:"lon"`
		DisplayName string `json:"display_name"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, err
	}

	if len(data) == 0 {
		return nil, errors.New("openstreetmap returned no geocoding results")
	}

	lat, err := strconv.ParseFloat(data[0].Lat, 64)
	if err != nil {
		return nil, err
	}

	lng, err := strconv.ParseFloat(data[0].Lon, 64)
	if err != nil {
		return nil, err
	}

	return &GeocodeResult{
		Lat:          lat,
		Lng:          lng,
		Formatted:    data[0].DisplayName,
		ProviderUsed: "OpenStreetMap (Nominatim)",
	}, nil
}
