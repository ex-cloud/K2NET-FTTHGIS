package config

import (
	"os"
)

type Config struct {
	Port                 string
	RedisAddr            string
	GatewayToken         string
	DatabaseUrl          string
	StorageGatewayUrl    string
	JobTimeoutMinutes    string
	MaxConcurrentExports string
	FontDir              string
	TemplateDir          string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5007"
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

	storageGatewayUrl := os.Getenv("STORAGE_GATEWAY_URL")
	if storageGatewayUrl == "" {
		storageGatewayUrl = "http://ftth-storage-gateway:5004"
	}

	jobTimeoutMinutes := os.Getenv("JOB_TIMEOUT_MINUTES")
	if jobTimeoutMinutes == "" {
		jobTimeoutMinutes = "10"
	}

	maxConcurrentExports := os.Getenv("MAX_CONCURRENT_EXPORTS")
	if maxConcurrentExports == "" {
		maxConcurrentExports = "5"
	}

	fontDir := os.Getenv("FONT_DIR")
	if fontDir == "" {
		fontDir = "/app/fonts"
	}

	templateDir := os.Getenv("TEMPLATE_DIR")
	if templateDir == "" {
		templateDir = "/app/templates"
	}

	return Config{
		Port:                 port,
		RedisAddr:            redisAddr,
		GatewayToken:         gatewayToken,
		DatabaseUrl:          databaseUrl,
		StorageGatewayUrl:    storageGatewayUrl,
		JobTimeoutMinutes:    jobTimeoutMinutes,
		MaxConcurrentExports: maxConcurrentExports,
		FontDir:              fontDir,
		TemplateDir:          templateDir,
	}
}
