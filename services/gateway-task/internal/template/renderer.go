package template

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"
	"text/template"
)

const projectTemplateStr = `---
task_id: {{.TaskID}}
type: PROJECT
scope: {{.Scope}}
status: {{.Status}}
priority: {{.Priority}}
tenant: {{.TenantName}}
assignee: {{.AssigneeName}}
reporter: {{.ReporterName}}
geom_ref: "{{.ReferenceID}}"
due_date: "{{.DueDate}}"
created_at: "{{.CreatedAt}}"
environment: production
infrastructure_type: ftth-project
---

# {{.Title}}

## Deskripsi Proyek
{{.Description}}

## Sub-Tasks
{{range .SubTasks}}- [ ] {{.}}
{{end}}
## Lokasi
- Referensi GIS: {{.ReferenceType}} — {{.ReferenceID}}
- Koordinat: [Lihat di Peta](https://system-gis.k2net.id/tasks/{{.TaskID}})

## Links
- Dashboard K2NET: [{{.TaskID}}](https://system-gis.k2net.id/tasks/{{.TaskID}})
- Buka Obsidian: [obsidian://open?vault=K2NET_Engineering_Vault&file={{.TaskID}}](obsidian://open?vault=K2NET_Engineering_Vault&file={{.TaskID}})
`

const ticketTemplateStr = `---
task_id: {{.TaskID}}
type: TICKET
scope: {{.Scope}}
status: {{.Status}}
priority: {{.Priority}}
tenant: {{.TenantName}}
assignee: {{.AssigneeName}}
geom_ref: "{{.ReferenceID}}"
due_date: "{{.DueDate}}"
created_at: "{{.CreatedAt}}"
environment: production
infrastructure_type: support-ticket
---

# {{.Title}}

## Detail Gangguan
{{.Description}}

## Timeline
- **Dilaporkan**: {{.CreatedAt}}
- **Penanggung Jawab**: {{.AssigneeName}}
- **Target Selesai (SLA)**: {{.DueDate}}

## Links
- Dashboard K2NET: [{{.TaskID}}](https://system-gis.k2net.id/tasks/{{.TaskID}})
`

type TaskPayload struct {
	TaskID        string   `json:"taskId"`
	TaskType      string   `json:"taskType"`
	Scope         string   `json:"scope"` // PLATFORM_INTERNAL | TENANT_TO_PLATFORM | TENANT_INTERNAL
	Status        string   `json:"status"`
	Priority      string   `json:"priority"`
	TenantName    string   `json:"tenantName"`
	TenantSlug    string   `json:"tenantSlug"`
	AssigneeName  string   `json:"assigneeName"`
	ReporterName  string   `json:"reporterName"`
	ReferenceType string   `json:"referenceType"`
	ReferenceID   string   `json:"referenceId"`
	DueDate       string   `json:"dueDate"`
	CreatedAt     string   `json:"createdAt"`
	Title         string   `json:"title"`
	Description   string   `json:"description"`
	ObsidianRef   string   `json:"obsidianRef"`
	SubTasks      []string `json:"subTasks"`
}

var (
	projectTmpl = template.Must(template.New("project").Parse(projectTemplateStr))
	ticketTmpl  = template.Must(template.New("ticket").Parse(ticketTemplateStr))
	subtaskReg  = regexp.MustCompile(`(?m)^[-*]\s+\[\s*\]\s+(.*)$`)
)

func RenderTask(payload TaskPayload) ([]byte, error) {
	// Parse subtasks dynamically from markdown description if none provided in payload
	if len(payload.SubTasks) == 0 && payload.Description != "" {
		matches := subtaskReg.FindAllStringSubmatch(payload.Description, -1)
		for _, m := range matches {
			if len(m) > 1 {
				payload.SubTasks = append(payload.SubTasks, strings.TrimSpace(m[1]))
			}
		}
	}

	var buf bytes.Buffer
	var err error

	if payload.TaskType == "PROJECT" {
		err = projectTmpl.Execute(&buf, payload)
	} else {
		err = ticketTmpl.Execute(&buf, payload)
	}

	if err != nil {
		return nil, fmt.Errorf("execute template error: %w", err)
	}

	return buf.Bytes(), nil
}
