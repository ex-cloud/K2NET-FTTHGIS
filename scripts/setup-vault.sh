#!/bin/bash
set -e

# Load Nextcloud Credentials
ENV_FILE="/opt/project5/.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' $ENV_FILE | grep -E "NEXTCLOUD_URL|NEXTCLOUD_USER|NEXTCLOUD_APP_PASSWORD" | xargs)
else
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

if [ -z "$NEXTCLOUD_URL" ] || [ -z "$NEXTCLOUD_USER" ] || [ -z "$NEXTCLOUD_APP_PASSWORD" ]; then
  echo "Error: Nextcloud environment credentials not loaded from .env"
  exit 1
fi

echo "=== Nextcloud Vault Setup v1.3 (Scope-Aware) initiated ==="

BASE_URL="$NEXTCLOUD_URL"
if [[ "$BASE_URL" != */ ]]; then
  BASE_URL="${BASE_URL}/"
fi

VAULT_DIR="K2NET_Engineering_Vault"

# Helper: Create directory via WebDAV MKCOL (ignore error if exists)
mkdir_nextcloud() {
  local dir_path=$1
  echo "  📁 Creating directory: $dir_path"
  curl -s -u "$NEXTCLOUD_USER:$NEXTCLOUD_APP_PASSWORD" -X MKCOL "${BASE_URL}${dir_path}/" -o /dev/null || true
}

# Helper: Upload file via WebDAV PUT
upload_nextcloud() {
  local target_path=$1
  local local_file=$2
  echo "  📄 Uploading file: $target_path"
  curl -s -u "$NEXTCLOUD_USER:$NEXTCLOUD_APP_PASSWORD" \
    -X PUT -H "Content-Type: text/markdown" -T "$local_file" "${BASE_URL}${target_path}" -o /dev/null
}

# ─── 1. Folder Structure (Scope-Aware & AI-First) ───────────────────────────
echo ""
echo "Step 1: Creating scope-aware and AI-First folder structure..."

mkdir_nextcloud "$VAULT_DIR"
mkdir_nextcloud "${VAULT_DIR}/00_AI_Agent"
mkdir_nextcloud "${VAULT_DIR}/00_AI_Agent/skills"
mkdir_nextcloud "${VAULT_DIR}/00_AI_Agent/skills/devops-monitoring"
mkdir_nextcloud "${VAULT_DIR}/00_AI_Agent/skills/ftth-gis-engine"
mkdir_nextcloud "${VAULT_DIR}/00_AI_Agent/skills/backup-disaster-dr"
mkdir_nextcloud "${VAULT_DIR}/00_AI_Agent/skills/task-management"
mkdir_nextcloud "${VAULT_DIR}/00_AI_Agent/prompts"

mkdir_nextcloud "${VAULT_DIR}/01_Projects"
mkdir_nextcloud "${VAULT_DIR}/01_Projects/Platform"         # scope=PLATFORM_INTERNAL
mkdir_nextcloud "${VAULT_DIR}/01_Projects/Tenants"          # scope=TENANT_INTERNAL (per-tenant subfolders)
mkdir_nextcloud "${VAULT_DIR}/02_Tickets"
mkdir_nextcloud "${VAULT_DIR}/02_Tickets/B2B_Inbox"         # scope=TENANT_TO_PLATFORM
mkdir_nextcloud "${VAULT_DIR}/02_Tickets/DevOps_Internal"   # scope=PLATFORM_INTERNAL (alerts/manual)
mkdir_nextcloud "${VAULT_DIR}/03_Infrastructure"
mkdir_nextcloud "${VAULT_DIR}/04_Tenants"
mkdir_nextcloud "${VAULT_DIR}/05_Documentation"
mkdir_nextcloud "${VAULT_DIR}/05_Documentation/Architecture"
mkdir_nextcloud "${VAULT_DIR}/05_Documentation/Server_Plans"
mkdir_nextcloud "${VAULT_DIR}/05_Documentation/Guides"
mkdir_nextcloud "${VAULT_DIR}/99_Templates"

echo "  ✅ Folder structure ready."

# ─── 2. Write temp files ─────────────────────────────────────────────────────
TMPDIR_VAULT=$(mktemp -d)
trap "rm -rf $TMPDIR_VAULT" EXIT

