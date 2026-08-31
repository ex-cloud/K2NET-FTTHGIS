<p align="center">
  <img src="https://img.shields.io/badge/K2NET-FTTH%20GIS%20Enterprise-0ea5e9?style=for-the-badge&logo=map&logoColor=white" alt="K2NET FTTH GIS" height="42">
</p>

<h3 align="center">K2NET FTTH GIS — Enterprise B2B SaaS Platform</h3>

<p align="center">
  Platform manajemen infrastruktur fiber optik spasial cerdas, otomatisasi provisioning jaringan OLT, tata kelola multi-tenant ISP, dan AI Copilot terintegrasi.
  <br />
  Dibangun dengan arsitektur Monorepo modern, microservices gateway berkinerja tinggi, dan orkestrasi cloud-native mandiri (fully self-hosted).
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Vite%206-React%2019-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite SPA">
  <img src="https://img.shields.io/badge/Go-1.25%20(13%20Gateways)-00ADD8?style=flat-square&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/Python-3.11%20(AI%20RAG)-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python AI">
  <img src="https://img.shields.io/badge/PostgreSQL-16%20+%20PostGIS%204.0-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Keycloak-26%20(OIDC)-4D4D4D?style=flat-square&logo=keycloak&logoColor=white" alt="Keycloak">
  <img src="https://img.shields.io/badge/Kong%20Gateway-3.9-003366?style=flat-square&logo=kong&logoColor=white" alt="Kong">
  <img src="https://img.shields.io/badge/Traefik-v3-24A1C1?style=flat-square&logo=traefik&logoColor=white" alt="Traefik">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
</p>

---

## 🌟 Fitur Utama Platform

- 🗺️ **Interactive GIS & Vector Tiles** — Visualisasi aset jaringan fiber optik secara *real-time* (jalur kabel backbone/distribusi, tiang, penempatan ODC/ODP, status redaman dBm, dan pemetaan port pelanggan) bertenaga MapLibre GL JS dan Martin PostGIS MVT Server.
- 📐 **Web-QGIS Design & pgRouting** — Simulasi perencanaan jalur ekspansi kabel baru, kalkulasi otomatis kebutuhan material (*Bill of Quantity / BoQ*), deteksi area *Blank Spot* via Buffer Analysis, serta *auto-tracing* kabel mengikuti koridor jalan raya via pgRouting.
- 🏢 **Multi-Tenant ISP Lifecycle Engine** — Isolasi data logis tingkat tinggi antar organisasi/ISP pada level database (Row-Level Filter), storage (MinIO S3 Tenant Buckets), dan routing subdomain dinamis, dilengkapi proteksi anti-spoofing header di layer edge Kong.
- ⚡ **Automated Provisioning SNMP Poller** — Daemon Go Poller asinkron terhubung via Redis Queue untuk mengotomatisasi perintah jaringan perangkat keras OLT riil (*Zero-Touch SN Discovery*, isolir massal otomatis saat tagihan jatuh tempo, dan pembukaan isolir instan pasca-bayar).
- 🤖 **AI Fiber Copilot & RAG Knowledge Base** — Asisten teknis AI terintegrasi (Python FastEmbed + pgvector) untuk diagnosa redaman serat optik, rekomendasi rute penarikan kabel, pemetaan SOP jaringan, dan FAQ teknisi lapangan.
- 🔐 **Identity & Access Management (IAM)** — Autentikasi terpusat berskala industri menggunakan Keycloak 26 OpenID Connect (OIDC) dengan standard Authorization Code + PKCE (`S256`), RBAC Matrix 6 level, dan token enrichment.
- 📊 **360° Cloud-Native Full Observability Suite** — Dashboard observabilitas terpadu berbasis Go Gateway (`observability-gateway:5013`) mengagregasi data Prometheus, Redis Poller, dan Spring Boot secara real-time via Server-Sent Events (SSE).
- 🛡️ **3-Layer Disaster Recovery Backup** — Strategi backup otomatis tiga lapis (Local Disk Backup, On-Premise S3 MinIO Archive, dan Offsite Cloud Sync ke Nextcloud WebDAV via rclone).

---

## 🏗️ Arsitektur Sistem

