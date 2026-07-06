package scheduler

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) RunMigrations(ctx context.Context) error {
	_, err := r.db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS scheduled_jobs (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			tenant_slug VARCHAR(100) NOT NULL,
			name VARCHAR(255) NOT NULL,
			description TEXT,
			cron_expr VARCHAR(100) NOT NULL,
			job_type VARCHAR(100) NOT NULL,
			payload JSONB,
			is_active BOOLEAN DEFAULT true,
			last_run_at TIMESTAMPTZ,
			next_run_at TIMESTAMPTZ,
			created_at TIMESTAMPTZ DEFAULT NOW(),
			updated_at TIMESTAMPTZ DEFAULT NOW()
		);
		CREATE TABLE IF NOT EXISTS job_execution_history (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			job_id UUID REFERENCES scheduled_jobs(id) ON DELETE CASCADE,
			tenant_slug VARCHAR(100) NOT NULL,
			status VARCHAR(50) NOT NULL DEFAULT 'queued',
			started_at TIMESTAMPTZ,
			finished_at TIMESTAMPTZ,
			duration_ms INTEGER,
			error_message TEXT,
			created_at TIMESTAMPTZ DEFAULT NOW()
		);
	`)
	return err
}

func (r *Repository) CreateJob(ctx context.Context, req *CreateJobRequest) (*Job, error) {
	payloadJSON, err := json.Marshal(req.Payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payload: %w", err)
	}

	var job Job
	var payloadBytes []byte
	err = r.db.QueryRow(ctx, `
		INSERT INTO scheduled_jobs (tenant_slug, name, description, cron_expr, job_type, payload)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, tenant_slug, name, description, cron_expr, job_type, payload,
		          is_active, last_run_at, next_run_at, created_at, updated_at
	`, req.TenantSlug, req.Name, req.Description, req.CronExpr, req.JobType, payloadJSON).
		Scan(&job.ID, &job.TenantSlug, &job.Name, &job.Description,
			&job.CronExpr, &job.JobType, &payloadBytes,
			&job.IsActive, &job.LastRunAt, &job.NextRunAt,
			&job.CreatedAt, &job.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create job: %w", err)
	}

	_ = json.Unmarshal(payloadBytes, &job.Payload)
	return &job, nil
}

func (r *Repository) ListAllJobs(ctx context.Context) ([]*Job, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, tenant_slug, name, description, cron_expr, job_type, payload,
		       is_active, last_run_at, next_run_at, created_at, updated_at
		FROM scheduled_jobs ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanJobs(rows)
}

func (r *Repository) ListTenantJobs(ctx context.Context, tenantSlug string) ([]*Job, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, tenant_slug, name, description, cron_expr, job_type, payload,
		       is_active, last_run_at, next_run_at, created_at, updated_at
		FROM scheduled_jobs WHERE tenant_slug = $1 ORDER BY created_at DESC
	`, tenantSlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanJobs(rows)
}

func (r *Repository) GetJob(ctx context.Context, id string) (*Job, error) {
	var job Job
	var payloadBytes []byte
	err := r.db.QueryRow(ctx, `
		SELECT id, tenant_slug, name, description, cron_expr, job_type, payload,
		       is_active, last_run_at, next_run_at, created_at, updated_at
		FROM scheduled_jobs WHERE id = $1
	`, id).Scan(&job.ID, &job.TenantSlug, &job.Name, &job.Description,
		&job.CronExpr, &job.JobType, &payloadBytes,
		&job.IsActive, &job.LastRunAt, &job.NextRunAt,
		&job.CreatedAt, &job.UpdatedAt)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(payloadBytes, &job.Payload)
	return &job, nil
}

func (r *Repository) GetActiveJobs(ctx context.Context) ([]*Job, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, tenant_slug, name, description, cron_expr, job_type, payload,
		       is_active, last_run_at, next_run_at, created_at, updated_at
		FROM scheduled_jobs WHERE is_active = true ORDER BY created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanJobs(rows)
}

func (r *Repository) UpdateJob(ctx context.Context, id string, req *UpdateJobRequest) (*Job, error) {
	// Build partial update using COALESCE
	payloadJSON, _ := json.Marshal(req.Payload)
	var job Job
	var payloadBytes []byte

	err := r.db.QueryRow(ctx, `
		UPDATE scheduled_jobs SET
			name        = COALESCE($2, name),
			description = COALESCE($3, description),
			cron_expr   = COALESCE($4, cron_expr),
			payload     = COALESCE($5::jsonb, payload),
			is_active   = COALESCE($6, is_active),
			updated_at  = NOW()
		WHERE id = $1
		RETURNING id, tenant_slug, name, description, cron_expr, job_type, payload,
		          is_active, last_run_at, next_run_at, created_at, updated_at
	`, id, req.Name, req.Description, req.CronExpr, payloadJSON, req.IsActive).
		Scan(&job.ID, &job.TenantSlug, &job.Name, &job.Description,
			&job.CronExpr, &job.JobType, &payloadBytes,
			&job.IsActive, &job.LastRunAt, &job.NextRunAt,
			&job.CreatedAt, &job.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to update job: %w", err)
	}
	_ = json.Unmarshal(payloadBytes, &job.Payload)
	return &job, nil
}

func (r *Repository) SoftDeleteJob(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `
		UPDATE scheduled_jobs SET is_active = false, updated_at = NOW() WHERE id = $1
	`, id)
	return err
}

func (r *Repository) RecordExecution(ctx context.Context, h *JobHistory) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO job_execution_history
		  (job_id, tenant_slug, status, started_at, finished_at, duration_ms, error_message)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, h.JobID, h.TenantSlug, h.Status, h.StartedAt, h.FinishedAt, h.DurationMs, h.ErrorMessage)
	return err
}

func (r *Repository) UpdateLastRun(ctx context.Context, jobID string, t interface{}) error {
	_, err := r.db.Exec(ctx, `
		UPDATE scheduled_jobs SET last_run_at = NOW(), updated_at = NOW() WHERE id = $1
	`, jobID)
	return err
}

func (r *Repository) GetJobHistory(ctx context.Context, jobID string, limit int) ([]*JobHistory, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id, job_id, tenant_slug, status, started_at, finished_at, duration_ms, error_message, created_at
		FROM job_execution_history WHERE job_id = $1
		ORDER BY created_at DESC LIMIT $2
	`, jobID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*JobHistory
	for rows.Next() {
		var h JobHistory
		if err := rows.Scan(&h.ID, &h.JobID, &h.TenantSlug, &h.Status,
			&h.StartedAt, &h.FinishedAt, &h.DurationMs, &h.ErrorMessage, &h.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, &h)
	}
	return list, nil
}

// Helper to scan multiple job rows
func scanJobs(rows interface {
	Next() bool
	Scan(dest ...any) error
}) ([]*Job, error) {
	var list []*Job
	for rows.Next() {
		var job Job
		var payloadBytes []byte
		if err := rows.Scan(&job.ID, &job.TenantSlug, &job.Name, &job.Description,
			&job.CronExpr, &job.JobType, &payloadBytes,
			&job.IsActive, &job.LastRunAt, &job.NextRunAt,
			&job.CreatedAt, &job.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(payloadBytes, &job.Payload)
		list = append(list, &job)
	}
	return list, nil
}
