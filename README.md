<p align="center">
  <img src="https://img.shields.io/badge/K2NET-FTTH%20GIS-0ea5e9?style=for-the-badge&logo=map&logoColor=white" alt="K2NET FTTH GIS" height="40">
</p>

<h3 align="center">Fiber To The Home — Geographic Information System</h3>

<p align="center">
  Platform manajemen jaringan fiber optik berbasis peta interaktif.
  <br />
  Dibangun dengan arsitektur monorepo modern & self-hosted sepenuhnya.
</p>

<p align="center">
  <a href="https://system-gis.kdua.net"><strong>Live App »</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Go-1.25-00ADD8?style=flat-square&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/PostgreSQL-16%20+%20PostGIS-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Keycloak-26-4D4D4D?style=flat-square&logo=keycloak&logoColor=white" alt="Keycloak">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
</p>

---

## Features

- [x] **Interactive GIS Dashboard** — Visualisasi aset jaringan fiber optik secara *real-time* (jalur kabel backbone/distribusi, tiang, penempatan ODC/ODP, status redaman, dan pemetaan port pelanggan) berbasis MapLibre GL JS.
- [x] **Web-QGIS Design & Simulation Mode** — Fitur cerdas pemisahan area *Operasional (O&M)* dan *Perencanaan (Planning)*. Admin tenant dapat mensimulasikan coretan jalur ekspansi, menghitung otomatis kebutuhan kabel (*Bill of Quantity - BoQ*), mendeteksi *Blank Spot* pemukiman via **Buffer Analysis**, serta menggambar jalur kabel otomatis mengikuti jalan raya raya via **pgRouting**.
- [x] **Multi-Tenant Monorepo Architecture** — Isolasi data tingkat tinggi antar organisasi/ISP secara logis pada level database, storage, dan routing terpusat menggunakan sub-domain dinamis (`<tenant>-gis.kdua.net`) dikelola dalam satu repositori terpadu. Meskipun menggunakan satu repositori terpadu, setiap tenant memiliki ruang kerja (namespace) yang terisolasi baik dari segi data, konfigurasi, maupun akses.
- [x] **Identity Management & SSO** — Autentikasi terpusat berskala industri menggunakan Keycloak OpenID Connect (OIDC) yang mendukung proteksi multi-realm serta integrasi Social Auth.
- [x] **Enterprise REST API Core** — Backend kokoh penopang logika bisnis utama (siklus hidup pelanggan, *automated billing engine* penagihan otomatis massal, inventaris perangkat, dan kontrol akses berbasis peran/RBAC).
- [x] **Automated Provisioning SNMP Poller** — Layanan latar belakang (*daemon*) Go Poller asinkron terhubung via Redis Queue untuk mengotomatisasi perintah jaringan riil (*Zero-Touch Configuration*, pencarian otomatis SN modem baru, isolir otomatis saat jatuh tempo, dan buka isolir).
- [x] **Microservices Integration Gateways** — Arsitektur pintu gerbang mikroservis berbasis Go yang efisien untuk menangani fungsionalitas spesifik (*payment callback handler*, *WhatsApp notification dispatch*, *MVT tile server proxy*, dan *MinIO storage broker*).
- [x] **Unified API Gateway Layer** — Kong API Gateway bertindak sebagai "Satpam Digital" di pintu depan internal server guna melakukan *Auth Token Verification Offloading*, pembersihan header ilegal, CORS global, dan pembatasan laju trafik (*Rate Limiting*).
- [x] **Edge Routing & Reverse Proxy** — Traefik v3 sebagai Ingress controller terluar yang memonitor API Docker secara dinavis untuk otomatisasi pembuatan sertifikat SSL HTTPS wildcard bagi tenant baru.
- [x] **Cloud-Native Full Observability Suite** — Pengawasan infrastruktur 360 derajat yang menggabungkan metrik performa (*Prometheus*), pelacakan latensi request (*Zipkin Tracing via OpenTelemetry*), visualisasi metrik (*Grafana*), serta agregasi log terpusat rendah resource (*Grafana Loki + Promtail*).

## Architecture

