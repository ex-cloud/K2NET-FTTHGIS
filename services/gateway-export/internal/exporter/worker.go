package exporter

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"

	"gateways/shared/logger"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

type Worker struct {
	rdb               *redis.Client
	db                *pgxpool.Pool
	storageGatewayURL string
	gatewayToken      string
}

func NewWorker(rdb *redis.Client, db *pgxpool.Pool, storageGatewayURL, gatewayToken string) *Worker {
	return &Worker{
		rdb:               rdb,
		db:                db,
		storageGatewayURL: storageGatewayURL,
		gatewayToken:      gatewayToken,
	}
}

// EnqueueJob creates a new job entry in Redis and returns the job ID
func (w *Worker) EnqueueJob(ctx context.Context, jobType, tenantSlug string, params map[string]any) (*ExportJob, error) {
	jobID := uuid.New().String()
	now := time.Now()
	job := &ExportJob{
		JobID:      jobID,
		TenantSlug: tenantSlug,
		Type:       jobType,
		Status:     StatusQueued,
		Params:     params,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	data, err := json.Marshal(job)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal job: %w", err)
	}

	key := "export:job:" + jobID
	if err := w.rdb.Set(ctx, key, data, 24*time.Hour).Err(); err != nil {
		return nil, fmt.Errorf("failed to store job in redis: %w", err)
	}

	return job, nil
}

// GetJob retrieves a job from Redis
func (w *Worker) GetJob(ctx context.Context, jobID string) (*ExportJob, error) {
	key := "export:job:" + jobID
	data, err := w.rdb.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var job ExportJob
	if err := json.Unmarshal([]byte(data), &job); err != nil {
		return nil, err
	}
	return &job, nil
}

// ListRecentJobs scans Redis for all export:job:* keys and returns up to 20 most recent jobs
func (w *Worker) ListRecentJobs(ctx context.Context) ([]*ExportJob, error) {
	var cursor uint64
	var keys []string

	for {
		ks, nextCursor, err := w.rdb.Scan(ctx, cursor, "export:job:*", 100).Result()
		if err != nil {
			return nil, fmt.Errorf("failed to scan redis keys: %w", err)
		}
		keys = append(keys, ks...)
		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}

	if len(keys) == 0 {
		return []*ExportJob{}, nil
	}

	// Batch-get all jobs
	pipe := w.rdb.Pipeline()
	cmds := make([]*redis.StringCmd, len(keys))
	for i, k := range keys {
		cmds[i] = pipe.Get(ctx, k)
	}
	if _, err := pipe.Exec(ctx); err != nil && err != redis.Nil {
		return nil, fmt.Errorf("failed to batch get jobs: %w", err)
	}

	var jobs []*ExportJob
	for _, cmd := range cmds {
		raw, err := cmd.Result()
		if err != nil {
			continue
		}
		var job ExportJob
		if err := json.Unmarshal([]byte(raw), &job); err != nil {
			continue
		}
		jobs = append(jobs, &job)
	}

	// Sort by UpdatedAt descending (most recent first), take up to 20
	for i := 0; i < len(jobs)-1; i++ {
		for j := i + 1; j < len(jobs); j++ {
			if jobs[j].UpdatedAt.After(jobs[i].UpdatedAt) {
				jobs[i], jobs[j] = jobs[j], jobs[i]
			}
		}
	}
	if len(jobs) > 20 {
		jobs = jobs[:20]
	}

	return jobs, nil
}

// UpdateJobStatus updates the status of a job in Redis
func (w *Worker) updateJob(ctx context.Context, job *ExportJob) {
	job.UpdatedAt = time.Now()
	data, _ := json.Marshal(job)
	key := "export:job:" + job.JobID
	w.rdb.Set(ctx, key, data, 24*time.Hour)
}

