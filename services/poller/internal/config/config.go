package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

// Config holds all application configuration
type Config struct {
	// SNMP Settings
	SNMPCommunity string
	SNMPVersion   string
	SNMPTimeout   time.Duration
	SNMPRetries   int

	// Redis Settings
	RedisAddr     string
	RedisPassword string
	RedisDB       int

	// Worker Settings
	PollInterval time.Duration
	WorkerCount  int

	// Database Settings
	DatabaseURL string

	// Devices to poll (loaded from DB or config file)
	Devices []DeviceConfig
}

// DeviceConfig represents a single device to poll
type DeviceConfig struct {
	Code    string // Unique identifier (e.g., OLT-BDG-01)
	IP      string
	Port    uint16
	Type    string // OLT, ODC, ODP
	OIDList []string
}

// Load reads configuration from .env file and environment variables
func Load() (*Config, error) {
	// Load .env file if exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := &Config{
		SNMPCommunity: getEnv("SNMP_COMMUNITY", "public"),
		SNMPVersion:   getEnv("SNMP_VERSION", "2c"),
		SNMPTimeout:   time.Duration(getEnvInt("SNMP_TIMEOUT_SEC", 5)) * time.Second,
		SNMPRetries:   getEnvInt("SNMP_RETRIES", 2),

		RedisAddr:     getEnv("REDIS_ADDR", "127.0.0.1:6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),
		RedisDB:       getEnvInt("REDIS_DB", 0),

		PollInterval: time.Duration(getEnvInt("POLL_INTERVAL_SEC", 60)) * time.Second,
		WorkerCount:  getEnvInt("WORKER_COUNT", 10),

		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:123456@localhost:5432/ftth_gis"),

		// Default device for testing
		Devices: []DeviceConfig{
			{
				Code: "OLT-TEST-01",
				IP:   "127.0.0.1",
				Port: 161,
				Type: "OLT",
				OIDList: []string{
					".1.3.6.1.2.1.1.1.0", // sysDescr
					".1.3.6.1.2.1.1.3.0", // sysUpTime
				},
			},
		},
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return fallback
}
