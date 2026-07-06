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
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
			occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);
		CREATE OR REPLACE RULE no_update_audit AS ON UPDATE TO audit_events DO INSTEAD NOTHING;
		CREATE OR REPLACE RULE no_delete_audit AS ON DELETE TO audit_events DO INSTEAD NOTHING;
	`)
	return err
}

func (r *Repository) CreateEvent(ctx context.Context, req *CreateAuditEventRequest) (*AuditEvent, error) {
	oldJSON, _ := json.Marshal(req.OldValue)
	newJSON, _ := json.Marshal(req.NewValue)
	metaJSON, _ := json.Marshal(req.Metadata)

	var ev AuditEvent
	var oldB, newB, metaB []byte
	err := r.db.QueryRow(ctx, `
		INSERT INTO audit_events 
		  (tenant_slug, actor_id, actor_role, actor_ip, action, resource_type, resource_id, old_value, new_value, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, tenant_slug, actor_id, actor_role, actor_ip, action, resource_type, resource_id, 
		          old_value, new_value, metadata, occurred_at
	`, req.TenantSlug, req.ActorID, req.ActorRole, req.ActorIP, req.Action, req.ResourceType, req.ResourceID, 
		oldJSON, newJSON, metaJSON).Scan(
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
	query := `
		SELECT id, tenant_slug, actor_id, actor_role, actor_ip, action, resource_type, resource_id, 
		       old_value, new_value, metadata, occurred_at
		FROM audit_events WHERE 1=1
	`
	args := []any{}
	argCount := 1

	if tenant != "" {
		query += fmt.Sprintf(" AND tenant_slug = $%d", argCount)
		args = append(args, tenant)
		argCount++
	}
	if actor != "" {
		query += fmt.Sprintf(" AND actor_id = $%d", argCount)
		args = append(args, actor)
		argCount++
	}
	if action != "" {
		query += fmt.Sprintf(" AND action = $%d", argCount)
		args = append(args, action)
		argCount++
	}
	if resource != "" {
		query += fmt.Sprintf(" AND resource_type = $%d", argCount)
		args = append(args, resource)
		argCount++
	}
	if start != nil {
		query += fmt.Sprintf(" AND occurred_at >= $%d", argCount)
		args = append(args, *start)
		argCount++
	}
	if end != nil {
		query += fmt.Sprintf(" AND occurred_at <= $%d", argCount)
		args = append(args, *end)
		argCount++
	}

	query += " ORDER BY occurred_at DESC LIMIT 500"

	rows, err := r.db.Query(ctx, query, args...)
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
	return list, nil
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

	// Since we have ON DELETE DO INSTEAD NOTHING rule, we temporarily disable the rule, delete, then enable it.
	// We execute inside a transaction.
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx, "ALTER TABLE audit_events DISABLE RULE no_delete_audit")
	if err != nil {
		return 0, err
	}

	tag, err := tx.Exec(ctx, "DELETE FROM audit_events WHERE occurred_at < $1", cutoff)
	if err != nil {
		return 0, err
	}

	_, err = tx.Exec(ctx, "ALTER TABLE audit_events ENABLE RULE no_delete_audit")
	if err != nil {
		return 0, err
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}

	return tag.RowsAffected(), nil
}