```text
                          ┌─────────────────────────────┐
                          │        Cloudflare CDN        │
                          │     (SSL/WAF/Bot Protection) │
                          └──────────────┬──────────────┘
                                         │ HTTPS :443
                                         ▼
                          ┌─────────────────────────────┐
                          │      Traefik Ingress v3      │
                          │   (Origin CA SSL Termination)│
                          └──┬───┬───┬───┬───┬───┬──────┘
                             │   │   │   │   │   │
            ┌────────────────┘   │   │   │   │   └────────────────┐
            ▼                    ▼   │   ▼   │                    ▼
    ┌──────────────┐   ┌─────────┐   │  ┌────┴────┐    ┌──────────────┐
    │   Frontend   │   │Keycloak │   │  │  Martin  │    │  Go Poller   │
    │  (Next.js)   │   │ (Auth)  │   │  │ (Tiles)  │    │   (SNMP)     │
    └──────────────┘   └─────────┘   │  └─────────┘    └──────────────┘
                                     ▼
                          ┌─────────────────────────────┐
                          │     Kong API Gateway         │
                          │  (JWT Verify + Rate Limit)   │
                          └──┬──────────────────────┬───┘
                             │                      │
                ┌────────────┘                      └───────────┐
                ▼                                               ▼
    ┌───────────────────┐                         ┌──────────────────────┐
    │   Spring Boot     │                         │    Go Gateways       │
    │   Backend API     │                         │ ┌──────────────────┐ │
    │  (REST + OAuth2)  │                         │ │ Payment Gateway  │ │
    └────────┬──────────┘                         │ │ Map Gateway      │ │
             │                                    │ │ Notif Gateway    │ │
    ┌────────┴──────────┐                         │ │ Storage Gateway  │ │
    │  PostgreSQL 16    │                         │ └──────────────────┘ │
    │  + PostGIS 4.0    │                         └──────────────────────┘
    └───────────────────┘
```

---

## Tech Stack

Setiap komponen dalam FTTH GIS menggunakan teknologi open-source yang battle-tested:

