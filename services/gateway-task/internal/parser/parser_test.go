package parser

import (
	"testing"
)

func TestParseMarkdownNote(t *testing.T) {
	mdSample := `---
task_id: TASK-001
type: PROJECT
scope: PLATFORM_INTERNAL
status: IN_PROGRESS
priority: HIGH
lead: andiansyah@kdua.net
target_date: "2026-12-31"
---

# 🚀 Deployment Core Network

> [!abstract] Ringkasan
> Pemasangan OLT dan ODF baru.

### 🎯 Key Milestones
- [x] **M1 — Discovery & Requirements**: Analisa kebutuhan
- [ ] **M2 — Implementation & Testing**: Pengerjaan teknis
- [x] **M3 — Production Rollout**: Deployment
`

	note, err := ParseMarkdownNote(mdSample)
	if err != nil {
		t.Fatalf("Failed to parse markdown: %v", err)
	}

	if note.Frontmatter.TaskID != "TASK-001" {
		t.Errorf("Expected TaskID TASK-001, got %s", note.Frontmatter.TaskID)
	}
	if note.Frontmatter.Status != "IN_PROGRESS" {
		t.Errorf("Expected Status IN_PROGRESS, got %s", note.Frontmatter.Status)
	}
	if note.Frontmatter.Priority != "HIGH" {
		t.Errorf("Expected Priority HIGH, got %s", note.Frontmatter.Priority)
	}
	if note.Title != "Deployment Core Network" {
		t.Errorf("Expected Title 'Deployment Core Network', got '%s'", note.Title)
	}
	if note.TotalChecks != 3 {
		t.Errorf("Expected 3 total checks, got %d", note.TotalChecks)
	}
	if note.DoneChecks != 2 {
		t.Errorf("Expected 2 done checks, got %d", note.DoneChecks)
	}
	if note.Percentage != 66 {
		t.Errorf("Expected 66%% percentage, got %d%%", note.Percentage)
	}
}
