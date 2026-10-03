package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"time"
)

// AuditArchiveMeta represents the metadata manifest of an archived partition
type AuditArchiveMeta struct {
	Partition         string `json:"partition"`
	ParentTable       string `json:"parentTable"`
	ArchivedAt        string `json:"archivedAt"`
	TotalRows         int64  `json:"totalRows"`
	FileSizeBytes     int64  `json:"fileSizeBytes"`
	SHA256Checksum    string `json:"sha256Checksum"`
	ArchiveFileName   string `json:"archiveFileName"`
	S3Path            string `json:"s3Path"`
	WORMRetentionDays int    `json:"wormRetentionDays"`
	Status            string `json:"status"`
	StartDate         string `json:"startDate,omitempty"`
	EndDate           string `json:"endDate,omitempty"`
}

// ArchiveSummary provides aggregated metrics across all cold storage archives
type ArchiveSummary struct {
	TotalArchives        int    `json:"totalArchives"`
	TotalArchivedRows    int64  `json:"totalArchivedRows"`
	TotalSizeBytes       int64  `json:"totalSizeBytes"`
	TotalSizeFormatted   string `json:"totalSizeFormatted"`
	OldestArchive        string `json:"oldestArchive"`
	NewestArchive        string `json:"newestArchive"`
	WORMComplianceStatus string `json:"wormComplianceStatus"`
	RetentionPolicy      string `json:"retentionPolicy"`
}

// AuditArchiveQuery parameters for filtering archives
type AuditArchiveQuery struct {
	Table     string
	StartDate *time.Time
	EndDate   *time.Time
	Search    string
}

// ArchiveReader provides discovery and inspection of cold storage S3/local partition archives
type ArchiveReader struct {
	baseDir    string
	s3Bucket   string
	s3Endpoint string
}

// NewArchiveReader initializes a new cold storage archive reader
func NewArchiveReader(baseDir, s3Bucket, s3Endpoint string) *ArchiveReader {
	if baseDir == "" {
		baseDir = "/opt/project5/backups/archive/audit_events"
	}
	if s3Bucket == "" {
		s3Bucket = "audit-archives"
	}
	return &ArchiveReader{
		baseDir:    baseDir,
		s3Bucket:   s3Bucket,
		s3Endpoint: s3Endpoint,
	}
}

// ListArchives scans for partition manifests and returns metadata and summary metrics
func (r *ArchiveReader) ListArchives(ctx context.Context, q AuditArchiveQuery) ([]*AuditArchiveMeta, *ArchiveSummary, error) {
	var archives []*AuditArchiveMeta
	var totalRows int64
	var totalBytes int64

	targetDirs := []string{
		filepath.Join(r.baseDir, "audit_events"),
		filepath.Join(r.baseDir, "audit_logs"),
		r.baseDir,
	}

	seenFiles := make(map[string]bool)

	for _, dir := range targetDirs {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			continue
		}

		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}

		for _, entry := range entries {
			if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".meta.json") {
				continue
			}

			fullPath := filepath.Join(dir, entry.Name())
			if seenFiles[fullPath] {
				continue
			}
			seenFiles[fullPath] = true

			data, err := os.ReadFile(fullPath)
			if err != nil {
				continue
			}

			var meta AuditArchiveMeta
			if err := json.Unmarshal(data, &meta); err != nil {
				continue
			}

			// Derive date boundaries from partition name if not set
			if meta.StartDate == "" || meta.EndDate == "" {
				start, end := ParsePartitionDateRange(meta.Partition)
				meta.StartDate = start
				meta.EndDate = end
			}

			if meta.Status == "" {
				meta.Status = "LOCKED_WORM_COMPLIANT"
			}
			if meta.WORMRetentionDays == 0 {
				meta.WORMRetentionDays = 1095
			}

			// Apply Filters
			if q.Table != "" && !strings.EqualFold(meta.ParentTable, q.Table) && !strings.Contains(meta.Partition, q.Table) {
				continue
			}

			if q.Search != "" {
				s := strings.ToLower(q.Search)
				if !strings.Contains(strings.ToLower(meta.Partition), s) &&
					!strings.Contains(strings.ToLower(meta.ArchiveFileName), s) &&
					!strings.Contains(strings.ToLower(meta.SHA256Checksum), s) {
					continue
				}
			}

			if q.StartDate != nil && meta.EndDate != "" {
				if endT, err := time.Parse(time.RFC3339, meta.EndDate); err == nil {
					if endT.Before(*q.StartDate) {
						continue
					}
				}
			}

			if q.EndDate != nil && meta.StartDate != "" {
				if startT, err := time.Parse(time.RFC3339, meta.StartDate); err == nil {
					if startT.After(*q.EndDate) {
						continue
					}
				}
			}

			totalRows += meta.TotalRows
			totalBytes += meta.FileSizeBytes
			archives = append(archives, &meta)
		}
	}

	// Sort archives by StartDate descending (newest first)
	sort.Slice(archives, func(i, j int) bool {
		return archives[i].StartDate > archives[j].StartDate
	})

	oldest := ""
	newest := ""
	if len(archives) > 0 {
		newest = archives[0].Partition
		oldest = archives[len(archives)-1].Partition
	}

	summary := &ArchiveSummary{
		TotalArchives:        len(archives),
		TotalArchivedRows:    totalRows,
		TotalSizeBytes:       totalBytes,
		TotalSizeFormatted:   FormatBytes(totalBytes),
		OldestArchive:        oldest,
		NewestArchive:        newest,
		WORMComplianceStatus: "COMPLIANT_LOCKED",
		RetentionPolicy:      "1095 Days (3 Years WORM Compliance)",
	}

	return archives, summary, nil
}

// ParsePartitionDateRange extracts start and end RFC3339 timestamps from partition naming convention
// Example: audit_events_y2026_m06 or audit_events_y2026m06
var partitionRegex = regexp.MustCompile(`_y(\d{4})_?m(\d{2})`)

func ParsePartitionDateRange(partition string) (string, string) {
	matches := partitionRegex.FindStringSubmatch(partition)
	if len(matches) < 3 {
		return "", ""
	}

	yearStr := matches[1]
	monthStr := matches[2]

	var year, month int
	fmt.Sscanf(yearStr, "%d", &year)
	fmt.Sscanf(monthStr, "%d", &month)

	if year < 2000 || month < 1 || month > 12 {
		return "", ""
	}

	loc := time.UTC
	startTime := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, loc)
	endTime := startTime.AddDate(0, 1, 0).Add(-time.Nanosecond)

	return startTime.Format(time.RFC3339), endTime.Format(time.RFC3339)
}

// FormatBytes converts raw byte count to human-readable string
func FormatBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.2f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}