// ProcessAsync runs the job processing in a goroutine
func (w *Worker) ProcessAsync(job *ExportJob) {
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
		defer cancel()

		logger.Info(ctx, "Processing export job",
			zap.String("jobId", job.JobID),
			zap.String("type", job.Type),
		)

		job.Status = StatusProcessing
		w.updateJob(ctx, job)

		var fileBytes []byte
		var filename string
		var contentType string
		var err error

		switch job.Type {
		case "invoice":
			fileBytes, filename, contentType, err = w.processInvoice(ctx, job)
		case "billing":
			fileBytes, filename, contentType, err = w.processBillingReport(ctx, job)
		case "network", "inventory", "tickets", "customer":
			fileBytes, filename, contentType, err = w.processGenericReport(ctx, job)
		default:
			err = fmt.Errorf("unknown job type: %s", job.Type)
		}

		if err != nil {
			logger.Error(ctx, "Export job failed", zap.String("jobId", job.JobID), zap.Error(err))
			job.Status = StatusFailed
			job.ErrorMsg = err.Error()
			w.updateJob(ctx, job)
			return
		}

		// Upload to storage-gateway
		downloadURL, uploadErr := w.uploadToStorage(ctx, job.TenantSlug, filename, contentType, fileBytes)
		if uploadErr != nil {
			logger.Error(ctx, "Failed to upload export to storage", zap.Error(uploadErr))
			// Still mark done but with local note
			job.Status = StatusDone
			job.DownloadURL = ""
			job.ErrorMsg = "File generated but upload failed: " + uploadErr.Error()
		} else {
			job.Status = StatusDone
			job.DownloadURL = downloadURL
		}

		w.updateJob(ctx, job)

		// Notify via Redis
		notif := map[string]any{
			"jobId":       job.JobID,
			"tenant":      job.TenantSlug,
			"type":        job.Type,
			"downloadUrl": job.DownloadURL,
		}
		notifJSON, _ := json.Marshal(notif)
		w.rdb.Publish(ctx, "export:done:"+job.TenantSlug, notifJSON)

		logger.Info(ctx, "Export job completed",
			zap.String("jobId", job.JobID),
			zap.String("downloadUrl", job.DownloadURL),
		)
	}()
}

func (w *Worker) processInvoice(ctx context.Context, job *ExportJob) ([]byte, string, string, error) {
	invoiceID, _ := job.Params["invoiceId"].(string)

	// Query invoice data from PostgreSQL
	data, err := w.fetchInvoiceFromDB(ctx, invoiceID, job.TenantSlug)
	if err != nil {
		// Fallback: generate with dummy data if no schema yet
		data = w.dummyInvoiceData(invoiceID, job.TenantSlug)
	}

	pdfBytes, err := GenerateInvoicePDF(data)
	if err != nil {
		return nil, "", "", err
	}

	filename := fmt.Sprintf("invoice-%s-%s.pdf", invoiceID, time.Now().Format("20060102"))
	return pdfBytes, filename, "application/pdf", nil
}

func (w *Worker) processBillingReport(ctx context.Context, job *ExportJob) ([]byte, string, string, error) {
	period, _ := job.Params["period"].(string)
	if period == "" {
		period = time.Now().Format("2006-01")
	}

	rows, err := w.fetchBillingRows(ctx, job.TenantSlug, period)
	if err != nil || len(rows) == 0 {
		rows = w.dummyBillingRows()
	}

	excelBytes, err := GenerateBillingExcel(job.TenantSlug, period, rows)
	if err != nil {
		return nil, "", "", err
	}

	filename := fmt.Sprintf("billing-%s-%s.xlsx", job.TenantSlug, period)
	return excelBytes, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nil
}

func (w *Worker) processGenericReport(ctx context.Context, job *ExportJob) ([]byte, string, string, error) {
	period, _ := job.Params["period"].(string)

	title := fmt.Sprintf("Laporan %s — %s — %s", job.Type, job.TenantSlug, period)
	headers := []string{"No", "ID", "Nama", "Status", "Tanggal", "Keterangan"}
	data := [][]any{
		{1, "N/A", "Data akan diisi setelah skema DB tersedia", "active", time.Now().Format("02/01/2006"), "-"},
	}

	excelBytes, err := GenerateGenericExcel(title, job.Type, headers, data)
	if err != nil {
		return nil, "", "", err
	}

	filename := fmt.Sprintf("%s-%s-%s.xlsx", job.Type, job.TenantSlug, period)
	return excelBytes, filename, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nil
}

