# 🛡️ Standar Audit & Aturan Baku Kualitas Kode per Service (K2NET FTTH GIS)

Dokumen ini adalah acuan resmi bagi AI Agent dan Developer untuk memastikan kesiapan logika, gaya penulisan kode, dan prasyarat arsitektur di seluruh service sebelum dilakukan deployment.

---

## 🏗️ Peta Arsitektur & Daftar Service

| Kategori | Nama Container / Modul | Port | Bahasa / Framework | Tanggung Jawab Utama |
|---|---|---|---|---|
| **Frontend** | `ftth-frontend-admin` (`apps/studio-admin`) | `3000` | Next.js 16 (React 19) | Admin SaaS Platform, Observability, Tasks, Gateways UI |
| **Frontend** | `ftth-frontend-tenant` (`apps/studio-tenant`) | `3001` | Next.js 16 (React 19) | Tenant Self-Service GIS Portal |
| **Backend** | `ftth-backend` (`apps/api`) | `9090` | Spring Boot 3 (Java 21) | Core Business Logic, PostGIS Queries, Auth RBAC |
| **Go Gateway** | `ftth-notification-gateway` | `5001` | Go 1.25 (Gin) | Twilio SMS, WhatsApp, SMTP Email Dispatcher |
| **Go Gateway** | `ftth-payment-gateway` | `5002` | Go 1.25 (Gin) | Xendit Payment Links & Webhooks |
| **Go Gateway** | `ftth-map-gateway` | `5003` | Go 1.25 (Gin) | HERE / Google Maps Geocoding & Martin Tile Proxy |
| **Go Gateway** | `ftth-storage-gateway` | `5004` | Go 1.25 (Gin) | MinIO S3 Tenant Assets & Bucket Statistics |
| **Go Gateway** | `ftth-whatsapp-gateway` | `5005` | Go 1.25 (Gin) | WhatsApp Cloud API Integration |
| **Go Gateway** | `ftth-scheduler-gateway` | `5006` | Go 1.25 (Gin) | Automated Backup & Cron Job Orchestrator |
| **Go Gateway** | `ftth-export-gateway` | `5007` | Go 1.25 (Gin) | Asynchronous Data Export to S3 / Excel / PDF |
| **Go Gateway** | `ftth-olt-gateway` | `5008` | Go 1.25 (Gin) | SNMP OLT Hardware Bridge & Terminal CLI |
| **Go Gateway** | `ftth-audit-gateway` | `5009` | Go 1.25 (Gin) | Centralized Immutable Audit Log Ingestion |
| **Go Service** | `ftth-poller` | `5010` | Go 1.25 (Gin) | High-Frequency SNMP Device Polling & Prometheus Telemetry |
| **Go Gateway** | `ftth-task-gateway` | `5011` | Go 1.25 (Gin) | Obsidian Semantic Markdown Sync Worker |
| **Python AI** | `ftth-ai-gateway` | `5012` | Python 3.12 (FastAPI) | RAG Copilot, pgvector 1536 dim, SSE Streaming |
| **Ingress** | `kong` | `8000/8001` | Kong API Gateway 3.9 | Edge Routing, Token Decoupling, Rate Limiting |
| **Edge Proxy**| `traefik` | `80/443` | Traefik v3 | SSL Termination, Host Subdomain Routing |

---

## 📌 Checklist Prasyarat & Aturan Baku per Service

### 1. 🎨 FRONTEND SERVICES (`apps/studio-admin` & `apps/studio-tenant`)

| Area | Aturan Baku Wajib | Perintah Verifikasi |
|---|---|---|
| **Tema & Warna** | • **0 hardcoded colors**: Dilarang menggunakan `text-zinc-*`, `bg-zinc-*`, `border-zinc-*`, `text-white`, `bg-emerald-*`, `text-emerald-*`.<br>• Gunakan **Semantic Tokens**: `text-foreground`, `bg-card`, `text-primary`, `border-border`, `text-muted-foreground`. | `pnpm audit:colors` (Target: **0**) |
| **Tipe Data** | • **0 TypeScript Error**: Dilarang menggunakan `any` tanpa alasan jelas.<br>• Seluruh 67 rute halaman wajib lulus type-checking tanpa error. | `pnpm --filter @k2net/studio-admin typecheck` |
| **Tooltips** | • Seluruh *icon button* dan tombol toolbar wajib dibungkus `<ActionTooltip>` dari `@k2net/ui` dengan badge shortcut keyboard (contoh: `shortcut="R"`, `shortcut="⌘K"`). | Code Review |
| **Context Menu** | • Seluruh baris tabel data enterprise wajib mendukung klik kanan `<UniversalContextMenu>` (Tanya AI Copilot `Ctrl+J`, Quick Inspect, Salin UUID, Hapus `Del`). | Code Review |
| **Top KPI Cards**| • Seluruh metrik strip di bagian atas dashboard wajib menggunakan `<Card glowingEffect>` dengan animasi border gradient dinamis. | Code Review |
| **Otentikasi** | • Super Admin (`ROLE_SUPER_ADMIN` / `super_admin`) wajib membypass seluruh proteksi role (`return true`). | Code Review |

---

### 2. ☕ BACKEND JAVA SPRING BOOT (`apps/api`)

