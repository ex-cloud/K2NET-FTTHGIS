# FTTH GIS — K2NET Enterprise SaaS Platform Context

This file serves as the persistent memory and knowledge base for AI agents working on the K2NET FTTH GIS project.

## 🏗️ Architecture Overview

- **Frontend**: Next.js 16 (located in [apps/studio](file:///opt/project5/apps/studio))
- **Backend**: Spring Boot 3.x (located in [apps/api](file:///opt/project5/apps/api))
- **Local Go Microservices**: 4 Go-based gateways for notification, payment, map, storage (located in [services](file:///opt/project5/services))
- **Identity & Access Management**: Keycloak 26 (Self-hosted inside Docker)
- **Database**: PostgreSQL 17 (DBs: `ftth_gis` and `keycloak_db`)
- **Object Storage**: MinIO S3 (Console port: `9006`, API port: `9005`)
- **Reverse Proxy / SSL**: Traefik (Edge proxy) and Kong (API Gateway)
- **Cache**: Redis

---

## 🔌 Internal Service Port Map

| Service Name | Port | Description |
|---|---|---|
| **Kong API Gateway** | `8000` / `8443` | External edge router and request decorator |
| **notification-gateway** | `5001` | Handles Twilio SMS, WhatsApp, and SMTP emails |
| **payment-gateway** | `5002` | Integrates Xendit payment links and payment webhooks |
| **map-gateway** | `5003` | Interfaces with Google Maps / HERE Maps APIs for geocoding |
| **storage-gateway** | `5004` | Interfaces with MinIO S3 for tenant asset upload/storage |
| **ftth-backend** | `9090` | Core Spring Boot application containing business logic |
| **ftth-frontend** | `3000` | Next.js application served via Traefik |

---

## 🔒 Multi-Tenant Isolation

1. **Edge level (Kong)**: Kong validates the Keycloak JWT. If present, it decodes the token claims and sets the `X-Tenant-ID` header.
2. **Go Gateway level**: Each Go microservice (notification, payment, map, storage) reads the `X-Tenant-ID` header forwarded by Kong to scope all operations to the correct tenant. They also validate the internal `X-Gateway-Token`.

---

## 💾 Backup Strategy (3-Layer Disaster Recovery)

All backups are managed by shell scripts located in [scripts](file:///opt/project5/scripts):
1. **Local storage**: `/opt/project5/backups/`
2. **On-premise S3**: MinIO buckets (`db-backups`, `code-backups`, `docker-backups`)
3. **Offsite cloud**: Nextcloud WebDAV (`https://cloud.kdua.net/remote.php/dav/files/andiansyah/FTTH-GIS-Backups/`)

### Crontab Schedule
- `00:00` — [backup.sh](file:///opt/project5/scripts/backup.sh) (Postgres & Keycloak DB dumps)
- `01:00` — [backup-minio.sh](file:///opt/project5/scripts/backup-minio.sh) (Archive of MinIO data)
- `02:00` — [backup-code.sh](file:///opt/project5/scripts/backup-code.sh) (Archive of codebase, excluding target/node_modules)
- `03:00` (Sunday) — [backup-docker-volumes.sh](file:///opt/project5/scripts/backup-docker-volumes.sh) (Backup of Grafana, Prometheus, Keycloak Docker volumes)
- `04:00` — [sync-nextcloud.sh](file:///opt/project5/scripts/sync-nextcloud.sh) (Synchronizes local backup folder to Nextcloud via rclone)

---

## 🧠 Solved Issues & Key Knowledge

- **MinIO Connection**: MinIO API is bound to Tailscale IP `100.110.205.109:9005`. Do not use `127.0.0.1:9005` or `localhost:9005` inside server scripts or config files.
- **Spring Security PreAuthorize**: Use `@PreAuthorize("isAuthenticated()")` rather than `hasRole('authenticated')` to properly enforce Keycloak authentication status without relying on custom role mappings.
- **Go Compilation**: The `gateways/shared` module is resolved via the `go.work` workspace file. Do not require `gateways/shared` in local `go.mod` files to avoid path segment dot validation errors.