```text
                                 ┌─────────────────────────────┐
                                 │     Cloudflare CDN / DNS    │
                                 │  (SSL/WAF/Cloudflare Tunnel)│
                                 └──────────────┬──────────────┘
                                                │ HTTPS :443
                                                ▼
                                 ┌─────────────────────────────┐
                                 │      Traefik Ingress v3     │
                                 │  (Origin CA SSL Termination)│
                                 └──┬───┬───┬───┬───┬──────────┘
                                    │   │   │   │   │
             ┌──────────────────────┘   │   │   │   └──────────────────────┐
             ▼                          ▼   │   ▼                          ▼
    ┌──────────────────┐       ┌─────────┐  │ ┌───────────┐       ┌─────────────────┐
    │  Studio Admin    │       │Keycloak │  │ │Martin MVT │       │ Studio Tenant   │
    │  (Vite 6 SPA)    │       │ (IAM)   │  │ │Tile Server│       │ (Vite 6 SPA)    │
    │  (Admin Portal)  │       │Port 8081│  │ │ Port 3000 │       │ (Tenant Portal) │
    └────────┬─────────┘       └─────────┘  │ └───────────┘       └────────┬────────┘
             │                              ▼                              │
             │                   ┌─────────────────────┐                   │
             │                   │  Kong API Gateway   │                   │
             │                   │(JWT Verify, Headers)│                   │
             │                   │     Port 8000       │                   │
             │                   └──┬───────────────┬──┘                   │
             │                      │               │                      │
             │         ┌────────────┘               └────────────┐         │
             ▼         ▼                                         ▼         ▼
    ┌──────────────────────────┐                    ┌──────────────────────────────────┐
    │  Spring Boot Core API    │                    │   13 Go Gateways + 1 Python AI   │
    │  (Java 21, REST, JPA)    │                    │ ┌──────────────────────────────┐ │
    │        Port 9090         │                    │ │ notification-gateway  (:5001)│ │
    └────────────┬─────────────┘                    │ │ payment-gateway       (:5002)│ │
                 │                                  │ │ map-gateway           (:5003)│ │
        ┌────────┴────────┐                         │ │ storage-gateway       (:5004)│ │
        ▼                 ▼                         │ │ whatsapp-gateway      (:5005)│ │
  ┌───────────┐    ┌─────────────┐                  │ │ scheduler-gateway     (:5006)│ │
  │PostgreSQL │    │   Redis 7   │◀─────────────────┼─│ export-gateway        (:5007)│ │
  │16+PostGIS │    │(Cache/Queue)│                  │ │ olt-gateway           (:5008)│ │
  │ Port 5432 │    │  Port 6379  │                  │ │ audit-gateway         (:5009)│ │
  └───────────┘    └─────────────┘                  │ │ ftth-poller           (:5010)│ │
        │                                           │ │ task-gateway          (:5011)│ │
        ▼                                           │ │ ai-gateway (Python)   (:5012)│ │
  ┌───────────┐                                     │ │ observability-gateway (:5013)│ │
  │ MinIO S3  │                                     │ └──────────────────────────────┘ │
  │ Port 9005 │                                     └──────────────────────────────────┘
  └───────────┘
```

---

## 🔌 Peta Port & Layanan Internal

