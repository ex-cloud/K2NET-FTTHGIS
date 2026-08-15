package service

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
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
	"sync"
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

type StorageStats struct {
	TotalFiles          int64 `json:"total_files"`
	TotalOriginalSize   int64 `json:"total_original_size"`
	TotalCompressedSize int64 `json:"total_compressed_size"`
	FailureCount        int64 `json:"failure_count"`
	SuccessCount        int64 `json:"success_count"`
}

var statsMutex sync.Mutex

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

func (s *StorageService) UploadFile(ctx context.Context, file io.Reader, filename string, size int64, mimeType string, targetBucket string, folder string) (string, error) {
	statsMutex.Lock()
	stats, _ := s.readStats()
	stats.TotalFiles++
	stats.TotalOriginalSize += size
	s.writeStats(stats)
	statsMutex.Unlock()

	// Batasan ukuran: 10MB untuk gambar, 150MB untuk file lainnya
	isImage := strings.HasPrefix(mimeType, "image/jpeg") || strings.HasPrefix(mimeType, "image/png")
	if isImage {
		if size > 10*1024*1024 {
			statsMutex.Lock()
			stats, _ = s.readStats()
			stats.FailureCount++
			s.writeStats(stats)
			statsMutex.Unlock()
			return "", errors.New("image size exceeds maximum limit of 10MB")
		}
	} else {
		if size > 150*1024*1024 {
			statsMutex.Lock()
			stats, _ = s.readStats()
			stats.FailureCount++
			s.writeStats(stats)
			statsMutex.Unlock()
			return "", errors.New("file size exceeds maximum limit of 150MB")
		}
	}

	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, file); err != nil {
		statsMutex.Lock()
		stats, _ = s.readStats()
		stats.FailureCount++
		s.writeStats(stats)
		statsMutex.Unlock()
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
				statsMutex.Lock()
				stats, _ = s.readStats()
				stats.FailureCount++
				s.writeStats(stats)
				statsMutex.Unlock()
				return "", fmt.Errorf("failed to compress to WebP: %w", err)
			}
			uploadBytes = webpBuf.Bytes()
			finalMimeType = "image/webp"

			bytesSeed := make([]byte, 16)
			if _, err := rand.Read(bytesSeed); err != nil {
				statsMutex.Lock()
				stats, _ = s.readStats()
				stats.FailureCount++
				s.writeStats(stats)
				statsMutex.Unlock()
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

	// Jika subfolder ditentukan (misal: "tasks/attachments", "tenants/isp-a/tasks"), bersihkan dan tambahkan prefix
	if folder != "" {
		cleanedFolder := strings.Trim(filepath.ToSlash(folder), "/")
		if cleanedFolder != "" {
			finalKey = cleanedFolder + "/" + finalKey
		}
	}

	if s.localStore {
		outPath := filepath.Join("/opt/project5/backups", finalKey)
		logger.Warn(ctx, "AWS/R2 credentials not set. Saving file locally!", zap.String("path", outPath))

		cleanedPath := filepath.Clean(outPath)
		if !strings.HasPrefix(cleanedPath, "/opt/project5/backups/") {
			statsMutex.Lock()
			stats, _ = s.readStats()
			stats.FailureCount++
			s.writeStats(stats)
			statsMutex.Unlock()
			return "", errors.New("directory traversal attempt blocked")
		}

		err := os.WriteFile(cleanedPath, uploadBytes, 0600)
		if err != nil {
			statsMutex.Lock()
			stats, _ = s.readStats()
			stats.FailureCount++
			s.writeStats(stats)
			statsMutex.Unlock()
			return "", err
		}

		statsMutex.Lock()
		stats, _ = s.readStats()
		stats.TotalCompressedSize += int64(len(uploadBytes))
		stats.SuccessCount++
		s.writeStats(stats)
		statsMutex.Unlock()

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
		statsMutex.Lock()
		stats, _ = s.readStats()
		stats.FailureCount++
		s.writeStats(stats)
		statsMutex.Unlock()
		return "", err
	}

	statsMutex.Lock()
	stats, _ = s.readStats()
	stats.TotalCompressedSize += int64(len(uploadBytes))
	stats.SuccessCount++
	s.writeStats(stats)
	statsMutex.Unlock()

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

func (s *StorageService) getStatsFilePath() string {
	return "storage-stats.json"
}

func (s *StorageService) readStats() (StorageStats, error) {
	filePath := s.getStatsFilePath()
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return s.initializeStats()
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return StorageStats{}, err
	}

	var stats StorageStats
	err = json.Unmarshal(data, &stats)
	return stats, err
}

func (s *StorageService) writeStats(stats StorageStats) error {
	data, err := json.MarshalIndent(stats, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.getStatsFilePath(), data, 0644)
}

func (s *StorageService) initializeStats() (StorageStats, error) {
	stats := StorageStats{}
	if s.localStore {
		files, err := os.ReadDir("/opt/project5/backups")
		if err == nil {
			for _, file := range files {
				if !file.IsDir() {
					info, err := file.Info()
					if err == nil {
						stats.TotalFiles++
						stats.SuccessCount++
						stats.TotalOriginalSize += info.Size()
						stats.TotalCompressedSize += info.Size()
					}
				}
			}
		}
		s.writeStats(stats)
		return stats, nil
	}

	buckets := []string{"tenant-assets", "public-contents", "db-backups"}
	for _, b := range buckets {
		err := s.s3Client.ListObjectsPagesWithContext(context.Background(), &s3.ListObjectsInput{
			Bucket: aws.String(b),
		}, func(page *s3.ListObjectsOutput, lastPage bool) bool {
			for _, obj := range page.Contents {
				stats.TotalFiles++
				stats.SuccessCount++
				stats.TotalOriginalSize += aws.Int64Value(obj.Size)
				stats.TotalCompressedSize += aws.Int64Value(obj.Size)
			}
			return true
		})
		if err != nil {
			continue
		}
	}
	s.writeStats(stats)
	return stats, nil
}

func (s *StorageService) GetStats(ctx context.Context) (StorageStats, error) {
	statsMutex.Lock()
	defer statsMutex.Unlock()
	return s.readStats()
}

type BucketStats struct {
	Name       string `json:"name"`
	TotalFiles int64  `json:"total_files"`
	TotalSize  int64  `json:"total_size"`
}

func (s *StorageService) GetBucketStats(ctx context.Context, bucket string) (BucketStats, error) {
	stats := BucketStats{Name: bucket}
	if s.localStore {
		dirPath := filepath.Join("/opt/project5/backups", bucket)
		if bucket == "db-backups" {
			dirPath = "/opt/project5/backups"
		}
		files, err := os.ReadDir(dirPath)
		if err != nil {
			return stats, err
		}
		for _, file := range files {
			if !file.IsDir() {
				name := file.Name()
				if bucket == "db-backups" && !(strings.HasSuffix(name, ".sql") || strings.HasSuffix(name, ".sql.gz")) {
					continue
				}
				info, err := file.Info()
				if err == nil {
					stats.TotalFiles++
					stats.TotalSize += info.Size()
				}
			}
		}
		return stats, nil
	}

	err := s.s3Client.ListObjectsPagesWithContext(ctx, &s3.ListObjectsInput{
		Bucket: aws.String(bucket),
	}, func(page *s3.ListObjectsOutput, lastPage bool) bool {
		for _, obj := range page.Contents {
			stats.TotalFiles++
			stats.TotalSize += aws.Int64Value(obj.Size)
		}
		return true
	})
	return stats, err
}
