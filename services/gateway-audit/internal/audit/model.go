package audit

import "time"

type AuditEvent struct {
	ID           string         `json:"id" db:"id"`
	TenantSlug   string         `json:"tenantSlug" db:"tenant_slug"`
	ActorID      string         `json:"actorId" db:"actor_id"`
	ActorRole    string         `json:"actorRole" db:"actor_role"`
	ActorIP      string         `json:"actorIp" db:"actor_ip"`
	Action       string         `json:"action" db:"action"`
	ResourceType string         `json:"resourceType" db:"resource_type"`
	ResourceID   string         `json:"resourceId" db:"resource_id"`
	OldValue     map[string]any `json:"oldValue" db:"old_value"`
	NewValue     map[string]any `json:"newValue" db:"new_value"`
	Metadata     map[string]any `json:"metadata" db:"metadata"`
	OccurredAt   time.Time      `json:"occurredAt" db:"occurred_at"`
}

type CreateAuditEventRequest struct {
	TenantSlug   string         `json:"tenantSlug" binding:"required"`
	ActorID      string         `json:"actorId" binding:"required"`
	ActorRole    string         `json:"actorRole"`
	ActorIP      string         `json:"actorIp"`
	Action       string         `json:"action" binding:"required"`
	ResourceType string         `json:"resourceType" binding:"required"`
	ResourceID   string         `json:"resourceId"`
	OldValue     map[string]any `json:"oldValue"`
	NewValue     map[string]any `json:"newValue"`
	Metadata     map[string]any `json:"metadata"`
}

type QueryAuditEventsFilter struct {
	TenantSlug   string     `json:"tenantSlug"`
	ActorID      string     `json:"actorId"`
	Action       string     `json:"action"`
	ResourceType string     `json:"resourceType"`
	LogGroup     string     `json:"logGroup"`
	Severity     string     `json:"severity"`
	ProjectID    string     `json:"projectId"`
	Scope        string     `json:"scope"`
	Category     string     `json:"category"`
	Search       string     `json:"search"`
	StartDate    *time.Time `json:"startDate"`
	EndDate      *time.Time `json:"endDate"`
	Page         int        `json:"page"`
	PageSize     int        `json:"pageSize"`
}

type PaginatedAuditEventsResponse struct {
	Data       []*AuditEvent `json:"data"`
	TotalCount int64         `json:"totalCount"`
	Page       int           `json:"page"`
	PageSize   int           `json:"pageSize"`
	TotalPages int           `json:"totalPages"`
}
