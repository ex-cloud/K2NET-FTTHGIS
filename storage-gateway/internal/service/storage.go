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
	"time"

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

func (s *StorageService) UploadFile(ctx context.Context, file io.Reader, filename string, size int64, mimeType string, targetBucket string) (string, error) {
	// Batasan ukuran: 10MB untuk gambar, 150MB untuk file lainnya
	isImage := strings.HasPrefix(mimeType, "image/jpeg") || strings.HasPrefix(mimeType, "image/png")
	if isImage {
		if size > 10*1024*1024 {
			return "", errors.New("image size exceeds maximum limit of 10MB")
		}
	} else {
		if size > 150*1024*1024 {
			return "", errors.New("file size exceeds maximum limit of 150MB")
		}
	}

	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, file); err != nil {
		return "", err
	}
	rawBytes := buf.Bytes()

	// Gunakan bucket default jika tidak ditentukan
	bucket := targetBucket
	if bucket == "" {
		bucket = s.cfg.BucketName
	}

	var uploadBytes []byte
	var finalMimeType string
	var finalKey string

	// Logika: Jika gambar JPEG/PNG, lakukan optimasi dan ubah ke format WebP
	if isImage {
		img, format, err := image.Decode(bytes.NewReader(rawBytes))
		if err != nil {
			logger.Error(ctx, "Failed to decode image, uploading raw bytes", zap.Error(err), zap.String("filename", filename))
			uploadBytes = rawBytes
			finalMimeType = mimeType
			finalKey = fmt.Sprintf("%d_%s", time.Now().UnixNano(), filename)
		} else {
			logger.Info(ctx, "Processing image compression", zap.String("format", format), zap.Int64("original_size", size))
			var webpBuf bytes.Buffer
			if err := webp.Encode(&webpBuf, img, &webp.Options{Quality: 75}); err != nil {
				return "", fmt.Errorf("failed to compress to WebP: %w", err)
			}
			uploadBytes = webpBuf.Bytes()
			finalMimeType = "image/webp"

			bytesSeed := make([]byte, 16)
			if _, err := rand.Read(bytesSeed); err != nil {
				return "", err
			}
			finalKey = hex.EncodeToString(bytesSeed) + ".webp"
			logger.Info(ctx, "Image compressed successfully", zap.Int("new_size", len(uploadBytes)))
		}
	} else {
		// File non-gambar langsung dilewatkan tanpa diubah
		uploadBytes = rawBytes
		finalMimeType = mimeType
		if finalMimeType == "" || finalMimeType == "application/octet-stream" {
			finalMimeType = http.DetectContentType(rawBytes)
		}
		// Gunakan nama file asli yang aman dengan timestamp
		finalKey = fmt.Sprintf("%d_%s", time.Now().UnixNano(), filepath.Base(filename))
	}

	if s.localStore {
		outPath := filepath.Join("/opt/project5/backups", finalKey)
		logger.Warn(ctx, "AWS/R2 credentials not set. Saving file locally!", zap.String("path", outPath))

		cleanedPath := filepath.Clean(outPath)
		if !strings.HasPrefix(cleanedPath, "/opt/project5/backups/") {
			return "", errors.New("directory traversal attempt blocked")
		}

		err := os.WriteFile(cleanedPath, uploadBytes, 0600)
		if err != nil {
			return "", err
		}
		return "file://localhost" + cleanedPath, nil
	}

	_, err := s.s3Client.PutObjectWithContext(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(bucket),
		Key:           aws.String(finalKey),
		Body:          bytes.NewReader(uploadBytes),
		ContentLength: aws.Int64(int64(len(uploadBytes))),
		ContentType:   aws.String(finalMimeType),
	})
	if err != nil {
		return "", err
	}

	publicURL := fmt.Sprintf("%s/%s/%s", s.cfg.AWSEndpoint, bucket, finalKey)
	return publicURL, nil
}

func (s *StorageService) GeneratePresignedURL(ctx context.Context, bucket string, key string, expiry time.Duration) (string, error) {
	if s.localStore {
		return "file://localhost/opt/project5/backups/" + key, nil
	}

	req, _ := s.s3Client.GetObjectRequest(&s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})

	urlStr, err := req.Presign(expiry)
	if err != nil {
		return "", err
	}
	return urlStr, nil
}
