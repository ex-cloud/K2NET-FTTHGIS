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
  <a href="https://gis.k2net.id"><strong>Live App »</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=flat-square&logo=springboot&logoColor=white" alt="Spring Boot">
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/Go-1.25-00ADD8?style=flat-square&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/PostgreSQL-16%20+%20PostGIS-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Keycloak-26-4D4D4D?style=flat-square&logo=keycloak&logoColor=white" alt="Keycloak">
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
</p>

---

## Features

- [x] **GIS Dashboard** — Peta interaktif berbasis MapLibre GL JS untuk visualisasi jaringan fiber optik (ODC, ODP, kabel, pelanggan)
- [x] **Multi-Tenant Architecture** — Isolasi data per organisasi dengan subdomain routing (`<org>.gis.k2net.id`)
- [x] **Authentication & SSO** — Keycloak OpenID Connect dengan dukungan Google & GitHub OAuth
- [x] **REST API** — Spring Boot API dengan JWT token verification & role-based access control
- [x] **Real-time Monitoring** — SNMP Poller untuk monitoring perangkat jaringan secara real-time
- [x] **Microservices Gateway** — Go-based gateways untuk payment, notification, map, dan storage
- [x] **Object Storage** — Self-hosted MinIO (S3-compatible) untuk upload file & aset
- [x] **Observability Stack** — Prometheus + Grafana + Alertmanager + Zipkin (metrics, alerts, tracing)
- [x] **API Gateway** — Kong (DB-less) dengan JWT verification offloading & rate limiting
- [x] **Reverse Proxy** — Traefik v3 dengan Cloudflare Origin CA SSL
- [ ] Landing Page & Public Docs *(Fase 3)*

---

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

| Komponen | Teknologi | Deskripsi |
|:---------|:----------|:----------|
| **Frontend** | [Next.js 15](https://nextjs.org/) | React-based dashboard dengan SSR, subdomain routing, & server actions |
| **Backend API** | [Spring Boot 3](https://spring.io/projects/spring-boot) | REST API dengan OAuth2 Resource Server, JPA/Hibernate, & Zipkin tracing |
| **Database** | [PostgreSQL 16 + PostGIS](https://postgis.net/) | Spatial database dengan pgRouting untuk analisis jaringan fiber |
| **Auth** | [Keycloak 26](https://www.keycloak.org/) | OpenID Connect identity provider, multi-realm, SSO |
| **API Gateway** | [Kong 3.9](https://konghq.com/) | DB-less mode, JWT verification offloading, CORS, rate limiting |
| **Reverse Proxy** | [Traefik v3](https://traefik.io/) | Auto-discovery via Docker labels, Cloudflare Origin CA |
| **Tile Server** | [Martin](https://maplibre.org/martin/) | PostGIS vector tile server untuk rendering peta |
| **Microservices** | [Go + Gin](https://gin-gonic.com/) | Payment, Notification, Map, & Storage gateways |
| **SNMP Poller** | Go (Custom) | Real-time monitoring perangkat jaringan (OLT, Switch) |
| **Object Storage** | [MinIO](https://min.io/) | S3-compatible self-hosted storage |
| **Monitoring** | [Prometheus](https://prometheus.io/) + [Grafana](https://grafana.com/) | Metrics collection & visualization dashboards |
| **Alerting** | [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/) | Alert routing ke Discord webhook |
| **Tracing** | [Zipkin](https://zipkin.io/) | Distributed tracing untuk debugging request latency |

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
