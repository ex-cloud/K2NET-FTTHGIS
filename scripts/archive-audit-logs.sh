#!/bin/bash
# ==============================================================================
# FTTH GIS — Audit Log Cold Storage Archiver
# Mengekspor partisi audit_logs yang lebih tua dari 90 hari ke MinIO,
# lalu menghapus partisi tersebut dari PostgreSQL untuk menghemat disk.
#
# Jadwal disarankan (crontab):
#   0 3 1 * * /opt/project5/scripts/archive-audit-logs.sh >> /var/log/ftth-archive.log 2>&1
# ==============================================================================

set -euo pipefail

# --- Konfigurasi ---
PG_CONTAINER="ftth-postgres"
PG_USER="postgres"
PG_DB="ftth_gis"

ARCHIVE_BUCKET="db-backups"
ARCHIVE_PREFIX="archive/audit_logs"
ARCHIVE_LOCAL="/opt/project5/backups/archive/audit_logs"
RETENTION_DAYS=90

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

mkdir -p "$ARCHIVE_LOCAL"

# --- Hitung batas waktu (partisi yang lebih tua dari RETENTION_DAYS hari) ---
CUTOFF_DATE=$(date -d "-${RETENTION_DAYS} days" +%Y-%m-01)
log "Cutoff date: $CUTOFF_DATE (partisi sebelum tanggal ini akan diarsipkan)"

# --- Temukan partisi yang sudah melewati batas waktu ---
PARTITIONS=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tA -c "
SELECT child.relname
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
JOIN pg_class child ON pg_inherits.inhrelid = child.oid
WHERE parent.relname = 'audit_logs'
  AND child.relname <> 'audit_logs_default'
  AND (regexp_replace(child.relname, 'audit_logs_y(\\d{4})m(\\d{2})', '\\1-\\2-01'))::date < '${CUTOFF_DATE}'::date
ORDER BY child.relname;
" 2>/dev/null || echo "")

if [ -z "$PARTITIONS" ]; then
    log "Tidak ada partisi yang memerlukan pengarsipan (semua partisi masih dalam periode retensi ${RETENTION_DAYS} hari)."
    exit 0
fi

log "Partisi yang akan diarsipkan:"
echo "$PARTITIONS" | while read -r p; do log "  - $p"; done

# --- Proses setiap partisi ---
echo "$PARTITIONS" | while read -r PARTITION; do
    if [ -z "$PARTITION" ]; then continue; fi

    log "============================================"
    log "Memproses partisi: $PARTITION"

    # 1. Ekspor ke CSV terkompresi
    CSV_FILE="$ARCHIVE_LOCAL/${PARTITION}_${TIMESTAMP}.csv.gz"
    log "Mengekspor data ke $CSV_FILE..."
    docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c \
        "COPY (SELECT * FROM ${PARTITION}) TO STDOUT WITH CSV HEADER" 2>/dev/null \
        | gzip > "$CSV_FILE"
    log "Export selesai: $(du -sh "$CSV_FILE" | cut -f1)"

    # 2. Upload ke MinIO menggunakan kontainer mc sementara
    log "Mengupload ke MinIO ($ARCHIVE_BUCKET/$ARCHIVE_PREFIX/)..."
    docker run --rm \
        --entrypoint /bin/sh \
        --network project5_default \
        -v "$ARCHIVE_LOCAL:/archive" \
        minio/mc -c \
        "mc alias set localminio http://minio:9000 \
            \$(cat /dev/stdin <<< '$MINIO_ROOT_USER') \
            \$(cat /dev/stdin <<< '$MINIO_ROOT_PASSWORD') --quiet && \
         mc cp /archive/${PARTITION}_${TIMESTAMP}.csv.gz localminio/${ARCHIVE_BUCKET}/${ARCHIVE_PREFIX}/${PARTITION}_${TIMESTAMP}.csv.gz" 2>&1 || {
        log "WARNING: Upload ke MinIO gagal. File tetap tersimpan lokal di $CSV_FILE"
    }

    # 3. Drop partisi dari PostgreSQL (hanya jika file lokal ada)
    if [ -f "$CSV_FILE" ]; then
        log "Menghapus partisi $PARTITION dari database..."
        docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c \
            "DROP TABLE IF EXISTS ${PARTITION};" 2>/dev/null
        log "Partisi $PARTITION berhasil dihapus dari database."
    else
        log "ERROR: File ekspor tidak ditemukan. Partisi $PARTITION TIDAK dihapus sebagai langkah keamanan."
    fi
done

log "============================================"
log "Proses pengarsipan selesai."
log "File arsip tersimpan di: $ARCHIVE_LOCAL"
log "Akan tersinkronisasi ke Nextcloud pada pukul 04:00 via sync-nextcloud.sh"
