package template

import (
	"bytes"
	"fmt"
	"regexp"
	"strings"
	"text/template"
)

const ideaTemplateStr = `---
task_id: {{.TaskID}}
type: IDEA
scope: {{.Scope}}
status: {{.Status}}
priority: {{.Priority}}
lead: {{if .AssigneeName}}{{.AssigneeName}}{{else}}Unassigned{{end}}
created_at: "{{.CreatedAt}}"
tags:
  - idea/{{.Scope}}
  - status/{{.Status}}
---

# 💡 {{.Title}}

> [!abstract] 💭 Problem Statement & Hypothesis
> {{if .Description}}{{.Description}}{{else}}*Jelaskan latar belakang masalah, pain point pengguna, dan hipotesis solusi yang diajukan.*{{end}}

---

### 🎯 Expected Impact & Value
- **Target User**: *(Siapa yang paling terdampak oleh ide/fitur ini?)*
- **Business/Platform Value**: *(Efisiensi operasional, reliabilitas jaringan, dsb.)*
- **Effort Estimation**: *(Estimasi kompleksitas: Low / Medium / High)*

---

### 🧪 Discovery & Validation Checklist
{{if .SubTasks}}{{range .SubTasks}}- [ ] {{.}}
{{end}}{{else}}- [ ] Wawancara stakeholder / user feedback review
- [ ] Analisa kelayakan teknis & arsitektur awal
- [ ] Evaluasi dependensi modul & estimasi resource
- [ ] Keputusan RFC: Approve untuk dijadikan Plan atau Reject
{{end}}

---

### 🔗 Quick Access
- 🌐 [Buka Idea di Workspace](https://system-gis.kdua.net/workspace/plans/{{.TaskID}})
`

const planTemplateStr = `---
task_id: {{.TaskID}}
type: PLAN
scope: {{.Scope}}
status: {{.Status}}
priority: {{.Priority}}
lead: {{if .AssigneeName}}{{.AssigneeName}}{{else}}Unassigned{{end}}
target_date: "{{.DueDate}}"
created_at: "{{.CreatedAt}}"
tags:
  - plan/{{.Scope}}
  - status/{{.Status}}
---

# 📋 {{.Title}}

> [!abstract] 📌 Product Requirements & Architecture Blueprint
> {{if .Description}}{{.Description}}{{else}}*Belum ada deskripsi dokumen rencana atau spesifikasi arsitektur.*{{end}}

---

### 🏛️ Technical Specifications & Architecture Decisions
- **Service Boundaries**: *(Modul backend Spring Boot, Go Gateway, atau Vite Frontend)*
- **Data Model & Migrations**: *(Skema Flyway V-series dan relasi database)*
- **Security & PBAC Isolation**: *(Scope Air-Gap SYSTEM vs TENANT, kode permission eksplisit)*

---

### 🎯 Key Milestones & Deliverables
{{if .SubTasks}}{{range .SubTasks}}- [ ] {{.}}
{{end}}{{else}}- [ ] **M1 — Discovery & Requirements**: Analisa kebutuhan dan arsitektur awal
- [ ] **M2 — Implementation & Testing**: Pengerjaan teknis dan pengujian sistem
- [ ] **M3 — Production Rollout & Handover**: Deployment dan operasionalisasi
{{end}}

---

### 📊 Linked Issues & Tasks (Dataview)
> [!info] Daftar issue dan tugas teknis yang terhubung secara otomatis:
` + "```dataview" + `
TABLE status, priority, assignee, due_date
FROM "02_Tickets"
WHERE contains(project_ref, "{{.TaskID}}") OR contains(file.tags, "{{.TaskID}}")
SORT priority desc
` + "```" + `

---

### 🔗 Quick Access
- 🌐 [Buka Plan & Specs di Workspace](https://system-gis.kdua.net/workspace/plans/{{.TaskID}})
`

const projectTemplateStr = `---
task_id: {{.TaskID}}
type: PROJECT
scope: {{.Scope}}
status: {{.Status}}
priority: {{.Priority}}
lead: {{if .AssigneeName}}{{.AssigneeName}}{{else}}Unassigned{{end}}
target_date: "{{.DueDate}}"
created_at: "{{.CreatedAt}}"
tags:
  - project/{{.Scope}}
  - status/{{.Status}}
---

# 🚀 {{.Title}}

> [!abstract] 📌 Executive Summary & Scope
> {{if .Description}}{{.Description}}{{else}}*Belum ada deskripsi inisiatif project.*{{end}}

---

### 🎯 Key Milestones & Deliverables
{{if .SubTasks}}{{range .SubTasks}}- [ ] {{.}}
{{end}}{{else}}- [ ] **M1 — Discovery & Requirements**: Analisa kebutuhan dan arsitektur awal
- [ ] **M2 — Implementation & Testing**: Pengerjaan teknis dan pengujian sistem
- [ ] **M3 — Production Rollout & Handover**: Deployment dan operasionalisasi
{{end}}

---

### 📊 Linked Issues & Tickets (Dataview)
> [!info] Daftar issue dan tugas teknis yang terhubung secara otomatis:
` + "```dataview" + `
TABLE status, priority, assignee, due_date
FROM "02_Tickets"
WHERE contains(project_ref, "{{.TaskID}}") OR contains(file.tags, "{{.TaskID}}")
SORT priority desc
` + "```" + `

---

### 📝 Architecture Decisions & Engineering Notes
- **Decisions**: *(Catat RFC / keputusan desain teknis di sini)*
- **Dependencies**: *(Catat dependensi antar modul atau gateway)*

---

### 🔗 Quick Access
- 🌐 [Buka Project di Workspace](https://system-gis.kdua.net/workspace/plans/{{.TaskID}})
- 📈 [Buka Project Dashboard](obsidian://open?vault=K2NET_Engineering_Vault&file=Excalidraw/Project%20Dashboard)
`

