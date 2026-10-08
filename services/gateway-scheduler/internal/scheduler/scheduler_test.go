package scheduler

import (
	"context"
	"testing"
)

func TestSchedulerEngineInitialization(t *testing.T) {
	// With valid timezone
	eng1 := NewEngine(nil, nil, "Asia/Jakarta")
	if eng1 == nil {
		t.Fatal("expected non-nil Engine for Asia/Jakarta")
	}

	// With invalid timezone (fallback to UTC)
	eng2 := NewEngine(nil, nil, "Invalid/Timezone")
	if eng2 == nil {
		t.Fatal("expected non-nil Engine with fallback timezone")
	}
}

func TestSchedulerCronExpressionValidation(t *testing.T) {
	eng := NewEngine(nil, nil, "UTC")

	// Valid cron expression with seconds (6 fields)
	validJob := &Job{
		ID:         "job-001",
		TenantSlug: "isp-alpha",
		Name:       "Test Valid Job",
		CronExpr:   "0 0 0 * * *", // midnight daily
		JobType:    "BACKUP",
		IsActive:   true,
	}

	err := eng.AddJob(context.Background(), validJob)
	if err != nil {
		t.Fatalf("expected valid cron expression to succeed, got: %v", err)
	}

	// Invalid cron expression
	invalidJob := &Job{
		ID:         "job-002",
		TenantSlug: "isp-alpha",
		Name:       "Test Invalid Job",
		CronExpr:   "invalid-cron-syntax",
		JobType:    "BACKUP",
		IsActive:   true,
	}

	err2 := eng.AddJob(context.Background(), invalidJob)
	if err2 == nil {
		t.Error("expected error for invalid cron expression, got nil")
	}

	// Test Remove Job
	eng.RemoveJob("job-001")
	if _, exists := eng.entryMap["job-001"]; exists {
		t.Error("expected job-001 to be removed from entryMap")
	}
}
