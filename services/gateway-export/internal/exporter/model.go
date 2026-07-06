package exporter

import "time"

// JobStatus constants
const (
	StatusQueued     = "queued"
	StatusProcessing = "processing"
	StatusDone       = "done"
	StatusFailed     = "failed"
)

// ExportJob represents the async export job tracked in Redis
type ExportJob struct {
	JobID       string     `json:"jobId"`
	TenantSlug  string     `json:"tenantSlug"`
	Type        string     `json:"type"`        // "invoice", "billing", "network", "inventory", "tickets", "customer"
	Status      string     `json:"status"`      // queued, processing, done, failed
	Params      map[string]any `json:"params"`  // e.g., {"invoiceId": "...", "period": "2026-06"}
	DownloadURL string     `json:"downloadUrl,omitempty"`
	ErrorMsg    string     `json:"errorMsg,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

// InvoiceData holds data for PDF invoice generation
type InvoiceData struct {
	InvoiceNumber string     `json:"invoiceNumber"`
	InvoiceDate   time.Time  `json:"invoiceDate"`
	DueDate       time.Time  `json:"dueDate"`
	CustomerName  string     `json:"customerName"`
	CustomerAddr  string     `json:"customerAddr"`
	CustomerPhone string     `json:"customerPhone"`
	TenantName    string     `json:"tenantName"`
	TenantAddr    string     `json:"tenantAddr"`
	Items         []InvoiceItem `json:"items"`
	Subtotal      float64    `json:"subtotal"`
	Tax           float64    `json:"tax"`
	Total         float64    `json:"total"`
	BankName      string     `json:"bankName"`
	AccountNumber string     `json:"accountNumber"`
	AccountName   string     `json:"accountName"`
}

type InvoiceItem struct {
	Description string  `json:"description"`
	Qty         int     `json:"qty"`
	UnitPrice   float64 `json:"unitPrice"`
	Total       float64 `json:"total"`
}

// ExportReportRequest common params for report endpoints
type ExportReportRequest struct {
	TenantSlug string `json:"tenantSlug" binding:"required"`
	Period     string `json:"period"`      // e.g., "2026-06"
	Format     string `json:"format"`      // "excel" or "pdf", default "excel"
}
