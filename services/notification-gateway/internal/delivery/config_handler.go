package delivery

import (
	"bufio"
	"context"
	"fmt"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"gateways/shared/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// ConfigHandler provides secure CRUD operations for gateway .env configuration
type ConfigHandler struct {
	envPath string
	mu      sync.RWMutex
}

func NewConfigHandler() *ConfigHandler {
	envPath := os.Getenv("ENV_FILE_PATH")
	if envPath == "" {
		envPath = "/opt/project5/services/.env"
	}
	return &ConfigHandler{envPath: envPath}
}

// censorValue masks sensitive credential values for safe display
func censorValue(key, value string) string {
	if value == "" {
		return ""
	}
	sensitiveKeys := []string{
		"TOKEN", "SECRET", "PASSWORD", "AUTH_TOKEN",
		"API_KEY", "WEBHOOK_KEY", "ACCESS_KEY",
	}
	for _, sk := range sensitiveKeys {
		if strings.Contains(strings.ToUpper(key), sk) {
			if len(value) <= 8 {
				return "••••••••"
			}
			return value[:4] + "••••••••" + value[len(value)-4:]
		}
	}
	return value
}

// configEntry represents a single key-value config pair with metadata
type configEntry struct {
	Key      string `json:"key"`
	Value    string `json:"value"`
	Censored string `json:"censored"`
	Section  string `json:"section"`
}

// parseEnvFile reads the .env file and returns structured config entries
func (h *ConfigHandler) parseEnvFile() ([]configEntry, error) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	// Validate the path to prevent directory traversal
	cleanPath := filepath.Clean(h.envPath)
	if !strings.HasPrefix(cleanPath, "/opt/project5/services/") {
		return nil, fmt.Errorf("invalid env file path")
	}

	file, err := os.Open(cleanPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var entries []configEntry
	currentSection := "General"
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())

		// Parse section comments like "# --- Notification Gateway (Port 5001) ---"
		if strings.HasPrefix(line, "# ---") && strings.HasSuffix(line, "---") {
			sectionName := strings.TrimPrefix(line, "# ---")
			sectionName = strings.TrimSuffix(sectionName, "---")
			currentSection = strings.TrimSpace(sectionName)
			continue
		}

		// Skip other comments and empty lines
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		entries = append(entries, configEntry{
			Key:      key,
			Value:    value,
			Censored: censorValue(key, value),
			Section:  currentSection,
		})
	}

	return entries, scanner.Err()
}

// writeEnvFile writes the updated config entries back to the .env file
func (h *ConfigHandler) writeEnvFile(updates map[string]string) error {
	h.mu.Lock()
	defer h.mu.Unlock()

	cleanPath := filepath.Clean(h.envPath)
	if !strings.HasPrefix(cleanPath, "/opt/project5/services/") {
		return fmt.Errorf("invalid env file path")
	}

	// Read existing file content
	input, err := os.ReadFile(cleanPath)
	if err != nil {
		return err
	}

	lines := strings.Split(string(input), "\n")
	updatedLines := make([]string, 0, len(lines))

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			updatedLines = append(updatedLines, line)
			continue
		}

		parts := strings.SplitN(trimmed, "=", 2)
		if len(parts) != 2 {
			updatedLines = append(updatedLines, line)
			continue
		}

		key := strings.TrimSpace(parts[0])
		if newVal, ok := updates[key]; ok {
			updatedLines = append(updatedLines, key+"="+newVal)
			delete(updates, key)
		} else {
			updatedLines = append(updatedLines, line)
		}
	}

	// Append any brand new keys that didn't exist before
	for key, val := range updates {
		updatedLines = append(updatedLines, key+"="+val)
	}

	return os.WriteFile(cleanPath, []byte(strings.Join(updatedLines, "\n")), 0600)
}

// restartGatewayServices triggers a self-restart by exiting, allowing Docker's restart policy to reboot it
func restartGatewayServices() error {
	go func() {
		time.Sleep(500 * time.Millisecond)
		logger.Warn(context.Background(), "Exiting process to trigger Docker container restart...")
		os.Exit(0)
	}()
	return nil
}

// GetConfig returns the current .env configuration with censored secrets
func (h *ConfigHandler) GetConfig(c *gin.Context) {
	ctx := c.Request.Context()

	entries, err := h.parseEnvFile()
	if err != nil {
		logger.Error(ctx, "Failed to read env file", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read configuration"})
		return
	}

	// Group entries by section for the frontend
	grouped := make(map[string][]configEntry)
	for _, e := range entries {
		grouped[e.Section] = append(grouped[e.Section], e)
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "ok",
		"sections": grouped,
	})
}

