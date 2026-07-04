#!/bin/bash
# ==============================================================================
# BACKUP KODE SUMBER → LOKAL + MINIO S3
# Arsipkan seluruh kode aplikasi FTTH GIS (minus file yang bisa diregenerasi)
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/opt/project5/backups/code"
PROJECT_DIR="/opt/project5"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ftth_code_backup_$TIMESTAMP.tar.gz"

# Buat folder jika belum ada
mkdir -p "$BACKUP_DIR"

echo "=== Memulai Backup Kode Sumber [$TIMESTAMP] ==="

# Arsipkan kode sumber, kecuali folder besar yang bisa diregenerasi
tar -czf "$BACKUP_FILE" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='minio_data' \
  --exclude='backups' \
  --exclude='.git/objects' \
  --exclude='target' \
  --exclude='*.jar' \
  --exclude='*.class' \
  --exclude='go/pkg' \
  --exclude='__pycache__' \
  -C "$(dirname $PROJECT_DIR)" "$(basename $PROJECT_DIR)"

TAR_STATUS=$?

if [ $TAR_STATUS -eq 0 ]; then
  FILE_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
  echo "Arsip kode sumber sukses: $BACKUP_FILE ($FILE_SIZE)"

  # Upload ke MinIO via Storage Gateway
  GATEWAY_TOKEN=$(grep -E "^GATEWAY_TOKEN=" /opt/project5/services/.env | cut -d'=' -f2)
  if [ -n "$GATEWAY_TOKEN" ]; then
    echo "Mengunggah arsip kode ke MinIO S3 (bucket: code-backups)..."
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
      -H "X-Gateway-Token: $GATEWAY_TOKEN" \
      -F "file=@$BACKUP_FILE" \
      -F "bucket=code-backups" \
      http://127.0.0.1:5004/api/v1/upload)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    if [ "$HTTP_CODE" = "200" ]; then
      echo "Upload ke MinIO berhasil (HTTP $HTTP_CODE)"
    else
      echo "Warning: Upload ke MinIO gagal (HTTP $HTTP_CODE)"
    fi
  else
    echo "Warning: GATEWAY_TOKEN tidak ditemukan. Upload ke MinIO dilewati."
  fi

  # Hapus backup lokal yang lebih tua dari 7 hari
  find "$BACKUP_DIR" -type f -name "ftth_code_backup_*.tar.gz" -mtime +7 -delete
  echo "=== Backup Kode Sumber Selesai ==="
else
  echo "Error: Arsip kode sumber GAGAL!"
  exit 1
fi