| Area | Aturan Baku Wajib | Perintah Verifikasi |
|---|---|---|
| **Multi-Tenancy** | • **Isolasi Tenant**: Setiap query repository atau service yang mengambil data operasional wajib menyertakan filter `tenant_id` dari header `X-Tenant-ID`. | Code Review |
| **Security Annotation** | • Gunakan `@PreAuthorize("isAuthenticated()")` alih-alih `hasRole('authenticated')` untuk memastikan kompatibilitas Keycloak JWT. | `grep -rn "hasRole('authenticated')" apps/api` (Target: **0**) |
| **Audit Logging** | • Setiap mutasi data (`POST`, `PUT`, `DELETE`) pada service layer wajib ditandai `@AuditRequired(action=..., resourceType=...)`.<br>• Penanganan error audit tidak boleh memutus atau me-rollback transaksi database utama jika gateway audit sedang tidak dapat dijangkau. | Code Review |
| **PostGIS Spatial**| • Seluruh data spasial (koordinat OLT/ODP, kabel) wajib menggunakan proyeksi **SRID 4326 (WGS 84)**.<br>• Output API spasial dikembalikan dalam format standar GeoJSON.<br>• Kolom geometri wajib memiliki spatial index `GIST`. | Code Review |
| **Flyway Migrations**| • Penamaan berkas migrasi SQL wajib mengikuti urutan `V<Nomor>__<Deskripsi>.sql`.<br>• Dilarang mengubah berkas SQL migrasi yang sudah dieksekusi di database produksi. | `ls apps/api/src/main/resources/db/migration/` |
| **Kompilasi** | • Seluruh 231 kelas Java terkompilasi bersih tanpa syntax error. | `pnpm verify:backend` |

---

### 3. 🐹 GO MICROSERVICES & GATEWAYS (`services/*`)

| Area | Aturan Baku Wajib | Perintah Verifikasi |
|---|---|---|
| **Dial & Networking**| • **Dilarang hardcode IP internal Docker (`172.18.0.x`)**: Wajib menggunakan service hostname (`http://ftth-postgres:5432`, `http://ftth-poller:5010`).<br>• **Dilarang `fmt.Sprintf("%s:%d", host, port)` pada `net.Dial`**: Wajib menggunakan `net.JoinHostPort(host, strconv.Itoa(port))` agar kompatibel dengan IPv6. | `go vet ./...` di dalam modul |
| **Auth & Header** | • Setiap handler wajib mengekstrak header `X-Tenant-ID` dan memvalidasi `X-Gateway-Token` menggunakan `middleware.InternalAuthMiddleware`. | Code Review |
| **Audit Client** | • Pengiriman audit log dari Go service wajib bersifat non-blocking (*fire-and-forget* goroutine: `go auditClient.LogEvent(...)`).<br>• Jika `AUDIT_GATEWAY_URL` kosong, client harus otomatis no-op secara aman tanpa memicu nil-pointer panic. | Code Review |
| **Timeouts** | • Setiap pemanggilan HTTP keluar atau koneksi database wajib dibungkus `context.WithTimeout(ctx, duration)`. | Code Review |
| **Kompilasi Workspace**| • Seluruh 12 modul Go di `services/go.work` wajib lulus `go vet` dan `go build`. | `pnpm verify:gateways` |

---

### 4. 🐍 PYTHON FASTAPI AI GATEWAY (`services/gateway-ai`)

| Area | Aturan Baku Wajib | Perintah Verifikasi |
|---|---|---|
| **Zero Data Leakage**| • **SETIAP** similarity search pgvector wajib menyertakan filter `WHERE tenant_id = :tenant_id`. Double-lock pada JOIN queries. | Code Review |
| **SSE Streaming** | • Endpoint streaming wajib mengembalikan header `X-Accel-Buffering: no` untuk mencegah buffering proxy. | Code Review |
| **Vector Schema** | • Dimensi embedding standar: **1536 dim**. Index HNSW menggunakan parameter `m=16, ef_construction=64`. | Code Review |
| **Kompilasi Sintaks**| • Seluruh berkas Python wajib bebas dari syntax error. | `python -m py_compile app/**/*.py` |

---

### 5. 🌐 INGRESS, DOCKER & INFRASTRUCTURE (`docker/`)

| Area | Aturan Baku Wajib | Perintah Verifikasi |
|---|---|---|
| **Kong Declarative**| • Setiap microservice baru wajib memiliki entri `service` dan `route` di `docker/kong/kong.yml`.<br>• IP Whitelist wajib menggunakan Subnet CIDR `172.18.0.0/16`. | `pnpm verify:infra` |
| **Traefik SSL** | • Domain routing wajib terdaftar untuk 5 subdomain resmi: `system-gis`, `gis`, `auth-gis`, `map-gis`, `s3-gis`. | `docker compose config` |
| **Docker Build Guard**| • **Dilarang keras melakukan `docker build` langsung di server**. Proses build image didelegasikan ke GitHub Actions Runner. | Aturan Level 1 AGENTS.md |

---

## ⚡ Perintah Cepat Verifikasi per Service (Quality Gate Commands)

```bash
# 1. Verifikasi Seluruh Monorepo (Semua 5 Pilar) — < 25 detik
pnpm verify

# 2. Verifikasi Khusus Frontend Admin & UI (Warna Semantik + Typecheck)
pnpm verify:frontend

# 3. Verifikasi Khusus Backend Spring Boot (Java 21 Syntax & Compile)
pnpm verify:backend

# 4. Verifikasi Khusus 12 Go Microservices (go vet + go build workspace)
pnpm verify:gateways

# 5. Verifikasi Khusus Konfigurasi Docker Compose & Ingress
pnpm verify:infra
```
