package template

import (
	"strings"
	"testing"
)

func TestRenderTaskProject(t *testing.T) {
	payload := TaskPayload{
		TaskID:       "PROJ-001",
		TaskType:     "PROJECT",
		Scope:        "PLATFORM_INTERNAL",
		Status:       "IN_PROGRESS",
		Priority:     "HIGH",
		AssigneeName: "Andi",
		Title:        "Fase B OLT Poller Upgrade",
		Description:  "Pembaruan arsitektur poller dan observabilitas OLT",
	}

	rendered, err := RenderTask(payload)
	if err != nil {
		t.Fatalf("expected successful project render, got: %v", err)
	}

	content := string(rendered)
	if !strings.Contains(content, "task_id: PROJ-001") {
		t.Error("expected content to contain task_id: PROJ-001")
	}
	if !strings.Contains(content, "type: PROJECT") {
		t.Error("expected content to contain type: PROJECT")
	}
	if !strings.Contains(content, "Fase B OLT Poller Upgrade") {
		t.Error("expected content to contain title")
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