# Project Dashboard
cat > "$TMPDIR_VAULT/project_dashboard.md" << 'MDEOF'
# 📋 K2NET — Project Dashboard (Platform Engineering)

> **Scope**: `PLATFORM_INTERNAL` — Proyek Software Engineering & Infrastruktur IT Internal K2NET
> Auto-synced dari backend task system via gateway-task worker.

---

## 🚧 Proyek Platform Aktif

```dataview
TABLE WITHOUT ID
  "[[" + file.name + "|" + file.name + "]]" AS "Proyek",
  status AS "Status",
  choice(status = "IN_PROGRESS", "🟡", choice(status = "TODO", "⬜", "✅")) AS "●",
  priority AS "Prioritas",
  due_date AS "Tenggat",
  assignee AS "Penanggung Jawab"
FROM "01_Projects/Platform"
WHERE scope = "PLATFORM_INTERNAL" AND status != "CLOSED"
SORT choice(priority = "URGENT", 1, choice(priority = "HIGH", 2, choice(priority = "NORMAL", 3, 4))) ASC, due_date ASC
```

---

## ✅ Proyek Platform Selesai (30 Hari Terakhir)

```dataview
TABLE WITHOUT ID
  file.name AS "Proyek",
  file.mtime AS "Diselesaikan"
FROM "01_Projects/Platform"
WHERE status = "CLOSED" AND file.mtime >= date(today) - dur(30 days)
SORT file.mtime DESC
LIMIT 10
```

---

## 🏢 Ringkasan Proyek Tenant FTTH per Mitra ISP

> Proyek fisik lapangan (tarik kabel, pasang ODP, dll) dari mitra ISP.
> Detail lengkap lihat subfolder: `01_Projects/Tenants/{tenant-slug}/`

```dataview
TABLE WITHOUT ID
  tenant AS "Mitra ISP",
  length(rows) AS "Jumlah Proyek Aktif",
  filter(rows.status, (s) => s = "IN_PROGRESS").length AS "Sedang Berjalan"
FROM "01_Projects/Tenants"
WHERE status != "CLOSED"
GROUP BY tenant
SORT length(rows) DESC
```
MDEOF

# Ticket Dashboard
cat > "$TMPDIR_VAULT/ticket_dashboard.md" << 'MDEOF'
# 🎫 K2NET — Ticket Dashboard (B2B Inbox + DevOps Internal)

> Super Admin melihat dua jenis tiket:
> - **B2B Inbox** (`TENANT_TO_PLATFORM`): Laporan masalah infrastruktur dari NOC Tenant ISP ke K2NET
> - **DevOps Internal** (`PLATFORM_INTERNAL`): Alert server otomatis atau tiket internal dari Super Admin
>
> ⚠️ Tiket pelanggan akhir ISP (`TENANT_INTERNAL`) **tidak terlihat di sini** — terisolasi di portal tenant masing-masing.

---

## 🔴 B2B Inbox — Prioritas URGENT dari Tenant

```dataview
TABLE WITHOUT ID
  "[[" + file.name + "|" + file.name + "]]" AS "ID Tiket",
  status AS "Status",
  tenant AS "Tenant Pengirim",
  due_date AS "Batas SLA"
FROM "02_Tickets/B2B_Inbox"
WHERE priority = "URGENT" AND status != "RESOLVED" AND status != "CLOSED"
SORT due_date ASC
```

---

## 📥 Semua B2B Inbox (Belum Diselesaikan)

```dataview
TABLE WITHOUT ID
  "[[" + file.name + "|" + file.name + "]]" AS "ID Tiket",
  choice(priority = "URGENT", "🔴 URGENT", choice(priority = "HIGH", "🟠 HIGH", "🟡 NORMAL")) AS "Prioritas",
  status AS "Status",
  tenant AS "Tenant Pengirim",
  assignee AS "Ditangani",
  due_date AS "Batas SLA"
FROM "02_Tickets/B2B_Inbox"
WHERE status != "RESOLVED" AND status != "CLOSED"
SORT choice(priority = "URGENT", 1, choice(priority = "HIGH", 2, 3)) ASC
```

---

## 🖥️ DevOps Internal — Alert & Tiket Sistem K2NET

