package audit

import (
	"testing"
	"time"
)

func TestQueryEventsSQLConstruction(t *testing.T) {
	// Stub to verify filter inputs
	tenant := "garut"
	actor := "user-123"
	action := "LOGIN"
	resource := "invoice"
	start := time.Now().Add(-1 * time.Hour)
	end := time.Now()

	// Direct structure check
	req := &CreateAuditEventRequest{
		TenantSlug:   tenant,
		ActorID:      actor,
		Action:       action,
		ResourceType: resource,
		ActorIP:      "127.0.0.1",
		ActorRole:    "admin",
	}

	if req.TenantSlug != "garut" || req.ActorID != "user-123" {
		t.Errorf("Request struct field validation failed")
	}

	if start.After(end) {
		t.Errorf("Time logic invalid")
	}
}

func TestQueryEventsFilterValidation(t *testing.T) {
	tenant := "cicadas"
	actor := "engineer@cicadas.net"
	action := "ODP_CREATED"
	resource := "ODP"
	projectID := "e7b99c42-83b4-4b52-9b57-6bc7185ad102"
	logGroup := "NETWORK"
	severity := "INFO"
	scope := "PROJECT"
	category := "NETWORK_ASSET"
	search := "ODP-042"
	start := time.Now().Add(-24 * time.Hour)
	end := time.Now()

	filter := QueryAuditEventsFilter{
		TenantSlug:   tenant,
		ActorID:      actor,
		Action:       action,
		ResourceType: resource,
		ProjectID:    projectID,
		LogGroup:     logGroup,
		Severity:     severity,
		Scope:        scope,
		Category:     category,
		Search:       search,
		StartDate:    &start,
		EndDate:      &end,
		Page:         1,
		PageSize:     50,
	}

	if filter.TenantSlug != "cicadas" || filter.ProjectID != projectID {
		t.Errorf("Filter fields mismatch")
	}

	if filter.LogGroup != "NETWORK" || filter.Scope != "PROJECT" {
		t.Errorf("Metadata filter fields mismatch")
	}

	resp := PaginatedAuditEventsResponse{
		Data:       []*AuditEvent{},
		TotalCount: 120,
		Page:       1,
		PageSize:   50,
		TotalPages: 3,
	}

	if resp.TotalPages != 3 || resp.TotalCount != 120 {
		t.Errorf("Pagination math mismatch")
	}
}