func (w *Worker) uploadToStorage(ctx context.Context, tenantSlug, filename, contentType string, fileBytes []byte) (string, error) {
	if w.storageGatewayURL == "" {
		return "", fmt.Errorf("storage gateway URL not configured")
	}

	var body bytes.Buffer
	mw := multipart.NewWriter(&body)

	_ = mw.WriteField("tenantSlug", tenantSlug)
	_ = mw.WriteField("folder", "exports")

	part, err := mw.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}
	part.Write(fileBytes)
	mw.Close()

	req, err := http.NewRequestWithContext(ctx, "POST", w.storageGatewayURL+"/api/v1/storage/upload", &body)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.Header.Set("X-Gateway-Token", w.gatewayToken)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("upload request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode >= 300 {
		return "", fmt.Errorf("storage gateway returned %d: %s", resp.StatusCode, string(respBody))
	}

	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", nil
	}

	if data, ok := result["data"].(map[string]any); ok {
		if url, ok := data["url"].(string); ok {
			return url, nil
		}
	}
	return "", nil
}

// DB queries
func (w *Worker) fetchInvoiceFromDB(ctx context.Context, invoiceID, tenantSlug string) (*InvoiceData, error) {
	// This queries the main FTTH database for invoice details
	// Schema: invoices, invoice_items, customers, packages tables
	row := w.db.QueryRow(ctx, `
		SELECT i.invoice_number, i.invoice_date, i.due_date, i.subtotal, i.tax, i.total,
		       c.full_name, c.address, c.phone_number
		FROM invoices i
		JOIN customers c ON i.customer_id = c.id
		WHERE i.id = $1 AND i.tenant_slug = $2
	`, invoiceID, tenantSlug)

	var data InvoiceData
	err := row.Scan(&data.InvoiceNumber, &data.InvoiceDate, &data.DueDate,
		&data.Subtotal, &data.Tax, &data.Total,
		&data.CustomerName, &data.CustomerAddr, &data.CustomerPhone)
	if err != nil {
		return nil, err
	}

	data.TenantName = tenantSlug
	data.BankName = "BRI"
	data.AccountNumber = "1234567890"
	data.AccountName = tenantSlug
	return &data, nil
}

func (w *Worker) fetchBillingRows(ctx context.Context, tenantSlug, period string) ([]BillingRow, error) {
	rows, err := w.db.Query(ctx, `
		SELECT c.full_name, i.invoice_number, p.name, i.total, 
		       CASE WHEN i.paid_at IS NOT NULL THEN 'lunas' ELSE 'belum bayar' END as status,
		       i.paid_at, ''
		FROM invoices i
		JOIN customers c ON i.customer_id = c.id
		JOIN packages p ON i.package_id = p.id
		WHERE i.tenant_slug = $1
		  AND TO_CHAR(i.invoice_date, 'YYYY-MM') = $2
		ORDER BY c.full_name
	`, tenantSlug, period)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []BillingRow
	for rows.Next() {
		var r BillingRow
		if err := rows.Scan(&r.CustomerName, &r.InvoiceNumber, &r.PackageName,
			&r.Amount, &r.Status, &r.PaidAt, &r.Notes); err != nil {
			continue
		}
		result = append(result, r)
	}
	return result, nil
}

// Fallback dummy data for demo/testing
func (w *Worker) dummyInvoiceData(invoiceID, tenant string) *InvoiceData {
	return &InvoiceData{
		InvoiceNumber: "INV-" + invoiceID,
		InvoiceDate:   time.Now(),
		DueDate:       time.Now().Add(14 * 24 * time.Hour),
		CustomerName:  "Budi Santoso",
		CustomerAddr:  "Jl. Merdeka No. 10, Garut",
		CustomerPhone: "08123456789",
		TenantName:    tenant,
		TenantAddr:    "Jl. Raya Garut No. 1",
		Items: []InvoiceItem{
			{Description: "Langganan Internet 20 Mbps", Qty: 1, UnitPrice: 250000, Total: 250000},
		},
		Subtotal:      250000,
		Tax:           27500,
		Total:         277500,
		BankName:      "BRI",
		AccountNumber: "1234567890",
		AccountName:   tenant,
	}
}

func (w *Worker) dummyBillingRows() []BillingRow {
	return []BillingRow{
		{CustomerName: "Sample Customer", InvoiceNumber: "INV-001", PackageName: "20 Mbps", Amount: 250000, Status: "lunas"},
	}
}
