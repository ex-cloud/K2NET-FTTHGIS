#!/bin/bash
# ==============================================================================
# BACKUP DOCKER PERSISTENT DATA → LOKAL + MINIO S3
# Arsipkan Docker volumes yang berisi data konfigurasi penting
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/opt/project5/backups/docker"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$BACKUP_DIR"

echo "=== Memulai Backup Docker Persistent Data [$TIMESTAMP] ==="

# Daftar volume yang perlu dibackup (hanya yang penting, bukan cache)
declare -A VOLUMES=(
  ["grafana"]="project5_grafana_data"
  ["keycloak"]="project5_keycloak_data"
  ["prometheus"]="project5_prometheus_data"
)

GATEWAY_TOKEN=$(grep -E "^GATEWAY_TOKEN=" /opt/project5/services/.env | cut -d'=' -f2)

for LABEL in "${!VOLUMES[@]}"; do
  VOL_NAME="${VOLUMES[$LABEL]}"
  BACKUP_FILE="$BACKUP_DIR/${LABEL}_volume_$TIMESTAMP.tar.gz"

  echo "--- Backup volume: $VOL_NAME ---"

  # Cek apakah volume ada
  if ! docker volume inspect "$VOL_NAME" > /dev/null 2>&1; then
    echo "Warning: Volume $VOL_NAME tidak ditemukan, dilewati."
    continue
  fi

  # Dapatkan mount point volume
  MOUNT_POINT=$(docker volume inspect "$VOL_NAME" --format '{{ .Mountpoint }}')

  # Arsipkan isi volume
  tar -czf "$BACKUP_FILE" -C "$MOUNT_POINT" . 2>/dev/null
  TAR_STATUS=$?

  if [ $TAR_STATUS -eq 0 ]; then
    FILE_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo "Arsip $LABEL sukses: $BACKUP_FILE ($FILE_SIZE)"

    # Upload ke MinIO
    if [ -n "${GATEWAY_TOKEN:-}" ]; then
      echo "Mengunggah $LABEL ke MinIO S3..."
      RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "X-Gateway-Token: $GATEWAY_TOKEN" \
        -F "file=@$BACKUP_FILE" \
        -F "bucket=docker-backups" \
        http://127.0.0.1:5004/api/v1/upload)

      HTTP_CODE=$(echo "$RESPONSE" | tail -1)
      if [ "$HTTP_CODE" = "200" ]; then
        echo "Upload $LABEL ke MinIO berhasil"
      else
        echo "Warning: Upload $LABEL ke MinIO gagal (HTTP $HTTP_CODE)"
      fi
    fi
  else
    echo "Warning: Arsip $LABEL GAGAL!"
  fi
done

# Hapus backup lokal yang lebih tua dari 30 hari
find "$BACKUP_DIR" -type f -name "*_volume_*.tar.gz" -mtime +30 -delete

echo "=== Backup Docker Persistent Data Selesai ==="