| Service Name | Port Internal | Protokol / Engine | Deskripsi & Fungsi |
|:---|:---:|:---|:---|
| **Traefik Reverse Proxy** | `80` / `443` | Traefik v3 (Go) | Ingress edge controller & terminasi SSL Cloudflare |
| **Kong API Gateway** | `8000` / `8001` | Kong 3.9 (OpenResty) | Gatekeeper JWT token verify, rate limiter, & CORS |
| **Studio Admin Portal** | `3001` | Vite 6 + Nginx Alpine | Portal Utama Super Admin (<20MB RAM) |
| **Studio Tenant Portal** | `3002` | Vite 6 + Nginx Alpine | Portal Tenant ISP (<20MB RAM) |
| **Core Backend API** | `9090` | Spring Boot 3 / Java 21 | REST API Engine bisnis FTTH, Lifecycle, & RBAC |
| **Keycloak IAM** | `8081` | Keycloak 26 (Quarkus) | Identity Provider (OIDC SSO, Realms, User Federation) |
| **Martin Tile Server** | `3000` | Martin (Rust) | High-performance Map Vector Tile (MVT) streamer |
| **notification-gateway** | `5001` | Go 1.25 (Gin) | Dispatcher Twilio SMS, WhatsApp notification, & SMTP |
| **payment-gateway** | `5002` | Go 1.25 (Gin) | Integrator pembayaran Xendit (VA, QRIS, e-Wallet) |
| **map-gateway** | `5003` | Go 1.25 (Gin) | Proxy data spasial & geocoding (Google Maps / HERE) |
| **storage-gateway** | `5004` | Go 1.25 (Gin) | File broker MinIO S3 & bucket metrics telemetry |
| **gateway-whatsapp** | `5005` | Go 1.25 (Gin) | Engine direct WhatsApp messaging & auto-responder |
| **gateway-scheduler** | `5006` | Go 1.25 (Gin) | Cron scheduler distributed runner & job manager |
| **gateway-export** | `5007` | Go 1.25 (Gin) | Generator berkas ekspor GIS (KMZ, GeoJSON, Excel) |
| **gateway-olt** | `5008` | Go 1.25 (Gin) | Interface komunikasi hardware OLT ZTE/Huawei/VSOL |
| **gateway-audit** | `5009` | Go 1.25 (Gin) | Asynchronous centralized audit logging stream |
| **ftth-poller** | `5010` | Go 1.25 (Daemon) | Telemetry engine & SNMP background poller |
| **gateway-task** | `5011` | Go 1.25 (Gin) | Asynchronous task queue & background job worker |
| **gateway-ai** | `5012` | Python 3.11 (FastAPI) | AI Copilot RAG, FastEmbed embeddings, & pgvector |
| **observability-gateway**| `5013` | Go 1.25 (Gin) | Parallel collector (Prometheus/Poller/DevOps) & SSE stream |
| **PostgreSQL Spatial** | `5432` | Postgres 16 + PostGIS 4.0 | Database relasional spasial & pgRouting topology |
| **Redis Cache & Queue**| `6379` | Redis 7.x (Alpine) | In-memory cache, task queue, & telemetry buffer |
| **MinIO Object Storage**| `9005` / `9006`| MinIO S3 Server | Self-hosted S3 object storage untuk foto redaman & KTP |
| **Prometheus** | `9092` (`:9090`)| Prometheus v2.x | Time-series metrics scraper dari seluruh container |
| **Grafana Dashboard** | `3002` | Grafana Enterprise | Visualisasi visual metrics & panel telemetri host |
| **Loki + Promtail** | `3100` | Grafana Loki Suite | Agregasi dan pencarian log server terpusat |
| **Alertmanager** | `9093` | Alertmanager v0.27 | Notifikasi peringatan anomali & downtime sistem |

---

## 📂 Struktur Repositori (Monorepo Layout)

```text
K2NET-FTTHGIS/
├── apps/
│   ├── api/                     # Spring Boot 3 Core Backend (Java 21, Flyway, JPA)
│   ├── studio-admin/            # Portal Utama Super Admin (Vite 6 + React 19)
│   ├── studio-tenant/           # Portal Tenant ISP (Vite 6 + React 19)
│   ├── www/                     # Landing Page & Company Profile
│   └── docs/                    # Dokumentasi Teknis & Panduan Pengembang
│
├── services/                    # Microservices & Gateways Mesh
│   ├── notification-gateway/    # Multi-channel notification service (:5001)
│   ├── payment-gateway/         # Payment processor & webhook handler (:5002)
│   ├── map-gateway/             # Spatial tile proxy & geocoder (:5003)
│   ├── storage-gateway/         # MinIO S3 asset manager (:5004)
│   ├── gateway-whatsapp/        # Direct WhatsApp engine (:5005)
│   ├── gateway-scheduler/       # Distributed job scheduler (:5006)
│   ├── gateway-export/          # Spatial KMZ/GeoJSON/Excel export (:5007)
│   ├── gateway-olt/             # OLT hardware controller (:5008)
│   ├── gateway-audit/           # Asynchronous audit log stream (:5009)
│   ├── poller/                  # SNMP poller & telemetry daemon (:5010)
│   ├── gateway-task/            # Background task manager (:5011)
│   ├── gateway-ai/              # Python FastAPI AI RAG & pgvector (:5012)
│   ├── observability-gateway/   # Parallel metrics collector & SSE stream (:5013)
│   ├── shared/                  # Shared Go libraries (auditclient, internalauth)
│   └── go.work                  # Go Workspace multi-module configuration
│
├── packages/                    # Monorepo Shared Libraries
│   ├── ui/                      # Shared React UI components (@k2net/ui)
│   ├── design-system/           # Tokens, theme variables, HSL palette (@k2net/design-system)
│   ├── auth/                    # Keycloak OIDC helper + SPA Client SDK (@k2net/auth)
│   ├── api-client/              # Unified typed HTTP Client via Kong Gateway (@k2net/api-client)
│   ├── map/                     # MapLibre layer styles & optical budget calculator (@k2net/map)
│   └── types/                   # Shared TypeScript models & DTOs (@k2net/types)
│
├── docker/                      # Infrastructure Declarative Configs
│   ├── kong/                    # Kong declarative configuration (kong.yml)
│   ├── traefik/                 # Traefik dynamic routers, middleware, & SSL
│   ├── prometheus/              # Prometheus scrape targets & alerting rules
│   ├── alertmanager/            # Alertmanager routing & webhook integration
│   ├── grafana/                 # Grafana dashboards provisioning
│   └── loki/                    # Loki & Promtail log ingestion configs
│
├── scripts/                     # Automation & DevOps Utility Scripts
│   ├── deploy.sh                # Zero-overhead production deployment script
│   ├── verify-all.sh            # Quality gate validation script
│   ├── backup.sh                # Layer 1: PostgreSQL & Keycloak DB dumps
│   ├── backup-minio.sh          # Layer 2: MinIO S3 data archiving
│   ├── backup-code.sh           # Layer 2: Codebase snapshot archive
│   ├── backup-docker-volumes.sh # Layer 2: Docker volume archive
│   └── sync-nextcloud.sh        # Layer 3: Nextcloud WebDAV offsite synchronization
│
├── .github/workflows/           # CI/CD Workflows (GitHub Actions)
│   ├── deploy-production.yml    # Lint -> External Build -> SSH Pull & Restart
│   ├── studio-tenant-ci.yml     # Vite Studio Tenant SPA CI/CD
│   ├── studio-admin-ci.yml      # Studio Admin SPA CI/CD
│   ├── api-ci.yml               # Spring Boot Core CI/CD
│   └── gateways-ci.yml          # Go Microservices CI/CD
├── docker-compose.yml           # Production Orchestration (20+ Containers)
└── AGENTS.md                    # Persistent AI Knowledge Base & Coding Guidelines
```

