package config

import (
	"os"
)

type Config struct {
	Port               string
	RedisAddr          string
	GatewayToken       string
	DatabaseUrl        string
	Timezone           string
	MaxConcurrentJobs  string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5006"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "redis:6379"
	}

	gatewayToken := os.Getenv("GATEWAY_TOKEN")
	if gatewayToken == "" {
		gatewayToken = "2dcac271c2b24a4de521951d1a413000"
	}

	databaseUrl := os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		databaseUrl = "postgres://postgres:postgres@postgres:5432/ftth_gis"
	}

	timezone := os.Getenv("TIMEZONE")
	if timezone == "" {
		timezone = "Asia/Jakarta"
	}

	maxConcurrentJobs := os.Getenv("MAX_CONCURRENT_JOBS")
	if maxConcurrentJobs == "" {
		maxConcurrentJobs = "50"
	}

	return Config{
		Port:               port,
		RedisAddr:          redisAddr,
		GatewayToken:       gatewayToken,
		DatabaseUrl:        databaseUrl,
		Timezone:           timezone,
		MaxConcurrentJobs:  maxConcurrentJobs,
	}
}
