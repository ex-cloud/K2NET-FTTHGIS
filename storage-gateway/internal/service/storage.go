package service

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"gateways/shared/logger"
	"gateways/storage-gateway/internal/config"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/chai2010/webp"
	"go.uber.org/zap"
)

type StorageService struct {
	cfg        config.Config
	s3Client   *s3.S3
	localStore bool
}

func NewStorageService(cfg config.Config) *StorageService {
	if cfg.AWSAccessKey == "" || cfg.AWSSecretKey == "" {
		return &StorageService{cfg: cfg, localStore: true}
	}

	awsCfg := &aws.Config{
		Region:           aws.String(cfg.AWSRegion),
		Credentials:      credentials.NewStaticCredentials(cfg.AWSAccessKey, cfg.AWSSecretKey, ""),
		S3ForcePathStyle: aws.Bool(true),
	}

	if cfg.AWSEndpoint != "" {
		awsCfg.Endpoint = aws.String(cfg.AWSEndpoint)
	}

	sess, err := session.NewSession(awsCfg)
	if err != nil {
		panic("Failed to create AWS session: " + err.Error())
	}

	return &StorageService{
		cfg:        cfg,
		s3Client:   s3.New(sess),
		localStore: false,
	}
}

func (s *StorageService) UploadImage(ctx context.Context, file io.Reader, filename string, size int64) (string, error) {
	if size > 10*1024*1024 {
		return "", errors.New("file size exceeds maximum limit of 10MB")
	}

	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, file); err != nil {
		return "", err
	}
	rawBytes := buf.Bytes()

	contentType := http.DetectContentType(rawBytes)
	if !strings.HasPrefix(contentType, "image/") {
		return "", fmt.Errorf("invalid file type: %s is not an image", contentType)
	}

	img, format, err := image.Decode(bytes.NewReader(rawBytes))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	logger.Info(ctx, "Processing image compression", zap.String("format", format), zap.Int64("original_size", size))

	var webpBuf bytes.Buffer
	if err := webp.Encode(&webpBuf, img, &webp.Options{Quality: 75}); err != nil {
		return "", fmt.Errorf("failed to compress to WebP: %w", err)
	}
	webpBytes := webpBuf.Bytes()

	bytesSeed := make([]byte, 16)
	if _, err := rand.Read(bytesSeed); err != nil {
		return "", err
	}
	uniqueName := hex.EncodeToString(bytesSeed) + ".webp"

	logger.Info(ctx, "Image compressed successfully", zap.Int("new_size", len(webpBytes)))

	if s.localStore {
		outPath := filepath.Join("/opt/project5/backups", uniqueName)
		logger.Warn(ctx, "AWS/R2 credentials not set. Saving file locally!", zap.String("path", outPath))
		
		cleanedPath := filepath.Clean(outPath)
		if !strings.HasPrefix(cleanedPath, "/opt/project5/backups/") {
			return "", errors.New("directory traversal attempt blocked")
		}

		err := os.WriteFile(cleanedPath, webpBytes, 0600)
		if err != nil {
			return "", err
		}
		return "file://localhost" + cleanedPath, nil
	}

	_, err = s.s3Client.PutObjectWithContext(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.cfg.BucketName),
		Key:         aws.String(uniqueName),
		Body:        bytes.NewReader(webpBytes),
		ContentLength: aws.Int64(int64(len(webpBytes))),
		ContentType: aws.String("image/webp"),
	})
	if err != nil {
		return "", err
	}

	publicURL := fmt.Sprintf("%s/%s/%s", s.cfg.AWSEndpoint, s.cfg.BucketName, uniqueName)
	return publicURL, nil
}