```dataview
TABLE WITHOUT ID
  "[[" + file.name + "|" + file.name + "]]" AS "ID Alert",
  status AS "Status",
  priority AS "Tingkat",
  due_date AS "Deadline"
FROM "02_Tickets/DevOps_Internal"
WHERE status != "RESOLVED" AND status != "CLOSED"
SORT choice(priority = "URGENT", 1, choice(priority = "HIGH", 2, 3)) ASC
```

---

## 📊 Summary B2B Inbox per Tenant ISP

```dataview
TABLE WITHOUT ID
  tenant AS "Mitra ISP",
  length(rows) AS "Tiket Aktif",
  filter(rows.priority, (p) => p = "URGENT").length AS "🔴 URGENT",
  filter(rows.priority, (p) => p = "HIGH").length AS "🟠 HIGH"
FROM "02_Tickets/B2B_Inbox"
WHERE status != "RESOLVED" AND status != "CLOSED"
GROUP BY tenant
SORT length(rows) DESC
```
MDEOF

# Infrastructure Map (Rich Badges)
cat > "$TMPDIR_VAULT/infrastructure_map.md" << 'MDEOF'
# 🏗️ K2NET — Infrastructure Service Map

> Auto-synced dari dokumentasi internal K2NET.

```dataview
TABLE WITHOUT ID
  file.link AS "Service",
  choice(environment = "production", "🔵 production", choice(environment = "staging", "🟡 staging", "🟣 testing")) AS "Environment",
  infrastructure_type AS "Tipe",
  platform AS "Platform",
  ip_addresses AS "IP / Port",
  choice(status = "active", "🟢 active", choice(status = "degraded", "🟡 degraded", "🔴 offline")) AS "Status"
FROM "03_Infrastructure"
SORT file.name ASC
```
MDEOF

# Scope Architecture Guide (NEW)
cat > "$TMPDIR_VAULT/scope_guide.md" << 'MDEOF'
# 🧭 K2NET — Task Scope Architecture Guide

Dokumen ini menjelaskan logika pemisahan data antara Portal Utama dan Portal Tenant.

---

## Tiga Nilai Scope

| Scope | Konteks | Terlihat Di | Contoh Nyata |
|---|---|---|---|
| `PLATFORM_INTERNAL` | Internal K2NET Engineering | `studio-admin` saja | Proyek rilis v2.0, bug fix backend, migrasi DB, alert server |
| `TENANT_TO_PLATFORM` | Tiket B2B dari Tenant → K2NET | `studio-admin` (inbox) + `studio` (outbox) | "OLT Poller Gateway Down", "Sistem GIS lambat" dari NOC ISP |
| `TENANT_INTERNAL` | Tiket/Proyek internal NOC ISP | `studio` saja, per tenant | Gangguan internet pelanggan, tarik kabel FO, pasang ODP baru |

---

## Prinsip Air-Gapped Ticketing

```
Pelanggan ISP
     │ melaporkan gangguan
     ▼
NOC ISP (studio-tenant)
  ├── 50x tiket B2C (TENANT_INTERNAL) → selamanya terisolasi di portal tenant
  │
  └── [jika akar masalah ada di infrastruktur K2NET]
        │ NOC membuat tiket B2B baru secara manual
        ▼
   1x tiket B2B (TENANT_TO_PLATFORM)
        │
        ▼
   Super Admin K2NET (studio-admin) → menerima via SSE notification
        │ memperbaiki sistem
        ▼
   NOC ISP → Bulk Resolve ke-50 tiket pelanggan
```

**Prinsip Mutlak**: Tiket pelanggan B2C tidak pernah bisa langsung ke Portal Utama.
Tidak ada tombol "Eskalasi ke K2NET" di tiket pelanggan — hanya ada menu "Contact K2NET Support"
yang mengharuskan NOC membuat tiket B2B baru secara sadar dan manual.

---

## Alur Obsidian Sync (gateway-task Worker)

| Scope | Type | Folder Tujuan Vault |
|---|---|---|
| `PLATFORM_INTERNAL` | PROJECT | `01_Projects/Platform/` |
| `TENANT_INTERNAL` | PROJECT | `01_Projects/Tenants/{tenant-slug}/` |
| `TENANT_TO_PLATFORM` | TICKET | `02_Tickets/B2B_Inbox/` |
| `PLATFORM_INTERNAL` | TICKET | `02_Tickets/DevOps_Internal/` |
| `TENANT_INTERNAL` | TICKET | *Tidak disync ke vault K2NET (terisolasi di tenant)* |

