package main

import (
	"log"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"context"
	"encoding/json"
	"fmt"
	"ftth-gis-poller/internal/cache"
	"ftth-gis-poller/internal/config"
	"ftth-gis-poller/internal/db"
	"ftth-gis-poller/internal/worker"
	"net/http"
	"strconv"
	"time"
)

func splitLines(s string) []string {
	return strings.Split(strings.ReplaceAll(s, "\r\n", "\n"), "\n")
}

func main() {
	startTime := time.Now()
	log.Println("===========================================")
	log.Println("   FTTH GIS - Network Poller Service")
	log.Println("===========================================")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("❌ Failed to load config: %v", err)
	}

	// Connect to Database
	dbService, err := db.New(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Database: %v", err)
	}
	defer dbService.Close()
	log.Println("✅ Connected to PostgreSQL Database")

	// Seed Development Data (Optional: Remove in Production)
	if err := dbService.SeedDevData(context.Background()); err != nil {
		log.Printf("⚠️ Failed to seed dev data: %v", err)
	}

	// Fetch Devices from DB
	devices, err := dbService.GetActiveDevices(context.Background())
	if err != nil {
		log.Fatalf("❌ Failed to fetch active devices: %v", err)
	}

	// Convert DB devices to Config devices
	var pollDevices []config.DeviceConfig
	for _, d := range devices {
		pollDevices = append(pollDevices, config.DeviceConfig{
			Code:    d.Code,
			IP:      d.IPAddress,
			Port:    161,
			Type:    "OLT",                  // Default to OLT for now
			OIDList: cfg.Devices[0].OIDList, // Reuse OID list from default config
		})
	}

	if len(pollDevices) > 0 {
		cfg.Devices = pollDevices
		log.Printf("✅ Loaded %d active devices from Database", len(cfg.Devices))
	} else {
		log.Println("⚠️ No active devices found in DB, using default config")
	}

	log.Printf("✅ Config loaded: %d devices, poll interval %v", len(cfg.Devices), cfg.PollInterval)

	// Connect to Redis
	statusCache, err := cache.NewStatusCache(cfg.RedisAddr, cfg.RedisPassword, cfg.RedisDB)
	if err != nil {
		log.Fatalf("❌ Failed to connect to Redis: %v", err)
	}
	defer statusCache.Close()

	// Start worker pool
	pool := worker.NewPool(cfg, statusCache)
	pool.Start()

	// 🛠️ Start Health Check and Metrics HTTP Server
	healthPort := 5010
	if envPort := os.Getenv("PORT"); envPort != "" {
		if p, err := strconv.Atoi(envPort); err == nil {
			healthPort = p
		}
	}
	go func() {
		http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
			// ✅ Allow Frontend Access
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			
			if r.Method == "OPTIONS" {
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status":        "running",
				"time":          time.Now().Format(time.RFC3339),
				"deviceCount":   len(cfg.Devices),
				"pollInterval":  cfg.PollInterval.String(),
				"redisStatus":   "connected",
			})
		})

		http.HandleFunc("/metrics", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
			
			redisConnected := 1
			if err := statusCache.Ping(); err != nil {
				redisConnected = 0
			}

			fmt.Fprintf(w, "# HELP ftth_poller_devices_count Total number of devices to poll\n")
			fmt.Fprintf(w, "# TYPE ftth_poller_devices_count gauge\n")
			fmt.Fprintf(w, "ftth_poller_devices_count %d\n", len(cfg.Devices))

			fmt.Fprintf(w, "# HELP ftth_poller_redis_connected Status of Redis connection (1 = connected, 0 = disconnected)\n")
			fmt.Fprintf(w, "# TYPE ftth_poller_redis_connected gauge\n")
			fmt.Fprintf(w, "ftth_poller_redis_connected %d\n", redisConnected)

			fmt.Fprintf(w, "# HELP ftth_poller_uptime_seconds Seconds since the poller service started\n")
			fmt.Fprintf(w, "# TYPE ftth_poller_uptime_seconds gauge\n")
			fmt.Fprintf(w, "ftth_poller_uptime_seconds %.0f\n", time.Since(startTime).Seconds())
		})

		http.HandleFunc("/api/v1/config", func(w http.ResponseWriter, r *http.Request) {
			gatewayToken := os.Getenv("GATEWAY_TOKEN")
			token := r.Header.Get("X-Gateway-Token")
			if token == "" || token != gatewayToken {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"Unauthorized"}`))
				return
			}
			w.Header().Set("Content-Type", "application/json")
			envPath := os.Getenv("ENV_FILE_PATH")
			if envPath == "" {
				envPath = "/opt/project5/services/.env"
			}
			data, err := os.ReadFile(envPath)
			if err != nil {
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(`{"error":"Failed to read config"}`))
				return
			}
			// Parse and return as structured sections
			type entry struct {
				Key      string `json:"key"`
				Censored string `json:"censored"`
				Section  string `json:"section"`
			}
			sections := map[string][]entry{}
			currentSection := "General"
			sensitiveWords := []string{"TOKEN", "SECRET", "PASSWORD", "AUTH_TOKEN", "API_KEY", "WEBHOOK_KEY", "ACCESS_KEY"}
			for _, line := range splitLines(string(data)) {
				line = strings.TrimSpace(line)
				if strings.HasPrefix(line, "# ---") && strings.HasSuffix(line, "---") {
					currentSection = strings.TrimSpace(strings.TrimSuffix(strings.TrimPrefix(line, "# ---"), "---"))
					continue
				}
				if line == "" || strings.HasPrefix(line, "#") {
					continue
				}
				parts := strings.SplitN(line, "=", 2)
				if len(parts) != 2 {
					continue
				}
				k := strings.TrimSpace(parts[0])
				v := strings.TrimSpace(parts[1])
				censored := v
				for _, sw := range sensitiveWords {
					if strings.Contains(strings.ToUpper(k), sw) {
						if len(v) <= 8 {
							censored = "••••••••"
						} else {
							censored = v[:4] + "••••••••" + v[len(v)-4:]
						}
						break
					}
				}
				sections[currentSection] = append(sections[currentSection], entry{Key: k, Censored: censored, Section: currentSection})
			}
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status":   "ok",
				"sections": sections,
			})
		})

		http.HandleFunc("/api/v1/devices/status", func(w http.ResponseWriter, r *http.Request) {
			gatewayToken := os.Getenv("GATEWAY_TOKEN")
			token := r.Header.Get("X-Gateway-Token")
			if token == "" || token != gatewayToken {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				w.Write([]byte(`{"error":"Unauthorized"}`))
				return
			}

			ctx := r.Context()
			w.Header().Set("Content-Type", "application/json")

			// SCAN Redis for all device:status:* keys
			type deviceStatusResponse struct {
				DeviceCode     string                 `json:"deviceCode"`
				Host           string                 `json:"host"`
				Name           string                 `json:"name"`
				Status         string                 `json:"status"`
				ResponseTimeMs float64                `json:"responseTimeMs"`
				LastPolledAt   string                 `json:"lastPolledAt"`
				Metrics        map[string]interface{} `json:"metrics,omitempty"`
			}

			var cursor uint64
			var keys []string
			for {
				ks, nextCursor, err := statusCache.ScanDeviceKeys(ctx, cursor)
				if err != nil {
					w.WriteHeader(http.StatusInternalServerError)
					json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
					return
				}
				keys = append(keys, ks...)
				cursor = nextCursor
				if cursor == 0 {
					break
				}
			}

			var results []deviceStatusResponse
			for _, deviceCode := range keys {
				ds, err := statusCache.GetStatus(deviceCode)
				if err != nil || ds == nil {
					continue
				}
				resp := deviceStatusResponse{
					DeviceCode:   ds.Code,
					Host:         ds.Code, // Code is IP-based
					Name:         ds.Code,
					Status:       ds.Status,
					LastPolledAt: ds.Timestamp.Format(time.RFC3339),
					Metrics:      ds.Metrics,
				}
				// Extract responseTimeMs from metrics if available
				if ds.Metrics != nil {
					if rt, ok := ds.Metrics["response_time_ms"]; ok {
						switch v := rt.(type) {
						case float64:
							resp.ResponseTimeMs = v
						case int:
							resp.ResponseTimeMs = float64(v)
						}
					}
				}
				// Try to find the human-readable name from cfg.Devices
				for _, d := range cfg.Devices {
					if d.Code == ds.Code {
						resp.Host = d.IP
						resp.Name = d.Code
						break
					}
				}
				results = append(results, resp)
			}

			if results == nil {
				results = []deviceStatusResponse{}
			}

			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    results,
			})
		})

		log.Printf("📡 Health Check and Metrics server started on port %d", healthPort)
		if err := http.ListenAndServe(fmt.Sprintf(":%d", healthPort), nil); err != nil {
			log.Printf("⚠️ Health Check/Metrics server error: %v", err)
		}
	}()

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	sig := <-sigChan
	log.Printf("🛑 Received signal: %v, shutting down...", sig)

	pool.Stop()
	log.Println("👋 Poller service stopped. Goodbye!")
}
