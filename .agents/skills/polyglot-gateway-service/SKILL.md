---
name: polyglot-gateway-service
description: >-
  Use this skill when creating, modifying, debugging, or auditing any Go microservice
  (services/gateway-*, services/poller, ports 5001-5014) or Python FastAPI service
  (services/gateway-ai, port 5012), Kong API Gateway routes (docker/kong/kong.yml),
  Prometheus scrape targets, or Observability dashboards.
---

# SOP: Pengembangan & Audit Microservice Go/Python (`services/*`) & Kong Routing

Gunakan skill ini setiap kali membuat microservice baru (seperti `gateway-auth` di port `5014`), memodifikasi gateway Go/Python yang ada di `/opt/project5/services/`, atau memperbarui rute di `docker/kong/kong.yml`.

## Referensi Lengkap
- [Riwayat Arsitektur & Pola Observability 10 Modul Gateway](./references/dev-history-observability.md)
- [Aturan Dasar Microservices](../../rules/microservices.md)
- [Aturan Infrastruktur Kong, Traefik & Docker](../../rules/infrastructure.md)

---

## Alur Eksekusi Standar Microservice Go (`services/*`)

### 1. Struktur Modul & Integrasi `services/go.work`
- Buat direktori service di `/opt/project5/services/<nama-gateway>` dengan `go.mod` lokal.
- Daftarkan modul baru ke dalam `/opt/project5/services/go.work`.
- **PENTING**: Jangan menulis `require gateways/shared` di dalam `go.mod` lokal; biarkan `services/go.work` yang me-resolve `gateways/shared` untuk menghindari error validasi path segment dot.

### 2. Isolasi Multi-Tenant & Internal Auth Middleware
- Gunakan `gateways/shared/middleware`:
  - Validasi `X-Gateway-Token` untuk request internal dari Kong / Backend.
  - Ekstrak `X-Tenant-ID` dari header untuk membatasi seluruh query PostgreSQL, Redis key prefix, dan MinIO S3 bucket ke tenant terkait.
- Gunakan `net.JoinHostPort(host, strconv.Itoa(port))` (dilarang `fmt.Sprintf("%s:%d", ...)` pada `net.Dial`).
- Gunakan hostname Docker (`http://postgres:5432`, `http://keycloak:8081`, `http://redis:6379`), **dilarang keras** hardcode IP `172.18.0.x`.

### 3. Non-Blocking Audit Logging (`auditclient`) & Telemetry (`/health`, `/metrics`)
- Setiap operasi mutasi/autentikasi wajib mengirim log audit secara asinkron menggunakan goroutine:
  ```go
  go auditClient.LogEvent(ctx, auditclient.Event{...})
  ```
- Ekspos endpoint `GET /health` dan `GET /metrics` (Prometheus).

### 4. Pendaftaran Rute di Kong (`docker/kong/kong.yml`) & Prometheus
- Daftarkan `service` dan `route` di bawah prefix `/api/v1/...` pada [`docker/kong/kong.yml`](file:///opt/project5/docker/kong/kong.yml).
- Daftarkan target scrape baru di [`docker/prometheus/prometheus.yml`](file:///opt/project5/docker/prometheus/prometheus.yml).

### 5. Verifikasi Wajib
```bash
bash scripts/verify-all.sh gateways
pnpm audit:versioning
docker compose config -q
```