---

## Notifikasi Real-Time

- **Teknologi**: Server-Sent Events (SSE) — bukan WebSocket
- **Endpoint**: `GET /api/v1/tasks/stream`
- **Trigger**: Setiap tiket `TENANT_TO_PLATFORM` baru dibuat → notifikasi push ke semua Super Admin aktif
- **Alasan SSE**: komunikasi one-way (server → client), konsisten dengan Live Audit Log Feed
MDEOF

# ─── 3. Infrastructure Service Definition Generator ────────────────────────
echo ""
echo "Step 2: Generating infrastructure service definitions..."

create_service_doc() {
  local filename=$1
  local name=$2
  local env=$3
  local type=$4
  local platform=$5
  local ipport=$6
  local status=$7
  local desc=$8

  cat > "$TMPDIR_VAULT/${filename}.md" << EOF
---
environment: $env
infrastructure_type: $type
platform: $platform
ip_addresses: "$ipport"
status: $status
---

# $name

> **Environment**: \`$env\` | **Type**: \`$type\` | **Platform**: \`$platform\` | **Status**: \`$status\`

$desc

---

## 🔌 Connection & Endpoints
- **Host / Port**: \`$ipport\`
- **Platform Hostname**: \`http://${filename}:...\`

## 🔗 Related Components
- [[📌 Infrastructure Map|Infrastructure Map]]
- [[📌 Project Dashboard|Platform Engineering Projects]]
EOF

  upload_nextcloud "${VAULT_DIR}/03_Infrastructure/${filename}.md" "$TMPDIR_VAULT/${filename}.md"
}

create_service_doc "kong-gateway" "🚪 Kong API Gateway" "production" "API Gateway" "Docker (Kong DB-less)" "172.18.0.x:8000 / 8001" "active" "External edge router, rate limiting, and Keycloak JWT validation proxy."
create_service_doc "traefik-proxy" "🌐 Traefik Edge Reverse Proxy" "production" "Edge Reverse Proxy" "Docker Container" "172.18.0.x:80 / 443" "active" "SSL Termination, Let's Encrypt automated certificates, and dynamic domain routing."
create_service_doc "keycloak-iam" "🔐 Keycloak Identity & Access Management" "production" "IAM / OAuth2" "Docker (Keycloak 26)" "http://keycloak:8081" "active" "Single Sign-On (SSO), RBAC permissions, and realm authentication for Super Admin and ISP Tenants."
create_service_doc "ftth-backend" "☕ Spring Boot Core API" "production" "Core Application Backend" "Spring Boot 3.x (Java 21)" "http://backend:9090" "active" "Core FTTH GIS business logic, PostGIS spatial queries, task engine, and RESTful APIs."
create_service_doc "ftth-postgres" "🗄️ PostgreSQL + PostGIS" "production" "Relational & Spatial DB" "PostgreSQL 17 + PostGIS" "http://ftth-postgres:5432" "active" "Primary transactional store, audit logs, and spatial GIS polygon geometry."
create_service_doc "ftth-redis" "⚡ Redis Cache & Queue" "production" "In-Memory Cache & Broker" "Redis 7.x" "http://ftth-redis:6379" "active" "Session state, rate limit tokens, OLT telemetry cache, and background task queues."
create_service_doc "minio-storage" "🪣 MinIO Object Storage" "production" "S3 Object Storage" "MinIO S3" "100.110.205.109:9005 (API) / 9006" "active" "Disaster recovery DB dumps, tenant attachments, map tiles, and backup archives."
create_service_doc "ftth-poller" "📡 FTTH OLT Poller Gateway" "production" "Telemetry Engine" "Go Microservice (5010)" "http://ftth-poller:5010" "active" "Real-time SNMP/SSH polling engine for OLT hardware and ONU/ONT subscriber links."
create_service_doc "notification-gateway" "💬 Notification Gateway" "production" "Messaging Gateway" "Go Microservice (5001)" "http://notification-gateway:5001" "active" "Multi-channel notification dispatcher (Twilio WhatsApp, SMS OTP, SMTP Email)."
create_service_doc "payment-gateway" "💳 Payment Gateway" "production" "Payment Gateway" "Go Microservice (5002)" "http://payment-gateway:5002" "active" "Xendit invoice generation, virtual accounts, QRIS, and webhook reconciliation."
create_service_doc "map-gateway" "🗺️ Spatial Map Gateway" "production" "GIS Mapping Gateway" "Go Microservice (5003)" "http://map-gateway:5003" "active" "Vector tile caching, spatial indexing, geocoding, and map routing services."
create_service_doc "storage-gateway" "📂 Storage Gateway" "production" "Storage Bridge" "Go Microservice (5004)" "http://storage-gateway:5004" "active" "Presigned URL generator, chunked upload orchestrator, and MinIO S3 bridge."
create_service_doc "prometheus-grafana" "📊 Observability Suite" "production" "Metrics & Monitoring" "Prometheus + Grafana" "100.110.205.109:3002 (Grafana)" "active" "Time-series metrics collection, alertmanager, and infrastructure telemetry dashboards."

# ─── 4. AI Agent Memory & Skills Hub (00_AI_Agent/) ────────────────────────
echo ""
echo "Step 3: Generating AI Agent Skills & Memory Hub..."

# 4.1 AGENTS.md (Root memory)
if [ -f "/opt/project5/AGENTS.md" ]; then
  upload_nextcloud "${VAULT_DIR}/00_AI_Agent/AGENTS.md" "/opt/project5/AGENTS.md"
  echo "  🤖 Uploaded 00_AI_Agent/AGENTS.md"
fi

# 4.2 DevOps Monitoring Skill
cat > "$TMPDIR_VAULT/skill_devops.md" << 'EOF'
---
name: devops-monitoring
description: Runbook investigasi metrik Prometheus, status gateway Kong, Traefik SSL, dan log Redis telemetry
---

# 🛠️ DevOps & Observability Runbook

Gunakan skill ini untuk memeriksa kesehatan dan telemetri server K2NET FTTH GIS.

## 📊 Endpoints Observabilitas
- **Prometheus Scrape**: `http://ftth-prometheus:9090`
- **OLT Poller Metrics**: `http://ftth-poller:5010/metrics`
- **Kong Admin API**: `http://kong:8001/status`
- **Spring Core DevOps API**: `GET /api/v1/system/devops-stats`

## 🚨 Troubleshooting Alerting
1. Jika Poller lambat: Periksa koneksi Redis key `gateway:poller:stats`.
2. Jika Traefik SSL expired: Periksa `docker/traefik/acme.json` dan let's encrypt challenge.
EOF
upload_nextcloud "${VAULT_DIR}/00_AI_Agent/skills/devops-monitoring/SKILL.md" "$TMPDIR_VAULT/skill_devops.md"

# 4.3 FTTH GIS Engine Skill
cat > "$TMPDIR_VAULT/skill_gis.md" << 'EOF'
---
name: ftth-gis-engine
description: Panduan query spasial PostGIS, manajemen polygon coverage ODP/OLT, dan vector tiles
---

# 🗺️ FTTH GIS Spatial Engine Runbook

Gunakan skill ini saat mengelola data spasial kabel fiber optik, ODP, closure, dan pole.

## 📐 Standar Geometri
- **SRID Baku**: `EPSG:4326` (WGS 84 Lat/Lng)
- **Indexing**: Spatial GiST Index pada kolom `location_geom`
- **Vector Tiles**: Map Gateway port `5003` mengompilasi MVT (Mapbox Vector Tiles) dari layer PostgreSQL.
EOF
upload_nextcloud "${VAULT_DIR}/00_AI_Agent/skills/ftth-gis-engine/SKILL.md" "$TMPDIR_VAULT/skill_gis.md"

# 4.4 Backup & Disaster Recovery Skill
cat > "$TMPDIR_VAULT/skill_backup.md" << 'EOF'
---
name: backup-disaster-dr
description: Panduan 3-layer disaster recovery (Local Disk, MinIO S3, Nextcloud WebDAV offsite)
---

# 💾 3-Layer Disaster Recovery Runbook

Panduan pemulihan sistem dari backup lokal, S3 MinIO, atau cloud Nextcloud.

## 🕒 Jadwal Backup Harian
- `00:00` — `scripts/backup.sh` (Postgres & Keycloak dumps)
- `01:00` — `scripts/backup-minio.sh` (MinIO assets archive)
- `02:00` — `scripts/backup-code.sh` (Codebase archive)
- `04:00` — `scripts/sync-nextcloud.sh` (Sync rclone ke Nextcloud)
EOF
upload_nextcloud "${VAULT_DIR}/00_AI_Agent/skills/backup-disaster-dr/SKILL.md" "$TMPDIR_VAULT/skill_backup.md"

# 4.5 Task Management Skill
cat > "$TMPDIR_VAULT/skill_tasks.md" << 'EOF'
---
name: task-management
description: Panduan arsitektur Linear (Projects & Plans, Tickets, Sub-issues, Air-Gap isolation)
---

# 📋 Linear Task Management Runbook

Hierarki sistem task K2NET:
1. **Projects (Induk Inisiatif)**: Disimpan di `01_Projects/Platform/` atau `01_Projects/Tenants/`.
2. **Tickets (Anak Tugas)**: Disimpan di `02_Tickets/DevOps_Internal/` atau `02_Tickets/B2B_Inbox/`.
3. **Sub-issues**: Tugas butir terkecil dalam task dengan dynamic circular progress ratio (`0/1`, `2/2`).
EOF
upload_nextcloud "${VAULT_DIR}/00_AI_Agent/skills/task-management/SKILL.md" "$TMPDIR_VAULT/skill_tasks.md"

# ─── 5. Sync Documentation (/opt/project5/docs/ -> 05_Documentation/) ────────
echo ""
echo "Step 4: Syncing technical documentation from /opt/project5/docs/..."

for doc in /opt/project5/docs/*.md; do
  if [ -f "$doc" ]; then
    fname=$(basename "$doc")
    upload_nextcloud "${VAULT_DIR}/05_Documentation/${fname}" "$doc"
    echo "  📄 Synced docs: ${fname}"
  fi
done

# Sync server recommendation plans if any
if [ -d "/opt/project5/docs/Server" ]; then
  for doc in /opt/project5/docs/Server/*.md; do
    if [ -f "$doc" ]; then
      fname=$(basename "$doc")
      upload_nextcloud "${VAULT_DIR}/05_Documentation/Server_Plans/${fname}" "$doc"
    fi
  done
fi

# ─── 6. Upload Dashboards ───────────────────────────────────────────────────
echo ""
echo "Step 5: Uploading dashboard files..."

upload_nextcloud "${VAULT_DIR}/📌 Project Dashboard.md" "$TMPDIR_VAULT/project_dashboard.md"
upload_nextcloud "${VAULT_DIR}/📌 Ticket Dashboard.md" "$TMPDIR_VAULT/ticket_dashboard.md"
upload_nextcloud "${VAULT_DIR}/📌 Infrastructure Map.md" "$TMPDIR_VAULT/infrastructure_map.md"
upload_nextcloud "${VAULT_DIR}/🧭 Scope Architecture Guide.md" "$TMPDIR_VAULT/scope_guide.md"

echo ""
echo "=== Nextcloud Vault Update v1.4 (AI-First & Full Docs) Completed Successfully ==="
echo ""
echo "📁 Vault Structure:"
echo "  ✅ 00_AI_Agent/skills/        ← 4 AI Skills (DevOps, GIS, Backup, Tasks) + AGENTS.md"
echo "  ✅ 01_Projects/Platform/      ← scope=PLATFORM_INTERNAL projects"
echo "  ✅ 01_Projects/Tenants/       ← scope=TENANT_INTERNAL projects (per ISP)"
echo "  ✅ 02_Tickets/B2B_Inbox/      ← scope=TENANT_TO_PLATFORM tickets"
echo "  ✅ 02_Tickets/DevOps_Internal/ ← scope=PLATFORM_INTERNAL tickets"
echo "  ✅ 03_Infrastructure/         ← 13 Microservices markdown docs"
echo "  ✅ 05_Documentation/          ← /opt/project5/docs/ technical docs"
echo ""
echo "📄 Dashboards:"
echo "  ✅ 📌 Project Dashboard.md"
echo "  ✅ 📌 Ticket Dashboard.md"
echo "  ✅ 📌 Infrastructure Map.md"
echo "  ✅ 🧭 Scope Architecture Guide.md"
