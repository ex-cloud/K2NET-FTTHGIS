package scheduler

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"gateways/shared/logger"
	"github.com/redis/go-redis/v9"
	"github.com/robfig/cron/v3"
	"go.uber.org/zap"
)

// Engine wraps robfig/cron and manages job lifecycle
type Engine struct {
	cron   *cron.Cron
	repo   *Repository
	rdb    *redis.Client
	mu     sync.Mutex
	entryMap map[string]cron.EntryID // jobID -> cron.EntryID
}

func NewEngine(repo *Repository, rdb *redis.Client, timezone string) *Engine {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		loc = time.UTC
	}

	c := cron.New(
		cron.WithLocation(loc),
		cron.WithSeconds(),       // enable second-level precision if needed
		cron.WithChain(
			cron.Recover(cron.DefaultLogger),
		),
	)

	return &Engine{
		cron:     c,
		repo:     repo,
		rdb:      rdb,
		entryMap: make(map[string]cron.EntryID),
	}
}

// Start boots the cron engine and restores active jobs from DB
func (e *Engine) Start(ctx context.Context) error {
	if err := e.RestoreJobsFromDB(ctx); err != nil {
		logger.Error(ctx, "Failed to restore scheduled jobs from DB", zap.Error(err))
		// Non-fatal: engine can still accept new jobs via API
	}
	e.cron.Start()
	logger.Info(ctx, "Scheduler engine started")
	return nil
}

// Stop gracefully stops the cron engine
func (e *Engine) Stop() {
	e.cron.Stop()
}

// RestoreJobsFromDB loads all active jobs from Postgres and registers them in cron
func (e *Engine) RestoreJobsFromDB(ctx context.Context) error {
	jobs, err := e.repo.GetActiveJobs(ctx)
	if err != nil {
		return fmt.Errorf("failed to fetch active jobs: %w", err)
	}

	for _, job := range jobs {
		if err := e.addJobToCron(ctx, job); err != nil {
			logger.Error(ctx, "Failed to restore job into cron engine",
				zap.String("job_id", job.ID),
				zap.String("name", job.Name),
				zap.Error(err))
		} else {
			logger.Info(ctx, "Restored scheduled job",
				zap.String("job_id", job.ID),
				zap.String("name", job.Name),
				zap.String("cron_expr", job.CronExpr))
		}
	}

	logger.Info(ctx, "Restored scheduled jobs from database", zap.Int("count", len(jobs)))
	return nil
}

// AddJob registers a new job in cron and tracks its entry ID
func (e *Engine) AddJob(ctx context.Context, job *Job) error {
	return e.addJobToCron(ctx, job)
}

// RemoveJob removes a job from the cron engine by job ID
func (e *Engine) RemoveJob(jobID string) {
	e.mu.Lock()
	defer e.mu.Unlock()

	if entryID, ok := e.entryMap[jobID]; ok {
		e.cron.Remove(entryID)
		delete(e.entryMap, jobID)
	}
}

// UpdateJob removes old cron entry and adds new one with updated schedule
func (e *Engine) UpdateJob(ctx context.Context, job *Job) error {
	e.RemoveJob(job.ID)
	if job.IsActive {
		return e.addJobToCron(ctx, job)
	}
	return nil
}

// TriggerJob manually runs a job immediately (outside cron schedule)
func (e *Engine) TriggerJob(ctx context.Context, job *Job) {
	go e.executeJob(ctx, job)
}

func (e *Engine) addJobToCron(ctx context.Context, job *Job) error {
	jobCopy := *job // capture loop variable
	entryID, err := e.cron.AddFunc(jobCopy.CronExpr, func() {
		execCtx := context.Background()
		e.executeJob(execCtx, &jobCopy)
	})
	if err != nil {
		return fmt.Errorf("invalid cron expression '%s': %w", job.CronExpr, err)
	}

	e.mu.Lock()
	e.entryMap[job.ID] = entryID
	e.mu.Unlock()

	return nil
}

// executeJob runs the job logic and records execution in Postgres
func (e *Engine) executeJob(ctx context.Context, job *Job) {
	startedAt := time.Now()
	history := &JobHistory{
		JobID:      job.ID,
		TenantSlug: job.TenantSlug,
		Status:     "running",
		StartedAt:  &startedAt,
	}

	logger.Info(ctx, "Executing scheduled job",
		zap.String("job_id", job.ID),
		zap.String("name", job.Name),
		zap.String("type", job.JobType),
	)

	// Publish execution event to Redis channel
	eventPayload := map[string]any{
		"jobId":      job.ID,
		"tenantSlug": job.TenantSlug,
		"jobType":    job.JobType,
		"payload":    job.Payload,
		"triggeredAt": startedAt.Format(time.RFC3339),
	}
	jsonEvent, _ := json.Marshal(eventPayload)
	channel := fmt.Sprintf("scheduler:execute:%s", job.JobType)

	if err := e.rdb.Publish(ctx, channel, jsonEvent).Err(); err != nil {
		logger.Error(ctx, "Failed to publish job event to Redis",
			zap.String("channel", channel),
			zap.Error(err))
	}

	finishedAt := time.Now()
	durationMs := int(finishedAt.Sub(startedAt).Milliseconds())
	history.Status = "done"
	history.FinishedAt = &finishedAt
	history.DurationMs = &durationMs

	// Update last_run_at in DB
	_ = e.repo.UpdateLastRun(ctx, job.ID, startedAt)

	// Record execution history
	if err := e.repo.RecordExecution(ctx, history); err != nil {
		logger.Error(ctx, "Failed to record job execution history", zap.Error(err))
	}
}
