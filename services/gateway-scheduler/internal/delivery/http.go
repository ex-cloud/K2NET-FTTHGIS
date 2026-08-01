package delivery

import (
	"net/http"

	"gateways/gateway-scheduler/internal/scheduler"
	"gateways/shared/auditclient"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
)

type HTTPHandler struct {
	repo   *scheduler.Repository
	engine *scheduler.Engine
	audit  *auditclient.Client
}

func NewHTTPHandler(repo *scheduler.Repository, engine *scheduler.Engine) *HTTPHandler {
	return &HTTPHandler{
		repo:   repo,
		engine: engine,
		audit:  auditclient.NewFromEnv(),
	}
}

// POST /scheduler/jobs
func (h *HTTPHandler) CreateJob(c *gin.Context) {
	ctx := c.Request.Context()
	var req scheduler.CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	job, err := h.repo.CreateJob(ctx, &req)
	if err != nil {
		h.audit.LogError(ctx,
			req.TenantSlug, c.GetHeader("X-Actor-ID"),
			"SCHEDULER_JOB_CREATE_FAILED", "SCHEDULER_JOB", "",
			auditclient.GroupOperations, "gateway-scheduler",
			err.Error(), map[string]any{"job_name": req.Name, "cron": req.CronExpr},
		)
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	// Register in cron engine if active
	if job.IsActive {
		if err := h.engine.AddJob(ctx, job); err != nil {
			c.JSON(http.StatusCreated, gin.H{
				"success": true,
				"data":    job,
				"warning": "Job saved but failed to register in cron engine: " + err.Error(),
			})
			return
		}
	}

	// Audit: scheduler job created
	h.audit.LogSuccess(ctx,
		req.TenantSlug, c.GetHeader("X-Actor-ID"),
		"SCHEDULER_JOB_CREATED", "SCHEDULER_JOB", job.ID,
		auditclient.GroupOperations, "gateway-scheduler",
		map[string]any{"job_name": req.Name, "cron": req.CronExpr, "job_type": req.JobType},
	)

	c.JSON(http.StatusCreated, gin.H{"success": true, "data": job})
}

// GET /scheduler/jobs
func (h *HTTPHandler) GetJobs(c *gin.Context) {
	ctx := c.Request.Context()
	jobs, err := h.repo.ListAllJobs(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": jobs})
}

// GET /scheduler/jobs/tenant/:slug
func (h *HTTPHandler) GetTenantJobs(c *gin.Context) {
	ctx := c.Request.Context()
	slug := c.Param("slug")
	jobs, err := h.repo.ListTenantJobs(ctx, slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": jobs})
}

// GET /scheduler/jobs/:id
func (h *HTTPHandler) GetJob(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	job, err := h.repo.GetJob(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "Job not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	history, _ := h.repo.GetJobHistory(ctx, id, 10)
	c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"job": job, "history": history}})
}

// PUT /scheduler/jobs/:id
func (h *HTTPHandler) UpdateJob(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	var req scheduler.UpdateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "error": gin.H{"code": "BAD_REQUEST", "message": err.Error()}})
		return
	}

	job, err := h.repo.UpdateJob(ctx, id, &req)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "Job not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	// Update cron engine entry (re-register with new expr or deactivate)
	_ = h.engine.UpdateJob(ctx, job)

	c.JSON(http.StatusOK, gin.H{"success": true, "data": job})
}

// DELETE /scheduler/jobs/:id
func (h *HTTPHandler) DeleteJob(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	if err := h.repo.SoftDeleteJob(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	// Remove from cron engine
	h.engine.RemoveJob(id)

	c.JSON(http.StatusOK, gin.H{"success": true, "message": "Job deactivated successfully"})
}

// POST /scheduler/jobs/:id/trigger
func (h *HTTPHandler) TriggerJob(c *gin.Context) {
	ctx := c.Request.Context()
	id := c.Param("id")

	job, err := h.repo.GetJob(ctx, id)
	if err != nil {
		if err == pgx.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"success": false, "error": gin.H{"code": "NOT_FOUND", "message": "Job not found"}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}

	h.engine.TriggerJob(ctx, job)

	// Audit: scheduler job manually triggered
	h.audit.LogSuccess(ctx,
		job.TenantSlug, c.GetHeader("X-Actor-ID"),
		"SCHEDULER_JOB_TRIGGERED", "SCHEDULER_JOB", id,
		auditclient.GroupOperations, "gateway-scheduler",
		map[string]any{"job_name": job.Name, "trigger": "manual"},
	)

	c.JSON(http.StatusAccepted, gin.H{"success": true, "message": "Job triggered successfully", "data": gin.H{"jobId": id}})
}

// GET /scheduler/history/:jobId
func (h *HTTPHandler) GetJobHistory(c *gin.Context) {
	ctx := c.Request.Context()
	jobID := c.Param("jobId")

	history, err := h.repo.GetJobHistory(ctx, jobID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"success": false, "error": gin.H{"code": "DB_ERROR", "message": err.Error()}})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "data": history})
}
