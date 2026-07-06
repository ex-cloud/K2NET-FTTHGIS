package scheduler

import "time"

// Job represents a scheduled cron job stored in Postgres
type Job struct {
	ID          string         `json:"id" db:"id"`
	TenantSlug  string         `json:"tenantSlug" db:"tenant_slug"`
	Name        string         `json:"name" db:"name"`
	Description string         `json:"description" db:"description"`
	CronExpr    string         `json:"cronExpr" db:"cron_expr"`
	JobType     string         `json:"jobType" db:"job_type"`
	Payload     map[string]any `json:"payload" db:"payload"`
	IsActive    bool           `json:"isActive" db:"is_active"`
	LastRunAt   *time.Time     `json:"lastRunAt" db:"last_run_at"`
	NextRunAt   *time.Time     `json:"nextRunAt" db:"next_run_at"`
	CreatedAt   time.Time      `json:"createdAt" db:"created_at"`
	UpdatedAt   time.Time      `json:"updatedAt" db:"updated_at"`
}

// JobHistory represents one execution record for a Job
type JobHistory struct {
	ID           string     `json:"id" db:"id"`
	JobID        string     `json:"jobId" db:"job_id"`
	TenantSlug   string     `json:"tenantSlug" db:"tenant_slug"`
	Status       string     `json:"status" db:"status"` // queued, running, done, failed
	StartedAt    *time.Time `json:"startedAt" db:"started_at"`
	FinishedAt   *time.Time `json:"finishedAt" db:"finished_at"`
	DurationMs   *int       `json:"durationMs" db:"duration_ms"`
	ErrorMessage *string    `json:"errorMessage" db:"error_message"`
	CreatedAt    time.Time  `json:"createdAt" db:"created_at"`
}

// CreateJobRequest is the payload for creating a new job
type CreateJobRequest struct {
	TenantSlug  string         `json:"tenantSlug" binding:"required"`
	Name        string         `json:"name" binding:"required"`
	Description string         `json:"description"`
	CronExpr    string         `json:"cronExpr" binding:"required"`
	JobType     string         `json:"jobType" binding:"required"`
	Payload     map[string]any `json:"payload"`
}

// UpdateJobRequest is the payload for updating an existing job
type UpdateJobRequest struct {
	Name        *string        `json:"name"`
	Description *string        `json:"description"`
	CronExpr    *string        `json:"cronExpr"`
	Payload     map[string]any `json:"payload"`
	IsActive    *bool          `json:"isActive"`
}
