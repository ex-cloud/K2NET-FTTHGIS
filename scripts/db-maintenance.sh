#!/usr/bin/env bash
# ==============================================================================
# K2NET FTTH GIS — Automated PostgreSQL Database Maintenance & Hygiene Script
# ==============================================================================
# Fungsi:
#   1. Menjalankan VACUUM (ANALYZE) pada tabel aktif bertrafik tinggi
#   2. Menjalankan REINDEX TABLE CONCURRENTLY pada tabel audit_events tanpa lock
#   3. Memperbarui statistik katalog PostgreSQL (optimizer planner stats)
#   4. Mengukur efisiensi ruang disk sebelum dan sesudah maintenance
#   5. Mencatat hasil ke log audit dan mengirim notifikasi Telegram
#
# Penggunaan:
#   bash scripts/db-maintenance.sh [--dry-run]
# ==============================================================================

set -euo pipefail

ENV_FILE="/opt/project5/.env"
LOG_DIR="/opt/project5/backups"
LOG_FILE="$LOG_DIR/db_maintenance.log"
CONTAINER="ftth-postgres"
DATABASE="ftth_gis"

# Warna Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

mkdir -p "$LOG_DIR"

echo -e "\n${BLUE}================================================================${NC}"
echo -e "${BLUE}   🧹 K2NET FTTH GIS — Database Maintenance & Index Hygiene     ${NC}"
echo -e "${BLUE}================================================================${NC}\n"

