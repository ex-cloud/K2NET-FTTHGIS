#!/bin/bash
# ==============================================================================
# SINKRONISASI BACKUP KE NEXTCLOUD via RCLONE (WebDAV)
# Kirim semua backup lokal ke server Nextcloud sebagai offsite backup
# ==============================================================================

set -euo pipefail

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
      text="☁️ *FTTH GIS — Offsite Sync Nextcloud Sukses*

📅 $(date +"%d %b %Y, %H:%M") WIB
✅ Status: Semua berkas cadangan database, kode, Docker volumes, dan secrets berhasil disinkronisasikan ke cloud Nextcloud."
    else
      text="⚠️ *FTTH GIS — Offsite Sync Nextcloud GAGAL!*

📅 $(date +"%d %b %Y, %H:%M") WIB
❌ Detail: $detail"
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

# Pasang trap untuk mendeteksi error
trap 'docker exec -i ftth-postgres psql -U postgres -d ftth_gis -c "UPDATE database_backups SET nextcloud_status = '\''FAILED'\'' WHERE id = (SELECT id FROM database_backups ORDER BY id DESC LIMIT 1);" 2>/dev/null || true; send_telegram "FAILED" "Proses rclone sync ke Nextcloud terputus/gagal!"' ERR


BACKUP_BASE="/opt/project5/backups"
REMOTE="nextcloud"
REMOTE_BASE="FTTH-GIS-Backups"

echo "=== Memulai Sinkronisasi ke Nextcloud [$(date '+%Y-%m-%d %H:%M:%S')] ==="

# Verifikasi rclone remote tersedia
if ! rclone listremotes | grep -q "^${REMOTE}:"; then
  echo "Error: Rclone remote '$REMOTE' belum dikonfigurasi!"
  echo "Jalankan: rclone config"
  exit 1
fi

# 1. Sinkronisasi backup database (hanya file .sql.gz di root, bukan subfolder)
echo "--- Sinkronisasi backup database ---"
if ls "$BACKUP_BASE"/*.sql.gz 1>/dev/null 2>&1; then
  rclone copy "$BACKUP_BASE/" "${REMOTE}:${REMOTE_BASE}/database/" \
    --include "*.sql.gz" \
    --max-depth 1 \
    --transfers 2 \
    --checkers 4 \
    --retries 3 \
    --low-level-retries 10 \
    -v
  echo "Database backups: OK"
else
  echo "Tidak ada file backup database ditemukan."
fi

# 2. Sinkronisasi backup kode sumber
echo "--- Sinkronisasi backup kode ---"
if [ -d "$BACKUP_BASE/code" ] && ls "$BACKUP_BASE/code"/*.tar.gz 1>/dev/null 2>&1; then
  rclone copy "$BACKUP_BASE/code/" "${REMOTE}:${REMOTE_BASE}/code/" \
    --include "*.tar.gz" \
    --transfers 2 \
    --retries 3 \
    --low-level-retries 10 \
    -v
  echo "Code backups: OK"
else
  echo "Tidak ada file backup kode ditemukan."
fi

# 3. Sinkronisasi backup Docker volumes
echo "--- Sinkronisasi backup Docker volumes ---"
if [ -d "$BACKUP_BASE/docker" ] && ls "$BACKUP_BASE/docker"/*.tar.gz 1>/dev/null 2>&1; then
  rclone copy "$BACKUP_BASE/docker/" "${REMOTE}:${REMOTE_BASE}/docker/" \
    --include "*.tar.gz" \
    --transfers 2 \
    --retries 3 \
    --low-level-retries 10 \
    -v
  echo "Docker backups: OK"
else
  echo "Tidak ada file backup Docker ditemukan."
fi

# 4. Sinkronisasi backup MinIO data
echo "--- Sinkronisasi backup MinIO data ---"
if [ -d "$BACKUP_BASE/minio" ] && ls "$BACKUP_BASE/minio"/*.tar.gz 1>/dev/null 2>&1; then
  rclone copy "$BACKUP_BASE/minio/" "${REMOTE}:${REMOTE_BASE}/minio/" \
    --include "*.tar.gz" \
    --transfers 2 \
    --retries 3 \
    --low-level-retries 10 \
    -v
  echo "MinIO backups: OK"
else
  echo "Tidak ada file backup MinIO ditemukan."
fi

# 5. Sinkronisasi backup secrets terenkripsi (OLT_ENCRYPTION_KEY, dll.)
echo "--- Sinkronisasi backup secrets terenkripsi ---"
if [ -d "$BACKUP_BASE/secrets" ] && ls "$BACKUP_BASE/secrets"/*.enc 1>/dev/null 2>&1; then
  rclone copy "$BACKUP_BASE/secrets/" "${REMOTE}:${REMOTE_BASE}/secrets/" \
    --include "*.enc" \
    --transfers 2 \
    --retries 3 \
    --low-level-retries 10 \
    -v
  echo "Secrets backups: OK"
else
  echo "Tidak ada file backup secrets ditemukan."
fi

# 6. Sinkronisasi arsip audit log ke cold storage Nextcloud
echo "--- Sinkronisasi arsip audit_logs (cold storage) ---"
if [ -d "$BACKUP_BASE/archive/audit_logs" ] && ls "$BACKUP_BASE/archive/audit_logs"/*.csv.gz 1>/dev/null 2>&1; then
  rclone copy "$BACKUP_BASE/archive/audit_logs/" "${REMOTE}:${REMOTE_BASE}/archive/audit_logs/" \
    --include "*.csv.gz" \
    --transfers 2 \
    --retries 3 \
    --low-level-retries 10 \
    -v
  echo "Archive audit_logs: OK"
else
  echo "Tidak ada file arsip audit_logs ditemukan."
fi

# 7. Bersihkan berkas cadangan di Nextcloud yang berusia lebih dari 30 hari (Retensi 30 hari)
echo "--- Membersihkan berkas cadangan lama di Nextcloud (Retensi 30 hari) ---"
rclone delete "${REMOTE}:${REMOTE_BASE}/" --min-age 30d --rmdirs -v 2>&1 | tail -5

echo "=== Sinkronisasi ke Nextcloud Selesai [$(date '+%Y-%m-%d %H:%M:%S')] ==="

# Catat sukses Nextcloud sync ke DB
docker exec -i ftth-postgres psql -U postgres -d ftth_gis -c "UPDATE database_backups SET nextcloud_status = 'SUCCESS', nextcloud_sync_time = NOW() WHERE id = (SELECT id FROM database_backups ORDER BY id DESC LIMIT 1);" 2>/dev/null || true

# Kirim notifikasi sukses ke Telegram
send_telegram "SUCCESS"
