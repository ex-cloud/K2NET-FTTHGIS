package main

import (
	"log"
	"os"
	"os/signal"
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