---

## 🛠️ Panduan Pengembangan Lokal (Getting Started)

### Prasyarat Perangkat Lunak:
- **Docker & Docker Compose**: Docker Engine ≥ 24.0 & Compose v2.x
- **Node.js & pnpm**: Node.js ≥ 20.x & pnpm ≥ 9.x
- **Java Development Kit**: OpenJDK 21 (Temurin / Corretto) & Apache Maven 3.9+
- **Go**: Go ≥ 1.25 (dengan dukungan `go.work`)
- **Python**: Python ≥ 3.11 (untuk AI Gateway)

### 1. Kloning Repositori & Konfigurasi Lingkungan:
```bash
git clone https://github.com/ex-cloud/K2NET-FTTHGIS.git
cd K2NET-FTTHGIS
cp .env.example .env
```

### 2. Validasi & Quality Gate Lokal Sebelum Deploy:
```bash
# Validasi Frontend Suite (Audit warna hardcode + typecheck)
pnpm verify:admin

# Validasi Go Gateway Mesh
cd services && go vet ./...

# Validasi Backend Java Core
cd apps/api && mvn clean test
```

---

## 🔒 Multi-Tenant Security & Edge Isolation

1. **Kong Edge Level**: Kong memvalidasi Keycloak JWT (RS256 signature). Plugin `post-function` global secara otomatis menghapus header klien (`clear_header("X-Tenant-Id")`) dan menginjeksi header `X-Tenant-Id` asli dari klaim token Keycloak.
2. **Spring Boot Level**: `TenantFilter` menginjeksi scope `TenantContext` (ThreadLocal). Hibernate `@Filter` dan JPA entity listener secara otomatis memfilter seluruh query PostGIS pada level baris (`WHERE project_id = :tenantId`).
3. **Go Gateway Level**: Setiap microservice Go memvalidasi `X-Tenant-ID` untuk membatasi akses MinIO S3 bucket, antrean WhatsApp, OLT hardware command, serta pgvector AI embedding khusus untuk tenant bersangkutan.
4. **Observability Scoping**: `services/observability-gateway` memvalidasi kepemilikan OLT tenant melalui Spring Boot sebelum memfilter telemetri PromQL dan daemon SNMP Poller, sehingga metrik server host internal tidak bocor ke tenant.

---

## 📄 Lisensi & Hak Cipta
Hak Cipta © 2026 **K2NET Enterprise / PT. Dua Multi Solusindo**. Seluruh hak dilindungi undang-undang.