const docTemplateStr = `---
task_id: {{.TaskID}}
type: DOC
scope: {{.Scope}}
status: {{.Status}}
author: {{if .AssigneeName}}{{.AssigneeName}}{{else}}Unassigned{{end}}
created_at: "{{.CreatedAt}}"
tags:
  - doc/{{.Scope}}
  - wiki
---

# 📖 {{.Title}}

> [!abstract] 📚 Document Overview & Knowledge Wiki
> {{if .Description}}{{.Description}}{{else}}*Belum ada isi dokumentasi teknis atau SOP.*{{end}}

---

### 📝 Content & Specifications
{{if .SubTasks}}{{range .SubTasks}}- [ ] {{.}}
{{end}}{{else}}- [ ] Review konten dan akurasi teknis
- [ ] Verifikasi kepatuhan standar monorepo
{{end}}

---

### 🔗 Quick Access
- 🌐 [Buka Dokumen di Workspace](https://system-gis.kdua.net/workspace/plans/{{.TaskID}})
`

const ticketTemplateStr = `---
task_id: {{.TaskID}}
type: TICKET
scope: {{.Scope}}
status: {{.Status}}
priority: {{.Priority}}
tenant: {{.TenantName}}
assignee: {{if .AssigneeName}}{{.AssigneeName}}{{else}}Unassigned{{end}}
{{if .ReferenceID}}geom_ref: "{{.ReferenceID}}"
{{end}}due_date: "{{.DueDate}}"
created_at: "{{.CreatedAt}}"
tags:
  - ticket/{{.Scope}}
  - priority/{{.Priority}}
  - status/{{.Status}}
---

# 🎫 {{.Title}}

> [!warning] ⚠️ Detail Masalah & Instruksi Kerja
> {{if .Description}}{{.Description}}{{else}}*Belum ada rincian gangguan.*{{end}}

---

### 📋 Technical Checklist
{{if .SubTasks}}{{range .SubTasks}}- [ ] {{.}}
{{end}}{{else}}- [ ] Verifikasi gangguan & identifikasi titik root cause
- [ ] Lakukan perbaikan teknis / penggantian perangkat
- [ ] Uji performa & pastikan parameter redaman / koneksi normal
- [ ] Konfirmasi ke pelapor dan tutup tiket
{{end}}

{{if .ReferenceID}}
---

### 📍 Lokasi Geospasial GIS
- **Objek GIS**: {{.ReferenceType}} (ID: ` + "`{{.ReferenceID}}`" + `)
{{if eq .Scope "TENANT_TO_PLATFORM"}}- **Peta Spasial**: [Lihat Objek di Web Map Studio](https://system-gis.kdua.net/support/tickets/{{.TaskID}})
{{else if eq .Scope "PLATFORM_INTERNAL"}}- **Peta Spasial**: [Lihat Objek di Web Map Studio](https://system-gis.kdua.net/workspace/issues/{{.TaskID}})
{{else}}- **Peta Spasial**: [Lihat Objek di Web Map Studio](https://tenant-gis.kdua.net/tasks/{{.TaskID}})
{{end}}{{end}}

---

### ⏱️ Timeline & SLA
- **Dilaporkan**: {{.CreatedAt}}
- **Penanggung Jawab**: {{if .AssigneeName}}{{.AssigneeName}}{{else}}Belum ditugaskan{{end}}
- **Batas Waktu (SLA)**: {{if .DueDate}}{{.DueDate}}{{else}}Standard SLA{{end}}

---

### 🔗 Quick Links
{{if eq .Scope "TENANT_TO_PLATFORM"}}- 🌐 [Buka Tiket di Support Portal](https://system-gis.kdua.net/support/tickets/{{.TaskID}})
{{else if eq .Scope "PLATFORM_INTERNAL"}}- 🌐 [Buka Issue di Workspace](https://system-gis.kdua.net/workspace/issues/{{.TaskID}})
{{else}}- 🌐 [Buka Tiket di Web Studio](https://tenant-gis.kdua.net/tasks/{{.TaskID}})
{{end}}`

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
	ideaTmpl    = template.Must(template.New("idea").Parse(ideaTemplateStr))
	planTmpl    = template.Must(template.New("plan").Parse(planTemplateStr))
	projectTmpl = template.Must(template.New("project").Parse(projectTemplateStr))
	docTmpl     = template.Must(template.New("doc").Parse(docTemplateStr))
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
		refType := strings.ToUpper(strings.TrimSpace(payload.ReferenceType))
		switch refType {
		case "IDEA":
			err = ideaTmpl.Execute(&buf, payload)
		case "DOC":
			err = docTmpl.Execute(&buf, payload)
		case "PROJECT":
			err = projectTmpl.Execute(&buf, payload)
		case "PLAN":
			fallthrough
		default:
			err = planTmpl.Execute(&buf, payload)
		}
	} else {
		err = ticketTmpl.Execute(&buf, payload)
	}

	if err != nil {
		return nil, fmt.Errorf("execute template error: %w", err)
	}

	return buf.Bytes(), nil
}
