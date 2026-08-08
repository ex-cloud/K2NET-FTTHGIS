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

echo "=== Nextcloud Vault Setup initiated ==="

# Nextcloud WebDAV Base URL
BASE_URL="$NEXTCLOUD_URL"
if [[ "$BASE_URL" != */ ]]; then
  BASE_URL="${BASE_URL}/"
fi

VAULT_DIR="K2NET_Engineering_Vault"

# Helper function to create Nextcloud directory via WebDAV MKCOL
mkdir_nextcloud() {
  local dir_path=$1
  echo "Creating directory: $dir_path"
  curl -s -u "$NEXTCLOUD_USER:$NEXTCLOUD_APP_PASSWORD" -X MKCOL "${BASE_URL}${dir_path}/" -o /dev/null || true
}

# Helper function to upload file via WebDAV PUT
upload_nextcloud() {
  local target_path=$1
  local local_content=$2
  echo "Uploading file: $target_path"
  echo -e "$local_content" | curl -s -u "$NEXTCLOUD_USER:$NEXTCLOUD_APP_PASSWORD" -X PUT -H "Content-Type: text/markdown" -T - "${BASE_URL}${target_path}" -o /dev/null
}

# 1. Create directory structures
mkdir_nextcloud "$VAULT_DIR"
mkdir_nextcloud "${VAULT_DIR}/01_Projects"
mkdir_nextcloud "${VAULT_DIR}/02_Tickets"
mkdir_nextcloud "${VAULT_DIR}/03_Infrastructure"
mkdir_nextcloud "${VAULT_DIR}/04_Tenants"
mkdir_nextcloud "${VAULT_DIR}/99_Templates"

# 2. Define Markdown content
PROJECT_DASHBOARD_CONTENT='# 📋 K2NET — Active Project Dashboard

> Auto-generated from backend task system. Last sync: '$(date +%Y-%m-%d)'

## 🚧 Proyek Aktif

```dataview
TABLE WITHOUT ID
  "[[" + file.name + "|" + file.name + "]]" AS "ID Proyek",
  status AS "Status",
  choice(status = "IN_PROGRESS", "🟡", choice(status = "TODO", "⬜", "✅")) AS "●",
  priority AS "Prioritas",
  tenant AS "Mitra ISP",
  geom_ref AS "Referensi ODP/ODC",
  due_date AS "Tenggat"
FROM "01_Projects"
WHERE type = "PROJECT" AND status != "CLOSED"
SORT choice(priority = "URGENT", 1, choice(priority = "HIGH", 2, choice(priority = "NORMAL", 3, 4))) ASC, due_date ASC
```

## ✅ Proyek Selesai (30 Hari Terakhir)

```dataview
TABLE WITHOUT ID
  file.name AS "ID Proyek",
  tenant AS "Mitra ISP",
  file.mtime AS "Diselesaikan"
FROM "01_Projects"
WHERE status = "CLOSED" AND file.mtime >= date(today) - dur(30 days)
SORT file.mtime DESC
LIMIT 10
```'

TICKET_DASHBOARD_CONTENT='# 🎫 K2NET — Active Ticket Dashboard

## 🔴 Tiket URGENT (Respons Segera)

```dataview
TABLE WITHOUT ID
  "[[" + file.name + "|" + file.name + "]]" AS "ID Tiket",
  status AS "Status",
  tenant AS "Mitra ISP",
  geom_ref AS "Lokasi Gangguan",
  due_date AS "Batas SLA"
FROM "02_Tickets"
WHERE priority = "URGENT" AND status != "RESOLVED" AND status != "CLOSED"
SORT due_date ASC
```

## 🟡 Semua Tiket Terbuka

```dataview
TABLE WITHOUT ID
  "[[" + file.name + "|" + file.name + "]]" AS "ID Tiket",
  choice(priority = "URGENT", "🔴 URGENT", choice(priority = "HIGH", "🟠 HIGH", "🟡 NORMAL")) AS "Prioritas",
  status AS "Status",
  tenant AS "Mitra ISP",
  assignee AS "Penanggung Jawab",
  due_date AS "Batas SLA"
FROM "02_Tickets"
WHERE status != "RESOLVED" AND status != "CLOSED"
SORT choice(priority = "URGENT", 1, choice(priority = "HIGH", 2, 3)) ASC
```

## 📊 Summary per Tenant

```dataview
TABLE WITHOUT ID
  tenant AS "Mitra ISP",
  length(rows) AS "Jumlah Tiket Aktif"
FROM "02_Tickets"
WHERE status != "RESOLVED" AND status != "CLOSED"
GROUP BY tenant
SORT length(rows) DESC
```'

INFRASTRUCTURE_MAP_CONTENT='# 🏗️ K2NET — Infrastructure Service Map

```dataview
TABLE WITHOUT ID
  file.name AS "Service",
  environment AS "Environment",
  infrastructure_type AS "Tipe",
  ip_addresses AS "IP / Port",
  status AS "Status"
FROM "03_Infrastructure"
SORT file.name ASC
```'

# 3. Upload Dashboards
upload_nextcloud "${VAULT_DIR}/📌 Project Dashboard.md" "$PROJECT_DASHBOARD_CONTENT"
upload_nextcloud "${VAULT_DIR}/📌 Ticket Dashboard.md" "$TICKET_DASHBOARD_CONTENT"
upload_nextcloud "${VAULT_DIR}/📌 Infrastructure Map.md" "$INFRASTRUCTURE_MAP_CONTENT"

echo "=== Nextcloud Vault Setup Completed Successfully ==="
