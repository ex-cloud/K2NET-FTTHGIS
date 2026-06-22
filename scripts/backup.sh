#!/bin/bash
# Folder tujuan backup lokal di AlmaLinux
BACKUP_DIR="/opt/project5/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/ftth_gis_backup_$TIMESTAMP.sql"

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
    GATEWAY_TOKEN=$(grep -E "^GATEWAY_TOKEN=" /opt/project5/gateways/.env | cut -d'=' -f2)
    if [ -n "$GATEWAY_TOKEN" ]; then
      echo "Mengunggah berkas cadangan database ke MinIO S3 lokal..."
      curl -s -X POST \
        -H "X-Gateway-Token: $GATEWAY_TOKEN" \
        -F "file=@$BACKUP_FILE.gz" \
        -F "bucket=db-backups" \
        http://127.0.0.1:5004/api/v1/upload > /dev/null &
    else
      echo "Warning: GATEWAY_TOKEN tidak ditemukan di gateways/.env. Unggah ke MinIO dilewati."
    fi
  else
    # Catat gagal kompres ke DB
    docker exec -i ftth-postgres psql -U postgres -d ftth_gis -c "INSERT INTO database_backups (backup_time, status, success, backup_file) VALUES (NOW(), 'FAILED', false, '');"
    echo "Error: Kompresi backup gagal"
    exit 1
  fi
else
  # Catat gagal dump ke DB
  docker exec -i ftth-postgres psql -U postgres -d ftth_gis -c "INSERT INTO database_backups (backup_time, status, success, backup_file) VALUES (NOW(), 'FAILED', false, '');"
  echo "Error: pg_dump gagal"
  exit 1
fi

# 🚀 TINGKAT KEAMANAN TINGGI (Offsite Backup):
# Unggah otomatis berkas backup terkompresi ke S3-compatible cloud storage (misal: Cloudflare R2 / AWS S3)
# menggunakan Rclone jika sudah dikonfigurasi.
if which rclone >/dev/null 2>&1 && rclone listremotes | grep -q "^cloudflare-r2:"; then
  echo "Mengunggah berkas backup database ke offsite cloud storage (cloudflare-r2)..."
  rclone copy "$BACKUP_FILE.gz" cloudflare-r2:ftth-gis-disaster-recovery/database/
  RCLONE_STATUS=$?
  if [ $RCLONE_STATUS -eq 0 ]; then
    echo "Backup database offsite sukses!"
  else
    echo "Warning: Backup database offsite GAGAL!"
  fi
else
  echo "Warning: Rclone belum terinstal atau remote 'cloudflare-r2' belum dikonfigurasi. Backup database offsite dilewati."
fi

# Hapus backup lokal yang lebih tua dari 7 hari agar disk AlmaLinux tidak penuh
find $BACKUP_DIR -type f -name "*.gz" -mtime +7 -delete
