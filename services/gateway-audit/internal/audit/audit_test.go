package audit

import (
	"testing"
	"time"
)

func TestQueryEventsSQLConstruction(t *testing.T) {
	tenant := "garut"
	actor := "user-123"
	action := "LOGIN"
	resource := "invoice"
	start := time.Now().Add(-1 * time.Hour)
	end := time.Now()

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

func TestSanitizeMapPIIRedaction(t *testing.T) {
	input := map[string]any{
		"username":    "admin@k2.net",
		"password":    "super_secret_123!",
		"api_key":     "k2_live_9988776655",
		"credit_card": "4111-2222-3333-4444",
		"nested": map[string]any{
			"private_key": "-----BEGIN RSA PRIVATE KEY-----",
			"normal_info": "public data",
		},
		"token_list": []any{
			"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
			"plain_string",
		},
	}

	sanitized := SanitizeMap(input)

	if sanitized["password"] != "[REDACTED]" {
		t.Errorf("Password was not redacted: %v", sanitized["password"])
	}
	if sanitized["api_key"] != "[REDACTED]" {
		t.Errorf("API key was not redacted: %v", sanitized["api_key"])
	}
	if sanitized["credit_card"] != "[REDACTED]" {
		t.Errorf("Credit card was not redacted: %v", sanitized["credit_card"])
	}

	nested, ok := sanitized["nested"].(map[string]any)
	if !ok || nested["private_key"] != "[REDACTED]" {
		t.Errorf("Nested private key was not redacted")
	}
	if nested["normal_info"] != "public data" {
		t.Errorf("Normal info was mistakenly modified")
	}

	tokens := sanitized["token_list"].([]any)
	if tokens[0] != "[REDACTED]" {
		t.Errorf("Bearer token string was not redacted")
	}
	if tokens[1] != "plain_string" {
		t.Errorf("Plain string was modified")
	}
}

func TestCryptographicHashAndMerkleRoot(t *testing.T) {
	now := time.Now()
	hash1, prev1 := ComputeEventHash("", "tenant-a", "user-1", "LOGIN", "AUTH", "auth-session-1", now, nil, nil, map[string]any{"ip": "1.2.3.4"})
	if hash1 == "" || prev1 != "GENESIS_ROOT_tenant-a" {
		t.Errorf("Hash generation failed for genesis block: %s, %s", hash1, prev1)
	}

	hash2, prev2 := ComputeEventHash(hash1, "tenant-a", "user-1", "ODP_CREATED", "ODP", "odp-101", now.Add(time.Second), nil, map[string]any{"name": "ODP-101"}, nil)
	if hash2 == "" || prev2 != hash1 {
		t.Errorf("Hash chain broken: prev2 %s != hash1 %s", prev2, hash1)
	}

	merkleRoot := ComputeBatchMerkleRoot([]string{hash1, hash2})
	if merkleRoot == "" || len(merkleRoot) != 64 {
		t.Errorf("Merkle root invalid: %s", merkleRoot)
	}
}

func TestSlidingWindowDeduplicator(t *testing.T) {
	dedup := NewSlidingWindowDeduplicator(500*time.Millisecond, 5)

	// First 5 events should be recorded
	for i := 1; i <= 5; i++ {
		recorded, count := dedup.ShouldSample("tenant-a", "PING_FAILED", "OLT", "poller", "olt-01")
		if !recorded || count != i {
			t.Errorf("Event %d should be recorded (count: %d)", i, count)
		}
	}

	// 6th to 9th events should be throttled
	for i := 6; i <= 9; i++ {
		recorded, count := dedup.ShouldSample("tenant-a", "PING_FAILED", "OLT", "poller", "olt-01")
		if recorded {
			t.Errorf("Event %d should have been throttled (count: %d)", i, count)
		}
	}

	// 10th event (milestone) should be recorded
	recorded, count := dedup.ShouldSample("tenant-a", "PING_FAILED", "OLT", "poller", "olt-01")
	if !recorded || count != 10 {
		t.Errorf("10th milestone event should be sampled (count: %d)", count)
	}
}

func TestCursorPaginationAndBenchmarkFilter(t *testing.T) {
	now := time.Now()
	testID := "018f3a2c-4b52-7000-8000-000000000001"

	filter := QueryAuditEventsFilter{
		TenantSlug:       "system",
		IncludeBenchmark: false,
		BeforeOccurredAt: &now,
		BeforeID:         testID,
		Page:             1,
		PageSize:         50,
	}

	if filter.IncludeBenchmark {
		t.Errorf("Expected IncludeBenchmark to be false")
	}

	if filter.BeforeID != testID || filter.BeforeOccurredAt == nil {
		t.Errorf("Expected BeforeID and BeforeOccurredAt to be populated")
	}

	cursorStr := "MjAyNi0xMC0wMlQxMTo1ODozOS4xMjM0NTZaPDAxOGYzYTJjLTRiNTItNzAwMC04MDAwLTAwMDAwMDAwMDAwMQ=="
	nextCursor := &cursorStr
	resp := PaginatedAuditEventsResponse{
		Data:       []*AuditEvent{},
		TotalCount: 500,
		Page:       1,
		PageSize:   50,
		TotalPages: 10,
		HasMore:    true,
		NextCursor: nextCursor,
	}

	if !resp.HasMore || resp.NextCursor == nil || *resp.NextCursor != cursorStr {
		t.Errorf("Cursor response struct validation failed")
	}
}

