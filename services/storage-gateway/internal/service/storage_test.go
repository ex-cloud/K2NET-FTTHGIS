package service

import (
	"bytes"
	"context"
	"strings"
	"testing"

	"gateways/storage-gateway/internal/config"
)

func TestStorageServiceFileLimits(t *testing.T) {
	cfg := config.Config{
		BucketName: "test-bucket",
	}
	svc := NewStorageService(cfg)

	// Case 1: Image exceeding 10MB limit
	largeImageContent := bytes.NewReader([]byte("dummy image content"))
	_, err := svc.UploadFile(
		context.Background(),
		largeImageContent,
		"large.png",
		11*1024*1024, // 11 MB
		"image/png",
		"test-bucket",
		"test-folder",
	)
	if err == nil || !strings.Contains(err.Error(), "exceeds maximum limit of 10MB") {
		t.Errorf("expected error exceeding 10MB for images, got %v", err)
	}

	// Case 2: Document exceeding 150MB limit
	largeDocContent := bytes.NewReader([]byte("dummy doc content"))
	_, err2 := svc.UploadFile(
		context.Background(),
		largeDocContent,
		"large.tar.gz",
		151*1024*1024, // 151 MB
		"application/gzip",
		"test-bucket",
		"backups",
	)
	if err2 == nil || !strings.Contains(err2.Error(), "exceeds maximum limit of 150MB") {
		t.Errorf("expected error exceeding 150MB for files, got %v", err2)
	}
}

func TestInitTenantVaultFoldersValidation(t *testing.T) {
	cfg := config.Config{}
	svc := NewStorageService(cfg)

	// Empty tenant slug should return an error
	err := svc.InitTenantVaultFolders(context.Background(), "")
	if err == nil {
		t.Error("expected error for empty tenant slug")
	}

	// Valid tenant slug in localStore mode should succeed
	err2 := svc.InitTenantVaultFolders(context.Background(), "isp-bandung")
	if err2 != nil {
		t.Errorf("expected nil error for valid tenant slug, got %v", err2)
	}
}
