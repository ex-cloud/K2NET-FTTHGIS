#!/bin/bash
# Folder tujuan backup lokal di AlmaLinux
BACKUP_DIR="/opt/project5/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ftth_gis_backup_$TIMESTAMP.sql"

# --- Fungsi Notifikasi Telegram ---
send_telegram() {
  local status="$1"
  local detail="${2:-}"
  local env_file="/opt/project5/.env"
  local bot_token=$(grep -E "^TELEGRAM_BOT_TOKEN=" "$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo "")
  local chat_id=$(grep -E "^TELEGRAM_CHAT_ID=" "$env_file" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo "")

  if [ -n "$bot_token" ] && [ -n "$chat_id" ]; then
    local text=""
    if [ "$status" = "SUCCESS" ]; then
      text="💾 *FTTH GIS — Backup Database Sukses*

📅 $(date +"%d %b %Y, %H:%M") WIB
🗄️ Database: ftth_gis & keycloak_db
📁 Berkas: $(basename $BACKUP_FILE).gz
🔑 Keycloak: $(basename ${KC_BACKUP_FILE:-none}).gz"
    else
      text="⚠️ *FTTH GIS — Backup Database GAGAL!*

📅 $(date +"%d %b %Y, %H:%M") WIB
❌ Status: $detail"
    fi

    local payload=$(printf '{"chat_id": "%s", "parse_mode": "Markdown", "text": "%s"}' \
      "$chat_id" \
      "$(echo "$text" | sed 's/"/\\"/g')")

    curl -s -o /dev/null -w "%{http_code}" \
      -X POST \
      -H "Content-Type: application/json" \
      -d "$payload" \
      "https://api.telegram.org/bot${bot_token}/sendMessage" \
      2>/dev/null || true
  fi
}


# Buat folder jika belum ada
mkdir -p $BACKUP_DIR

# SANGAT PRESISI: Gunakan -i (Interactive) BUKAN -t (TTY). 
# Menghindari korupsi karakter terminal (seperti \r\n terikut di dalam dump) saat berjalan otomatis di Cron.
docker exec -i ftth-postgres pg_dump -U postgres ftth_gis > $BACKUP_FILE
PG_STATUS=$?

if [ $PG_STATUS -eq 0 ]; then
  gzip -f $BACKUP_FILE
  GZIP_STATUS=$?
  if [ $GZIP_STATUS -eq 0 ]; then
    # Catat sukses ke DB
    docker exec -i ftth-postgres psql -U postgres -d ftth_gis -c "INSERT INTO database_backups (backup_time, status, success, backup_file) VALUES (NOW(), 'SUCCESS', true, '$(basename $BACKUP_FILE).gz');"
    echo "Backup database sukses: $BACKUP_FILE.gz"

    # Unggah cadangan database ke MinIO lokal via Storage Gateway secara background
    GATEWAY_TOKEN=$(grep -E "^GATEWAY_TOKEN=" /opt/project5/services/.env | cut -d'=' -f2)
    if [ -n "$GATEWAY_TOKEN" ]; then
      echo "Mengunggah berkas cadangan database ke MinIO S3 lokal..."
      curl -s -X POST \
        -H "X-Gateway-Token: $GATEWAY_TOKEN" \
        -F "file=@$BACKUP_FILE.gz" \
        -F "bucket=db-backups" \
        http://127.0.0.1:5004/api/v1/upload > /dev/null &
    fi
  else
    # Catat gagal kompres ke DB
    docker exec -i ftth-postgres psql -U postgres -d ftth_gis -c "INSERT INTO database_backups (backup_time, status, success, backup_file) VALUES (NOW(), 'FAILED', false, '');"
    echo "Error: Kompresi backup gagal"
    send_telegram "FAILED" "Kompresi backup ftth_gis gagal!"
    exit 1
  fi
else
  # Catat gagal dump ke DB
  docker exec -i ftth-postgres psql -U postgres -d ftth_gis -c "INSERT INTO database_backups (backup_time, status, success, backup_file) VALUES (NOW(), 'FAILED', false, '');"
  echo "Error: pg_dump gagal"
  send_telegram "FAILED" "pg_dump database ftth_gis gagal!"
  exit 1
fi

# =============================================================================
# BACKUP KEYCLOAK DATABASE (keycloak_db)
# Berisi konfigurasi realm, user credentials, identity providers, session data.
# Data ini TIDAK bisa di-recover dari kode saja jika hilang.
# =============================================================================
KC_BACKUP_FILE="$BACKUP_DIR/keycloak_db_backup_$TIMESTAMP.sql"

echo "Memulai backup database Keycloak (keycloak_db)..."
docker exec -i ftth-postgres pg_dump -U postgres keycloak_db > $KC_BACKUP_FILE
KC_STATUS=$?

if [ $KC_STATUS -eq 0 ]; then
  gzip -f $KC_BACKUP_FILE
  KC_GZIP_STATUS=$?
  if [ $KC_GZIP_STATUS -eq 0 ]; then
    echo "Backup database Keycloak sukses: $KC_BACKUP_FILE.gz"

    # Unggah cadangan Keycloak ke MinIO lokal
    if [ -n "${GATEWAY_TOKEN:-}" ]; then
      echo "Mengunggah berkas cadangan Keycloak ke MinIO S3 lokal..."
      curl -s -X POST \
        -H "X-Gateway-Token: $GATEWAY_TOKEN" \
        -F "file=@$KC_BACKUP_FILE.gz" \
        -F "bucket=db-backups" \
        http://127.0.0.1:5004/api/v1/upload > /dev/null &
    fi
  else
    echo "Error: Kompresi backup Keycloak gagal"
    send_telegram "FAILED" "Kompresi backup database keycloak_db gagal!"
    exit 1
  fi
else
  echo "Error: pg_dump Keycloak gagal"
  send_telegram "FAILED" "pg_dump database keycloak_db gagal!"
  exit 1
fi

# 🚀 TINGKAT KEAMANAN TINGGI (Offsite Backup):
# Unggah otomatis berkas backup terkompresi ke S3-compatible cloud storage (misal: Cloudflare R2 / AWS S3)
# menggunakan Rclone jika sudah dikonfigurasi.
if which rclone >/dev/null 2>&1 && rclone listremotes | grep -q "^cloudflare-r2:"; then
  echo "Mengunggah berkas backup database ke offsite cloud storage (cloudflare-r2)..."
  rclone copy "$BACKUP_FILE.gz" cloudflare-r2:ftth-gis-disaster-recovery/database/
  rclone copy "$KC_BACKUP_FILE.gz" cloudflare-r2:ftth-gis-disaster-recovery/keycloak/ 2>/dev/null
  RCLONE_STATUS=$?
  if [ $RCLONE_STATUS -eq 0 ]; then
    echo "Backup database offsite sukses!"
  else
    echo "Warning: Backup database offsite GAGAL!"
  fi
else
  echo "Warning: Rclone belum terinstal atau remote 'cloudflare-r2' belum dikonfigurasi. Backup database offsite dilewati."
fi

# Kirim notifikasi sukses ke Telegram
send_telegram "SUCCESS"

# Hapus backup lokal yang lebih tua dari 3 hari agar disk AlmaLinux tidak penuh
find $BACKUP_DIR -type f -name "*.gz" -mtime +3 -delete
