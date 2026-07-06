package config

import (
	"os"
)

type Config struct {
	Port          string
	GatewayToken  string
	DatabaseUrl   string
	RetentionDays string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5009"
	}

	gatewayToken := os.Getenv("GATEWAY_TOKEN")
	if gatewayToken == "" {
		gatewayToken = "2dcac271c2b24a4de521951d1a413000"
	}

	databaseUrl := os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		databaseUrl = "postgres://postgres:postgres@postgres:5432/ftth_gis"
	}

	retentionDays := os.Getenv("RETENTION_DAYS")
	if retentionDays == "" {
		retentionDays = "365"
	}

	return Config{
		Port:          port,
		GatewayToken:  gatewayToken,
		DatabaseUrl:   databaseUrl,
		RetentionDays: retentionDays,
	}
}