| Komponen | Teknologi | Kategori | Deskripsi |
|:---------|:----------|:---------|:----------|
| **Frontend UI** | [Next.js 16](https://nextjs.org/) | App Core | Server-side rendering (SSR), middleware subdomain routing, Server Actions & UI konsisten terintegrasi via Shared Packages. |
| **Backend API** | [Spring Boot 3](https://spring.io/projects/spring-boot) | Core Logic | REST API Engine berjalan di Java 21, diamankan OAuth2 Resource Server, abstraksi JPA/Hibernate, & OpenTelemetry integration. |
| **Database** | [PostgreSQL 16 + PostGIS](https://postgis.net/) | Spatial DB | Penyimpanan relasional & spasial geometris dengan ekstensi `pgRouting` untuk kalkulasi topologi jaringan jalan raya. |
| **Identity/Auth** | [Keycloak 26](https://www.keycloak.org/) | Identity / IAM | Penyedia identitas utama (Identity Provider), enkripsi token JWT, manajemen multi-realm, & RBAC token mapping. |
| **API Gateway** | [Kong 3.9](https://konghq.com/) | Traffic Security | Berjalan pada DB-less mode, menangani JWT validation offloading, global CORS, & IP Rate Limiting. |
| **Reverse Proxy** | [Traefik v3](https://traefik.io/) | Ingress Controller | Deteksi kontainer otomatis via Docker Labels, SSL Termination via Cloudflare Origin CA Certificate. |
| **Tile Server** | [Martin](https://maplibre.org/martin/) | Geo Streaming | PostGIS Map Vector Tiles (MVT) server berkecepatan tinggi untuk streaming ribuan aset peta di browser tanpa lag. |
| **Microservices** | [Go (Golang) + Gin](https://gin-gonic.com/) | Edge Gateways | 4 Microservices Go (Payment, Notification, Map, Storage) berjalan ringan di level host network. |
| **Network Poller** | Go (Custom Daemon) | Automation | Mesin otomatisasi perangkat keras OLT/Mikrotik terintegrasi dengan `GoSNMP` & `Crypto/SSH` via Redis Message Broker. |
| **Object Storage** | [MinIO](https://min.io/) | Asset Storage | S3-compatible self-hosted object storage untuk berkas KTP pelanggan & unggahan foto redaman teknisi lapangan. |
| **Logging Suite** | [Grafana Loki + Promtail](https://grafana.com/oss/loki/) | Logging | Agregasi log terpusat berbasis kompresi metadata (*label-index*) untuk pelacakan log container & systemd. |
| **Metrics Suite** | [Prometheus + Grafana](https://prometheus.io/) | Metrics | Pengumpul metrik (*Scraping mechanism*) performa host/container dipadukan dengan Visual Grafana Dashboard. |
| **Distributed Tracing**| [Zipkin](https://zipkin.io/) | Request Tracing | Pelacakan visual linimasa latensi API (*Trace ID correlation*) dari pintu gerbang hingga ke lapisan database. |

---

## Repository Structure

```text
K2NET-FTTHGIS/
│
├── apps/
│   ├── api/                     # Spring Boot Backend (Java 17)
│   ├── studio/                  # Next.js Frontend (GIS Dashboard)
│   ├── www/                     # [Planned] Landing Page
│   └── docs/                    # [Planned] Public Documentation
│
├── services/
│   ├── payment-gateway/         # Payment integration service (Go)
│   ├── notification-gateway/    # Push alerts & SMS/WA notifications (Go)
│   ├── map-gateway/             # Spatial data proxy service (Go)
│   ├── storage-gateway/         # MinIO file management service (Go)
│   ├── poller/                  # SNMP network device poller (Go)
│   └── shared/                  # Shared Go libraries & middleware
│
├── packages/
│   ├── ui/                      # Shared React UI components
│   └── design-system/           # Design tokens (colors, typography)
│
├── database/
│   └── migrations/              # PostgreSQL/PostGIS schema migrations
│
├── docker/
│   ├── kong/                    # Kong API Gateway declarative config
│   ├── traefik/                 # Traefik dynamic config & SSL certs
│   ├── prometheus/              # Prometheus scrape config & alert rules
│   ├── alertmanager/            # Alertmanager routing config
│   └── grafana/                 # Grafana dashboards & provisioning
│
├── .github/workflows/           # CI/CD pipelines (GitHub Actions)
├── docker-compose.yml           # Production orchestration (16 containers)
└── docker-compose.staging.yml   # Staging orchestration
```

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|:-----|:--------|:--------|
| Docker Engine | ≥ 20.10 | Container runtime |
| Docker Compose | ≥ v2.0 | Multi-container orchestration |
| Node.js | ≥ 20 | Frontend development |
| JDK | ≥ 17 | Backend development |
| Go | ≥ 1.25 | Microservices development |

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/ex-cloud/K2NET-FTTHGIS.git
cd K2NET-FTTHGIS
```

2. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your database passwords, Keycloak secrets, OAuth credentials, etc.
```

3. **Configure Alertmanager** *(optional)*

```bash
cp docker/alertmanager/alertmanager.yml.example docker/alertmanager/alertmanager.yml
# Edit alertmanager.yml with your Discord webhook URL
```

4. **Start all services**

```bash
docker compose up -d
```

5. **Verify deployment**

```bash
docker ps                                    # All 16 containers should be healthy
curl http://localhost:9090/actuator/health    # Backend API health check
```

---

## CI/CD Pipelines

| Workflow | Trigger | Description |
|:---------|:--------|:------------|
| `api-ci.yml` | Push to `apps/api/` | Build & test Spring Boot backend |
| `studio-ci.yml` | Push to `apps/studio/` | Build & deploy Next.js frontend |
| `gateways-ci.yml` | Push to `services/*/` (excl. poller) | Build Go gateway binaries |
| `poller-ci.yml` | Push to `services/poller/` | Build & deploy SNMP poller |

> Infrastructure changes (`docker-compose.yml`, `docker/`) are applied directly on the server — no CI workflow needed.

---

## Security

- 🔐 **Secrets Management** — All credentials stored in `.env` (gitignored). Docker Compose references them via `${VARIABLE}` interpolation.
- 🔑 **JWT Verification** — Kong validates Keycloak-signed JWT tokens at the gateway level before reaching the backend (defense-in-depth).
- 🛡️ **Header Cleansing** — Anonymous requests have `X-User-*` headers stripped by Kong to prevent spoofing.
- 🌐 **SSL/TLS** — Cloudflare Full (Strict) mode with Origin CA certificates.
- 🚦 **Rate Limiting** — Kong enforces 30 req/sec and 1000 req/min per client.
- 📡 **Alerting** — Prometheus Alertmanager sends real-time Discord notifications for service downtime & anomalies.

> [!CAUTION]
> **Never commit `.env`, `alertmanager.yml`, or any file containing real credentials.** Always verify with `git status` before pushing.

---

## License

Licensed under the terms of the [LICENSE](./LICENSE) file in this repository.

---

<p align="center">
  <sub>Built with ❤️ by <strong>K2NET</strong> — PT. Kirana karina</sub>
</p>
