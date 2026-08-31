package collector

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"gateways/observability-gateway/internal/config"
	"gateways/shared/logger"
	"go.uber.org/zap"
)

type ObservabilitySummary struct {
	Timestamp      string                 `json:"timestamp"`
	SystemHealth   string                 `json:"system_health"`
	TenantId       string                 `json:"tenant_id,omitempty"`
	PrometheusData map[string]interface{} `json:"prometheus"`
	PollerData     map[string]interface{} `json:"poller"`
	BackendData    map[string]interface{} `json:"backend"`
	Errors         []string               `json:"errors,omitempty"`
}

type Collector struct {
	cfg        *config.Config
	httpClient *http.Client
}

func NewCollector(cfg *config.Config) *Collector {
	return &Collector{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

func (c *Collector) FetchSummary(ctx context.Context, tenantId string) (*ObservabilitySummary, error) {
	summary := &ObservabilitySummary{
		Timestamp:    time.Now().UTC().Format(time.RFC3339),
		SystemHealth: "HEALTHY",
		TenantId:     tenantId,
		Errors:       make([]string, 0),
	}

	var wg sync.WaitGroup
	var mu sync.Mutex

	// If tenant-scoped request, fetch tenant's device codes first for filtering
	var tenantDeviceCodes []string
	if tenantId != "" {
		devices, err := c.fetchTenantDeviceCodes(ctx, tenantId)
		if err == nil {
			tenantDeviceCodes = devices
		} else {
			logger.Warn(ctx, "Failed to load tenant device inventory", zap.String("tenant_id", tenantId), zap.Error(err))
		}
	}

	// 1. Fetch Prometheus Metrics (Scoped to Tenant Devices if Tenant Admin)
	wg.Add(1)
	go func() {
		defer wg.Done()
		data, err := c.fetchPrometheusStatus(ctx, tenantId, tenantDeviceCodes)
		mu.Lock()
		defer mu.Unlock()
		if err != nil {
			logger.Warn(ctx, "Failed to collect Prometheus metrics", zap.Error(err))
			summary.Errors = append(summary.Errors, fmt.Sprintf("Prometheus: %v", err))
			summary.SystemHealth = "DEGRADED"
		} else {
			summary.PrometheusData = data
		}
	}()

	// 2. Fetch Poller Telemetry (Filtered to Tenant Devices)
	wg.Add(1)
	go func() {
		defer wg.Done()
		data, err := c.fetchPollerStatus(ctx, tenantId, tenantDeviceCodes)
		mu.Lock()
		defer mu.Unlock()
		if err != nil {
			logger.Warn(ctx, "Failed to collect Poller telemetry", zap.Error(err))
			summary.Errors = append(summary.Errors, fmt.Sprintf("Poller: %v", err))
		} else {
			summary.PollerData = data
		}
	}()

	// 3. Fetch Spring Boot Core DB Observability & DevOps Stats (Scoped to Tenant)
	wg.Add(1)
	go func() {
		defer wg.Done()
		data, err := c.fetchBackendDevOps(ctx, tenantId)
		mu.Lock()
		defer mu.Unlock()
		if err != nil {
			logger.Warn(ctx, "Failed to collect Spring Boot devops stats", zap.Error(err))
			summary.Errors = append(summary.Errors, fmt.Sprintf("Backend: %v", err))
			summary.SystemHealth = "DEGRADED"
		} else {
			summary.BackendData = data
		}
	}()

	wg.Wait()

	if len(summary.Errors) >= 3 {
		summary.SystemHealth = "CRITICAL"
	}

	return summary, nil
}

func (c *Collector) fetchTenantDeviceCodes(ctx context.Context, tenantId string) ([]string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.cfg.BackendUrl+"/api/v1/network/olts?size=200", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Gateway-Token", c.cfg.GatewayToken)
	req.Header.Set("X-Tenant-ID", tenantId)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var response struct {
		Content []struct {
			Code string `json:"code"`
		} `json:"content"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, err
	}

	codes := make([]string, 0, len(response.Content))
	for _, item := range response.Content {
		if item.Code != "" {
			codes = append(codes, item.Code)
		}
	}
	return codes, nil
}

func (c *Collector) fetchPrometheusStatus(ctx context.Context, tenantId string, deviceCodes []string) (map[string]interface{}, error) {
	var queryUrl string
	if tenantId == "" {
		// Super Admin: Global cluster query
		queryUrl = c.cfg.PrometheusUrl + "/api/v1/query?query=up"
	} else if len(deviceCodes) > 0 {
		// Tenant Admin: Scoped device metric query
		regex := strings.Join(deviceCodes, "|")
		queryUrl = fmt.Sprintf("%s/api/v1/query?query=ftth_poller_device_up{device=~\"%s\"}", c.cfg.PrometheusUrl, regex)
	} else {
		// Tenant has no registered OLT devices
		return map[string]interface{}{
			"status":  "NO_DEVICES",
			"results": []interface{}{},
		}, nil
	}

	req, err := http.NewRequestWithContext(ctx, "GET", queryUrl, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}

func (c *Collector) fetchPollerStatus(ctx context.Context, tenantId string, deviceCodes []string) (map[string]interface{}, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.cfg.PollerUrl+"/api/v1/devices/status", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Gateway-Token", c.cfg.GatewayToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		// Fallback to poller healthz if devices endpoint unavailable
		return map[string]interface{}{
			"status": "RUNNING",
			"scoped": tenantId != "",
		}, nil
	}
	defer resp.Body.Close()

	var result struct {
		Data []map[string]interface{} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return map[string]interface{}{"status": "RUNNING"}, nil
	}

	// Filter poller devices by tenant device ownership
	if tenantId != "" {
		codeSet := make(map[string]bool)
		for _, code := range deviceCodes {
			codeSet[strings.ToLower(code)] = true
		}

		filtered := make([]map[string]interface{}, 0)
		for _, dev := range result.Data {
			devCode, _ := dev["deviceCode"].(string)
			if codeSet[strings.ToLower(devCode)] {
				filtered = append(filtered, dev)
			}
		}

		return map[string]interface{}{
			"status":      "RUNNING",
			"deviceCount": len(filtered),
			"devices":     filtered,
		}, nil
	}

	// Super Admin receives all poller devices
	return map[string]interface{}{
		"status":      "RUNNING",
		"deviceCount": len(result.Data),
		"devices":     result.Data,
	}, nil
}

func (c *Collector) fetchBackendDevOps(ctx context.Context, tenantId string) (map[string]interface{}, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.cfg.BackendUrl+"/api/v1/system/devops-stats", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Gateway-Token", c.cfg.GatewayToken)
	if tenantId != "" {
		req.Header.Set("X-Tenant-ID", tenantId)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result, nil
}
