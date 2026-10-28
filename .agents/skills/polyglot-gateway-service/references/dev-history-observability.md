# Dev History & Solved Issues — Observability & Gateways (Agustus 2026)

> **Dokumen Riwayat Dev & Solusi**: Catatan implementasi dan solusi teknis pada modul Observability dan Go Gateways.
> Referensi utama: [AGENTS.md](file:///opt/project5/.agents/AGENTS.md).

---

### 🔍 Pola Audit Halaman Observability (Agustus 2026)
- **Sub-menu diaudit**: `overview`, `query-performance`, `api-gateway`, `compute`, `database`, `identity`, `messaging`, `olt-poller`, `scheduler`, `spatial-map`.
- **Format dokumen**: `DD-bulan-YYYY-nama-submenu.md` di `/opt/project5/docs/Server/rekomendasi/plan/`.
- **Alur baku**: (1) Analisa halaman + hook + backend, (2) Buat dokumen rekomendasi, (3) Implementation plan + task.md.

### ✅ Observability API Gateway (06 Agustus 2026)
- **Rute & Hook**: [page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/api-gateway/page.tsx), `useKongRoutes` / `useKongTraffic` dari `useKongObservability.ts`.
- **Root Cause Bug OFFLINE**: Kong belum me-route `/api/observability/*` (HTTP 404). Solusi: tambah service `frontend-admin-api-service` di `docker/kong/kong.yml`.
- **Kong Admin API**: Bind internal `http://kong:8001`. Rute Kong diarahkan ke Vite SPA tanpa prefix Next.js legacy.

### 📊 Pola Observability Time-Series Charts (Agustus 2026)
- **Data Source**: Prometheus `query_range` (24h, step `15m`) dari `http://ftth-prometheus:9090` via Go gateway (:5013) terhubung ke Kong.
- **Hook Pattern (Vite CSR)**: `use<Nama>Observability.ts` polling 30s (`charts`, `loading`, `error`, `refresh`). Fallback data 24h jika metrik kosong.
- **CSS Variables**: Gunakan `var(--chart-1)` s/d `var(--chart-5)`, dilarang hex hardcoded.

### 🗄️ Endpoint DB Observability (Agustus 2026)
- **Controller**: [DatabaseObservabilityController.java](file:///opt/project5/apps/api/src/main/java/com/company/ftthgis/api/system/DatabaseObservabilityController.java) (`GET /api/v1/system/db-observability`).
- **Metrik Diekspos**: DB size (`pg_database_size`), WAL size (`pg_ls_waldir`), cache hit rate (`pg_statio_user_tables`), koneksi aktif (`pg_stat_activity`), top 10 tabel & indeks.
- **Nextcloud Real Status**: Menggunakan kolom `database_backups.nextcloud_status` & `nextcloud_sync_time` dari migrasi Flyway V16.

### 🗺️ Spatial Map Gateway Dashboard Upgrade (Agustus 2026)
- **Rute & Hook**: [spatial-map/page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/spatial-map/page.tsx), `useMapGatewayStats` (polling 60s).
- **Target Host**: Terhubung ke `http://ftth-map-gateway:5003` dengan validasi `GATEWAY_TOKEN`.
- **DB Pool Spasial**: Agregasi pool spasial terhubung ke `/api/v1/system/db-observability`.

### ⏰ System Jobs & Cron Scheduler Dashboard Upgrade (Agustus 2026)
- **Rute & Hook**: [scheduler/page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/scheduler/page.tsx), `useSchedulerStatus` (polling 60s).
- **Integrasi Stats Riil**: Query paralel ke `/api/v1/system/devops-stats`. Status backup dan Nextcloud sinkron membaca disk fisik dan database.
- **Live Logs & File Manager**: Modal `LiveLogModal` streaming `/logs/{scriptKey}` dan download/delete binary backup via Spring Boot.

### 📡 OLT & Poller Dashboard Upgrade (Agustus 2026)
- **Rute & Hook**: [olt-poller/page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/olt-poller/page.tsx), `useOltPollerObservability` (polling 30s).
- **Integrasi go-poller**: Merge inventaris OLT DB dengan live Redis telemetry (`status`, `responseTimeMs`, `lastPolledAt`) dari `ftth-poller:5010`.
- **Prometheus Metrics**: `ftth_poller_devices_count`, `ftth_poller_redis_connected`, `ftth_poller_uptime_seconds` scrape port `:5010`.

### 💬 Messaging Gateway Dashboard Upgrade (Agustus 2026)
- **Rute & Hook**: [messaging/page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/messaging/page.tsx), `useMessagingStats` (polling 30s).
- **Telemetry Riil**: Status WABA dinamis berdasarkan `TWILIO_ACCOUNT_SID`. Kedalaman antrean membaca Redis `LLen(ctx, "gateway:notification:queue")`. KPI menghitung Total Failed 24h dari Redis log.

### 🔐 Identity & Auth Dashboard Upgrade (Agustus 2026)
- **Rute & Hook**: [identity/page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/identity/page.tsx), `useKeycloakObservability` (polling 30s).
- **Keycloak Metrics Riil**: Active sessions via `/admin/realms/ftth-realm/client-session-stats`. Failed logins via `/events?type=LOGIN_ERROR`. Latensi live diuji ke Keycloak dan DB.

### 🖥️ Compute & Host Dashboard Upgrade (Agustus 2026)
- **Rute & Hook**: [compute/page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/compute/page.tsx), `useComputeObservability` (polling 30s).
- **Metrik JVM & Host**: Ekspor `heapUsedMb`, `nonHeapUsedMb`, `heapMaxMb` via `MemoryMXBean`. Metrik host `node_load1/5/15` dan RSS memory per-service dari Prometheus.
- **MinIO Bucket Stats**: Endpoint `GET /api/v1/bucket-stats?bucket=...` di `storage-gateway:5004` (auth `X-Gateway-Token`) dipanggil paralel oleh backend.
