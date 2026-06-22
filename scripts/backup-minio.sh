#!/bin/bash
# ==============================================================================
# SCRIPT BACKUP MINIO DATA (ALMALINUX LOCAL + OFFSITE SYNC)
# ==============================================================================

BACKUP_DIR="/opt/project5/backups/minio"
MINIO_DATA_DIR="/opt/project5/minio_data"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/minio_backup_$TIMESTAMP.tar.gz"

# Buat folder backup tujuan jika belum ada
mkdir -p $BACKUP_DIR

echo "=== Memulai Backup Data MinIO [$TIMESTAMP] ==="

# 1. Kompresi data lokal MinIO
tar -czf $BACKUP_FILE -C $(dirname $MINIO_DATA_DIR) $(basename $MINIO_DATA_DIR)
TAR_STATUS=$?

if [ $TAR_STATUS -eq 0 ]; then
  echo "Kompresi data MinIO sukses: $BACKUP_FILE"
  
  # 🚀 TINGKAT KEAMANAN TINGGI (Disaster Recovery / Offsite Backup)
  # Kirim cadangan ke server backup cadangan sekunder via Rclone jika dikonfigurasi.
  if which rclone >/dev/null 2>&1 && rclone listremotes | grep -q "^cloudflare-r2:"; then
    echo "Rclone ditemukan dan remote 'cloudflare-r2' terkonfigurasi. Memulai sinkronisasi offsite..."
    rclone copy "$BACKUP_FILE" cloudflare-r2:ftth-gis-disaster-recovery/minio/
    RCLONE_STATUS=$?
    if [ $RCLONE_STATUS -eq 0 ]; then
      echo "Sinkronisasi offsite sukses!"
    else
      echo "Warning: Sinkronisasi offsite Rclone GAGAL!"
    fi
  else
    echo "Warning: Rclone belum terinstal atau remote 'cloudflare-r2' belum terkonfigurasi. Sinkronisasi offsite dilewati."
  fi
  
  # Hapus berkas lokal yang berusia lebih dari 14 hari
  find $BACKUP_DIR -type f -name "minio_backup_*.tar.gz" -mtime +14 -delete
else
  echo "Error: Kompresi data MinIO GAGAL!"
  exit 1
fi
