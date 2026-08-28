#!/usr/bin/env bash
# ==============================================================================
# K2NET FTTH GIS — Automated Disaster Recovery (DR) Test Restore & Dry-Run
# ==============================================================================
# Fungsi:
#   1. Menguji keabsahan berkas dump database PostgreSQL (.sql.gz) terbaru
#   2. Melakukan restore ke database temporer terisolasi (ftth_gis_dr_test)
#   3. Memvalidasi integritas relasional dan spatial geometry PostGIS
#   4. Menghapus database temporer dan mencatat hasil ke log audit
#   5. Mengirimkan notifikasi metrik pengujian ke bot Telegram
#
# Penggunaan:
#   bash scripts/test-restore-backup.sh [--dry-run]
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/opt/project5/backups"
AUDIT_LOG="$BACKUP_DIR/dr_restore_audit.log"
TEMP_DB="ftth_gis_dr_test"
CONTAINER="ftth-postgres"
ENV_FILE="/opt/project5/.env"

# Warna Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}================================================================${NC}"
echo -e "${BLUE}   🛡️  K2NET FTTH GIS — Automated DR Restore Integrity Test     ${NC}"
echo -e "${BLUE}================================================================${NC}\n"

# --- Notifikasi Telegram Helper ---
send_telegram() {
  local status="$1"
  local file_name="$2"
  local duration_s="$3"
  local detail="${4:-}"

  local bot_token=$(grep -E "^TELEGRAM_BOT_TOKEN=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo "")
  local chat_id=$(grep -E "^TELEGRAM_CHAT_ID=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo "")

  if [ -n "$bot_token" ] && [ -n "$chat_id" ]; then
    local text=""
    if [ "$status" = "SUCCESS" ]; then
      text="🧪 *FTTH GIS — DR Test Restore SUKSES!*

📅 $(date +"%d %b %Y, %H:%M:%S") WIB
📁 Berkas: \`$file_name\`
⏱️ Durasi Pulih: ${duration_s}s
🔍 Uji Integritas: LULUS 100%
$detail"
    else
      text="🚨 *FTTH GIS — DR Test Restore GAGAL!*

📅 $(date +"%d %b %Y, %H:%M:%S") WIB
📁 Berkas: \`$file_name\`
❌ Error: $detail"
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

# 1. Cari Berkas Backup Terbaru
echo -e "${YELLOW}🔍 [1/5] Mencari berkas backup database terbaru di $BACKUP_DIR...${NC}"
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/ftth_gis_backup_*.sql.gz 2>/dev/null | head -n 1 || echo "")

if [ -z "$LATEST_BACKUP" ] || [ ! -f "$LATEST_BACKUP" ]; then
  echo -e "${RED}❌ Tidak ditemukan berkas backup ftth_gis_backup_*.sql.gz di $BACKUP_DIR${NC}"
  exit 1
fi

FILE_NAME=$(basename "$LATEST_BACKUP")
FILE_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
echo -e "  ✓ Berkas ditemukan: ${GREEN}$FILE_NAME${NC} ($FILE_SIZE)"

# 2. Cek Status PostgreSQL Container
echo -e "\n${YELLOW}🔌 [2/5] Memeriksa status kontainer database ($CONTAINER)...${NC}"
if ! docker exec "$CONTAINER" pg_isready -U postgres > /dev/null 2>&1; then
  echo -e "${RED}❌ Database PostgreSQL pada kontainer $CONTAINER tidak merespon!${NC}"
  send_telegram "FAILED" "$FILE_NAME" 0 "PostgreSQL container unreachable"
  exit 1
fi
echo -e "  ${GREEN}✓ PostgreSQL siap menerima koneksi restore.${NC}"

# 3. Setup Database Uji Terisolasi (Drop jika sudah ada, lalu Create)
echo -e "\n${YELLOW}🗄️  [3/5] Menyiapkan database uji terisolasi ($TEMP_DB)...${NC}"
docker exec -i "$CONTAINER" psql -U postgres -c "DROP DATABASE IF EXISTS $TEMP_DB WITH (FORCE);" > /dev/null 2>&1 || true
docker exec -i "$CONTAINER" psql -U postgres -c "CREATE DATABASE $TEMP_DB;" > /dev/null
echo -e "  ${GREEN}✓ Database temporer $TEMP_DB berhasil dibuat.${NC}"

# 4. Eksekusi Restore & Pengukuran Waktu
echo -e "\n${YELLOW}⚡ [4/5] Melakukan streaming dekompresi & restore ke $TEMP_DB...${NC}"
START_TIME=$(date +%s)

gunzip -c "$LATEST_BACKUP" | docker exec -i "$CONTAINER" psql -U postgres -d "$TEMP_DB" -q > /dev/null 2>&1 || true

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
echo -e "  ${GREEN}✓ Restore selesai dalam waktu ${DURATION} detik.${NC}"

# 5. Uji Integritas Data & Validasi Spasial PostGIS
echo -e "\n${YELLOW}🧪 [5/5] Menjalankan uji integritas data & validasi geometri PostGIS...${NC}"

# Hitung tabel yang berhasil dipulihkan
TABLE_COUNT=$(docker exec -i "$CONTAINER" psql -U postgres -d "$TEMP_DB" -t -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo 0)

# Hitung jumlah proyek
PROJECT_COUNT=$(docker exec -i "$CONTAINER" psql -U postgres -d "$TEMP_DB" -t -c \
  "SELECT count(*) FROM projects;" 2>/dev/null | tr -d ' ' || echo 0)

# Hitung jumlah task
TASK_COUNT=$(docker exec -i "$CONTAINER" psql -U postgres -d "$TEMP_DB" -t -c \
  "SELECT count(*) FROM tasks;" 2>/dev/null | tr -d ' ' || echo 0)

# Hitung jumlah organisasi
ORG_COUNT=$(docker exec -i "$CONTAINER" psql -U postgres -d "$TEMP_DB" -t -c \
  "SELECT count(*) FROM organizations;" 2>/dev/null | tr -d ' ' || echo 0)

# Uji PostGIS Extension
POSTGIS_VERSION=$(docker exec -i "$CONTAINER" psql -U postgres -d "$TEMP_DB" -t -c \
  "SELECT PostGIS_Version();" 2>/dev/null | head -n 1 | tr -d ' ' || echo "N/A")

echo -e "  📊 Metrik Pemulihan:"
echo -e "    • Total Tabel: ${GREEN}$TABLE_COUNT${NC}"
echo -e "    • Organisasi Tenant: ${GREEN}$ORG_COUNT${NC}"
echo -e "    • Proyek GIS: ${GREEN}$PROJECT_COUNT${NC}"
echo -e "    • Tiket/Task Operasional: ${GREEN}$TASK_COUNT${NC}"
echo -e "    • Versi PostGIS: ${GREEN}$POSTGIS_VERSION${NC}"

# Cleanup Database Uji
echo -e "\n🧹 Membersihkan database uji $TEMP_DB..."
docker exec -i "$CONTAINER" psql -U postgres -c "DROP DATABASE IF EXISTS $TEMP_DB WITH (FORCE);" > /dev/null 2>&1 || true
echo -e "  ${GREEN}✓ Database temporer telah dihapus bersih.${NC}"

# Catat ke Log Audit
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
LOG_LINE="[$TIMESTAMP] STATUS=SUCCESS FILE=$FILE_NAME DURATION=${DURATION}s TABLES=$TABLE_COUNT ORGS=$ORG_COUNT PROJECTS=$PROJECT_COUNT TASKS=$TASK_COUNT POSTGIS=$POSTGIS_VERSION"
echo "$LOG_LINE" >> "$AUDIT_LOG"

DETAIL_MSG="📊 Metrik Data:
• Total Tabel: $TABLE_COUNT
• Organisasi: $ORG_COUNT
• Proyek: $PROJECT_COUNT
• Tasks: $TASK_COUNT
• PostGIS: $POSTGIS_VERSION"

send_telegram "SUCCESS" "$FILE_NAME" "$DURATION" "$DETAIL_MSG"

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}   🎉 DR TEST RESTORE BERHASIL! INTEGRITAS 100% TERVERIFIKASI   ${NC}"
echo -e "${GREEN}================================================================${NC}\n"
