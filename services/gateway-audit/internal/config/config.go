package config

import (
	"os"
)

type Config struct {
	Port          string
	GatewayToken  string
	DatabaseUrl   string
	RetentionDays string
	ArchiveDir    string
	ArchiveBucket string
	MinIOHost     string
}

func LoadConfig() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "5009"
	}

	gatewayToken := os.Getenv("GATEWAY_TOKEN")

	databaseUrl := os.Getenv("DATABASE_URL")
	if databaseUrl == "" {
		databaseUrl = "postgres://postgres:postgres@postgres:5432/ftth_gis"
	}

	retentionDays := os.Getenv("RETENTION_DAYS")
	if retentionDays == "" {
		retentionDays = "365"
	}

	archiveDir := os.Getenv("ARCHIVE_DIR")
	if archiveDir == "" {
		archiveDir = "/opt/project5/backups/archive/audit_events"
	}

	archiveBucket := os.Getenv("ARCHIVE_BUCKET")
	if archiveBucket == "" {
		archiveBucket = "audit-archives"
	}

	minIOHost := os.Getenv("MINIO_HOST")
	if minIOHost == "" {
		minIOHost = "http://100.110.205.109:9005"
	}

	return Config{
		Port:          port,
		GatewayToken:  gatewayToken,
		DatabaseUrl:   databaseUrl,
		RetentionDays: retentionDays,
		ArchiveDir:    archiveDir,
		ArchiveBucket: archiveBucket,
		MinIOHost:     minIOHost,
	}
}