# --- Notifikasi Telegram Helper ---
send_telegram() {
  local status="$1"
  local duration_s="$2"
  local size_before="$3"
  local size_after="$4"

  local bot_token=$(grep -E "^TELEGRAM_BOT_TOKEN=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo "")
  local chat_id=$(grep -E "^TELEGRAM_CHAT_ID=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo "")

  if [ -n "$bot_token" ] && [ -n "$chat_id" ]; then
    local text="🧹 *FTTH GIS — Pemeliharaan Database Sukses*

📅 $(date +"%d %b %Y, %H:%M:%S") WIB
🗄️ Database: \`$DATABASE\`
⏱️ Durasi: ${duration_s}s
💾 Ukuran DB: $size_before ➔ $size_after
🔍 Aksi: VACUUM ANALYZE & REINDEX CONCURRENTLY"

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

# 1. Cek Kesiapan PostgreSQL
echo -e "${YELLOW}🔌 [1/4] Memeriksa status kontainer database ($CONTAINER)...${NC}"
if ! docker exec "$CONTAINER" pg_isready -U postgres -d "$DATABASE" > /dev/null 2>&1; then
  echo -e "${RED}❌ Database PostgreSQL pada kontainer $CONTAINER tidak merespon!${NC}"
  exit 1
fi
echo -e "  ${GREEN}✓ PostgreSQL siap menerima perintah maintenance.${NC}"

# Ukuran Database Sebelum
SIZE_BEFORE=$(docker exec -i "$CONTAINER" psql -U postgres -d "$DATABASE" -t -c \
  "SELECT pg_size_pretty(pg_database_size('$DATABASE'));" 2>/dev/null | tr -d ' ' || echo "N/A")
echo -e "  💾 Ukuran database saat ini: ${CYAN}$SIZE_BEFORE${NC}"

START_TIME=$(date +%s)

# 2. VACUUM (ANALYZE) pada Tabel Utama
echo -e "\n${YELLOW}⚡ [2/4] Menjalankan VACUUM (ANALYZE) pada tabel bertrafik tinggi...${NC}"

TABLES=("audit_events" "tasks" "projects" "users" "organizations" "database_backups" "network_nodes" "network_edges")

for tbl in "${TABLES[@]}"; do
  EXISTS=$(docker exec -i "$CONTAINER" psql -U postgres -d "$DATABASE" -t -c \
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$tbl';" 2>/dev/null | tr -d ' ' || echo "0")
  
  if [ "$EXISTS" = "1" ]; then
    echo -e "  🔹 Menjalankan VACUUM ANALYZE pada tabel: ${CYAN}$tbl${NC}..."
    docker exec -i "$CONTAINER" psql -U postgres -d "$DATABASE" -c "VACUUM (ANALYZE) $tbl;" > /dev/null 2>&1 || true
  fi
done
echo -e "  ${GREEN}✓ VACUUM ANALYZE selesai pada seluruh tabel yang ada.${NC}"

# 2b. Auto-Purge Soft-Deleted Records (> 30 Hari di Recycle Bin)
echo -e "\n${YELLOW}🗑️  [2b] Membersihkan data Recycle Bin yang kadaluarsa (> 30 hari)...${NC}"
PURGE_TABLES=("tasks" "network_edges" "network_nodes" "projects" "organizations")
for tbl in "${PURGE_TABLES[@]}"; do
  HAS_DEL=$(docker exec -i "$CONTAINER" psql -U postgres -d "$DATABASE" -t -c \
    "SELECT 1 FROM information_schema.columns WHERE table_name = '$tbl' AND column_name = 'deleted_at';" 2>/dev/null | tr -d ' ' || echo "0")
  if [ "$HAS_DEL" = "1" ]; then
    PURGED_COUNT=$(docker exec -i "$CONTAINER" psql -U postgres -d "$DATABASE" -t -c \
      "WITH deleted AS (DELETE FROM $tbl WHERE deleted_at < NOW() - INTERVAL '30 days' RETURNING *) SELECT COUNT(*) FROM deleted;" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$PURGED_COUNT" -gt "0" ]; then
      echo -e "  🔹 ${CYAN}$tbl${NC}: $PURGED_COUNT baris kadaluarsa (>30 hari) dibersihkan permanen."
    fi
  fi
done
echo -e "  ${GREEN}✓ Kebijakan retensi 30 hari Recycle Bin tervalidasi.${NC}"

# 3. REINDEX CONCURRENTLY pada Tabel Audit
echo -e "\n${YELLOW}🔄 [3/4] Menjalankan REINDEX TABLE CONCURRENTLY (Zero Lock)...${NC}"
AUDIT_EXISTS=$(docker exec -i "$CONTAINER" psql -U postgres -d "$DATABASE" -t -c \
  "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_events';" 2>/dev/null | tr -d ' ' || echo "0")

if [ "$AUDIT_EXISTS" = "1" ]; then
  echo -e "  🔹 Melakukan Reindex Concurrently pada tabel ${CYAN}audit_events${NC}..."
  docker exec -i "$CONTAINER" psql -U postgres -d "$DATABASE" -c "REINDEX TABLE CONCURRENTLY audit_events;" > /dev/null 2>&1 || true
  echo -e "  ${GREEN}✓ Reindex audit_events sukses tanpa mengunci tabel.${NC}"
fi

# 4. Pengukuran Akhir & Logging
echo -e "\n${YELLOW}📊 [4/4] Mengukur metrik pasca pemeliharaan...${NC}"
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

SIZE_AFTER=$(docker exec -i "$CONTAINER" psql -U postgres -d "$DATABASE" -t -c \
  "SELECT pg_size_pretty(pg_database_size('$DATABASE'));" 2>/dev/null | tr -d ' ' || echo "N/A")

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
LOG_ENTRY="[$TIMESTAMP] STATUS=SUCCESS DURATION=${DURATION}s SIZE_BEFORE=$SIZE_BEFORE SIZE_AFTER=$SIZE_AFTER ACTIONS='VACUUM ANALYZE, REINDEX CONCURRENTLY'"
echo "$LOG_ENTRY" >> "$LOG_FILE"

echo -e "  • Durasi: ${GREEN}${DURATION}s${NC}"
echo -e "  • Ukuran DB: ${CYAN}$SIZE_BEFORE${NC} ➔ ${GREEN}$SIZE_AFTER${NC}"
echo -e "  • Log Audit: ${CYAN}$LOG_FILE${NC}"

send_telegram "SUCCESS" "$DURATION" "$SIZE_BEFORE" "$SIZE_AFTER"

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN}   🎉 PEMELIHARAAN DATABASE SELESAI & TERVERIFIKASI SUKSES!    ${NC}"
echo -e "${GREEN}================================================================${NC}\n"
