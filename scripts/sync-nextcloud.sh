#!/bin/bash
# ==============================================================================
# SINKRONISASI BACKUP KE NEXTCLOUD via RCLONE (WebDAV)
# Kirim semua backup lokal ke server Nextcloud sebagai offsite backup
# ==============================================================================

set -euo pipefail

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

echo "=== Sinkronisasi ke Nextcloud Selesai [$(date '+%Y-%m-%d %H:%M:%S')] ==="
