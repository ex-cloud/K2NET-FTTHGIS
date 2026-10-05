package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BatchConfig struct {
	BufferSize    int
	BatchSize     int
	FlushInterval time.Duration
	DLQDir        string
}

type BatchIngestionEngine struct {
	db           *pgxpool.Pool
	cfg          BatchConfig
	ringBuffer   chan *CreateAuditEventRequest
	dedup        *SlidingWindowDeduplicator
	dispatcher   *AlertDispatcher
	drainLock    sync.RWMutex
	isReplaying  atomic.Bool
	stopChan     chan struct{}
	wg           sync.WaitGroup
	droppedCount atomic.Int64
}

func NewBatchIngestionEngine(db *pgxpool.Pool, cfg BatchConfig, dispatcher *AlertDispatcher) *BatchIngestionEngine {
	if cfg.BufferSize <= 0 {
		cfg.BufferSize = 5000
	}
	if cfg.BatchSize <= 0 {
		cfg.BatchSize = 100
	}
	if cfg.FlushInterval <= 0 {
		cfg.FlushInterval = 500 * time.Millisecond
	}
	if cfg.DLQDir == "" {
		cfg.DLQDir = "/opt/project5/backups/dlq/audit_events"
	}

	_ = os.MkdirAll(cfg.DLQDir, 0755)

	engine := &BatchIngestionEngine{
		db:         db,
		cfg:        cfg,
		ringBuffer: make(chan *CreateAuditEventRequest, cfg.BufferSize),
		dedup:      NewSlidingWindowDeduplicator(10*time.Second, 5),
		dispatcher: dispatcher,
		stopChan:   make(chan struct{}),
	}

	engine.startWorkers()
	return engine
}

// Ingest queues an event into the asynchronous ring buffer
func (e *BatchIngestionEngine) Ingest(req *CreateAuditEventRequest) error {
	e.drainLock.RLock()
	defer e.drainLock.RUnlock()

	// 1. Sanitize PII
	req.OldValue = SanitizeMap(req.OldValue)
	req.NewValue = SanitizeMap(req.NewValue)
	req.Metadata = SanitizeMap(req.Metadata)

	// 2. Extract deduplication keys
	serviceSource := ""
	if req.Metadata != nil {
		if s, ok := req.Metadata["serviceSource"].(string); ok {
			serviceSource = s
		}
	}

	// 3. Sliding-Window Deduplication & Sampling
	shouldRecord, repeatCount := e.dedup.ShouldSample(req.TenantSlug, req.Action, req.ResourceType, serviceSource, req.ResourceID)
	if !shouldRecord {
		return nil // Throttled due to error storm
	}

	if repeatCount > 1 {
		if req.Metadata == nil {
			req.Metadata = make(map[string]any)
		}
		req.Metadata["repeatedCount"] = repeatCount
		req.Metadata["isSampled"] = true
	}

	// 4. Incident Alert Dispatcher Hook (P.11)
	if e.dispatcher != nil {
		e.dispatcher.Dispatch(req, time.Now())
	}

	// 5. Ingest to non-blocking Ring Buffer with Backpressure
	select {
	case e.ringBuffer <- req:
		return nil
	default:
		// Buffer is full (Backpressure triggered) -> Spool immediately to DLQ disk
		e.droppedCount.Add(1)
		go e.spoolSingleToDLQ(req)
		return fmt.Errorf("buffer full: event spooled to DLQ")
	}
}

func (e *BatchIngestionEngine) startWorkers() {
	e.wg.Add(1)
	go e.batchProcessor()
	go e.dlqReplayWorker()
}

func (e *BatchIngestionEngine) batchProcessor() {
	defer e.wg.Done()
	ticker := time.NewTicker(e.cfg.FlushInterval)
	defer ticker.Stop()

	batch := make([]*CreateAuditEventRequest, 0, e.cfg.BatchSize)

	flush := func() {
		if len(batch) == 0 {
			return
		}
		currentBatch := batch
		batch = make([]*CreateAuditEventRequest, 0, e.cfg.BatchSize)
		e.flushBatch(context.Background(), currentBatch)
	}

	for {
		select {
		case <-e.stopChan:
			// Flush remaining
			for {
				select {
				case req := <-e.ringBuffer:
					batch = append(batch, req)
					if len(batch) >= e.cfg.BatchSize {
						flush()
					}
				default:
					flush()
					return
				}
			}
		case req := <-e.ringBuffer:
			batch = append(batch, req)
			if len(batch) >= e.cfg.BatchSize {
				flush()
			}
		case <-ticker.C:
			flush()
		}
	}
}