// UpdateConfig receives a map of key-value pairs and updates the .env file
func (h *ConfigHandler) UpdateConfig(c *gin.Context) {
	ctx := c.Request.Context()

	var payload struct {
		Updates map[string]string `json:"updates" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Whitelist: only allow known configuration keys to be updated
	allowedKeys := map[string]bool{
		"GATEWAY_TOKEN":                  true,
		"REDIS_ADDR":                     true,
		"TWILIO_ACCOUNT_SID":             true,
		"TWILIO_AUTH_TOKEN":              true,
		"TWILIO_FROM_NUMBER":             true,
		"XENDIT_API_KEY":                 true,
		"XENDIT_WEBHOOK_KEY":             true,
		"CORE_API_URL":                   true,
		"GOOGLE_MAPS_API_KEY":            true,
		"HERE_MAPS_API_KEY":              true,
		"AWS_REGION":                     true,
		"AWS_ENDPOINT":                   true,
		"AWS_ACCESS_KEY_ID":              true,
		"AWS_SECRET_ACCESS_KEY":          true,
		"AWS_BUCKET_NAME":                true,
		"WA_API_URL":                     true,
		"WA_ACCESS_TOKEN":                true,
		"WA_VERIFY_TOKEN":                true,
		"WA_PHONE_NUMBER_ID":             true,
		"TIMEZONE":                       true,
		"MAX_CONCURRENT_JOBS":            true,
		"STORAGE_GATEWAY_URL":            true,
		"JOB_TIMEOUT_MINUTES":            true,
		"MAX_CONCURRENT_EXPORTS":          true,
		"FONT_DIR":                       true,
		"TEMPLATE_DIR":                   true,
		"OLT_ENCRYPTION_KEY":             true,
		"SNMP_TIMEOUT_SECONDS":           true,
		"SSH_TIMEOUT_SECONDS":            true,
		"MAX_CONCURRENT_OLT_CONNECTIONS": true,
		"RETENTION_DAYS":                 true,
	}

	sanitized := make(map[string]string)
	for k, v := range payload.Updates {
		if !allowedKeys[k] {
			logger.Warn(ctx, "Attempted to update disallowed config key", zap.String("key", k))
			continue
		}
		// Prevent newlines or special characters in values
		v = strings.ReplaceAll(v, "\n", "")
		v = strings.ReplaceAll(v, "\r", "")
		sanitized[k] = v
	}

	if len(sanitized) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No valid configuration keys provided"})
		return
	}

	if err := h.writeEnvFile(sanitized); err != nil {
		logger.Error(ctx, "Failed to write env file", zap.Error(err))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save configuration"})
		return
	}

	logger.Info(ctx, "Configuration updated successfully via admin panel",
		zap.Int("keys_updated", len(sanitized)))

	// Restart self-service to pick up new config. Warn that other containers should be restarted.
	go func() {
		if err := restartGatewayServices(); err != nil {
			logger.Error(ctx, "Failed to initiate restart of gateway config handler", zap.Error(err))
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"status":       "ok",
		"message":      "Configuration updated. notification-gateway is restarting. Please manually restart other services if needed to apply changes.",
		"keys_updated": len(sanitized),
	})
}

// GetGatewayStatus returns the status of all gateway containers by checking their ports in the Docker network
func (h *ConfigHandler) GetGatewayStatus(c *gin.Context) {
	ctx := c.Request.Context()

	type serviceStatus struct {
		Name   string `json:"name"`
		Port   int    `json:"port"`
		Active bool   `json:"active"`
		Status string `json:"status"`
	}

	services := []struct {
		name string
		port int
	}{
		{"ftth-notification-gateway", 5001},
		{"ftth-payment-gateway", 5002},
		{"ftth-map-gateway", 5003},
		{"ftth-storage-gateway", 5004},
		{"ftth-whatsapp-gateway", 5005},
		{"ftth-scheduler-gateway", 5006},
		{"ftth-export-gateway", 5007},
		{"ftth-olt-gateway", 5008},
		{"ftth-audit-gateway", 5009},
		{"ftth-poller", 5010},
	}

	var results []serviceStatus
	for _, svc := range services {
		// Use the docker-compose service hostname to check port health
		address := net.JoinHostPort(svc.name, fmt.Sprintf("%d", svc.port))
		conn, err := net.DialTimeout("tcp", address, 300*time.Millisecond)
		active := err == nil
		status := "active"
		if !active {
			status = "inactive"
		} else {
			conn.Close()
		}

		results = append(results, serviceStatus{
			Name:   svc.name,
			Port:   svc.port,
			Active: active,
			Status: status,
		})
	}

	logger.Info(ctx, "Gateway container status check performed via TCP dial")

	c.JSON(http.StatusOK, gin.H{
		"status":   "ok",
		"services": results,
	})
}
