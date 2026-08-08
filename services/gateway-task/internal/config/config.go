package config

import (
	"os"
)

type Config struct {
	Port              string
	RedisAddr         string
	NextcloudURL      string
	NextcloudUser     string
	NextcloudPassword string
	AuditURL          string
	GatewayToken      string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5011"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "127.0.0.1:6379"
	}

	return Config{
		Port:              port,
		RedisAddr:         redisAddr,
		NextcloudURL:      os.Getenv("NEXTCLOUD_URL"),
		NextcloudUser:     os.Getenv("NEXTCLOUD_USER"),
		NextcloudPassword: os.Getenv("NEXTCLOUD_APP_PASSWORD"),
		AuditURL:          os.Getenv("AUDIT_GATEWAY_URL"),
		GatewayToken:      os.Getenv("GATEWAY_TOKEN"),
	}
}
