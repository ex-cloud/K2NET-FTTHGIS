#!/bin/bash
# ==============================================================================
# CLEANUP SCRIPT — FTTH GIS Server Storage Maintenance
# Membersihkan Docker artifacts, build cache, dan file sementara yang menumpuk
# untuk mencegah disk exhaustion.
#
# Aman dijalankan kapan saja — tidak menghapus data aktif atau container running.
#
# Usage:
#   bash /opt/project5/scripts/cleanup.sh           # jalankan manual
#   bash /opt/project5/scripts/cleanup.sh --dry-run # preview tanpa hapus
# ==============================================================================

set -euo pipefail

# --- Konfigurasi ---
LOG_DIR="/opt/project5/backups/cleanup"
LOG_FILE="$LOG_DIR/cleanup_$(date +"%Y%m%d_%H%M%S").log"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
DRY_RUN=false

# Ambil argumen
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

# Batas bawah build cache yang tetap dipertahankan (agar build berikutnya tidak terlalu lama)
BUILDX_KEEP_STORAGE="2gb"

# Batas usia log cleanup yang disimpan (hari)
CLEANUP_LOG_RETENTION_DAYS=14

# --- Inisialisasi ---
mkdir -p "$LOG_DIR"

# Fungsi logging
log() {
  echo "[$(date +"%H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Hitung ukuran direktori dengan aman
dir_size() {
  du -sh "$1" 2>/dev/null | cut -f1 || echo "N/A"
}

# ==============================================================================
log "================================================================"
log " FTTH GIS Server Cleanup — $TIMESTAMP"
log " Mode: $([ "$DRY_RUN" = true ] && echo 'DRY RUN (tidak ada yang dihapus)' || echo 'LIVE')"
log "================================================================"

# --- Snapshot disk sebelum cleanup ---
DISK_BEFORE=$(df -h / | awk 'NR==2 {print $3 " used (" $5 ")"}')
log "💾 Disk sebelum cleanup: $DISK_BEFORE"
log ""

# ==============================================================================
# BAGIAN 1: DOCKER CLEANUP
# ==============================================================================
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🐳 [1/4] Docker Cleanup"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1a. Hapus container yang sudah berhenti (exited/dead)
STOPPED_CONTAINERS=$(docker ps -aq --filter "status=exited" --filter "status=dead" 2>/dev/null | wc -l)
log "🗑️  Container berhenti ditemukan: $STOPPED_CONTAINERS"
if [ "$DRY_RUN" = false ] && [ "$STOPPED_CONTAINERS" -gt 0 ]; then
  docker container prune -f >> "$LOG_FILE" 2>&1
  log "   ✅ Container berhenti dihapus."
elif [ "$DRY_RUN" = true ]; then
  log "   [DRY RUN] Akan hapus $STOPPED_CONTAINERS container."
fi

# 1b. Hapus image yang tidak digunakan container manapun (dangling + unreferenced)
UNUSED_IMAGES=$(docker images -q --filter "dangling=true" 2>/dev/null | wc -l)
log "🗑️  Dangling images ditemukan: $UNUSED_IMAGES"
if [ "$DRY_RUN" = false ]; then
  docker image prune -f >> "$LOG_FILE" 2>&1
  log "   ✅ Dangling images dihapus."
elif [ "$DRY_RUN" = true ]; then
  log "   [DRY RUN] Akan hapus dangling images."
fi

# 1c. Hapus Docker build cache — pertahankan 2GB terbaru agar build tetap cepat
BUILD_CACHE_BEFORE=$(timeout 15 docker system df --format '{{.BuildCacheSize}}' 2>/dev/null || echo "N/A")
log "🗑️  Docker build cache saat ini: $BUILD_CACHE_BEFORE"
if [ "$DRY_RUN" = false ]; then
  log "   Membersihkan build cache (menjaga ${BUILDX_KEEP_STORAGE} terbaru)..."
  timeout 180 docker buildx prune --keep-storage="$BUILDX_KEEP_STORAGE" -f >> "$LOG_FILE" 2>&1 || log "   ⚠️  Docker buildx prune timed out."
  log "   ✅ Build cache dibersihkan."
elif [ "$DRY_RUN" = true ]; then
  log "   [DRY RUN] Akan prune build cache (keep: $BUILDX_KEEP_STORAGE)."
fi

# 1d. Hapus volume Docker yang tidak terhubung ke container manapun
UNUSED_VOLUMES=$(docker volume ls -q --filter "dangling=true" 2>/dev/null | wc -l)
log "🗑️  Volume tidak terpakai: $UNUSED_VOLUMES"
if [ "$DRY_RUN" = false ] && [ "$UNUSED_VOLUMES" -gt 0 ]; then
  docker volume prune -f >> "$LOG_FILE" 2>&1
  log "   ✅ Volume tidak terpakai dihapus."
elif [ "$DRY_RUN" = true ]; then
  log "   [DRY RUN] Akan hapus $UNUSED_VOLUMES volume."
fi

# 1e. Truncate file log container Docker yang membengkak (> 10MB)
log "🗑️  Memeriksa log container Docker yang membengkak (>10MB)..."
LARGE_LOGS=$(find /var/lib/docker/containers -name "*-json.log" -size +10M 2>/dev/null || true)
LARGE_LOG_COUNT=$(echo "$LARGE_LOGS" | (grep -v '^$' || true) | wc -l | tr -d ' ')
LARGE_LOG_COUNT=${LARGE_LOG_COUNT:-0}
log "   Ditemukan $LARGE_LOG_COUNT container log file > 10MB"
if [ "$DRY_RUN" = false ] && [ "$LARGE_LOG_COUNT" -gt 0 ]; then
  for log_path in $LARGE_LOGS; do
    log "   Truncating log: $log_path"
    truncate -s 0 "$log_path" 2>/dev/null || true
  done
  log "   ✅ Log container besar telah di-truncate."
elif [ "$DRY_RUN" = true ] && [ "$LARGE_LOG_COUNT" -gt 0 ]; then
  log "   [DRY RUN] Akan truncate $LARGE_LOG_COUNT file log container > 10MB."
fi

# 1f. Kong Memory Guard — Flush memory jika RAM Kong > 450MB
KONG_CONTAINER=$(docker ps -q --filter "name=kong" 2>/dev/null || true)
if [ -n "$KONG_CONTAINER" ]; then
  KONG_MEM_RAW=$(docker stats --no-stream --format "{{.MemUsage}}" kong 2>/dev/null | awk '{print $1}' || echo "0")
  log "🛡️  Kong Memory Guard — Memori Kong saat ini: $KONG_MEM_RAW"
  if [[ "$KONG_MEM_RAW" =~ ([0-9]+)(\.[0-9]+)?MiB ]] && [ "${BASH_REMATCH[1]}" -gt 420 ]; then
    log "   ⚠️  Kong RAM di atas 420MiB — merekstrak restart untuk flush worker socket broker..."
    if [ "$DRY_RUN" = false ]; then
      docker restart kong >> "$LOG_FILE" 2>&1 || true
      log "   ✅ Container Kong berhasil direstart & RAM ter-flush."
    else
      log "   [DRY RUN] Akan restart container Kong untuk flush RAM."
    fi
  fi
fi

# 1g. Zombie & Defunct Process Cleanup Guard
ZOMBIE_COUNT=$(ps aux 2>/dev/null | awk '{if ($8 ~ /Z/) print $0}' | wc -l || echo 0)
log "🧟 Zombie/Defunct processes di Host: $ZOMBIE_COUNT"
if [ "$ZOMBIE_COUNT" -gt 3 ]; then
  log "   ⚠️  Terdeteksi $ZOMBIE_COUNT zombie processes. Membersihkan zombie via Next.js container restart..."
  if [ "$DRY_RUN" = false ]; then
    docker restart ftth-frontend-admin ftth-frontend >> "$LOG_FILE" 2>&1 || true
    log "   ✅ Next.js frontend containers restarted — zombie reaped."
  fi
fi

# 1h. OS Memory Page Cache Release (jika RAM terpakai > 85%)
FREE_MEM_PCT=$(free | awk '/Mem:/ {printf "%.0f", $3/$2 * 100}')
log "💾 Total penggunaan RAM OS saat ini: ${FREE_MEM_PCT}%"
if [ "$FREE_MEM_PCT" -gt 85 ]; then
  log "   ⚠️  RAM OS > 85% — Melepas pagecache, dentries, & inodes..."
  if [ "$DRY_RUN" = false ]; then
    sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true
    log "   ✅ OS PageCache dropped & RAM dilepas."
  else
    log "   [DRY RUN] Akan drop OS page cache (echo 3 > drop_caches)."
  fi
fi


# ==============================================================================
# BAGIAN 2: BUILD ARTIFACTS & CACHE DEVELOPMENT TOOLS
# ==============================================================================
log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🔨 [2/4] Build Artifacts & Developer Caches"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 2a. Next.js & Vite SPA build outputs — diregenerasi otomatis saat Docker build
NEXT_DIR="/opt/project5/apps/studio/.next"
if [ -d "$NEXT_DIR" ]; then
  NEXT_SIZE=$(dir_size "$NEXT_DIR")
  log "🗑️  Next.js .next/ dir: $NEXT_SIZE"
  if [ "$DRY_RUN" = false ]; then
    rm -rf "$NEXT_DIR"
    log "   ✅ .next/ dihapus."
  else
    log "   [DRY RUN] Akan hapus $NEXT_DIR ($NEXT_SIZE)."
  fi
fi

# 2b. Vite SPA dist/ outputs (studio-admin & studio-tenant)
for VITE_DIST in "/opt/project5/apps/studio-admin/dist" "/opt/project5/apps/studio-tenant/dist"; do
  if [ -d "$VITE_DIST" ]; then
    VITE_SIZE=$(dir_size "$VITE_DIST")
    log "🗑️  Vite SPA dist ($VITE_DIST): $VITE_SIZE"
    if [ "$DRY_RUN" = false ]; then
      rm -rf "$VITE_DIST"
      log "   ✅ $(basename $(dirname "$VITE_DIST"))/dist dihapus."
    else
      log "   [DRY RUN] Akan hapus $VITE_DIST ($VITE_SIZE)."
    fi
  fi
done

# 2c. Vite internal build cache (.vite)
for VITE_CACHE in "/opt/project5/apps/studio-admin/node_modules/.vite" "/opt/project5/apps/studio-tenant/node_modules/.vite"; do
  if [ -d "$VITE_CACHE" ]; then
    VITE_CACHE_SIZE=$(dir_size "$VITE_CACHE")
    log "🗑️  Vite build cache ($VITE_CACHE): $VITE_CACHE_SIZE"
    if [ "$DRY_RUN" = false ]; then
      rm -rf "$VITE_CACHE"
      log "   ✅ Vite cache dihapus."
    else
      log "   [DRY RUN] Akan hapus $VITE_CACHE ($VITE_CACHE_SIZE)."
    fi
  fi
done

# 2d. Maven target/ — diregenerasi saat Docker build Spring Boot
MAVEN_TARGET="/opt/project5/apps/api/target"
if [ -d "$MAVEN_TARGET" ]; then
  MAVEN_SIZE=$(dir_size "$MAVEN_TARGET")
  log "🗑️  Maven target/: $MAVEN_SIZE"
  if [ "$DRY_RUN" = false ]; then
    rm -rf "$MAVEN_TARGET"
    log "   ✅ Maven target/ dihapus."
  else
    log "   [DRY RUN] Akan hapus $MAVEN_TARGET ($MAVEN_SIZE)."
  fi
fi

# 2e. Go build cache host (bukan di dalam Docker) — diregenerasi saat build
GO_CACHE="${HOME}/.cache/go-build"
if [ -d "$GO_CACHE" ]; then
  GO_SIZE=$(dir_size "$GO_CACHE")
  log "🗑️  Go build cache: $GO_SIZE"
  if [ "$DRY_RUN" = false ]; then
    go clean -cache 2>/dev/null || true
    rm -rf "$GO_CACHE"
    log "   ✅ Go build cache dihapus."
  else
    log "   [DRY RUN] Akan hapus $GO_CACHE ($GO_SIZE)."
  fi
fi

# 2f. TypeScript language server cache
TS_CACHE="${HOME}/.cache/typescript"
if [ -d "$TS_CACHE" ]; then
  TS_SIZE=$(dir_size "$TS_CACHE")
  log "🗑️  TypeScript server cache: $TS_SIZE"
  if [ "$DRY_RUN" = false ]; then
    rm -rf "$TS_CACHE"
    log "   ✅ TypeScript cache dihapus."
  else
    log "   [DRY RUN] Akan hapus $TS_CACHE ($TS_SIZE)."
  fi
fi

# ==============================================================================
# BAGIAN 3: SYSTEM TEMP FILES
# ==============================================================================
log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "🧹 [3/4] System Temp Files"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 3a. Hapus log cleanup yang sudah lama (> 14 hari)
OLD_CLEANUP_LOGS=$(find "$LOG_DIR" -name "cleanup_*.log" -mtime +$CLEANUP_LOG_RETENTION_DAYS 2>/dev/null | wc -l)
log "🗑️  Log cleanup lama (>${CLEANUP_LOG_RETENTION_DAYS}h): $OLD_CLEANUP_LOGS file"
if [ "$DRY_RUN" = false ] && [ "$OLD_CLEANUP_LOGS" -gt 0 ]; then
  find "$LOG_DIR" -name "cleanup_*.log" -mtime +$CLEANUP_LOG_RETENTION_DAYS -delete
  log "   ✅ Log cleanup lama dihapus."
fi

# 3b. Bersihkan /tmp yang sudah lebih dari 7 hari (bukan yang sedang aktif digunakan)
OLD_TMP=$(find /tmp -maxdepth 1 -type d -mtime +7 ! -name "." 2>/dev/null | wc -l)
log "🗑️  /tmp dirs usia > 7 hari: $OLD_TMP"
if [ "$DRY_RUN" = false ] && [ "$OLD_TMP" -gt 0 ]; then
  find /tmp -maxdepth 1 -type d -mtime +7 ! -name "." -exec rm -rf {} + 2>/dev/null || true
  log "   ✅ Old /tmp dirs dihapus."
fi

# 3c. Bersihkan arsip backup lokal (.gz, .tar.gz, .enc) berusia lebih dari 7 hari agar tidak menumpuk
BACKUP_PARENT="/opt/project5/backups"
RETENTION_DAYS=7
OLD_BACKUP_FILES=$(find "$BACKUP_PARENT" -type f -mtime +$RETENTION_DAYS \( -name "*.gz" -o -name "*.tar.gz" -o -name "*.enc" \) 2>/dev/null | wc -l)
log "🗑️  Arsip backup lokal lama (>$RETENTION_DAYS hari) ditemukan: $OLD_BACKUP_FILES berkas"
if [ "$DRY_RUN" = false ] && [ "$OLD_BACKUP_FILES" -gt 0 ]; then
  find "$BACKUP_PARENT" -type f -mtime +$RETENTION_DAYS \( -name "*.gz" -o -name "*.tar.gz" -o -name "*.enc" \) -delete
  log "   ✅ Berkas arsip backup lokal lama berhasil dibersihkan."
fi

# 3d. Bersihkan systemd journal log (simpan 7 hari terakhir)
if command -v journalctl &>/dev/null; then
  JOURNAL_SIZE=$(journalctl --disk-usage 2>/dev/null | grep -oP '[\d.]+[A-Z]+' || echo "N/A")
  log "🗑️  Systemd journal: $JOURNAL_SIZE"
  if [ "$DRY_RUN" = false ]; then
    journalctl --vacuum-time=7d >> "$LOG_FILE" 2>&1 || true
    log "   ✅ Journal dipangkas ke 7 hari terakhir."
  else
    log "   [DRY RUN] Akan vacuum journal ke 7 hari."
  fi
fi

# 3e. Rotasi & Kompresi Log Akses Traefik (Jika > 50MB)
TRAEFIK_LOG_DIR="/opt/project5/docker/traefik/logs"
TRAEFIK_ACCESS_LOG="$TRAEFIK_LOG_DIR/access.log"
if [ -f "$TRAEFIK_ACCESS_LOG" ]; then
  TRAEFIK_LOG_SIZE=$(stat -c%s "$TRAEFIK_ACCESS_LOG" 2>/dev/null || stat -f%z "$TRAEFIK_ACCESS_LOG" 2>/dev/null || echo 0)
  # Jika ukuran lebih dari 50MB (52428800 bytes)
  if [ "$TRAEFIK_LOG_SIZE" -gt 52428800 ]; then
    log "📦 Traefik access.log melebihi 50MB ($(du -h "$TRAEFIK_ACCESS_LOG" | cut -f1)) — Melakukan rotasi..."
    if [ "$DRY_RUN" = false ]; then
      ROTATED_FILE="$TRAEFIK_LOG_DIR/access_$(date +"%Y%m%d_%H%M%S").log"
      cp "$TRAEFIK_ACCESS_LOG" "$ROTATED_FILE"
      : > "$TRAEFIK_ACCESS_LOG"
      gzip -9 "$ROTATED_FILE" 2>/dev/null || true
      log "   ✅ Traefik access.log dirotasi dan dikompresi (.gz)."
    else
      log "   [DRY RUN] Akan merotasi dan mengompresi $TRAEFIK_ACCESS_LOG."
    fi
  fi

  # Hapus arsip log Traefik lama (> 14 hari)
  OLD_TRAEFIK_ARCHIVES=$(find "$TRAEFIK_LOG_DIR" -name "access_*.log.gz" -mtime +14 2>/dev/null | wc -l)
  if [ "$DRY_RUN" = false ] && [ "$OLD_TRAEFIK_ARCHIVES" -gt 0 ]; then
    find "$TRAEFIK_LOG_DIR" -name "access_*.log.gz" -mtime +14 -delete
    log "   ✅ $OLD_TRAEFIK_ARCHIVES arsip log Traefik (>14 hari) dibersihkan."
  fi
fi

# 3f. Safe Dangling Docker Volume Pruning (Hanya anonymous volumes yang tidak digunakan)
log "🗑️  Memeriksa Dangling Docker Anonymous Volumes..."
if [ "$DRY_RUN" = false ]; then
  docker volume prune -f >> "$LOG_FILE" 2>&1 || true
  log "   ✅ Dangling volumes dibersihkan."
else
  log "   [DRY RUN] Akan menjalankan safe volume prune."
fi

# ==============================================================================
# BAGIAN 4: LAPORAN AKHIR
# ==============================================================================
log ""
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log "📊 [4/4] Laporan Akhir"
log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DISK_AFTER=$(df -h / | awk 'NR==2 {print $3 " used (" $5 ")"}')
DISK_AVAIL=$(df -h / | awk 'NR==2 {print $4}')

log "💾 Disk sebelum : $DISK_BEFORE"
log "💾 Disk sesudah : $DISK_AFTER"
log "💾 Tersedia     : $DISK_AVAIL"
log ""

# Docker system summary
log "🐳 Docker summary setelah cleanup:"
docker system df 2>/dev/null | while IFS= read -r line; do
  log "   $line"
done

log ""

# ==============================================================================
# NOTIFIKASI — Discord Webhook + Telegram Bot
# Baca credentials dari .env utama
# ==============================================================================

# Load env vars notifikasi
ENV_FILE="/opt/project5/.env"
DISCORD_WEBHOOK_URL=$(grep -E "^DISCORD_WEBHOOK_URL=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo "")
TELEGRAM_BOT_TOKEN=$(grep -E "^TELEGRAM_BOT_TOKEN=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo "")
TELEGRAM_CHAT_ID=$(grep -E "^TELEGRAM_CHAT_ID=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | tr -d '"' || echo "")

# Susun pesan notifikasi
NOTIF_TITLE="🧹 FTTH GIS — Storage Cleanup Selesai"
NOTIF_BODY="📅 $(date +"%d %b %Y, %H:%M WIB")\n💾 Sebelum : $DISK_BEFORE\n✅ Sesudah  : $DISK_AFTER\n📂 Tersedia : $DISK_AVAIL\n📄 Log      : $LOG_FILE"

# --- Kirim ke Discord ---
if [ -n "$DISCORD_WEBHOOK_URL" ]; then
  DISCORD_BODY="📅 $(date +"%d %b %Y, %H:%M WIB")\\n💾 Sebelum : $DISK_BEFORE\\n✅ Sesudah  : $DISK_AFTER\\n📂 Tersedia : $DISK_AVAIL\\n📄 Log      : $LOG_FILE"
  DISCORD_PAYLOAD="{\"embeds\": [{\"title\": \"$NOTIF_TITLE\", \"description\": \"$DISCORD_BODY\", \"color\": 3066993, \"footer\": {\"text\": \"FTTH GIS Server Maintenance\"}}]}"
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$DISCORD_PAYLOAD" \
    "$DISCORD_WEBHOOK_URL" 2>/dev/null || echo "000")
  if [ "$HTTP_STATUS" = "204" ]; then
    log "   ✅ Notifikasi Discord terkirim."
  else
    log "   ⚠️  Discord gagal (HTTP $HTTP_STATUS) — dilewati."
  fi
else
  log "   ℹ️  DISCORD_WEBHOOK_URL tidak dikonfigurasi, notifikasi Discord dilewati."
fi

# --- Kirim ke Telegram ---
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
  log "📣 Mengirim notifikasi ke Telegram..."
  TELEGRAM_TEXT="🧹 *FTTH GIS — Storage Cleanup Selesai*

📅 $(date +"%d %b %Y, %H:%M") WIB
💾 Sebelum : $DISK_BEFORE
✅ Sesudah  : $DISK_AFTER
📂 Tersedia : $DISK_AVAIL
🧹 Lokal Backup: $OLD_BACKUP_FILES berkas (.gz) dibersihkan"
  TG_PAYLOAD=$(printf '{"chat_id": "%s", "parse_mode": "Markdown", "text": "%s"}' \
    "$TELEGRAM_CHAT_ID" \
    "$(echo "$TELEGRAM_TEXT" | sed 's/"/\\"/g')")
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$TG_PAYLOAD" \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    2>/dev/null || echo "000")
  if [ "$HTTP_STATUS" = "200" ]; then
    log "   ✅ Notifikasi Telegram terkirim."
  else
    log "   ⚠️  Telegram gagal (HTTP $HTTP_STATUS) — dilewati."
  fi
else
  log "   ℹ️  TELEGRAM_BOT_TOKEN/CHAT_ID tidak dikonfigurasi, notifikasi Telegram dilewati."
fi

if [ "$DRY_RUN" = false ]; then
  log "✅ Cleanup selesai. Log tersimpan di: $LOG_FILE"
else
  log "ℹ️  DRY RUN selesai. Tidak ada yang dihapus."
fi

log "================================================================"
exit 0