func (e *BatchIngestionEngine) flushBatch(ctx context.Context, batch []*CreateAuditEventRequest) {
	if len(batch) == 0 {
		return
	}

	// Compute Per-Tenant Hash Chains & Merkle Roots
	hashes := make([]string, len(batch))
	occurredAt := time.Now()

	rows := make([][]any, len(batch))
	for i, req := range batch {
		if req.Metadata == nil {
			req.Metadata = make(map[string]any)
		}

		hash, prev := ComputeEventHash(
			"", req.TenantSlug, req.ActorID, req.Action, req.ResourceType, req.ResourceID,
			occurredAt, req.OldValue, req.NewValue, req.Metadata,
		)
		req.Metadata["hash"] = hash
		req.Metadata["prevHash"] = prev
		hashes[i] = hash

		oldJSON, _ := json.Marshal(req.OldValue)
		newJSON, _ := json.Marshal(req.NewValue)
		metaJSON, _ := json.Marshal(req.Metadata)

		rows[i] = []any{
			req.TenantSlug, req.ActorID, req.ActorRole, req.ActorIP, req.Action,
			req.ResourceType, req.ResourceID, oldJSON, newJSON, metaJSON, occurredAt,
		}
	}

	// High-Performance CopyFrom Bulk Insert
	_, err := e.db.CopyFrom(
		ctx,
		pgx.Identifier{"audit_events"},
		[]string{"tenant_slug", "actor_id", "actor_role", "actor_ip", "action", "resource_type", "resource_id", "old_value", "new_value", "metadata", "occurred_at"},
		pgx.CopyFromRows(rows),
	)

	if err != nil {
		// Circuit Breaker: Failover to Local Disk Spooling (DLQ)
		e.spoolBatchToDLQ(batch)
	}
}

func (e *BatchIngestionEngine) spoolBatchToDLQ(batch []*CreateAuditEventRequest) {
	filename := filepath.Join(e.cfg.DLQDir, fmt.Sprintf("dlq_batch_%d_%d.jsonl", time.Now().UnixNano(), len(batch)))
	f, err := os.OpenFile(filename, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
	if err != nil {
		return
	}
	defer f.Close()

	for _, item := range batch {
		data, _ := json.Marshal(item)
		_, _ = f.Write(append(data, '\n'))
	}
}

func (e *BatchIngestionEngine) spoolSingleToDLQ(req *CreateAuditEventRequest) {
	e.spoolBatchToDLQ([]*CreateAuditEventRequest{req})
}

// dlqReplayWorker periodically checks and replays spooled DLQ files
func (e *BatchIngestionEngine) dlqReplayWorker() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-e.stopChan:
			return
		case <-ticker.C:
			e.replayDLQFiles()
		}
	}
}

func (e *BatchIngestionEngine) replayDLQFiles() {
	files, err := filepath.Glob(filepath.Join(e.cfg.DLQDir, "dlq_batch_*.jsonl"))
	if err != nil || len(files) == 0 {
		return
	}

	// Verify DB health
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := e.db.Ping(ctx); err != nil {
		return // DB still unavailable
	}

	// Acquire drain lock to preserve sequential replay
	e.drainLock.Lock()
	defer e.drainLock.Unlock()

	for _, file := range files {
		content, err := os.ReadFile(file)
		if err != nil {
			continue
		}

		lines := splitLines(content)
		replayedBatch := make([]*CreateAuditEventRequest, 0, len(lines))
		for _, line := range lines {
			if len(line) == 0 {
				continue
			}
			var req CreateAuditEventRequest
			if err := json.Unmarshal(line, &req); err == nil {
				replayedBatch = append(replayedBatch, &req)
			}
		}

		if len(replayedBatch) > 0 {
			e.flushBatch(context.Background(), replayedBatch)
		}

		_ = os.Remove(file)
	}
}

func splitLines(data []byte) [][]byte {
	var lines [][]byte
	start := 0
	for i, b := range data {
		if b == '\n' {
			lines = append(lines, data[start:i])
			start = i + 1
		}
	}
	if start < len(data) {
		lines = append(lines, data[start:])
	}
	return lines
}

func (e *BatchIngestionEngine) Close() {
	close(e.stopChan)
	e.wg.Wait()
}
