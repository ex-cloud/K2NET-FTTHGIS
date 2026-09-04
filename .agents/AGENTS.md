# FTTH GIS — K2NET Enterprise SaaS Platform Customization Context

Dokumen ini adalah repositori memori persisten dan aturan pengkodean untuk AI Agent yang bekerja pada proyek K2NET FTTH GIS. Aturan ini dimuat secara otomatis oleh sistem IDE untuk menjaga konsistensi pengerjaan.

---

## 🏗️ Gambaran Arsitektur Utama
- **Frontend Next.js**: [apps/studio](file:///opt/project5/apps/studio)
- **Backend Spring Boot**: [apps/api](file:///opt/project5/apps/api)
- **Go Microservices & Gateways**: [services/](file:///opt/project5/services/)
- **API Gateway**: Kong (Port 8000 / DB-less declarative)
- **Edge Reverse Proxy & SSL**: Traefik (Port 80/443)
- **Identity IAM**: Keycloak 26 (Port 8081)

## 🔒 Otentikasi, Granular PBAC & Batasan Super Admin (God Mode)
- **Role Kanonikal Tunggal**: Super Admin ditandai secara kanonikal oleh role `"super_admin"`. Ingress layer (`SecurityConfig.java` di backend & `@k2net/auth` di frontend) otomatis menormalkan seluruh format token Keycloak menjadi lowercase tanpa prefix `role_`.
- **Standar Anotasi Backend (Modern PBAC)**: Seluruh controller wajib menggunakan Granular PBAC (`@PreAuthorize("hasAuthority('system.<modul>.<aksi>')")` untuk scope SYSTEM dan `@PreAuthorize("@tenantSecurity.hasEffectivePermission('<modul>.<aksi>')")` untuk scope TENANT). Dilarang keras menggunakan role semu `hasRole('authenticated')` atau duplikasi string `hasRole('ROLE_SUPER_ADMIN')`.
- **Scope SYSTEM (Metadata Platform)**: Super Admin memiliki kewenangan penuh untuk mengelola konfigurasi platform, direktori organisasi, status langganan, dan template peran.
- **Scope TENANT (Data Operasional Tenant ISP)**: Sesuai Master Blueprint (02 Sep 2026), Super Admin **DILARANG** membypass langsung data operasional tenant (`network_elements`, `customers`, `invoices`, dll.). Akses ke data tenant **WAJIB** melalui **Impersonation Engine** resmi (Step-Up MFA, time-box 30 menit, dan dual-identity audit trail).
- **Auto-Eviction Cache L2**: Penambahan/perubahan role & permission wajib didukung migrasi Flyway SQL, dan cache Hibernate L2 (`Role` & `Permission`) di-refresh secara otomatis pada startup oleh `PermissionSeeder.java`.

## 🧪 Aturan Baku Verifikasi Kode Sebelum Deploy (Pre-Deployment Checklist)

Sebelum mengirimkan perubahan (*commit/push/deploy*) ke server, seluruh kode **WAJIB** melewati pengujian sintaks, linter, unit test, dan kompilasi per modul sebagai berikut:

### 1. Frontend Next.js (`apps/studio-admin` & `apps/studio-tenant`)
```bash
pnpm verify:admin                      # [REKOMENDASI CEPAT] Cek 0 pelanggaran warna + UI build + TypeScript typecheck (<20s, aman untuk RAM server)
pnpm audit:colors                      # Khusus audit 0 pelanggaran warna hardcode (zinc, white, emerald)
pnpm --filter @k2net/studio-admin typecheck # Pemeriksaan tipe data TypeScript tanpa memicu Webpack bundling
```
*Catatan: Dilarang menjalankan `next build` langsung di server pengembangan jika resource CPU/RAM sedang tinggi karena proses bundling 67 rute halaman Next.js dijalankan secara otomatis oleh GitHub Actions Runner di cloud.*

### 2. Backend Spring Boot (`apps/api`)
```bash
mvn clean test                         # Menjalankan seluruh pengujian unit backend Java
mvn clean package -DskipTests=false    # Memastikan aplikasi Java terkompilasi & terkemas (.jar)
```

### 3. Go Microservices & Gateways (`services/*`)
```bash
go vet ./...                           # Static analysis memeriksa bug potensial Go
go test ./...                          # Menjalankan unit test pada seluruh gateway Go
go build ./...                         # Memastikan kompilasi workspace Go (go.work) sukses
```

### 4. API Gateway Kong (`docker/kong/kong.yml`)
```bash
kong config parse docker/kong/kong.yml # Memeriksa keabsahan deklaratif kong.yml
```

### 5. Reverse Proxy Traefik (`docker/traefik/dynamic/`)
```bash
# Validasi konfigurasi YAML dynamic router Traefik v3 sebelum direstart
```

### 8. Docker Engine & Network Inspection
```bash
docker compose config                  # Memeriksa keabsahan file compose
docker network inspect project5_default | grep -E '"Name"|"IPv4Address"' # Verifikasi IP dinamis kontainer
```

---

## 🚫 ATURAN MUTLAK DEPLOYMENT — TERLARANG BUILD DI SERVER

> 🛑 **ATURAN MUTLAK LEVEL 1 (CRITICAL)**: Dilarang keras memicu perintah `docker compose build --no-cache` or `docker build` secara langsung di server/VM produksi. Proses pengompilasian Docker image membutuhkan CPU/RAM tinggi dan memicu server crash/overload.

### Alur Deployment Produksi Wajib (Ketika IP Publik / SSH Aktif):
1. Jalankan **Pre-Deployment Checklist** di atas secara lokal / di sandbox environment.
2. Push commit ke branch `main`.
3. GitHub Actions (`.github/workflows/deploy-production.yml`) secara otomatis menjalankan alur:
   - **Job 1 (Validate)**: Linting, type-checking, unit tests, dan audit regresi warna.
   - **Job 2 (Docker Build)**: Mengompilasi image Docker di runner GitHub (compute eksternal) dan melakukan push ke `ghcr.io`.
   - **Job 3 (Deploy)**: Melakukan SSH ke server produksi untuk menarik image terbaru (`docker pull`) dan me-restart container (`docker compose up -d --no-build`).

### 🛟 Alur Cadangan Deployment Manual (Ketika IP Publik / SSH Mati):
Jika proses login SSH dari GitHub Actions gagal (timeout/fail) karena IP publik server terganggu (misalnya setelah perpindahan ke Cloudflare Tunnel atau gangguan link ISP), tetapi proses build Docker image di GitHub Runner telah sukses, Anda **wajib** melakukan deployment manual secara aman langsung dari dalam server (0% overhead build):
1. Pastikan server sudah login ke registry:
   ```bash
   docker login ghcr.io -u ex-cloud
   # Masukkan GitHub Personal Access Token (PAT) dengan scope read:packages
   ```
2. Jalankan perintah git pull dan deploy script:
   ```bash
   git fetch origin && git checkout main && git pull origin main
   bash scripts/deploy.sh production frontend-admin
   ```
*Catatan: Selalu patuhi Larangan Docker Build di Server demi kestabilan RAM dan CPU host.*

---

---

## 🌐 Aturan Komunikasi Jaringan & IP Docker (Docker IP Rules)

1. **Dilarang Hardcode IP Internal (`172.18.0.x`)**: Seluruh inter-service communication wajib menggunakan **Container/Service Hostname** (`http://backend:9090`, `http://ftth-postgres:5432`, `http://keycloak:8081`, `http://ftth-poller:5010`). IP internal Docker bersifat dinamis dan dapat berubah setiap kali kontainer di-recreate.
2. **Penggunaan CIDR Subnet Range**: Pada IP Whitelist (seperti `kong.yml`), wajib menggunakan range Subnet CIDR (`172.18.0.0/16`) alih-alih IP tunggal (`172.18.0.1`).
3. **Pengecualian IP Tailscale**: Tailscale IP `100.110.205.109` digunakan khusus untuk MinIO S3 API (port 9005) dan Grafana (port 3002) untuk akses backup on-premise offsite.

---

## 📋 Aturan Pengkodean per Bagian (Coding Rules)

Untuk menjaga kualitas dan standardisasi sistem, ikuti petunjuk teknis pada tautan berikut sebelum mulai melakukan modifikasi:

1. **Aturan Frontend (Next.js & UI)**: [rules/frontend.md](file:///opt/project5/.agents/rules/frontend.md)
   *Membahas: Page Guards wajib, skema validasi Zod, sonner notification, dark mode styling.*
   
2. **Aturan Backend (Spring Boot & DB)**: [rules/backend.md](file:///opt/project5/.agents/rules/backend.md)
   *Membahas: Spring Security PreAuthorize, Hibernate PostGIS audit, snake_case.*

3. **Aturan Microservices (Go & Gateways)**: [rules/microservices.md](file:///opt/project5/.agents/rules/microservices.md)
   *Membahas: Port map internal, X-Tenant-ID header, go.work workspace compilation.*

4. **Aturan Infrastruktur (Kong & Traefik Proxy)**: [rules/infrastructure.md](file:///opt/project5/.agents/rules/infrastructure.md)
   *Membahas: Routing Kong/Traefik, SSL termination, Keycloak local bypass, MinIO Tailscale connection.*

5. **Aturan Gaya UI & Konsistensi Tema**: [rules/styles.md](file:///opt/project5/.agents/rules/styles.md)
   *Membahas: Sistem warna global (Tailwind v4), style card, button, typografi, serta perbedaan aksen portal utama vs portal tenant.*

6. **Aturan Knowledge Base AI**: [rules/ai-knowledge.md](file:///opt/project5/.agents/rules/ai-knowledge.md)
   *Membahas: Taksonomi 6 kategori pengetahuan, chunking 500 token pgvector, Multi-Tenant isolation scope, serta alur penambahan berkas SOP.*

7. **Standar Audit & Quality Gate per Service (PENTING)**: [rules/service-audit-standards.md](file:///opt/project5/.agents/rules/service-audit-standards.md)
   *Membahas: Matriks prasyarat wajib 5 pilar (Frontend, Spring Boot, 12 Go Gateways, Python AI, Docker Infra) serta perintah verifikasi cepat `pnpm verify`.*

8. **Standar Baku Pembuatan Modul Baru (SOP Wajib)**: [rules/module-creation-standard.md](file:///opt/project5/.agents/rules/module-creation-standard.md)
   *Membahas: Alur 5-langkah registrasi modul baru, Flyway SQL permissions, @PreAuthorize hasAuthority, dynamic sidebar filtering, UI PermissionGuards, dan daftar anti-patterns.*

---

## 🧠 Pembelajaran Masalah Terselesaikan (Knowledge Base)

### Infrastruktur & Jaringan
- **MinIO Connection**: Akses menggunakan Tailscale IP `100.110.205.109:9005`. Jangan gunakan `localhost:9005`.
- **Prometheus Port go-poller**: Port scrape yang benar untuk poller metrics adalah `ftth-poller:5010` (bukan 9091).
- **Traefik Proxy poller**: Routing `/poller` di Traefik dynamic service mengarah ke internal container `http://ftth-poller:5010` (bukan host.docker.internal).

### UI Compliance — Hardcoded Color Refactoring (Juli 2026)
- **Root Cause Bug Light Mode**: Penggunaan `text-zinc-*`, `bg-zinc-*`, `text-white`, dan `bg-emerald-*` di komponen menyebabkan teks tidak terbaca dan card tetap gelap di Light Mode. Solusi: migrasi 100% ke token semantik (`text-foreground`, `bg-card`, `text-primary`, `border-border`, dsb.).
- **Cheat Sheet Migrasi**: Lihat [rules/styles.md](file:///opt/project5/.agents/rules/styles.md) Seksi 3 untuk tabel pemetaan lengkap semua class hardcoded ke token semantik.
- **Perintah Audit**: `grep -rn "text-zinc-\|bg-zinc-\|border-zinc-\|text-white\|bg-emerald-\|text-emerald-" apps/studio-admin/src --include="*.tsx" --include="*.ts" | wc -l` — Target: **0** sebelum commit.
- **globals.css Safety Net**: File `apps/studio-admin/src/app/globals.css` mengandung selektor `.light` yang memetakan kelas `zinc-*` ke nilai Light Mode sebagai fallback terakhir. Ini **bukan** pengganti migrasi komponen.
- **Scope Refactoring**: Sesi Juli 2026 berhasil memigrasi **918 pelanggaran** di 55+ file di `apps/studio-admin`. `apps/studio` (baseline tenant) tidak diubah.

### UI Compliance — Skeleton Loading Architecture (Juli 2026)
- **Pattern**: Seluruh komponen skeleton dibuat sebagai shared di `packages/ui/src/components/skeletons.tsx` — bukan hardcoded per-halaman. Setiap `loading.tsx` di route hanya menjadi thin wrapper 3 baris mengimpor dari `@k2net/ui`.
- **Komponen tersedia**: `PageHeaderSkeleton`, `DashboardPageSkeleton`, `TablePageSkeleton`, `FormPageSkeleton`, `CardGridSkeleton` — semua diekspor dari `@k2net/ui`.
- **Verifikasi coverage**: `find apps/studio-admin/src/app -name "loading.tsx" | wc -l` → harus ≥ 25.
- **Reuse**: `studio-tenant` dapat mengimpor skeleton yang sama dari `@k2net/ui` di fase berikutnya tanpa duplikasi.

### UI Compliance — TracingBeam (Juli 2026)
- **Penggunaan**: Bungkus halaman berkonten panjang (settings, compliance, password-policy) dengan `<TracingBeam className="px-4">` dari `@k2net/ui`.
- **Padding dalam**: Tambahkan `pl-4 md:pl-10` pada container dalam `<TracingBeam>` agar garis SVG beam tidak menimpa sisi kiri konten card/form.

### Integrasi Audit Logging Terpadu (Agustus 2026)
- **Arsitektur Pipeline**: Log audit dari semua tier (Go microservices, Spring Boot, Keycloak, Kong, Traefik) dialirkan secara asinkronus ke `gateway-audit:5009`.
- **Go Shared Client**: Library `gateways/shared/auditclient` dirancang *fire-and-forget* (goroutine) dan aman dari crash jika URL log tidak di-set (no-op fallback).
- **Spring Boot AOP**: Pemisahan logic audit menggunakan annotation `@AuditRequired` (SpEL support) dan aspect `AuditAspect`. Error di aspect tidak boleh membatalkan transaksi utama database.
- **Kong Ingress & Noise Control**: Endpoint `/api/v1/audit/events/kong` di `gateway-audit` menyaring dan membuang HTTP method read-only (`GET`, `HEAD`, `OPTIONS`) secara real-time untuk menghindari ledakan data (DB bloat).
- **Pencegah Duplikasi Event**: Komunikasi Keycloak event controller disaring melalui LRU Cache in-memory (kapasitas 1000 item) sebelum diteruskan ke database.

### 🔍 Pola Audit Halaman Observability (Agustus 2026)
- **Sub-menu yang sudah diaudit**: `overview` ([31-juli-2026-observability-overview.md](file:///opt/project5/docs/Server/rekomendasi/plan/31-juli-2026-observability-overview.md)), `query-performance` ([04-agustus-2026-query-performance-upgrades.md](file:///opt/project5/docs/Server/rekomendasi/plan/04-agustus-2026-query-performance-upgrades.md))
- **Sub-menu yang belum diaudit**: `api-gateway`, `compute`, `database`, `identity`, `messaging`, `olt-poller`, `scheduler`, `spatial-map`
- **Format nama dokumen**: `DD-bulan-YYYY-nama-submenu.md` — simpan di `/opt/project5/docs/Server/rekomendasi/plan/`
- **Alur audit baku**: (1) Baca 2 dokumen plan sebelumnya sebagai referensi gaya, (2) Analisa halaman + hook + backend endpoint, (3) Buat dokumen rekomendasi lengkap, (4) Buat implementation plan + task.md

### 🎨 High-Contrast Light Mode Token Standard (Agustus 2026)
- **`--muted-foreground` di `.light`** ([theme.css](file:///opt/project5/packages/design-system/src/theme.css)): Gunakan `hsl(0 0% 30%)` — lebih gelap dari default `hsl(0 0% 38%)` agar teks deskriptif terbaca di latar putih
- **Label eyebrow/kategori card**: Gunakan `text-foreground/75 dark:text-muted-foreground` (bukan `text-muted-foreground` murni yang terlalu pucat di light mode)
- **Header sub-kategori panel**: Gunakan `text-foreground/75 dark:text-muted-foreground/70`
- **Telemetry headers**: Wajib gunakan token semantik — dilarang hardcode warna zinc/emerald
- Verified ✅ di: `overview-metric-card.tsx`, `overview-devops-card.tsx`, `map-detail-panel.tsx`, `gateways/overview/page.tsx`

### ✅ Observability API Gateway — Selesai (06 Agustus 2026)
- **Halaman**: [page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/api-gateway/page.tsx)
- **Hook**: `useKongRoutes`, `useKongTraffic` dari `apps/studio-admin/src/hooks/useKongObservability.ts`
- **Root Cause OFFLINE Bug**: Kong tidak memiliki route `/api/observability/*` — request dari browser melewati Kong dan mendapat 404. Fix: tambah service `frontend-admin-api-service` di `docker/kong/kong.yml`.
- **Kong Admin API**: tersedia di `http://kong:8001` (internal Docker)
- **Kong Next.js API Routes**: Wajib ditambahkan ke `kong.yml` agar browser bisa reach `/api/observability/*`, `/api/auth/*`, `/_next/*`.

### 📊 Pola Observability Time-Series Charts (Agustus 2026)
- **Sumber data**: Semua chart observabilitas wajib menggunakan Prometheus `query_range` (24 jam, step `15m`) dari `http://ftth-prometheus:9090` via Next.js API route (bukan langsung dari client browser).
- **API Route Pattern**: Buat file di `apps/studio-admin/src/app/api/observability/<nama>/route.ts` — gunakan `Promise.all` untuk parallel fetch semua metric sekaligus.
- **Hook Pattern**: Buat `use<Nama>Observability.ts` di `src/hooks/` — polling 30 detik, return `charts`, `loading`, `error`, `lastUpdated`, `refresh`.
- **Fallback**: Jika Prometheus kosong, generate fallback data 24 jam agar UI tidak blank.
- **CSS Variables untuk chart**: Gunakan `var(--chart-1)` hingga `var(--chart-5)` — jangan hardcode warna hex.

### 🗄️ Endpoint DB Observability (Agustus 2026)
- **Controller**: [DatabaseObservabilityController.java](file:///opt/project5/apps/api/src/main/java/com/company/ftthgis/api/system/DatabaseObservabilityController.java)
- **Endpoint**: `GET /api/v1/system/db-observability`
- **Data yang diekspos**: DB sizes (`pg_database_size`), WAL size (`pg_ls_waldir`), PG buffer cache hit rate (`pg_statio_user_tables`), connection breakdown by state (`pg_stat_activity`), top 10 large objects (tables + indexes), disk info.
- **Nextcloud status**: Sudah real dari `database_backups.nextcloud_status` kolom (via migration V16). Tidak lagi hardcoded `"SUCCESS"`.
- **Migration V16**: [V16__add_sync_columns_to_database_backups.sql](file:///opt/project5/apps/api/src/main/resources/db/migration/V16__add_sync_columns_to_database_backups.sql) — menambah kolom `minio_status`, `minio_sync_time`, `nextcloud_status`, `nextcloud_sync_time` ke tabel `database_backups`.

### 🔍 Sub-menu Observability — Status Audit (Agustus 2026)
- **✅ Selesai diaudit**: `overview`, `query-performance`, `api-gateway`, `database`, `compute`, `identity`, `messaging`, `olt-poller`, `scheduler`, `spatial-map`

### 🗺️ Spatial Map Gateway Dashboard Upgrade (Agustus 2026)
- **Halaman**: [page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/spatial-map/page.tsx)
- **Hook**: `useMapGatewayStats` dari `apps/studio-admin/src/hooks/useMapGatewayStats.ts` — polling 60s
- **Sub-komponen**: `SpatialKpiCards`, `SpatialThroughputChart`, `SpatialDetailsPanel` di [components/](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/spatial-map/components/)
- **API Route**: `apps/studio-admin/src/app/api/observability/map-stats/route.ts` — mengagregasikan status rill
- **Penyelarasan Host & Token**: Mengoreksi endpoint target ke `http://ftth-map-gateway:5003` dan `GATEWAY_TOKEN`.
- **Integrasi DB Pool Spasial Rill**: Menghubungkan metrik DB Pool dengan endpoint `/api/v1/system/db-observability` di backend Java Core.
- **High-Contrast Colors**: Label KPI cards menggunakan token `text-foreground/75 dark:text-muted-foreground` agar mudah terbaca pada Light Mode.

### ⏰ System Jobs & Cron Scheduler Dashboard Upgrade (Agustus 2026)
- **Halaman**: [page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/scheduler/page.tsx)
- **Hook**: `useSchedulerStatus` dari `apps/studio-admin/src/hooks/useSchedulerStatus.ts` — polling 60s
- **Sub-komponen**: `SchedulerKpiCards`, `SchedulerJobsTable`, `SchedulerArtifactsTable` di [components/](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/scheduler/components/)
- **Penyelarasan DevOps Stats API**: Hook melakukan query paralel ke `/api/v1/system/devops-stats` untuk memuat data `lastBackup` secara rill.
- **Bug Nextcloud Status Mock (Diperbaiki)**: Kartu *Offsite Sync (Nextcloud)* tidak lagi hardcoded `"SYNCED"`, melainkan membaca kolom `nextcloudStatus` & `nextcloudSyncTime` rill dari database (`database_backups`).
- **Bug Last Backup Status Mock (Diperbaiki)**: Kartu *Last Backup Status* membaca status rill dan timestamp `lastBackupTime` dari disk yang diverifikasi langsung oleh backend.
- **Fitur Live Logs Stream (Baru)**: Ditambahkan modal `LiveLogModal` di UI dan REST endpoint `/logs/{scriptKey}` di Spring Boot. Membaca file log rill di server latar belakang secara dinamis dengan visual console.
- **Fitur Local File Manager (Baru)**: Ditambahkan tombol download (binary stream `/download`) dan hapus fisik (`/delete` dengan validasi anti directory traversal) untuk berkas hasil backup lokal.
- **High-Contrast Colors**: Label Kpi Cards menggunakan token `text-foreground/75 dark:text-muted-foreground` agar mudah terbaca pada Light Mode.

### 📡 OLT & Poller Dashboard Upgrade (Agustus 2026)
- **Halaman**: [olt-poller/page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/olt-poller/page.tsx)
- **Hook**: `useOltPollerObservability` dari `apps/studio-admin/src/hooks/useOltPollerObservability.ts` — polling 30s
- **API Route**: `apps/studio-admin/src/app/api/observability/olt-poller/route.ts` — parallel fetch 3 sumber
- **Bug Hardcoded Subtitle (Diperbaiki)**: `Last polling cycle: 3 min ago` diganti dengan `lastPolledAt` riil dari `ftth-poller:5010`.
- **Bug SSH Card Statis (Diperbaiki)**: Kartu `SSH Session Failures: 0` dihapus, diganti **Poller Engine Health** (status Running/Offline, poll interval, Redis status).
- **Integrasi go-poller**: API Route menggabungkan (merge) inventaris OLT dari Spring Boot DB dengan live telemetry Redis (`status UP/DOWN/SLOW`, `responseTimeMs`, `lastPolledAt`) berdasarkan `deviceCode`.
- **Prometheus Metrics**: `ftth_poller_devices_count`, `ftth_poller_redis_connected`, `ftth_poller_uptime_seconds` tersedia di `ftth-poller:5010/metrics` (diakses Prometheus di `ftth-poller:5010`).

### 💬 Messaging Gateway Dashboard Upgrade (Agustus 2026)
- **Halaman**: [messaging/page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/messaging/page.tsx)
- **Hook**: `useMessagingStats` dari `apps/studio-admin/src/hooks/useMessagingStats.ts` — polling 30s
- **Go Handler**: [http.go](file:///opt/project5/services/notification-gateway/internal/delivery/http.go) — `GetStats` method
- **Bug Hardcoded Credits (Diperbaiki)**: Menghapus `sms_credits_remaining: 8420` dan `sms_credits_max: 10000` dari Go response `GetStats`.
- **Bug WABA Status Hardcoded (Diperbaiki)**: Mengganti `"waba_status": "CONNECTED"` murni dengan pengecekan `TWILIO_ACCOUNT_SID` ("CONFIGURED" vs "NOT_CONFIGURED").
- **Queue Depth Real**: Menggunakan `h.rdb.LLen(ctx, "gateway:notification:queue")` daripada `0` hardcoded.
- **KPI Card ke-3 (Diperbarui)**: Diganti dari SMS Backup Quota (statis) menjadi **Total Failed (24h)** yang dihitung dari log Redis.
- **Section Channel Health (Baru)**: Mengganti WABA API Status statis dengan **Notification Channels Status** dinamis (WhatsApp, SMS Backup, SMTP Email) yang mencerminkan konfigurasi provider riil.

### 🔐 Identity & Auth Dashboard Upgrade (Agustus 2026)
- **Halaman**: [identity/page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/identity/page.tsx)
- **Hook**: `useKeycloakObservability` dari `apps/studio-admin/src/hooks/useKeycloakObservability.ts` — polling 30s
- **Controller**: [KeycloakObservabilityController.java](file:///opt/project5/apps/api/src/main/java/com/company/ftthgis/api/system/KeycloakObservabilityController.java)
- **Bug Active Sessions Mocked (Diperbaiki)**: Root cause: `Math.round(totalUsers * 0.4)`. Fix: panggil `/admin/realms/ftth-realm/client-session-stats` dan sum field `active` per client.
- **Bug Failed Logins Hardcoded (Diperbaiki)**: Root cause: `stats.put("failedLogins24h", 3)`. Fix: query `/events?type=LOGIN_ERROR` dan hitung `eventsList.size()`.
- **IAM Connections Hardcoded (Diperbaiki)**: Root cause: data statis di frontend. Fix: Backend mengukur latency riil Spring Boot→Keycloak, Kong→Keycloak, dan Keycloak→PostgreSQL (`pg_stat_activity` query via `JdbcTemplate`).
- **Simulated Events Dihapus**: Metode `getSimulatedEvents()` dan `getSimulatedStats()` dihapus. Jika Keycloak tidak bisa dijangkau, endpoint mengembalikan list kosong `[]` dan status `degraded`.
- **Frontend**: Menampilkan skeleton loading, status DISCONNECTED merah, badge Degraded jika Keycloak unreachable.

### 🖥️ Compute & Host Dashboard Upgrade (Agustus 2026)
- **Halaman**: [compute/page.tsx](file:///opt/project5/apps/studio-admin/src/app/(dashboard)/observability/compute/page.tsx)
- **Hook**: `useComputeObservability` dari `apps/studio-admin/src/hooks/useComputeObservability.ts` — polling 30s
- **API Route**: `/api/observability/compute-metrics/route.ts` — parallel Prometheus + Spring Boot devops-stats
- **Bug JVM "— MB" (Diperbaiki)**: Root cause: mapping `d?.compute?.heapUsedMb` padahal backend mengirim `usedMemoryMb`. Fix: tambahkan `heapUsedMb`, `nonHeapUsedMb`, `heapMaxMb` ke `ComputeInfo` record di `DevOpsStatsController.java` via `MemoryMXBean`.
- **Bug Migration "— UNKNOWN" (Diperbaiki)**: Root cause: mapping `d?.migration?.status` padahal backend mengirim `d?.lastMigration?.success` (boolean). Fix: UI kini baca `migration.success` dan `migration.version`.
- **MinIO Bucket Stats Real (Diperbaiki)**: Root cause: hardcoded array statis (14.2 GB dll). Fix: tambah endpoint `GET /api/v1/bucket-stats?bucket=...` di `storage-gateway` Go, dipanggil dari `DevOpsStatsController.loadBackupInfo()`, dikirim via `BackupInfo.dbBackups/codeBackups/dockerBackups`.
- **KPI Card ke-4 (Diperbarui)**: Diganti dari "Database & Cache" (duplikat dengan `/database`) menjadi **System Load Average** (`node_load1/5/15` dari Prometheus).
- **Per-service Memory (Baru)**: Setiap service card menampilkan RSS Memory dari Prometheus `process_resident_memory_bytes`.
- **Charts (Baru)**: Ditambahkan chart CPU utilization + RAM usage rolling 30 menit (AreaChart) di samping HTTP request rate.
- **Nextcloud Trigger Palsu (Dihapus)**: Tombol "Trigger Sync Now" yang hanya `toast.success()` dihapus; diganti informasi jadwal + status real `nextcloudStatus` dari database.

### 🗂️ Storage Gateway — BucketStats Endpoint (Agustus 2026)
- **Endpoint**: `GET /api/v1/bucket-stats?bucket=<nama>` di `storage-gateway:5004`
- **Auth**: Dilindungi `X-Gateway-Token` (middleware.InternalAuthMiddleware)
- **Mode Local Store** (sandbox/no AWS creds): baca filesystem `/opt/project5/backups/{bucket}`
- **Mode MinIO S3** (production): `s3Client.ListObjectsPagesWithContext` untuk count & total bytes
- **Consumer**: `DevOpsStatsController.fetchBucketStats(bucketName)` di Spring Boot — fetches 3 bucket (db-backups, code-backups, docker-backups) secara parallel saat `loadBackupInfo()` dipanggil.

### 🛡️ Next.js Admin Portal Proxy Middleware
- **Lokasi file**: [proxy.ts](file:///opt/project5/apps/studio-admin/src/proxy.ts) (bertindak sebagai `middleware.ts` untuk Next.js admin portal).
- **Aturan bypass**: API paths `/api/*` dan berkas statis secara eksplisit di-bypass di middleware agar request rewrite langsung diteruskan ke Spring Boot Core Backend.
- **Validasi Unduhan Berkas**: Endpoint binary download `/api/v1/system/backup-status/download` harus diakses melalui *client-side secure AJAX fetch blob* (dengan menyertakan header `Authorization: Bearer <token>`) agar terotentikasi secara native di filter Spring Security core dan aman dari Cloudflare WAF parameter injection block.

### 📋 Standardisasi Modul Task Management & Linear App Architecture (Agustus 2026)
- **Mental Model**: Hierarki 2-tingkat ala Linear App:
  1. **Projects (Inisiatif/Plan Besar)**: Payung proyek (misal: "Rancang Bangun FTTH Garut", "Website CMS") dengan halaman Hub khusus (`Overview`, `Activity`, `Issues`).
  2. **Issues/Tasks (Unit Kerja Terkecil)**: `type: PROJECT` (pekerjaan internal) vs `type: TICKET` (tiket mitra B2B), `parent_task_id` (sub-issues), dan `labels`.
- **Floating Pill Modal (`NewTaskDialog.tsx`)**: Form pembuatan tugas dilarang kaku bertingkat; wajib menggunakan floating window dengan **Pill Button Bar** di bawah (`Status Pill`, `Priority Pill`, `Assignee Pill`, `Project Pill`, `Labels Pill`, `Attachment 📎`, toggle `Create more`).
- **Canvas Editor Penuh (`/tasks/[id]` & `TaskDetailSheet.tsx`)**: Header breadcrumb, title inline-editable + Emoji picker (`😀`), description markdown auto-save (1.5s debounce), sub-issues box, comments timeline dengan shortcut `Ctrl+Enter`, dan properties panel kanan (`w-72`).
- **Pola Bounded Scroll Table (Query-Performance Pattern)**: Root page dilarang dibungkus `<PageLayout>` jika ingin layout fixed viewport. Return root `div.h-full.overflow-hidden` langsung, card `border rounded-xl bg-card/10 overflow-hidden`, dan scroll hanya pada `div.flex-1.overflow-auto` dengan infinite scroll `IntersectionObserver` (page size `20`).
- **Secondary Sidebar (`TaskSecondarySidebar.tsx`)**: Mengelompokkan navigasi ke dalam **`PERSONAL`** (Inbox, My Issues, Created by Me), **`WORKSPACE`** (Projects & Views), dan **`SCOPE/TEAMS`** (`Platform Internal` vs `B2B Inbox`).

### 🎯 Standardisasi Tooltip Global Ala Linear App (Agustus 2026)
- **Komponen Shared**: `<ActionTooltip label="..." shortcut="...">` dan `<TooltipContent shortcut="...">` diekspor dari `@k2net/ui`.
- **Zero Arrow**: Segitiga/panah putih bawaan Radix UI dimatikan secara default (`showArrow=false`).
- **Dark Pill Styling**: Format visual gelap minimalis (`bg-popover text-popover-foreground border border-border shadow-xl rounded-lg px-2.5 py-1 text-[11px] font-medium tracking-tight`).
- **Shortcut Dinamis**: Properti `shortcut` otomatis menampilkan badge hotkey keyboard monospaced jika disediakan (misal: `"S"` sync, `"R"` refresh, `"C"` create, `"⌘K"` search, `"Del"` delete), dan otomatis menjadi teks bersih jika tidak ada shortcut.

### 🖱️ Standardisasi Universal Context Menu (Right-Click Drawer) (Agustus 2026)
- **Komponen Shared**: `<UniversalContextMenu groups={...}>` diekspor dari `@k2net/ui`.
- **Wajib di Semua Tabel Enterprise**: Setiap baris tabel data (Daftar SOP, Tasks & Tickets, Users, OLT) wajib mendukung interaksi klik kanan.
- **Struktur Anatomi Baku**:
  1. Aksi Utama & AI Copilot (`Ctrl+J` / `Alt+I`).
  2. Sub-menu bertingkat (Status, Prioritas, Kategori) jika diperlukan.
  3. Aksi Salin Data Cepat (`Ctrl+C` untuk judul, `Alt+C` untuk UUID).
  4. Aksi Destruktif Hapus (`variant="destructive"`, shortcut `Del` / `Ctrl+Del`).

### 💡 Standardisasi GlowingEffect pada KPI Summary Cards (Agustus 2026)
- **Komponen Shared**: `<Card glowingEffect>` diekspor dari `@k2net/ui`.
- **Wajib di Semua Top Metrics**: Seluruh baris KPI Cards / Metric Summary Strip di bagian atas halaman (`/tasks`, `/observability/*`, `/gateways/*`, `/organizations`, `/users`, `/ai`) **wajib** menggunakan `<Card glowingEffect className="p-5 flex flex-col gap-3">`.
- **Interaksi Hidup**: Menghasilkan efek border gradient mouse-tracking otomatis yang elegan dan seragam, menggantikan efek border statis.
- **Pencegahan Bug Overlap**: Dilarang menggunakan `overflow-hidden` di card terluar jika card memiliki konten berlatar gelap yang menempel pada tepi garis border.

### 🧠 AI Knowledge Base — Two-Way Disk Persistence & Smart Server Sync Detection (Agustus 2026)
- **Two-Way Disk Persistence**:
  - Setiap kali dokumen manual dibuat (`POST /api/v1/ai/documents/text`) atau diedit (`PUT /api/v1/ai/documents/{doc_id}`) dari UI, backend Python AI Gateway otomatis menuliskan dan memperbarui berkas fisik `.md` ke subfolder `/opt/project5/docs/{folder}/{slug}.md`.
  - Pemetaan Folder: `TROUBLESHOOTING` -> `02_SOP_Troubleshooting`, `NETWORK_CONFIG` -> `01_Architecture`, `INFRASTRUCTURE` -> `03_Infrastructure`, `GIS_MANUAL` -> `04_GIS_Mapping`, `PLANS` -> `05_Plans_Roadmap`, `GENERAL` -> `note`.
  - Kolom `file_name` di `ai_documents` menyimpan relative path berkas fisik server (`02_SOP_Troubleshooting/nama-sop.md`) untuk integrasi mulus dengan Obsidian dan Git version control.
- **Smart Server Sync Detection (`GET /api/v1/ai/documents/sync-status`)**:
  - Endpoint backend memindai file `.md` di `/opt/project5/docs` secara rekursif, membandingkannya dengan database `ai_documents`, dan mengembalikan status sinkronisasi beserta daftar file yang belum terindeks (`unindexed_files`).
- **Notification Banner & Modal di Studio Admin**:
  - Jika terdapat file unindexed (`unindexed_count > 0`), UI secara dinamis menampilkan banner amber dengan tombol *"Lihat Berkas"* (modal detail berkas, kategori, ukuran) dan *"Sinkronkan Sekarang"* (1-click trigger indexing background).

### ✍️ Standardisasi TipTap Editor & AI SOP Synthesis (Agustus 2026)
- **Shared Component**: Komponen editor TipTap wajib ditaruh di `@k2net/ui` (`packages/ui/src/components/rich-editor.tsx`) — bukan diinstall langsung di `apps/studio-admin` guna mencegah duplikasi dependensi dan bundle bloat.
- **Styling**: Headless TipTap menggunakan custom toolbar dengan semantic tokens (`bg-card`, `text-foreground`, `border-border`).
- **AI SOP Generator Modal**: `AiGenerateSopModal` memanggil endpoint streaming `POST /api/v1/ai/generate-sop/stream` di `gateway-ai:5012`.
- **Max Token & Preamble Stripping**: Parameter `max_output_tokens: 8192` dengan filter pembersih preamble (menghapus intro conversational seperti "Tentu, ini SOP-nya:") agar output markdown terstruktur 7-seksi langsung terisi ke dalam TipTap.

### 🤖 Standardisasi Floating AI Assistant (Agustus 2026)
- **Komponen**: `FloatingAiAssistant.tsx` di `apps/studio-admin/src/components/ai/`.
- **Shortcut & Trigger**: Tombol trigger di navbar atas dan shortcut keyboard universal `Ctrl+J` / `Cmd+J`.
- **Resizable Drawer**: Drawer dapat digeser secara fleksibel dengan drag handle di sisi kiri (min 440px, default 540px, wide mode 860px, max 1200px) dan lebarnya tersimpan di `localStorage`.
- **Header Toolbar**: Wajib memiliki tombol aksi: *New Chat*, *Wide Mode Toggle*, *Export to Markdown* (`.md`), *Clear History*, dan *Close*.
- **Step-by-Step Reasoning Accordion**: Menampilkan jejak proses berpikir AI secara visual (`load_knowledge`, `search_docs`, `Thinking`) yang dapat di-expand/collapse.
- **Rich Markdown Renderer**: Menggunakan `AiMarkdownRenderer.tsx` dengan syntax highlighting, header blok kode (ikon SQL, PostGIS, Bash, JSON), tombol *Copy*, dan format tabel data responsif.

### 📁 Two-Way Disk Persistence & Permission Volume Docker (Agustus 2026)
- **Volume Mount RW**: Mount `/opt/project5/docs` pada service `gateway-ai` di `docker-compose.gateways.yml` **wajib berstatus Read-Write** (`/opt/project5/docs:/opt/project5/docs` tanpa `:ro`) agar service Python AI dapat menulis dan memperbarui berkas fisik `.md`.
- **Approve Document Endpoint**: Saat dokumen disetujui melalui ikon centang atau modal (`POST /api/v1/ai/documents/{doc_id}/approve`), backend wajib memanggil `_save_markdown_to_disk()` untuk memastikan berkas fisik `.md` tersimpan di direktori kategori yang tepat (`02_SOP_Troubleshooting`, `04_GIS_Mapping`, dsb.).

### 📜 Pola Infinite Scroll & De-duplication Table (Agustus 2026)
- **Hook Standar**: Pengambilan data tabel dengan infinite scroll wajib menggunakan pola hook (seperti `useAiKnowledge.ts` dan `useDbPerformance.ts`) dengan proteksi `offsetRef`, `isFetchingRef`, dan de-duplikasi ID menggunakan `Set(prev.map(d => d.id))`.
- **Sentinel IntersectionObserver**: Gunakan elemen `<div ref={sentinelRef} />` di bawah baris tabel dengan `rootMargin: "200px"`.
- **Visual Feedback**: Wajib menampilkan skeleton loader atau spinner halus di bagian bawah tabel saat `loadingMore === true` agar pengguna mengetahui proses fetching sedang berjalan.

### 🛡️ Standardisasi Otorisasi Granular PBAC, Ingress Keycloak & Cache L2 (September 2026)
- **Granular PBAC di Backend**: Seluruh controller wajib dilindungi anotasi `@PreAuthorize` eksplisit berbasis permission (`hasAuthority('system.<modul>.<aksi>')` untuk system scope dan `@PreAuthorize("@tenantSecurity.hasEffectivePermission('<modul>.<aksi>')")` untuk tenant scope). Dilarang menggunakan role semu `hasRole('authenticated')` atau varian ganda `hasRole('ROLE_SUPER_ADMIN')`.
- **Ingress Role Normalization**: `SecurityConfig.java` (backend) dan `extractUser` di `@k2net/auth` (frontend) otomatis menormalkan seluruh format token Keycloak menjadi lowercase tanpa prefix `role_`.
- **Flyway Permissions & L2 Cache Eviction**: Setiap permission baru wajib didaftarkan lewat migrasi Flyway SQL, dan cache L2 Hibernate (`Role` & `Permission`) di-evict secara otomatis saat startup aplikasi oleh `PermissionSeeder.java`.
- **Frontend Granular Guards**: Navigasi sidebar (`system-sidebar-navigation.ts`) terfilter dinamis per item berdasarkan permission user, dan tombol aksi mutasi sensitif wajib dilindungi `<PermissionGuard permission="...">`.
- **Hibernate 6 Epoch Query Fix**: Di Hibernate 6 HQL, fungsi `EXTRACT(EPOCH FROM ...)` ditolak validator saat startup Spring Boot jika ditulis dalam query JPQL. Wajib menggunakan `nativeQuery = true` pada query kalkulasi durasi SQL PostgreSQL di repository.
- **Dual-Identity Audit Trail**: Setiap aksi selama sesi impersonasi wajib mencatat `actor_id` (identitas Super Admin asli) + `impersonated_tenant_id` + `impersonation_session_id`.
- **Theme & Session Persistence**: Portal tenant (`apps/studio-tenant`) wajib mempertahankan tema UI (`k2net-theme`) di `localStorage` saat logout / tenant switching, dan guard pertukaran kode impersonasi (`exchangeCode`) menggunakan double-lock (`activeExchangingCode` + `exchangeAttemptedRef`) untuk mencegah double toast error.



