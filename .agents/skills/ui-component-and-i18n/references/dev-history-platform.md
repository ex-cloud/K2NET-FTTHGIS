# Dev History & Solved Issues — Platform, Security & UI (Agustus–Oktober 2026)

> **Dokumen Riwayat Dev & Solusi**: Catatan implementasi dan solusi teknis pada modul Task Management, AI Knowledge, Security PBAC, dan CI Quality Gate.
> Referensi utama: [AGENTS.md](file:///opt/project5/.agents/AGENTS.md).

---

### 📋 Standardisasi Modul Task Management & Linear App (Agustus 2026)
- **Mental Model**: Hierarki 2-tingkat ala Linear App:
  1. **Projects (Inisiatif/Plan Besar)**: Payung pekerjaan dengan Hub khusus (`Overview`, `Activity`, `Issues`).
  2. **Issues/Tasks (Unit Kerja Terkecil)**: `type: PROJECT` vs `type: TICKET`, `parent_task_id`, dan `labels`.
- **Floating Pill Modal (`NewTaskDialog.tsx`)**: Form tugas floating dengan bar pill (`Status`, `Priority`, `Assignee`, `Project`, `Labels`, attachment `📎`, `Create more`).
- **Canvas Editor Penuh (`/tasks/[id]` & `TaskDetailSheet.tsx`)**: Inline title editable, markdown auto-save (1.5s debounce), comments timeline (`Ctrl+Enter`), dan properties drawer kanan (`w-72`).
- **Secondary Sidebar (`TaskSecondarySidebar.tsx`)**: Navigasi `PERSONAL` (Inbox, My Issues), `WORKSPACE` (Projects & Views), dan `SCOPE` (`Platform Internal` vs `B2B Inbox`).

### 🧠 AI Knowledge Base — Two-Way Disk Persistence & Sync (Agustus 2026)
- **Two-Way Persistence**: Pembuatan (`POST /api/v1/ai/documents/text`) atau pembaruan (`PUT /api/v1/ai/documents/{doc_id}`) dari UI otomatis menulis berkas `.md` ke disk `/opt/project5/docs/{folder}/{slug}.md`.
- **Pemetaan Kategori**: `TROUBLESHOOTING` → `02_SOP_Troubleshooting`, `NETWORK_CONFIG` → `01_Architecture`, `INFRASTRUCTURE` → `03_Infrastructure`, `GIS_MANUAL` → `04_GIS_Mapping`, `PLANS` → `05_Plans_Roadmap`.
- **Sync Detection (`GET /api/v1/ai/documents/sync-status`)**: Memindai file `.md` fisik terhadap database `ai_documents`. Banner amber di Admin menampilkan berkas unindexed dengan tombol 1-click trigger indexing.
- **Docker Volume Mount RW**: Mount `/opt/project5/docs` pada service `gateway-ai` wajib berstatus Read-Write (tanpa `:ro`) agar Python AI dapat menyimpan hasil approval SOP.

### ✍️ Standardisasi TipTap Editor & AI SOP Synthesis (Agustus 2026)
- **Shared Component**: Editor TipTap diletakkan terpusat di `@k2net/ui` (`rich-editor.tsx`) dengan tema semantik (`bg-card`, `text-foreground`, `border-border`).
- **Streaming SOP Generator**: Modal `AiGenerateSopModal` memanggil stream `POST /api/v1/ai/generate-sop/stream` di `gateway-ai:5012` (`max_output_tokens: 8192`) dengan pembersih preamble otomatis.

### 🤖 Standardisasi Floating AI Assistant (Agustus 2026)
- **Komponen & Trigger**: `FloatingAiAssistant.tsx` di `apps/studio-admin`, trigger via navbar atau keyboard shortcut `Ctrl+J` / `Cmd+J`.
- **Resizable Drawer**: Drag handle fleksibel (min 440px, default 540px, wide mode 860px) tersimpan di `localStorage`.
- **Fitur Toolbar**: New Chat, Wide Mode, Export `.md`, Clear History, dan visual accordion proses reasoning AI.

### 📜 Pola Infinite Scroll & De-duplication Table (Agustus 2026)
- **Pola Hook**: Guard `offsetRef`, `isFetchingRef`, dan de-duplikasi ID via `Set(prev.map(d => d.id))` pada tabel bervolume tinggi.
- **IntersectionObserver**: Gunakan `<div ref={sentinelRef} />` dengan `rootMargin: "200px"` dan skeleton feedback saat fetching.

### 🛡️ Otorisasi Granular PBAC, Ingress Keycloak & Cache L2 (September 2026)
- **Granular PBAC Backend**: Seluruh controller dilindungi `@PreAuthorize` spesifik (`hasAuthority('system.<modul>.<aksi>')` atau `@tenantSecurity.hasEffectivePermission('<modul>.<aksi>')`). Dilarang role semu `hasRole('authenticated')`.
- **Ingress Normalization**: `SecurityConfig.java` dan `@k2net/auth` otomatis menormalkan token Keycloak menjadi lowercase tanpa prefix `role_`.
- **Flyway Permissions & Cache Eviction**: Permission baru didaftarkan lewat migrasi Flyway SQL, dan cache Hibernate L2 di-evict saat startup oleh `PermissionSeeder.java`.
- **Hibernate 6 Epoch Query**: Fungsi `EXTRACT(EPOCH FROM ...)` di Hibernate 6 wajib menggunakan `nativeQuery = true` pada query kalkulasi durasi SQL di repository.
- **Dual-Identity Audit Trail**: Sesi impersonasi mencatat `actor_id` (Super Admin) + `impersonated_tenant_id` + `impersonation_session_id`.

### 🛡️ CI Gate Otorisasi Mutlak & Live DB Truth (September 2026)
- **CI Gate (`ComprehensiveControllerSecurityCoverageTest`)**: 100% `@RestController` dipindai otomatis. Build CI gagal jika endpoint tidak memiliki `@PreAuthorize`.
- **Pola Mutasi Terikat Project (Spatial ABAC)**: Endpoint pengubah aset fisik wajib menggunakan `@PreAuthorize("@spatialSecurityEvaluator.hasProjectPermission(#dto.projectId, 'network.manage')")`.
- **Live Database Truth**: Verifikasi matriks keamanan wajib langsung ke database PostgreSQL (`bash scripts/audit-security-matrix.sh`).
