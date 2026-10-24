package template

import (
	"strings"
	"testing"
)

func TestRenderTaskProject(t *testing.T) {
	payload := TaskPayload{
		TaskID:        "PRJ-001",
		TaskType:      "PROJECT",
		ReferenceType: "PROJECT",
		Scope:         "PLATFORM_INTERNAL",
		Status:        "IN_PROGRESS",
		Priority:      "HIGH",
		AssigneeName:  "Andi",
		Title:         "Fase B OLT Poller Upgrade",
		Description:   "Pembaruan arsitektur poller dan observabilitas OLT",
	}

	rendered, err := RenderTask(payload)
	if err != nil {
		t.Fatalf("expected successful project render, got: %v", err)
	}

	content := string(rendered)
	if !strings.Contains(content, "task_id: PRJ-001") {
		t.Error("expected content to contain task_id: PRJ-001")
	}
	if !strings.Contains(content, "type: PROJECT") {
		t.Error("expected content to contain type: PROJECT")
	}
	if !strings.Contains(content, "Fase B OLT Poller Upgrade") {
		t.Error("expected content to contain title")
	}
	if !strings.Contains(content, "https://system-gis.kdua.net/workspace/plans/PRJ-001") {
		t.Error("expected content to contain workspace plans URL")
	}
}

func TestRenderTaskPlan(t *testing.T) {
	payload := TaskPayload{
		TaskID:        "PLN-2026-10-0001",
		TaskType:      "PROJECT",
		ReferenceType: "PLAN",
		Scope:         "PLATFORM_INTERNAL",
		Status:        "PLANNING",
		Priority:      "MEDIUM",
		AssigneeName:  "Arsitek",
		Title:         "Spesifikasi Arsitektur Workspace & Task Gateway",
		Description:   "Dokumen PRD spesifikasi teknis",
	}

	rendered, err := RenderTask(payload)
	if err != nil {
		t.Fatalf("expected successful plan render, got: %v", err)
	}

	content := string(rendered)
	if !strings.Contains(content, "task_id: PLN-2026-10-0001") {
		t.Error("expected content to contain task_id: PLN-2026-10-0001")
	}
	if !strings.Contains(content, "type: PLAN") {
		t.Error("expected content to contain type: PLAN")
	}
	if !strings.Contains(content, "Spesifikasi Arsitektur Workspace & Task Gateway") {
		t.Error("expected content to contain title")
	}
	if !strings.Contains(content, "https://system-gis.kdua.net/workspace/plans/PLN-2026-10-0001") {
		t.Error("expected content to contain workspace plans URL")
	}
}

func TestRenderTaskIdea(t *testing.T) {
	payload := TaskPayload{
		TaskID:        "IDEA-2026-10-0002",
		TaskType:      "PROJECT",
		ReferenceType: "IDEA",
		Scope:         "PLATFORM_INTERNAL",
		Status:        "OPEN",
		Priority:      "LOW",
		AssigneeName:  "Product Manager",
		Title:         "Integrasi AI Copilot di Notifikasi Outage",
		Description:   "Eksplorasi penggunaan LLM untuk rekomendasi penanganan outage",
	}

	rendered, err := RenderTask(payload)
	if err != nil {
		t.Fatalf("expected successful idea render, got: %v", err)
	}

	content := string(rendered)
	if !strings.Contains(content, "task_id: IDEA-2026-10-0002") {
		t.Error("expected content to contain task_id: IDEA-2026-10-0002")
	}
	if !strings.Contains(content, "type: IDEA") {
		t.Error("expected content to contain type: IDEA")
	}
	if !strings.Contains(content, "Problem Statement & Hypothesis") {
		t.Error("expected idea section header")
	}
}

func TestRenderTaskDoc(t *testing.T) {
	payload := TaskPayload{
		TaskID:        "DOC-2026-10-0003",
		TaskType:      "PROJECT",
		ReferenceType: "DOC",
		Scope:         "PLATFORM_INTERNAL",
		Status:        "RESOLVED",
		Priority:      "MEDIUM",
		AssigneeName:  "Tech Lead",
		Title:         "SOP Penanganan Bencana Jaringan FTTH",
		Description:   "Panduan operasional penanganan FO cut",
	}

	rendered, err := RenderTask(payload)
	if err != nil {
		t.Fatalf("expected successful doc render, got: %v", err)
	}

	content := string(rendered)
	if !strings.Contains(content, "task_id: DOC-2026-10-0003") {
		t.Error("expected content to contain task_id: DOC-2026-10-0003")
	}
	if !strings.Contains(content, "type: DOC") {
		t.Error("expected content to contain type: DOC")
	}
	if !strings.Contains(content, "Knowledge Wiki") {
		t.Error("expected wiki section")
	}
}

func TestRenderTaskTicketWithSubtasks(t *testing.T) {
	payload := TaskPayload{
		TaskID:      "TCK-101",
		TaskType:    "TICKET",
		Scope:       "TENANT_INTERNAL",
		Status:      "OPEN",
		Priority:    "CRITICAL",
		TenantName:  "ISP Bandung",
		Title:       "Kabel Fiber Putus di Segmen Cicaheum",
		Description: "Gangguan FO putus:\n- [ ] Splicing core 1-12\n- [ ] Uji OTDR",
	}

	rendered, err := RenderTask(payload)
	if err != nil {
		t.Fatalf("expected successful ticket render, got: %v", err)
	}

	content := string(rendered)
	if !strings.Contains(content, "task_id: TCK-101") {
		t.Error("expected content to contain task_id: TCK-101")
	}
	if !strings.Contains(content, "Splicing core 1-12") {
		t.Error("expected parsed subtask in rendered output")
	}
}

func TestRenderTaskPlatformIssue(t *testing.T) {
	payload := TaskPayload{
		TaskID:      "ISSUE-555",
		TaskType:    "TICKET",
		Scope:       "PLATFORM_INTERNAL",
		Status:      "OPEN",
		Priority:    "HIGH",
		Title:       "Fix Redis Connection Pool Timeout",
		Description: "Investigasi kebocoran koneksi",
	}

	rendered, err := RenderTask(payload)
	if err != nil {
		t.Fatalf("expected successful issue render, got: %v", err)
	}

	content := string(rendered)
	if !strings.Contains(content, "https://system-gis.kdua.net/workspace/issues/ISSUE-555") {
		t.Errorf("expected platform issue link in ticket, got: %s", content)
	}
}

func TestRenderTaskSupportTicket(t *testing.T) {
	payload := TaskPayload{
		TaskID:      "SUPP-777",
		TaskType:    "TICKET",
		Scope:       "TENANT_TO_PLATFORM",
		Status:      "OPEN",
		Priority:    "URGENT",
		TenantName:  "ISP Maju Lancar",
		Title:       "Kendala Sinkronisasi Poller SNMP OLT",
		Description: "SNMP poller tidak merespons",
	}

	rendered, err := RenderTask(payload)
	if err != nil {
		t.Fatalf("expected successful support ticket render, got: %v", err)
	}

	content := string(rendered)
	if !strings.Contains(content, "https://system-gis.kdua.net/support/tickets/SUPP-777") {
		t.Errorf("expected support ticket link in ticket, got: %s", content)
	}
}
