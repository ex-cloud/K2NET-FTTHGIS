package config

import (
	"os"
)

type Config struct {
	Port                        string
	RedisAddr                   string
	GatewayToken                string
	DatabaseUrl                 string
	OltEncryptionKey            string
	SnmpTimeoutSeconds          string
	SshTimeoutSeconds           string
	MaxConcurrentOltConnections string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5008"
	}

	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "redis:6379"
	}

	gatewayToken := os.Getenv("GATEWAY_TOKEN")

	databaseUrl := os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		databaseUrl = "postgres://postgres:postgres@postgres:5432/ftth_gis"
	}

	oltEncryptionKey := os.Getenv("OLT_ENCRYPTION_KEY")
	snmpTimeoutSeconds := os.Getenv("SNMP_TIMEOUT_SECONDS")
	if snmpTimeoutSeconds == "" {
		snmpTimeoutSeconds = "5"
	}

	sshTimeoutSeconds := os.Getenv("SSH_TIMEOUT_SECONDS")
	if sshTimeoutSeconds == "" {
		sshTimeoutSeconds = "10"
	}

	maxConcurrentOltConnections := os.Getenv("MAX_CONCURRENT_OLT_CONNECTIONS")
	if maxConcurrentOltConnections == "" {
		maxConcurrentOltConnections = "20"
	}

	return Config{
		Port:                        port,
		RedisAddr:                   redisAddr,
		GatewayToken:                gatewayToken,
		DatabaseUrl:                 databaseUrl,
		OltEncryptionKey:            oltEncryptionKey,
		SnmpTimeoutSeconds:          snmpTimeoutSeconds,
		SshTimeoutSeconds:           sshTimeoutSeconds,
		MaxConcurrentOltConnections: maxConcurrentOltConnections,
	}
}
