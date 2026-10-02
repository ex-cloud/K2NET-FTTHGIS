package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

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
		CREATE TABLE IF NOT EXISTS audit_events (
			id UUID NOT NULL DEFAULT gen_random_uuid(),
			tenant_slug VARCHAR(100) NOT NULL,
			actor_id VARCHAR(255) NOT NULL,
			actor_role VARCHAR(100),
			actor_ip VARCHAR(50),
			action VARCHAR(50) NOT NULL,
			resource_type VARCHAR(100) NOT NULL,
			resource_id VARCHAR(255),
			old_value JSONB,
			new_value JSONB,
			metadata JSONB,
			occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (id, occurred_at)
		) PARTITION BY RANGE (occurred_at);
		CREATE TABLE IF NOT EXISTS audit_events_default PARTITION OF audit_events DEFAULT;
		CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_events(tenant_slug, occurred_at DESC);
		CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor_id, occurred_at DESC);
		CREATE INDEX IF NOT EXISTS idx_audit_events_occurred_at ON audit_events(occurred_at DESC);
		CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_project ON audit_events(tenant_slug, (metadata->>'projectId'), occurred_at DESC);
		CREATE INDEX IF NOT EXISTS idx_audit_events_group_occurred ON audit_events(((metadata->>'logGroup')), occurred_at DESC);
		CREATE INDEX IF NOT EXISTS idx_audit_events_type_occurred ON audit_events(((metadata->>'logType')), occurred_at DESC);
		CREATE INDEX IF NOT EXISTS idx_audit_events_severity_occurred ON audit_events(((metadata->>'severity')), occurred_at DESC);
		CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_resource ON audit_events(tenant_slug, resource_type, occurred_at DESC);
		CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_action ON audit_events(tenant_slug, action, occurred_at DESC);
	`)
	return err
}

func (r *Repository) CreateEvent(ctx context.Context, req *CreateAuditEventRequest) (*AuditEvent, error) {
	// 1. Strict PII Sanitization
	req.OldValue = SanitizeMap(req.OldValue)
	req.NewValue = SanitizeMap(req.NewValue)
	req.Metadata = SanitizeMap(req.Metadata)

	if req.Metadata == nil {
		req.Metadata = make(map[string]any)
	}

	// 2. Cryptographic Hash-Chaining
	occurredAt := time.Now()
	hash, prev := ComputeEventHash(
		"", req.TenantSlug, req.ActorID, req.Action, req.ResourceType, req.ResourceID,
		occurredAt, req.OldValue, req.NewValue, req.Metadata,
	)
	req.Metadata["hash"] = hash
	req.Metadata["prevHash"] = prev

	oldJSON, _ := json.Marshal(req.OldValue)
	newJSON, _ := json.Marshal(req.NewValue)
	metaJSON, _ := json.Marshal(req.Metadata)

	var ev AuditEvent
	var oldB, newB, metaB []byte
	err := r.db.QueryRow(ctx, `
		INSERT INTO audit_events 
		  (tenant_slug, actor_id, actor_role, actor_ip, action, resource_type, resource_id, old_value, new_value, metadata, occurred_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, tenant_slug, actor_id, actor_role, actor_ip, action, resource_type, resource_id, 
		          old_value, new_value, metadata, occurred_at
	`, req.TenantSlug, req.ActorID, req.ActorRole, req.ActorIP, req.Action, req.ResourceType, req.ResourceID, 
		oldJSON, newJSON, metaJSON, occurredAt).Scan(
		&ev.ID, &ev.TenantSlug, &ev.ActorID, &ev.ActorRole, &ev.ActorIP, &ev.Action, &ev.ResourceType, &ev.ResourceID,
		&oldB, &newB, &metaB, &ev.OccurredAt,
	)
	if err != nil {
		return nil, err
	}

	_ = json.Unmarshal(oldB, &ev.OldValue)
	_ = json.Unmarshal(newB, &ev.NewValue)
	_ = json.Unmarshal(metaB, &ev.Metadata)
	return &ev, nil
}

func (r *Repository) GetEvent(ctx context.Context, id string) (*AuditEvent, error) {
	var ev AuditEvent
	var oldB, newB, metaB []byte
	err := r.db.QueryRow(ctx, `
		SELECT id, tenant_slug, actor_id, actor_role, actor_ip, action, resource_type, resource_id, 
		       old_value, new_value, metadata, occurred_at
		FROM audit_events WHERE id = $1
	`, id).Scan(
		&ev.ID, &ev.TenantSlug, &ev.ActorID, &ev.ActorRole, &ev.ActorIP, &ev.Action, &ev.ResourceType, &ev.ResourceID,
		&oldB, &newB, &metaB, &ev.OccurredAt,
	)
	if err != nil {
		return nil, err
	}

	_ = json.Unmarshal(oldB, &ev.OldValue)
	_ = json.Unmarshal(newB, &ev.NewValue)
	_ = json.Unmarshal(metaB, &ev.Metadata)
	return &ev, nil
}

func (r *Repository) QueryEvents(ctx context.Context, tenant, actor, action, resource string, start, end *time.Time) ([]*AuditEvent, error) {
	resp, err := r.QueryEventsWithFilter(ctx, QueryAuditEventsFilter{
		TenantSlug:   tenant,
		ActorID:      actor,
		Action:       action,
		ResourceType: resource,
		StartDate:    start,
		EndDate:      end,
		Page:         1,
		PageSize:     500,
	})
	if err != nil {
		return nil, err
	}
	return resp.Data, nil
}

func (r *Repository) QueryEventsWithFilter(ctx context.Context, filter QueryAuditEventsFilter) (*PaginatedAuditEventsResponse, error) {
	whereClause := "WHERE 1=1"
	args := []any{}
	argCount := 1

	if filter.TenantSlug != "" && filter.TenantSlug != "all" {
		whereClause += fmt.Sprintf(" AND tenant_slug = $%d", argCount)
		args = append(args, filter.TenantSlug)
		argCount++
	}
	if filter.ActorID != "" {
		whereClause += fmt.Sprintf(" AND (actor_id = $%d OR actor_id ILIKE $%d)", argCount, argCount+1)
		args = append(args, filter.ActorID, "%"+filter.ActorID+"%")
		argCount += 2
	}
	if filter.Action != "" {
		whereClause += fmt.Sprintf(" AND action = $%d", argCount)
		args = append(args, filter.Action)
		argCount++
	}
	if filter.ResourceType != "" {
		whereClause += fmt.Sprintf(" AND resource_type = $%d", argCount)
		args = append(args, filter.ResourceType)
		argCount++
	}
	if filter.LogGroup != "" {
		whereClause += fmt.Sprintf(" AND (metadata->>'logGroup') = $%d", argCount)
		args = append(args, filter.LogGroup)
		argCount++
	}
	if filter.Severity != "" {
		whereClause += fmt.Sprintf(" AND (metadata->>'severity') = $%d", argCount)
		args = append(args, filter.Severity)
		argCount++
	}
	if filter.ProjectID != "" {
		if filter.ProjectID == "null" || filter.ProjectID == "none" {
			whereClause += " AND (metadata->>'projectId') IS NULL"
		} else {
			whereClause += fmt.Sprintf(" AND (metadata->>'projectId') = $%d", argCount)
			args = append(args, filter.ProjectID)
			argCount++
		}
	}
	if filter.Scope != "" {
		whereClause += fmt.Sprintf(" AND (metadata->>'scope') = $%d", argCount)
		args = append(args, filter.Scope)
		argCount++
	}
	if filter.Category != "" {
		whereClause += fmt.Sprintf(" AND (metadata->>'category') = $%d", argCount)
		args = append(args, filter.Category)
		argCount++
	}
	if filter.LogType != "" {
		whereClause += fmt.Sprintf(" AND (metadata->>'logType') = $%d", argCount)
		args = append(args, filter.LogType)
		argCount++
	}
	if filter.ServiceSource != "" {
		whereClause += fmt.Sprintf(" AND (metadata->>'serviceSource') = $%d", argCount)
		args = append(args, filter.ServiceSource)
		argCount++
	}
	if filter.Search != "" {
		searchPattern := "%" + filter.Search + "%"
		whereClause += fmt.Sprintf(" AND (action ILIKE $%d OR resource_type ILIKE $%d OR resource_id ILIKE $%d OR actor_id ILIKE $%d OR metadata::text ILIKE $%d)", 
			argCount, argCount, argCount, argCount, argCount)
		args = append(args, searchPattern)
		argCount++
	}
	if filter.StartDate != nil {
		whereClause += fmt.Sprintf(" AND occurred_at >= $%d", argCount)
		args = append(args, *filter.StartDate)
		argCount++
	}
	if filter.EndDate != nil {
		whereClause += fmt.Sprintf(" AND occurred_at <= $%d", argCount)
		args = append(args, *filter.EndDate)
		argCount++
	}

	// 1. Total Count Query
	countQuery := "SELECT COUNT(*) FROM audit_events " + whereClause
	var totalCount int64
	err := r.db.QueryRow(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, err
	}

	// 2. Pagination calculation
	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 50
	}
	if pageSize > 500 {
		pageSize = 500
	}
	offset := (page - 1) * pageSize
	totalPages := int((totalCount + int64(pageSize) - 1) / int64(pageSize))
	if totalPages == 0 {
		totalPages = 1
	}

	// 3. Data Query
	dataQuery := fmt.Sprintf(`
		SELECT id, tenant_slug, actor_id, actor_role, actor_ip, action, resource_type, resource_id, 
		       old_value, new_value, metadata, occurred_at
		FROM audit_events
		%s
		ORDER BY occurred_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argCount, argCount+1)

	dataArgs := append(args, pageSize, offset)

	rows, err := r.db.Query(ctx, dataQuery, dataArgs...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []*AuditEvent
	for rows.Next() {
		var ev AuditEvent
		var oldB, newB, metaB []byte
		if err := rows.Scan(
			&ev.ID, &ev.TenantSlug, &ev.ActorID, &ev.ActorRole, &ev.ActorIP, &ev.Action, &ev.ResourceType, &ev.ResourceID,
			&oldB, &newB, &metaB, &ev.OccurredAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(oldB, &ev.OldValue)
		_ = json.Unmarshal(newB, &ev.NewValue)
		_ = json.Unmarshal(metaB, &ev.Metadata)
		list = append(list, &ev)
	}

	return &PaginatedAuditEventsResponse{
		Data:       list,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

func (r *Repository) GetTenantReport(ctx context.Context, tenantSlug string) (map[string]any, error) {
	row := r.db.QueryRow(ctx, `
		SELECT COUNT(*), 
		       COALESCE(SUM(CASE WHEN action = 'LOGIN' THEN 1 ELSE 0 END), 0) as logins,
		       COALESCE(SUM(CASE WHEN action = 'EXPORT' THEN 1 ELSE 0 END), 0) as exports,
		       COALESCE(SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END), 0) as deletes
		FROM audit_events WHERE tenant_slug = $1
	`, tenantSlug)

	var total, logins, exports, deletes int
	if err := row.Scan(&total, &logins, &exports, &deletes); err != nil {
		return nil, err
	}

	return map[string]any{
		"tenantSlug":        tenantSlug,
		"totalEventsCount":  total,
		"actionsSummary": map[string]int{
			"LOGIN":  logins,
			"EXPORT": exports,
			"DELETE": deletes,
		},
	}, nil
}

func (r *Repository) GetProjectReport(ctx context.Context, tenantSlug, projectID string) (map[string]any, error) {
	row := r.db.QueryRow(ctx, `
		SELECT COUNT(*), 
		       COALESCE(SUM(CASE WHEN action LIKE '%CREATED' OR action LIKE '%ADD%' THEN 1 ELSE 0 END), 0) as creates,
		       COALESCE(SUM(CASE WHEN action LIKE '%UPDATED' OR action LIKE '%EDIT%' OR action LIKE '%MODIFY%' THEN 1 ELSE 0 END), 0) as updates,
		       COALESCE(SUM(CASE WHEN action LIKE '%DELETED' OR action LIKE '%REMOVE%' THEN 1 ELSE 0 END), 0) as deletes,
		       MAX(occurred_at) as last_activity
		FROM audit_events 
		WHERE tenant_slug = $1 AND (metadata->>'projectId') = $2
	`, tenantSlug, projectID)

	var total, creates, updates, deletes int
	var lastActivity *time.Time
	if err := row.Scan(&total, &creates, &updates, &deletes, &lastActivity); err != nil {
		return nil, err
	}

	return map[string]any{
		"tenantSlug":       tenantSlug,
		"projectId":        projectID,
		"totalEventsCount": total,
		"lastActivityAt":   lastActivity,
		"actionsSummary": map[string]int{
			"CREATE": creates,
			"UPDATE": updates,
			"DELETE": deletes,
		},
	}, nil
}


func (r *Repository) GetUserReport(ctx context.Context, actorID string) (map[string]any, error) {
	row := r.db.QueryRow(ctx, `
		SELECT COUNT(*), MAX(occurred_at) FROM audit_events WHERE actor_id = $1
	`, actorID)

	var total int
	var lastTime *time.Time
	if err := row.Scan(&total, &lastTime); err != nil {
		return nil, err
	}

	return map[string]any{
		"actorId":          actorID,
		"totalEventsCount": total,
		"lastActivityAt":   lastTime,
	}, nil
}

func (r *Repository) CleanupExpiredEvents(ctx context.Context, retentionDays int) (int64, error) {
	cutoff := time.Now().AddDate(0, 0, -retentionDays)

	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	// Temporarily disable mutation trigger for system retention purge
	_, _ = tx.Exec(ctx, "ALTER TABLE audit_events DISABLE TRIGGER trg_prevent_audit_events_mutation")

	tag, err := tx.Exec(ctx, "DELETE FROM audit_events WHERE occurred_at < $1", cutoff)
	if err != nil {
		return 0, err
	}

	_, _ = tx.Exec(ctx, "ALTER TABLE audit_events ENABLE TRIGGER trg_prevent_audit_events_mutation")

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}

	return tag.RowsAffected(), nil
}

func (r *Repository) GetMaterializedSummary(ctx context.Context, tenantSlug string, hours int) ([]map[string]any, error) {
	if hours <= 0 {
		hours = 24
	}
	cutoff := time.Now().Add(-time.Duration(hours) * time.Hour)

	query := `
		SELECT log_group, log_type, severity, event_hour, total_count, error_count, last_event_at
		FROM mv_audit_events_hourly_summary
		WHERE event_hour >= $1
	`
	args := []any{cutoff}

	if tenantSlug != "" && tenantSlug != "all" {
		query += " AND tenant_slug = $2"
		args = append(args, tenantSlug)
	}

	query += " ORDER BY event_hour DESC, total_count DESC"

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		// Fallback gracefully if view is not yet created
		return []map[string]any{}, nil
	}
	defer rows.Close()

	var result []map[string]any
	for rows.Next() {
		var logGroup, logType, severity string
		var eventHour time.Time
		var totalCount, errorCount int64
		var lastEventAt *time.Time

		if err := rows.Scan(&logGroup, &logType, &severity, &eventHour, &totalCount, &errorCount, &lastEventAt); err != nil {
			return nil, err
		}

		result = append(result, map[string]any{
			"logGroup":    logGroup,
			"logType":     logType,
			"severity":    severity,
			"eventHour":   eventHour,
			"totalCount":  totalCount,
			"errorCount":  errorCount,
			"lastEventAt": lastEventAt,
		})
	}
	return result, nil
}

func (r *Repository) RefreshMaterializedView(ctx context.Context) error {
	_, err := r.db.Exec(ctx, "SELECT refresh_audit_events_summary()")
	return err
}
