package delivery

import (
	"net/http"

	"gateways/gateway-export/internal/exporter"
	"gateways/shared/auditclient"
	"github.com/gin-gonic/gin"
)

type HTTPHandler struct {
	worker *exporter.Worker
	audit  *auditclient.Client
}

func NewHTTPHandler(worker *exporter.Worker) *HTTPHandler {
	return &HTTPHandler{
		worker: worker,
		audit:  auditclient.NewFromEnv(),
	}
}

// POST /export/invoice/:invoiceId
func (h *HTTPHandler) ExportInvoice(c *gin.Context) {
	ctx := c.Request.Context()
	invoiceID := c.Param("invoiceId")
	tenantSlug := c.Query("tenantSlug")
	if tenantSlug == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": "tenantSlug query param is required"}})
		return
	}

	params := map[string]any{
		"invoiceId": invoiceID,
	}

	job, err := h.worker.EnqueueJob(ctx, "invoice", tenantSlug, params)
	if err != nil {
		h.audit.LogError(ctx,
			tenantSlug, c.GetHeader("X-Actor-ID"),
			"EXPORT_INVOICE_FAILED", "EXPORT", invoiceID,
			auditclient.GroupOperations, "gateway-export",
			err.Error(), map[string]any{"type": "invoice"},
		)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "INTERNAL_ERROR", "message": err.Error()}})
		return
	}

	h.worker.ProcessAsync(job)

	// Audit: export job enqueued
	h.audit.LogSuccess(ctx,
		tenantSlug, c.GetHeader("X-Actor-ID"),
		"EXPORT_INVOICE_QUEUED", "EXPORT", job.JobID,
		auditclient.GroupOperations, "gateway-export",
		map[string]any{"type": "invoice", "invoice_id": invoiceID},
	)

	c.JSON(http.StatusAccepted, gin.H{
		"success": true,
		"data": gin.H{
			"jobId":  job.JobID,
			"status": job.Status,
		},
	})
}

// POST /export/report/billing
func (h *HTTPHandler) ExportBillingReport(c *gin.Context) {
	ctx := c.Request.Context()
	var req exporter.ExportReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	params := map[string]any{
		"period": req.Period,
		"format": req.Format,
	}

	job, err := h.worker.EnqueueJob(ctx, "billing", req.TenantSlug, params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "INTERNAL_ERROR", "message": err.Error()}})
		return
	}

	h.worker.ProcessAsync(job)

	// Audit: billing report export queued
	h.audit.LogSuccess(ctx,
		req.TenantSlug, c.GetHeader("X-Actor-ID"),
		"EXPORT_BILLING_REPORT_QUEUED", "EXPORT", job.JobID,
		auditclient.GroupOperations, "gateway-export",
		map[string]any{"type": "billing", "period": req.Period, "format": req.Format},
	)

	c.JSON(http.StatusAccepted, gin.H{
		"success": true,
		"data": gin.H{
			"jobId":  job.JobID,
			"status": job.Status,
		},
	})
}

// POST /export/report/network
func (h *HTTPHandler) ExportNetworkReport(c *gin.Context) {
	h.enqueueGenericReport(c, "network")
}

// POST /export/report/inventory
func (h *HTTPHandler) ExportInventoryReport(c *gin.Context) {
	h.enqueueGenericReport(c, "inventory")
}

// POST /export/report/tickets
func (h *HTTPHandler) ExportTicketsReport(c *gin.Context) {
	h.enqueueGenericReport(c, "tickets")
}

// POST /export/report/customer
func (h *HTTPHandler) ExportCustomerReport(c *gin.Context) {
	h.enqueueGenericReport(c, "customer")
}

func (h *HTTPHandler) enqueueGenericReport(c *gin.Context, reportType string) {
	ctx := c.Request.Context()
	var req exporter.ExportReportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	params := map[string]any{
		"period": req.Period,
		"format": req.Format,
	}

	job, err := h.worker.EnqueueJob(ctx, reportType, req.TenantSlug, params)
	if err != nil {
		h.audit.LogError(ctx,
			req.TenantSlug, c.GetHeader("X-Actor-ID"),
			"EXPORT_REPORT_FAILED", "EXPORT", "",
			auditclient.GroupOperations, "gateway-export",
			err.Error(), map[string]any{"type": reportType},
		)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "INTERNAL_ERROR", "message": err.Error()}})
		return
	}

	h.worker.ProcessAsync(job)

	// Audit: generic report export queued
	h.audit.LogSuccess(ctx,
		req.TenantSlug, c.GetHeader("X-Actor-ID"),
		"EXPORT_REPORT_QUEUED", "EXPORT", job.JobID,
		auditclient.GroupOperations, "gateway-export",
		map[string]any{"type": reportType, "period": req.Period, "format": req.Format},
	)

	c.JSON(http.StatusAccepted, gin.H{
		"success": true,
		"data": gin.H{
			"jobId":  job.JobID,
			"status": job.Status,
		},
	})
}

// GET /export/jobs — list recent export jobs from Redis
func (h *HTTPHandler) GetRecentJobs(c *gin.Context) {
	ctx := c.Request.Context()

	jobs, err := h.worker.ListRecentJobs(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"error":   gin.H{"code": "INTERNAL_ERROR", "message": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    jobs,
	})
}

// GET /export/job/:jobId/status
func (h *HTTPHandler) GetJobStatus(c *gin.Context) {
	ctx := c.Request.Context()
	jobID := c.Param("jobId")

	job, err := h.worker.GetJob(ctx, jobID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "Job not found"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    job,
	})
}

// GET /export/job/:jobId/download
func (h *HTTPHandler) DownloadJob(c *gin.Context) {
	ctx := c.Request.Context()
	jobID := c.Param("jobId")

	job, err := h.worker.GetJob(ctx, jobID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "Job not found"}})
		return
	}

	if job.Status != exporter.StatusDone {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "INVALID_STATE", "message": "Job is not finished yet"}})
		return
	}

	if job.DownloadURL == "" {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "NO_FILE", "message": "Download URL is not available. Check error details: " + job.ErrorMsg}})
		return
	}

	c.Redirect(http.StatusFound, job.DownloadURL)
}
